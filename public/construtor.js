// ============================================================
// construtor.js — Montagem Manual de Equivalências v2
// Carrega dados do curso de referência via sessionId
// e dados institucionais via /api/instituicao/:sigla
// ============================================================

let dadosTorino = [];
let dadosInstituicao = [];
let equivalenciasCriadas = [];
let disciplinaTorinoSelecionada = null;
let currentInstituicao = null;

const STORAGE_KEY = 'equivalencias_manuais_v2';

// Lê sessionId e instituição dos params da URL ou localStorage
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('sessionId') || localStorage.getItem('currentSessionId');
const instituicaoParam = urlParams.get('instituicao') || '';

// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function init() {
  await carregarInstituicoes();
  carregarEquivalenciasLocalStorage();
  configurarEventos();
  atualizarContador();

  if (sessionId) {
    await carregarTorino();
    document.getElementById('sessionStatus').style.display = 'none';
    document.getElementById('sessionControls').style.display = 'flex';
  } else {
    document.getElementById('listaTorino').innerHTML =
      '<div class="loading">Nenhuma sessão encontrada. <a href="/index.html">Carregue uma análise primeiro.</a></div>';
  }
}

// ============================================================
// CARREGAR DADOS DO CURSO DE REFERÊNCIA (via sessão)
// ============================================================

async function carregarTorino() {
  try {
    const resp = await fetch(`/api/sessao/${sessionId}`);
    if (!resp.ok) throw new Error('Sessão não encontrada');

    const sessao = await resp.json();
    dadosTorino = Array.isArray(sessao.torino) ? sessao.torino : [];

    const ref   = sessao.metadados?.cursoReferencia || 'Curso de Referência';
    const inst  = sessao.metadados?.instituicao || '';

    document.getElementById('sessionInfo').textContent = ref;
    document.getElementById('sessionLabel').textContent = `Sessão: ${ref}`;
    document.getElementById('torinoTitle').textContent = `Disciplinas — ${ref}`;

    popularFiltros();
    renderizarTorino();

    // Se a URL trouxe a instituição, carrega automaticamente
    if (instituicaoParam) {
      const select = document.getElementById('instituicaoSelect');
      select.value = instituicaoParam;
      if (select.value) await carregarInstituicaoData(instituicaoParam);
    }

  } catch (e) {
    console.error('[ERRO] Falha ao carregar sessão:', e.message);
    document.getElementById('listaTorino').innerHTML =
      `<div class="loading" style="color:var(--danger)">Erro ao carregar sessão: ${e.message}. <a href="/index.html">Recarregar análise</a></div>`;
  }
}

// ============================================================
// CARREGAR LISTA DE INSTITUIÇÕES DISPONÍVEIS
// ============================================================

async function carregarInstituicoes() {
  try {
    const resp = await fetch('/api/instituicoes');
    const instituicoes = await resp.json();

    const select = document.getElementById('instituicaoSelect');
    select.innerHTML = '<option value="">Selecione uma instituição...</option>';

    instituicoes.forEach(inst => {
      const opt = document.createElement('option');
      opt.value = inst.sigla;
      opt.textContent = `${inst.sigla} — ${inst.nome}`;
      select.appendChild(opt);
    });

    select.addEventListener('change', async (e) => {
      const sigla = e.target.value;
      if (sigla) await carregarInstituicaoData(sigla);
    });

  } catch (e) {
    console.error('[ERRO] Falha ao carregar instituições:', e.message);
  }
}

// ============================================================
// CARREGAR DADOS DA INSTITUIÇÃO BRASILEIRA
// ============================================================

async function carregarInstituicaoData(sigla) {
  currentInstituicao = sigla;
  document.getElementById('listaInst').innerHTML = '<div class="loading">Carregando...</div>';
  document.getElementById('instTitle').textContent = `Cursos e Disciplinas — ${sigla}`;

  try {
    const resp = await fetch(`/api/instituicao/${sigla}`);
    if (!resp.ok) throw new Error(`Instituição ${sigla} não encontrada`);
    dadosInstituicao = await resp.json();
    renderizarInstituicao();
  } catch (e) {
    console.error('[ERRO]', e.message);
    document.getElementById('listaInst').innerHTML =
      `<div class="loading" style="color:var(--danger)">Erro ao carregar ${sigla}: ${e.message}</div>`;
  }
}

