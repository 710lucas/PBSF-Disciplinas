// instituicoes.js — Explorador de dados das instituições brasileiras
// URL da API é relativa para funcionar em qualquer host

let currentData = null;
let currentInstituicao = null;
let filteredCursos = [];

document.addEventListener('DOMContentLoaded', () => {
  loadInstituicoes();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('instituicaoSelect').addEventListener('change', handleInstituicaoChange);
  document.getElementById('searchInput').addEventListener('input', handleSearch);
}

async function loadInstituicoes() {
  try {
    const response = await fetch('/api/instituicoes');
    const instituicoes = await response.json();

    const select = document.getElementById('instituicaoSelect');
    select.innerHTML = '<option value="">Selecione uma instituição...</option>';

    instituicoes.forEach(inst => {
      const option = document.createElement('option');
      option.value = inst.sigla;
      option.textContent = `${inst.sigla} - ${inst.nome}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar instituições:', error);
    alert('Erro ao carregar lista de instituições. Verifique se o servidor está rodando.');
  }
}

async function handleInstituicaoChange(event) {
  const sigla = event.target.value;

  if (!sigla) {
    hideAllSections();
    return;
  }

  currentInstituicao = sigla;
  showLoading();

  try {
    const response = await fetch(`/api/instituicao/${sigla}`);
    currentData = await response.json();

    currentData = currentData.filter(curso =>
      curso &&
      typeof curso === 'object' &&
      curso.titulo &&
      Array.isArray(curso.disciplinas) &&
      curso.disciplinas.length > 0
    );

    filteredCursos = [...currentData];

    hideLoading();
    renderData();
  } catch (error) {
    console.error('Erro ao carregar dados da instituição:', error);
    hideLoading();
    alert('Erro ao carregar dados da instituição.');
  }
}

function renderData() {
  if (!currentData || currentData.length === 0) {
    showEmptyState();
    return;
  }
  renderStats();
  renderCursos();
  showAllSections();
}

function renderStats() {
  let totalDisciplinas = 0;
  filteredCursos.forEach(curso => {
    if (curso.disciplinas) totalDisciplinas += curso.disciplinas.length;
  });
  document.getElementById('totalCursos').textContent = filteredCursos.length;
  document.getElementById('totalDisciplinas').textContent = totalDisciplinas;
}

function renderCursos() {
  const container = document.getElementById('cursosGrid');
  container.innerHTML = '';

  if (filteredCursos.length === 0) { showEmptyState(); return; }
  hideEmptyState();

  filteredCursos.forEach((curso, index) => {
    const card = document.createElement('div');
    card.className = 'curso-card';
    card.id = `curso-${index}`;

    const numDisc = curso.disciplinas ? curso.disciplinas.length : 0;

    card.innerHTML = `
      <div class="curso-header" onclick="toggleCurso(${index})">
        <h3 class="curso-title">${curso.titulo}</h3>
        <span class="curso-badge">${numDisc} disciplinas</span>
        <span class="curso-chevron" id="chevron-${index}">›</span>
      </div>
      <div class="curso-body" id="body-${index}">
        <div class="disciplinas-list">${renderDisciplinas(curso.disciplinas)}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderDisciplinas(disciplinas) {
  if (!disciplinas || disciplinas.length === 0) {
    return '<p style="color:#94a3b8;padding:20px">Nenhuma disciplina encontrada</p>';
  }
  return disciplinas.map(disc => {
    const clean = disc.replace(/\s+/g, ' ').trim();
    return `<div class="disciplina-item">${clean}</div>`;
  }).join('');
}

function toggleCurso(index) {
  document.getElementById(`body-${index}`).classList.toggle('expanded');
  document.getElementById(`chevron-${index}`).classList.toggle('expanded');
}

function handleSearch(event) {
  const term = event.target.value.toLowerCase().trim();

  if (!term) {
    filteredCursos = [...currentData];
    renderData();
    return;
  }

  filteredCursos = currentData.filter(curso => {
    if (curso.titulo && curso.titulo.toLowerCase().includes(term)) return true;
    if (curso.disciplinas && Array.isArray(curso.disciplinas)) {
      return curso.disciplinas.some(d => d && d.toLowerCase().includes(term));
    }
    return false;
  }).map(curso => {
    const filtrado = { ...curso };
    if (!curso.titulo.toLowerCase().includes(term)) {
      filtrado.disciplinas = curso.disciplinas.filter(d => d && d.toLowerCase().includes(term));
    }
    return filtrado;
  });

  renderData();
}

function showLoading() {
  document.getElementById('loading').style.display = 'block';
  hideAllSections();
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function showAllSections() {
  document.getElementById('statsSection').style.display = 'block';
  document.getElementById('cursosSection').style.display = 'block';
  hideEmptyState();
}

function hideAllSections() {
  document.getElementById('statsSection').style.display = 'none';
  document.getElementById('cursosSection').style.display = 'none';
  hideEmptyState();
}

function showEmptyState() {
  document.getElementById('emptyState').style.display = 'block';
  document.getElementById('cursosSection').style.display = 'none';
}

function hideEmptyState() {
  document.getElementById('emptyState').style.display = 'none';
}

window.toggleCurso = toggleCurso;
