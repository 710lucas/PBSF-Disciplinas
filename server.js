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
// Rotas para Análises Concluídas
// ============================================================

// GET /api/analises/instituicoes
// Lista instituições ESTRANGEIRAS que têm análises concluídas disponíveis.
app.get('/api/analises/instituicoes', (req, res) => {
  const analisesDir = path.join(__dirname, 'analises_concluidas');

  if (!fs.existsSync(analisesDir)) {
    return res.json([]);
  }

  try {
    // Busca dinamicamente todas as pastas (instituições estrangeiras)
    const instituicoes = fs.readdirSync(analisesDir)
      .filter(item => {
        const itemPath = path.join(analisesDir, item);
        return fs.statSync(itemPath).isDirectory() && !item.startsWith('.');
      })
      .map(inst => {
        const instPath = path.join(analisesDir, inst);
        const cursos = fs.readdirSync(instPath).filter(item => {
          const itemPath = path.join(instPath, item);
          return fs.statSync(itemPath).isDirectory() && !item.startsWith('.');
        });

        return {
          sigla: inst,
          nome: inst, // Pode ser customizado depois
          totalCursos: cursos.length
        };
      })
      .filter(inst => inst.totalCursos > 0); // Só exibe se tiver cursos

    res.json(instituicoes);
  } catch (e) {
    console.error('[ERRO] Falha ao listar instituições:', e.message);
    res.json([]);
  }
});

// GET /api/analises/:instituicao/cursos
// Lista os CURSOS ESTRANGEIROS disponíveis de uma instituição estrangeira específica.
app.get('/api/analises/:instituicao/cursos', (req, res) => {
  const instituicao = req.params.instituicao;
  const instituicaoPath = path.join(__dirname, 'analises_concluidas', instituicao);

  if (!fs.existsSync(instituicaoPath)) {
    return res.status(404).json({
      error: `Nenhuma análise encontrada para ${instituicao}`
    });
  }

  try {
    const cursos = fs.readdirSync(instituicaoPath)
      .filter(item => {
        const itemPath = path.join(instituicaoPath, item);
        return fs.statSync(itemPath).isDirectory();
      })
      .map(curso => {
        const cursoPath = path.join(instituicaoPath, curso);
        const arquivos = fs.readdirSync(cursoPath);

        // Verifica se tem o arquivo results{NomeDoCurso}.json
        const resultsFileName = `results${curso}.json`;
        const temResultsCurso = arquivos.includes(resultsFileName);

        // Verifica se tem pelo menos um par de arquivos de instituição
        const temEquivalencias = arquivos.some(a => a.endsWith('_cursos_equivalentes.json')) &&
                                  arquivos.some(a => a.endsWith('_equivalencias_disciplinas.json'));

        return {
          nome: curso,
          completo: temResultsCurso && temEquivalencias,
          arquivos: arquivos
        };
      });

    res.json(cursos);
  } catch (e) {
    console.error(`[ERRO] Falha ao listar cursos de ${instituicao}:`, e.message);
    res.status(500).json({ error: 'Erro ao listar cursos', details: e.message });
  }
});

// GET /api/analises/:instituicao/:curso
// Retorna os dados completos de uma análise específica.
// :instituicao = universidade estrangeira (ex: Firenze, Torino)
// :curso = curso estrangeiro (ex: Fisica_e_astrofisica)
// DEPRECATED: Use /api/analises/:instituicao/:curso/:instLocal em vez disso
app.get('/api/analises/:instituicao/:curso', (req, res) => {
  const instituicao = req.params.instituicao;
  const curso = req.params.curso;
  const cursoPath = path.join(__dirname, 'analises_concluidas', instituicao, curso);

  if (!fs.existsSync(cursoPath)) {
    return res.status(404).json({
      error: `Análise não encontrada: ${instituicao}/${curso}`
    });
  }

  try {
    // Busca os 3 arquivos (usando a primeira instituição encontrada)
    const arquivos = fs.readdirSync(cursoPath);

    // Busca o arquivo results{NomeDoCurso}.json
    const resultsFileName = `results${curso}.json`;
    const resultsCursoPath = path.join(cursoPath, resultsFileName);

    const cursosEquivPath = path.join(
      cursoPath,
      arquivos.find(a => a.endsWith('_cursos_equivalentes.json'))
    );
    const equivalenciasPath = path.join(
      cursoPath,
      arquivos.find(a => a.endsWith('_equivalencias_disciplinas.json'))
    );

    if (!fs.existsSync(resultsCursoPath) || !cursosEquivPath || !equivalenciasPath) {
      return res.status(404).json({
        error: 'Arquivos de análise incompletos',
        detalhes: 'Verifique se existem os 3 arquivos necessários'
      });
    }

    const torino = JSON.parse(fs.readFileSync(resultsCursoPath, 'utf8'));
    const cursosEquivalentes = JSON.parse(fs.readFileSync(cursosEquivPath, 'utf8'));
    const equivalencias = JSON.parse(fs.readFileSync(equivalenciasPath, 'utf8'));

    res.json({
      torino,
      cursosEquivalentes,
      equivalencias,
      metadados: {
        cursoReferencia: cursosEquivalentes.curso_referencia || curso,
        instituicao: cursosEquivalentes.instituicao_base || instituicao,
        fonte: 'analise_concluida'
      }
    });

  } catch (e) {
    console.error(`[ERRO] Falha ao carregar análise ${instituicao}/${curso}:`, e.message);
    res.status(500).json({ error: 'Erro ao carregar análise', details: e.message });
  }
});