// ============================================================
// POPULAR FILTROS (ano, língua)
// ============================================================

function popularFiltros() {
  const anos   = [...new Set(dadosTorino.map(d => d.anno))].filter(Boolean).sort();
  const linguas = [...new Set(dadosTorino.map(d => d.lingua))].filter(Boolean).sort();

  const filterAnno   = document.getElementById('filterAnno');
  const filterLingua = document.getElementById('filterLingua');

  filterAnno.innerHTML   = '<option value="">Todos os anos</option>';
  filterLingua.innerHTML = '<option value="">Todos os idiomas</option>';

  anos.forEach(ano => {
    const opt = document.createElement('option');
    opt.value = ano; opt.textContent = ano;
    filterAnno.appendChild(opt);
  });

  linguas.forEach(lang => {
    const opt = document.createElement('option');
    opt.value = lang; opt.textContent = lang;
    filterLingua.appendChild(opt);
  });
}

// ============================================================
// RENDERIZAR DISCIPLINAS DO CURSO DE REFERÊNCIA
// ============================================================

function renderizarTorino() {
  const container   = document.getElementById('listaTorino');
  const searchTerm  = document.getElementById('searchTorino').value.toLowerCase();
  const filterAnno  = document.getElementById('filterAnno').value;
  const filterLingua = document.getElementById('filterLingua').value;

  const filtradas = dadosTorino.filter(disc => {
    const matchSearch = !searchTerm || disc.nome.toLowerCase().includes(searchTerm);
    const matchAnno   = !filterAnno  || disc.anno   === filterAnno;
    const matchLingua = !filterLingua || disc.lingua === filterLingua;
    return matchSearch && matchAnno && matchLingua;
  });

  if (filtradas.length === 0) {
    container.innerHTML = '<div class="loading">Nenhuma disciplina encontrada</div>';
    return;
  }

  container.innerHTML = filtradas.map((disc, index) => `
    <div class="disciplina-card ${disciplinaTorinoSelecionada?.nome === disc.nome ? 'selected' : ''}"
         data-index="${index}"
         onclick="selecionarDisciplinaTorino(${index})">
      <h4>${disc.nome}</h4>
      <div class="disciplina-meta">
        ${disc.anno    ? `<span class="meta-tag anno">${disc.anno}</span>` : ''}
        ${disc.creditos ? `<span class="meta-tag creditos">${disc.creditos} cr</span>` : ''}
        ${disc.lingua  ? `<span class="meta-tag lingua">${disc.lingua}</span>` : ''}
      </div>
    </div>
  `).join('');
}

// ============================================================
// RENDERIZAR CURSOS E DISCIPLINAS DA INSTITUIÇÃO
// ============================================================

