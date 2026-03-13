// ============================================================
// app.js — Visualizador de Equivalências v2
// Fluxo principal: upload de 3 JSONs → renderização
// ============================================================

let currentData = null;
let currentSessionId = null;
let isEditing = false;
let originalData = null;
let isInvertedView = false;

// Arquivos selecionados
let fileTorinoData = null;
let fileCursosEquivData = null;
let fileEquivalenciasData = null;

document.addEventListener('DOMContentLoaded', () => {
  setupUploadListeners();
  setupFilterListeners();
  setupEditListeners();
  carregarSessoesAtivas();
});

// ============================================================
// UPLOAD — leitura dos 3 arquivos
// ============================================================

function setupUploadListeners() {
  const inputs = {
    fileTorino: (data) => { fileTorinoData = data; },
    fileCursosEquiv: (data) => { fileCursosEquivData = data; },
    fileEquivalencias: (data) => { fileEquivalenciasData = data; }
  };

  Object.entries(inputs).forEach(([id, setter]) => {
    const input = document.getElementById(id);
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          setter(data);
          input.classList.add('file-ok');
          verificarUploadCompleto();
        } catch (err) {
          alert(`Erro ao ler ${file.name}: JSON inválido.`);
          input.classList.remove('file-ok');
        }
      };
      reader.readAsText(file);
    });
  });

  document.getElementById('btnCarregar').addEventListener('click', carregarDados);
}

function verificarUploadCompleto() {
  const btn = document.getElementById('btnCarregar');
  if (fileTorinoData && fileCursosEquivData && fileEquivalenciasData) {
    btn.disabled = false;
    btn.textContent = 'Carregar e Visualizar';
  } else {
    const faltam = [];
    if (!fileTorinoData) faltam.push('Curso de referência');
    if (!fileCursosEquivData) faltam.push('Cursos equivalentes');
    if (!fileEquivalenciasData) faltam.push('Equivalências de disciplinas');
    btn.disabled = true;
    btn.textContent = `Faltam: ${faltam.join(', ')}`;
  }
}