// GET /api/analises/:instituicao/:curso/instituicoes-locais
// Lista quais instituições brasileiras têm análise para este curso.
app.get('/api/analises/:instituicao/:curso/instituicoes-locais', (req, res) => {
  const instituicao = req.params.instituicao;
  const curso = req.params.curso;
  const cursoPath = path.join(__dirname, 'analises_concluidas', instituicao, curso);

  if (!fs.existsSync(cursoPath)) {
    return res.status(404).json({
      error: `Curso não encontrado: ${instituicao}/${curso}`
    });
  }

  try {
    const arquivos = fs.readdirSync(cursoPath);

    const instituicoesInfo = [
      { sigla: 'UFPB', nome: 'Universidade Federal da Paraíba' },
      { sigla: 'UFCG', nome: 'Universidade Federal de Campina Grande' },
      { sigla: 'IFPB', nome: 'Instituto Federal da Paraíba' },
      { sigla: 'UEPB', nome: 'Universidade Estadual da Paraíba' }
    ];

    const disponiveis = instituicoesInfo.map(inst => {
      const cursosEquivFile = `${inst.sigla}_cursos_equivalentes.json`;
      const equivalenciasFile = `${inst.sigla}_equivalencias_disciplinas.json`;

      const temCursosEquiv = arquivos.includes(cursosEquivFile);
      const temEquivalencias = arquivos.includes(equivalenciasFile);
      const completo = temCursosEquiv && temEquivalencias;

      return {
        ...inst,
        completo,
        arquivos: {
          cursos_equivalentes: temCursosEquiv,
          equivalencias: temEquivalencias
        }
      };
    }).filter(inst => inst.completo); // Só retorna as que estão completas

    res.json(disponiveis);

  } catch (e) {
    console.error(`[ERRO] Falha ao listar instituições locais:`, e.message);
    res.status(500).json({ error: 'Erro ao listar instituições locais', details: e.message });
  }
});

// GET /api/analises/:instituicao/:curso/:instLocal
// Retorna os dados completos de uma análise específica para uma instituição local.
// :instituicao = universidade estrangeira (ex: Firenze, Torino)
// :curso = curso estrangeiro (ex: Fisica_e_astrofisica)
// :instLocal = instituição brasileira (ex: UFPB, UFCG)
app.get('/api/analises/:instituicao/:curso/:instLocal', (req, res) => {
  const instituicao = req.params.instituicao;
  const curso = req.params.curso;
  const instLocal = req.params.instLocal.toUpperCase();
  const cursoPath = path.join(__dirname, 'analises_concluidas', instituicao, curso);

  if (!fs.existsSync(cursoPath)) {
    return res.status(404).json({
      error: `Análise não encontrada: ${instituicao}/${curso}`
    });
  }

  try {
    // Busca o arquivo results{NomeDoCurso}.json
    const resultsFileName = `results${curso}.json`;
    const resultsCursoPath = path.join(cursoPath, resultsFileName);

    const cursosEquivPath = path.join(cursoPath, `${instLocal}_cursos_equivalentes.json`);
    const equivalenciasPath = path.join(cursoPath, `${instLocal}_equivalencias_disciplinas.json`);

    if (!fs.existsSync(resultsCursoPath)) {
      return res.status(404).json({
        error: `Arquivo ${resultsFileName} não encontrado`,
        detalhes: `Verifique se existe o arquivo ${resultsFileName} na pasta do curso`
      });
    }

    if (!fs.existsSync(cursosEquivPath) || !fs.existsSync(equivalenciasPath)) {
      return res.status(404).json({
        error: `Análise para ${instLocal} não encontrada`,
        detalhes: `Não foram encontrados os arquivos de análise para a instituição ${instLocal}`
      });
    }

    const torino = JSON.parse(fs.readFileSync(resultsCursoPath, 'utf8'));
    const cursosEquivalentes = JSON.parse(fs.readFileSync(cursosEquivPath, 'utf8'));
    const equivalencias = JSON.parse(fs.readFileSync(equivalenciasPath, 'utf8'));

    res.json({
      torino,
      cursosEquivalentes,
      equivalencias,
      metadados: {
        cursoReferencia: cursosEquivalentes.curso_referencia || curso,
        instituicao: cursosEquivalentes.instituicao_base || instLocal,
        universidadeEstrangeira: instituicao,
        cursoEstrangeiro: curso,
        fonte: 'analise_concluida'
      }
    });

  } catch (e) {
    console.error(`[ERRO] Falha ao carregar análise ${instituicao}/${curso}/${instLocal}:`, e.message);
    res.status(500).json({ error: 'Erro ao carregar análise', details: e.message });
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