function renderizarInstituicao() {
  const container  = document.getElementById('listaInst');
  const searchTerm = document.getElementById('searchInst').value.toLowerCase();

  let cursosFiltrados = dadosInstituicao.filter(c => c && c.titulo && Array.isArray(c.disciplinas));

  if (searchTerm) {
    cursosFiltrados = cursosFiltrados.filter(curso => {
      const matchCurso = curso.titulo.toLowerCase().includes(searchTerm);
      const matchDisc  = curso.disciplinas.some(d => d.toLowerCase().includes(searchTerm));
      return matchCurso || matchDisc;
    });
  }

  if (cursosFiltrados.length === 0) {
    container.innerHTML = '<div class="loading">Nenhum curso encontrado</div>';
    return;
  }

  container.innerHTML = cursosFiltrados.map((curso, cursoIdx) => {
    const cursoId = `curso-inst-${cursoIdx}`;
    const discsVisiveis = searchTerm
      ? curso.disciplinas.filter(d => d.toLowerCase().includes(searchTerm))
      : curso.disciplinas;

    return `
      <div class="curso-ufpb-card" id="${cursoId}">
        <div class="curso-header" onclick="toggleCurso('${cursoId}')">
          <h4>${curso.titulo}</h4>
          <span class="curso-toggle">▼</span>
        </div>
        <div class="disciplinas-ufpb-list">
          ${discsVisiveis.map(disc => {
            const isAssoc = disciplinaTorinoSelecionada &&
              equivalenciaExiste(disciplinaTorinoSelecionada.nome, disc);
            return `
              <div class="disciplina-ufpb-item ${isAssoc ? 'associated' : ''}">
                <span class="disciplina-ufpb-text">${disc}</span>
                <button class="btn-associar"
                  onclick="associarDisciplina('${escaparAspas(disc)}')"
                  ${!disciplinaTorinoSelecionada || isAssoc ? 'disabled' : ''}>
                  ${isAssoc ? '✓ Associada' : '+ Associar'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// RENDERIZAR EQUIVALÊNCIAS CRIADAS
// ============================================================

function renderizarEquivalencias() {
  const container = document.getElementById('listaEquivalencias');
  const instLabel = currentInstituicao || 'Instituição';

  if (equivalenciasCriadas.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Nenhuma equivalência criada ainda.</p>
        <p class="empty-hint">Selecione uma disciplina de referência e clique em "Associar"</p>
      </div>`;
    return;
  }

  container.innerHTML = equivalenciasCriadas.map((equiv, equivIdx) => `
    <div class="equivalencia-construida">
      <div class="equivalencia-construida-header">
        <div class="equiv-torino">
          <h4>${equiv.disciplinaTorino.nome}</h4>
          <div class="disciplina-meta">
            ${equiv.disciplinaTorino.anno    ? `<span class="meta-tag anno">${equiv.disciplinaTorino.anno}</span>` : ''}
            ${equiv.disciplinaTorino.creditos ? `<span class="meta-tag creditos">${equiv.disciplinaTorino.creditos} cr</span>` : ''}
          </div>
        </div>
        <button class="btn-remover-equiv" onclick="removerEquivalencia(${equivIdx})">🗑️</button>
      </div>
      <div class="equiv-arrow">⬇ Equivale a ${equiv.disciplinasInstituicao.length} disciplina(s) da ${instLabel}</div>
      <div class="equiv-ufpb-list">
        ${equiv.disciplinasInstituicao.map((disc, discIdx) => `
          <div class="equiv-ufpb-item">
            <span>${disc}</span>
            <button class="btn-remover-disc" onclick="removerDisciplinaDaEquivalencia(${equivIdx},${discIdx})">✕</button>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ============================================================
// SELEÇÃO E ASSOCIAÇÃO
// ============================================================

function selecionarDisciplinaTorino(index) {
  const searchTerm   = document.getElementById('searchTorino').value.toLowerCase();
  const filterAnno   = document.getElementById('filterAnno').value;
  const filterLingua = document.getElementById('filterLingua').value;

  const filtradas = dadosTorino.filter(disc => {
    const matchSearch = !searchTerm || disc.nome.toLowerCase().includes(searchTerm);
    const matchAnno   = !filterAnno  || disc.anno   === filterAnno;
    const matchLingua = !filterLingua || disc.lingua === filterLingua;
    return matchSearch && matchAnno && matchLingua;
  });

  disciplinaTorinoSelecionada = filtradas[index] || null;
  renderizarTorino();
  renderizarInstituicao();
}

function associarDisciplina(discInstituicao) {
  if (!disciplinaTorinoSelecionada) {
    alert('Selecione primeiro uma disciplina de referência');
    return;
  }

  let equiv = equivalenciasCriadas.find(e =>
    e.disciplinaTorino.nome === disciplinaTorinoSelecionada.nome
  );

  if (equiv) {
    if (!equiv.disciplinasInstituicao.includes(discInstituicao)) {
      equiv.disciplinasInstituicao.push(discInstituicao);
    }
  } else {
    equivalenciasCriadas.push({
      disciplinaTorino: { ...disciplinaTorinoSelecionada },
      disciplinasInstituicao: [discInstituicao]
    });
  }

  salvarEquivalenciasLocalStorage();
  renderizarInstituicao();
  renderizarEquivalencias();
  atualizarContador();
}

function equivalenciaExiste(nomeTorino, discInst) {
  const equiv = equivalenciasCriadas.find(e => e.disciplinaTorino.nome === nomeTorino);
  return equiv && equiv.disciplinasInstituicao.includes(discInst);
}

function removerDisciplinaDaEquivalencia(equivIdx, discIdx) {
  equivalenciasCriadas[equivIdx].disciplinasInstituicao.splice(discIdx, 1);
  if (equivalenciasCriadas[equivIdx].disciplinasInstituicao.length === 0) {
    equivalenciasCriadas.splice(equivIdx, 1);
  }
  salvarEquivalenciasLocalStorage();
  renderizarInstituicao();
  renderizarEquivalencias();
  atualizarContador();
}

function removerEquivalencia(equivIdx) {
  if (confirm('Remover esta equivalência?')) {
    equivalenciasCriadas.splice(equivIdx, 1);
    salvarEquivalenciasLocalStorage();
    renderizarInstituicao();
    renderizarEquivalencias();
    atualizarContador();
  }
}

function toggleCurso(cursoId) {
  document.getElementById(cursoId).classList.toggle('expanded');
}

// ============================================================
// EXPORT / IMPORT / LIMPAR
// ============================================================

function exportarJSON() {
  if (equivalenciasCriadas.length === 0) {
    alert('Não há equivalências para exportar');
    return;
  }
  const json = JSON.stringify(equivalenciasCriadas, null, 2);
  navigator.clipboard.writeText(json)
    .then(() => alert('JSON copiado para a área de transferência!'))
    .catch(() => prompt('Copie o JSON abaixo:', json));
}

function importarJSON() {
  const json = prompt('Cole o JSON das equivalências:');
  if (!json) return;
  try {
    const importado = JSON.parse(json);
    if (!Array.isArray(importado)) throw new Error('Deve ser um array');
    for (const e of importado) {
      if (!e.disciplinaTorino || !e.disciplinasInstituicao) throw new Error('Estrutura inválida');
    }
    if (confirm(`Importar ${importado.length} equivalência(s)?`)) {
      equivalenciasCriadas = importado;
      salvarEquivalenciasLocalStorage();
      renderizarEquivalencias();
      atualizarContador();
      alert('Importado com sucesso!');
    }
  } catch (e) {
    alert('Erro ao importar: ' + e.message);
  }
}

function limparTudo() {
  if (confirm('Limpar TODAS as equivalências? Ação irreversível.')) {
    equivalenciasCriadas = [];
    disciplinaTorinoSelecionada = null;
    salvarEquivalenciasLocalStorage();
    renderizarTorino();
    renderizarInstituicao();
    renderizarEquivalencias();
    atualizarContador();
  }
}

// ============================================================
// ESTADO E HELPERS
// ============================================================

function atualizarContador() {
  document.getElementById('countEquivalencias').textContent = equivalenciasCriadas.length;
}

function salvarEquivalenciasLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(equivalenciasCriadas));
}

function carregarEquivalenciasLocalStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { equivalenciasCriadas = JSON.parse(stored); } catch (e) { equivalenciasCriadas = []; }
  }
}

function configurarEventos() {
  document.getElementById('searchTorino').addEventListener('input', renderizarTorino);
  document.getElementById('searchInst').addEventListener('input', renderizarInstituicao);
  document.getElementById('filterAnno').addEventListener('change', renderizarTorino);
  document.getElementById('filterLingua').addEventListener('change', renderizarTorino);
  document.getElementById('btnExportar').addEventListener('click', exportarJSON);
  document.getElementById('btnImportar').addEventListener('click', importarJSON);
  document.getElementById('btnLimpar').addEventListener('click', limparTudo);
}

function escaparAspas(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Torna funções disponíveis globalmente (referenciadas em onclick no HTML dinâmico)
window.selecionarDisciplinaTorino = selecionarDisciplinaTorino;
window.associarDisciplina          = associarDisciplina;
window.removerEquivalencia         = removerEquivalencia;
window.removerDisciplinaDaEquivalencia = removerDisciplinaDaEquivalencia;
window.toggleCurso                 = toggleCurso;

// Inicia quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