// Carrega os dados dos 3 arquivos e registra sessão no servidor
async function carregarDados() {
  if (!fileTorinoData || !fileCursosEquivData || !fileEquivalenciasData) return;

  showLoading();

  // Monta a estrutura de dados interna (mesma que o antigo GET /api/curso/:id retornava)
  currentData = {
    torino: fileTorinoData,
    cursosEquivalentes: fileCursosEquivData,
    equivalencias: fileEquivalenciasData,
    metadados: {
      cursoReferencia: fileCursosEquivData.curso_referencia || 'Curso',
      instituicao: fileCursosEquivData.instituicao_base || 'Instituição'
    }
  };

  // Registra sessão no servidor (em background — necessário para o Construtor)
  try {
    const formData = new FormData();

    const torino_blob = new Blob([JSON.stringify(fileTorinoData)], { type: 'application/json' });
    const cursos_blob = new Blob([JSON.stringify(fileCursosEquivData)], { type: 'application/json' });
    const equiv_blob  = new Blob([JSON.stringify(fileEquivalenciasData)], { type: 'application/json' });

    formData.append('torino', torino_blob, 'torino.json');
    formData.append('cursosEquivalentes', cursos_blob, 'cursosEquivalentes.json');
    formData.append('equivalencias', equiv_blob, 'equivalencias.json');

    const resp = await fetch('/api/sessao', { method: 'POST', body: formData });
    if (resp.ok) {
      const { sessionId } = await resp.json();
      currentSessionId = sessionId;
      localStorage.setItem('currentSessionId', sessionId);
      console.log('[OK] Sessão registrada:', sessionId);
    }
  } catch (e) {
    // Falha silenciosa — os dados já foram carregados client-side
    console.warn('[AVISO] Não foi possível registrar sessão no servidor:', e.message);
  }

  hideLoading();
  renderData();

  // Atualiza lista de sessões ativas
  carregarSessoesAtivas();

  // Scroll para a visualização
  document.getElementById('overview').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// SESSÕES ATIVAS (recarregar de sessões anteriores)
// ============================================================

async function carregarSessoesAtivas() {
  try {
    const resp = await fetch('/api/sessoes');
    const sessoes = await resp.json();

    const section = document.getElementById('sessoesSection');
    const list = document.getElementById('sessoesList');

    if (sessoes.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    list.innerHTML = '';

    sessoes.forEach(s => {
      const chip = document.createElement('button');
      chip.className = 'sessao-chip';
      chip.innerHTML = `<span class="chip-inst">${s.metadados.instituicao}</span> ${s.metadados.cursoReferencia}`;
      chip.addEventListener('click', () => carregarSessao(s.id));
      list.appendChild(chip);
    });
  } catch (e) {
    // silencioso
  }
}

async function carregarSessao(sessionId) {
  showLoading();
  try {
    const resp = await fetch(`/api/sessao/${sessionId}`);
    if (!resp.ok) throw new Error('Sessão não encontrada');
    currentData = await resp.json();
    currentSessionId = sessionId;
    localStorage.setItem('currentSessionId', sessionId);
    hideLoading();
    renderData();
    document.getElementById('overview').scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    hideLoading();
    alert('Erro ao carregar sessão: ' + e.message);
  }
}

// ============================================================
// RENDERIZAÇÃO
// ============================================================

function renderData() {
  if (!currentData) return;

  const inst = currentData.metadados?.instituicao || 'Instituição';
  const ref  = currentData.metadados?.cursoReferencia || 'Curso';

  document.getElementById('instituicaoSubtitle').textContent = `${ref} × ${inst}`;
  document.getElementById('cursosEquivalentesLabel').textContent = `Cursos Equivalentes da ${inst}`;
  document.getElementById('cursosEquivalentesTitulo').textContent = `Cursos Equivalentes da ${inst}`;
  document.getElementById('cursoFilterLabel').textContent = `Filtrar por curso da ${inst}:`;

  // Link do construtor com sessionId
  if (currentSessionId) {
    const construtorLink = document.querySelector('.nav-link');
    if (construtorLink) {
      construtorLink.href = `/construtor.html?sessionId=${currentSessionId}&instituicao=${inst}`;
    }
  }

  renderOverview();
  renderCursosEquivalentes();
  renderEquivalencias();
  showAllSections();
}

function renderOverview() {
  const totalTorino = Array.isArray(currentData.torino) ? currentData.torino.length : 0;
  const totalCursos = currentData.cursosEquivalentes?.total_cursos_equivalentes || 0;

  let totalEquiv = 0;
  (currentData.equivalencias?.cursos_com_equivalencias || []).forEach(curso => {
    (curso.equivalencias || []).forEach(eq => {
      totalEquiv += (eq.disciplinasInstituicao || []).length;
    });
  });

  document.getElementById('totalDisciplinasTorino').textContent = totalTorino;
  document.getElementById('totalCursosEquivalentes').textContent = totalCursos;
  document.getElementById('totalEquivalencias').textContent = totalEquiv;
}

function renderCursosEquivalentes() {
  const container = document.getElementById('cursosEquivalentesList');
  container.innerHTML = '';

  (currentData.cursosEquivalentes?.cursos_equivalentes || []).forEach(cursoNome => {
    const cursoDiv = document.createElement('div');
    cursoDiv.className = 'curso-item';

    const cursoEquiv = (currentData.equivalencias?.cursos_com_equivalencias || [])
      .find(c => c.nome === cursoNome);

    let totalEquiv = 0;
    if (cursoEquiv) {
      (cursoEquiv.equivalencias || []).forEach(eq => {
        totalEquiv += (eq.disciplinasInstituicao || []).length;
      });
    }

    cursoDiv.innerHTML = `
      <h4>${cursoNome}</h4>
      <span class="curso-badge">${totalEquiv} equivalências</span>
    `;
    container.appendChild(cursoDiv);
  });
}

function renderEquivalencias() {
  populateCursoFilter();
  applyFilters();
}

function populateCursoFilter() {
  const select = document.getElementById('cursoFilter');
  select.innerHTML = '<option value="">Todos os cursos</option>';
  (currentData.cursosEquivalentes?.cursos_equivalentes || []).forEach(nome => {
    const opt = document.createElement('option');
    opt.value = nome;
    opt.textContent = nome;
    select.appendChild(opt);
  });
}

// ============================================================
// FILTROS E ALTERNÂNCIA DE VISUALIZAÇÃO
// ============================================================

function setupFilterListeners() {
  document.getElementById('cursoFilter').addEventListener('change', applyFilters);
  document.getElementById('statusFilter').addEventListener('change', applyFilters);
  document.getElementById('viewModeToggle').addEventListener('click', toggleViewMode);
}

function toggleViewMode() {
  isInvertedView = !isInvertedView;
  const btn = document.getElementById('toggleLabel');
  const inst = currentData?.metadados?.instituicao || 'Brasil';

  if (isInvertedView) {
    btn.textContent = `${inst} → Referência`;
    document.getElementById('viewModeToggle').classList.add('inverted');
  } else {
    btn.textContent = 'Referência → Brasil';
    document.getElementById('viewModeToggle').classList.remove('inverted');
  }
  applyFilters();
}

function applyFilters() {
  if (isInvertedView) {
    renderInvertedView();
  } else {
    renderNormalView();
  }
}

// Visualização normal: Referência → Brasil
function renderNormalView() {
  const cursoFilter  = document.getElementById('cursoFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;
  const container    = document.getElementById('equivalenciasGrid');
  container.innerHTML = '';

  const torino = Array.isArray(currentData.torino) ? currentData.torino : [];

  torino.forEach(discTorino => {
    const equivalencias = [];

    (currentData.equivalencias?.cursos_com_equivalencias || []).forEach((curso, cursoIdx) => {
      if (cursoFilter && curso.nome !== cursoFilter) return;

      const eqIdx = (curso.equivalencias || []).findIndex(e => e.disciplinaTorino === discTorino.nome);
      if (eqIdx !== -1) {
        equivalencias.push({
          curso: curso.nome,
          disciplinas: curso.equivalencias[eqIdx].disciplinasInstituicao || [],
          cursoIdx,
          eqIdx
        });
      }
    });

    const hasEquivalentes = equivalencias.some(eq => eq.disciplinas.length > 0);
    if (statusFilter === 'with' && !hasEquivalentes) return;
    if (statusFilter === 'without' && hasEquivalentes) return;

    const item = document.createElement('div');
    item.className = 'equivalencia-item';

    const badges = [];
    if (discTorino.creditos) badges.push(`<span class="badge badge-credits">${discTorino.creditos} créditos</span>`);
    if (discTorino.lingua)   badges.push(`<span class="badge badge-language">${discTorino.lingua}</span>`);
    if (discTorino.periodo)  badges.push(`<span class="badge" style="background:#fef3c7;color:#92400e">${discTorino.periodo}</span>`);
    if (discTorino.anno)     badges.push(`<span class="badge" style="background:#e0e7ff;color:#3730a3">${discTorino.anno}</span>`);

    item.innerHTML = `
      <div class="equivalencia-header">
        <h3>${discTorino.nome}</h3>
        <div class="equivalencia-badges">${badges.join('')}</div>
      </div>
    `;

    const body = document.createElement('div');
    body.className = 'equivalencia-body';

    if (!hasEquivalentes || equivalencias.length === 0) {
      body.innerHTML = `<div class="sem-equivalentes"><span class="badge badge-no-equiv">Sem equivalentes encontrados</span></div>`;
    } else {
      equivalencias.forEach(eq => {
        if (eq.disciplinas.length === 0 && !isEditing) return;

        const row = document.createElement('div');
        row.className = 'equivalencia-row';

        const discsHtml = eq.disciplinas.map((disc, dIdx) => {
          if (isEditing) {
            return `<div class="disciplina-instituicao editable">
              <span class="disc-text">${disc}</span>
              <button class="btn-remove" onclick="removeDisciplina(${eq.cursoIdx},${eq.eqIdx},${dIdx})" title="Remover">✕</button>
            </div>`;
          }
          return `<div class="disciplina-instituicao">${disc}</div>`;
        }).join('');

        const addBtn = isEditing
          ? `<button class="btn-add-disc" onclick="addDisciplina(${eq.cursoIdx},${eq.eqIdx})">+ Adicionar disciplina</button>`
          : '';

        row.innerHTML = `
          <div class="curso-instituicao-title">${eq.curso}</div>
          <div class="disciplinas-container">${discsHtml}${addBtn}</div>
        `;
        body.appendChild(row);
      });
    }

    item.appendChild(body);
    container.appendChild(item);
  });
}

// Visualização invertida: Brasil → Referência
function renderInvertedView() {
  const cursoFilter  = document.getElementById('cursoFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;
  const container    = document.getElementById('equivalenciasGrid');
  container.innerHTML = '';

  const invertedMap = new Map();
  (currentData.equivalencias?.cursos_com_equivalencias || []).forEach(curso => {
    (curso.equivalencias || []).forEach(eq => {
      (eq.disciplinasInstituicao || []).forEach(discBr => {
        const key = `${curso.nome}|||${discBr}`;
        if (!invertedMap.has(key)) {
          invertedMap.set(key, { disciplina: discBr, curso: curso.nome, equivalentesTorino: [] });
        }
        const entry = invertedMap.get(key);
        if (!entry.equivalentesTorino.includes(eq.disciplinaTorino)) {
          entry.equivalentesTorino.push(eq.disciplinaTorino);
        }
      });
    });
  });

  let data = Array.from(invertedMap.values());
  if (cursoFilter) data = data.filter(i => i.curso === cursoFilter);

  data.sort((a, b) => a.disciplina.localeCompare(b.disciplina));

  data.forEach(item => {
    const hasEquiv = item.equivalentesTorino.length > 0;
    if (statusFilter === 'with' && !hasEquiv) return;
    if (statusFilter === 'without' && hasEquiv) return;

    const elem = document.createElement('div');
    elem.className = 'equivalencia-item';

    elem.innerHTML = `
      <div class="equivalencia-header">
        <h3>${item.disciplina}</h3>
        <div class="equivalencia-badges">
          <span class="badge" style="background:#d1fae5;color:#065f46">${item.curso}</span>
        </div>
      </div>
    `;

    const body = document.createElement('div');
    body.className = 'equivalencia-body';

    if (!hasEquiv) {
      body.innerHTML = `<div class="sem-equivalentes"><span class="badge badge-no-equiv">Sem equivalentes</span></div>`;
    } else {
      const row = document.createElement('div');
      row.className = 'equivalencia-row';

      const torino = Array.isArray(currentData.torino) ? currentData.torino : [];
      const discsHtml = item.equivalentesTorino.map(nome => {
        const info = torino.find(d => d.nome === nome);
        const mini = info
          ? [info.creditos ? `<span class="badge-mini">${info.creditos} cr</span>` : '',
             info.anno     ? `<span class="badge-mini">${info.anno}</span>` : ''].filter(Boolean).join(' ')
          : '';
        return `<div class="disciplina-instituicao"><strong>${nome}</strong>${mini ? `<div class="badges-inline">${mini}</div>` : ''}</div>`;
      }).join('');

      row.innerHTML = `
        <div class="curso-instituicao-title">Equivalente no curso de referência</div>
        <div class="disciplinas-container">${discsHtml}</div>
      `;
      body.appendChild(row);
    }

    elem.appendChild(body);
    container.appendChild(elem);
  });

  if (container.children.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Nenhuma disciplina com os filtros selecionados.</p></div>`;
  }
}

// ============================================================
// MODO DE EDIÇÃO
// ============================================================

function setupEditListeners() {
  document.getElementById('editBtn').addEventListener('click', enterEditMode);
  document.getElementById('saveBtn').addEventListener('click', saveAndDownload);
  document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
}

function enterEditMode() {
  if (!currentData) return;
  isEditing = true;
  originalData = JSON.parse(JSON.stringify(currentData));
  document.getElementById('editBtn').style.display = 'none';
  document.getElementById('saveBtn').style.display = 'inline-block';
  document.getElementById('cancelBtn').style.display = 'inline-block';
  document.body.classList.add('editing-mode');
  renderEquivalencias();
}

function cancelEdit() {
  isEditing = false;
  currentData = originalData;
  originalData = null;
  document.getElementById('editBtn').style.display = 'inline-block';
  document.getElementById('saveBtn').style.display = 'none';
  document.getElementById('cancelBtn').style.display = 'none';
  document.body.classList.remove('editing-mode');
  renderEquivalencias();
}

function saveAndDownload() {
  if (!currentData) return;
  isEditing = false;
  originalData = null;
  document.getElementById('editBtn').style.display = 'inline-block';
  document.getElementById('saveBtn').style.display = 'none';
  document.getElementById('cancelBtn').style.display = 'none';
  document.body.classList.remove('editing-mode');

  const inst = currentData.equivalencias?.instituicao_base || 'INST';
  downloadJSON(currentData.equivalencias, `${inst}_equivalencias_disciplinas_editado.json`);
  renderEquivalencias();
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// FUNÇÕES DE EDIÇÃO INLINE
// ============================================================

function removeDisciplina(cursoIdx, eqIdx, discIdx) {
  currentData.equivalencias.cursos_com_equivalencias[cursoIdx].equivalencias[eqIdx]
    .disciplinasInstituicao.splice(discIdx, 1);
  renderEquivalencias();
}

function addDisciplina(cursoIdx, eqIdx) {
  const nova = prompt('Digite o nome da disciplina:');
  if (!nova || !nova.trim()) return;
  currentData.equivalencias.cursos_com_equivalencias[cursoIdx].equivalencias[eqIdx]
    .disciplinasInstituicao.push(nova.trim());
  renderEquivalencias();
}

// Torna funções disponíveis globalmente (usadas via onclick no HTML gerado dinamicamente)
window.removeDisciplina = removeDisciplina;
window.addDisciplina    = addDisciplina;

// ============================================================
// HELPERS DE UI
// ============================================================

function showLoading() {
  document.getElementById('loading').style.display = 'block';
  hideAllSections();
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function showAllSections() {
  document.getElementById('overview').style.display = 'block';
  document.getElementById('cursosEquivalentesSection').style.display = 'block';
  document.getElementById('equivalenciasSection').style.display = 'block';
}

function hideAllSections() {
  document.getElementById('overview').style.display = 'none';
  document.getElementById('cursosEquivalentesSection').style.display = 'none';
  document.getElementById('equivalenciasSection').style.display = 'none';
}
