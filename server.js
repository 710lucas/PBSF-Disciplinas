const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer — armazena uploads em memória (não grava em disco)
const upload = multer({ storage: multer.memoryStorage() });

// Store de sessões em memória
// Estrutura: { [sessionId]: { torino, cursosEquivalentes, equivalencias, metadados, criadaEm } }
const sessoes = {};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Redireciona raiz para home.html
app.get('/', (req, res) => {
  res.redirect('/home.html');
});

// ============================================================
// POST /api/sessao
// Recebe os 3 arquivos JSON e cria uma sessão em memória.
// Campos multipart esperados: torino, cursosEquivalentes, equivalencias
// Retorna: { sessionId, metadados }
// ============================================================
app.post('/api/sessao',
  upload.fields([
    { name: 'torino', maxCount: 1 },
    { name: 'cursosEquivalentes', maxCount: 1 },
    { name: 'equivalencias', maxCount: 1 }
  ]),
  (req, res) => {
    try {
      const files = req.files;

      if (!files || !files.torino || !files.cursosEquivalentes || !files.equivalencias) {
        return res.status(400).json({
          error: 'Envie os 3 arquivos: torino, cursosEquivalentes, equivalencias'
        });
      }

      const torino = JSON.parse(files.torino[0].buffer.toString('utf8'));
      const cursosEquivalentes = JSON.parse(files.cursosEquivalentes[0].buffer.toString('utf8'));
      const equivalencias = JSON.parse(files.equivalencias[0].buffer.toString('utf8'));

      const sessionId = randomUUID();

      sessoes[sessionId] = {
        torino,
        cursosEquivalentes,
        equivalencias,
        criadaEm: new Date().toISOString(),
        metadados: {
          cursoReferencia: cursosEquivalentes.curso_referencia || 'Curso',
          instituicao: cursosEquivalentes.instituicao_base || 'Instituição'
        }
      };

      console.log(`[SESSÃO CRIADA] ${sessionId} — ${sessoes[sessionId].metadados.cursoReferencia}`);

      res.json({
        sessionId,
        metadados: sessoes[sessionId].metadados
      });

    } catch (e) {
      console.error('[ERRO] Falha ao criar sessão:', e.message);
      res.status(400).json({ error: 'Erro ao processar arquivos JSON', details: e.message });
    }
  }
);

// ============================================================
// GET /api/sessoes
// Lista todas as sessões ativas em memória.
// ============================================================
app.get('/api/sessoes', (req, res) => {
  const lista = Object.entries(sessoes).map(([id, s]) => ({
    id,
    metadados: s.metadados,
    criadaEm: s.criadaEm
  }));
  res.json(lista);
});

// ============================================================
// GET /api/sessao/:id
// Retorna os dados completos de uma sessão.
// Mesma estrutura que o antigo GET /api/curso/:id
// ============================================================
app.get('/api/sessao/:id', (req, res) => {
  const sessao = sessoes[req.params.id];
  if (!sessao) {
    return res.status(404).json({ error: 'Sessão não encontrada ou expirada' });
  }

  res.json({
    torino: sessao.torino,
    cursosEquivalentes: sessao.cursosEquivalentes,
    equivalencias: sessao.equivalencias,
    metadados: sessao.metadados
  });
});

// ============================================================
// GET /api/instituicoes
// Lista as instituições disponíveis nos dados locais.
// ============================================================
app.get('/api/instituicoes', (req, res) => {
  const dadosDir = path.join(__dirname, 'dados');

  const instituicoes = [
    { sigla: 'UFPB', nome: 'Universidade Federal da Paraíba' },
    { sigla: 'UFCG', nome: 'Universidade Federal de Campina Grande' },
    { sigla: 'IFPB', nome: 'Instituto Federal da Paraíba' },
    { sigla: 'UEPB', nome: 'Universidade Estadual da Paraíba' }
  ];

  const disponiveis = instituicoes.filter(inst =>
    fs.existsSync(path.join(dadosDir, `${inst.sigla}.json`))
  );

  res.json(disponiveis);
});

// ============================================================
// GET /api/instituicao/:sigla
// Retorna o banco de dados completo de uma instituição.
// Usado pelo Construtor e pelo browser de Instituições.
// ============================================================
app.get('/api/instituicao/:sigla', (req, res) => {
  const sigla = req.params.sigla.toUpperCase();
  const filePath = path.join(__dirname, 'dados', `${sigla}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `Instituição ${sigla} não encontrada em dados/` });
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (e) {
    console.error(`[ERRO] Falha ao ler ${sigla}.json:`, e.message);
    res.status(500).json({ error: 'Erro ao carregar dados da instituição', details: e.message });
  }
});

// ============================================================
// Inicialização
// ============================================================
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   Visualizador de Equivalências v2 — Upload-Based        ║
╚═══════════════════════════════════════════════════════════╝

  Servidor: http://localhost:${PORT}
  Ctrl+C para parar

  Fluxo:
    1. Abra http://localhost:${PORT}
    2. Faça upload dos 3 JSONs gerados pelo pipeline
    3. Visualize e edite as equivalências
  `);

  // Verifica dados locais
  const dadosDir = path.join(__dirname, 'dados');
  const instituicoes = ['UFPB', 'UFCG', 'IFPB', 'UEPB'];
  const presentes = instituicoes.filter(i => fs.existsSync(path.join(dadosDir, `${i}.json`)));
  console.log(`  Dados institucionais disponíveis: ${presentes.join(', ') || 'nenhum'}`);
  console.log('');
});
