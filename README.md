# Visualizador de Equivalências Curriculares

Sistema web para visualizar e gerenciar equivalências de disciplinas entre universidades.

## 📁 Estrutura

```
visualizador/
├── dados/              # Bancos de dados das instituições (autocontido)
│   ├── UFPB.json      # Universidade Federal da Paraíba
│   ├── UFCG.json      # Universidade Federal de Campina Grande
│   ├── IFPB.json      # Instituto Federal da Paraíba
│   └── UEPB.json      # Universidade Estadual da Paraíba
├── public/             # Interface web (frontend)
│   ├── home.html      # Página inicial
│   ├── index.html     # Visualizador de equivalências
│   ├── construtor.html # Construtor de equivalências
│   ├── instituicoes.html # Explorador de dados institucionais
│   └── ...            # Arquivos JS e CSS
├── server.js           # Servidor Express
└── package.json        # Dependências Node.js
```

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
cd visualizador
npm install
```

### 2. Iniciar o Servidor

```bash
node server.js
```

O servidor iniciará em `http://localhost:3000`

### 3. Acessar o Sistema

Abra o navegador em `http://localhost:3000` e você verá:
- **Página Inicial**: Links para todas as funcionalidades
- **Visualizador**: Veja equivalências de cursos já processados
- **Construtor**: Crie novas equivalências manualmente
- **Explorador de Instituições**: Navegue pelos dados das universidades

## 📊 Funcionalidades

### Explorador de Instituições
- Visualize todos os cursos e disciplinas de cada universidade
- Busque por curso ou disciplina específica
- **Baixe os dados completos** em formato JSON
- Estatísticas em tempo real

### Visualizador de Equivalências
- Faça upload dos 3 arquivos gerados pelo pipeline:
  - `results[CURSO].json` (curso externo)
  - `[INST]_cursos_equivalentes.json` (cursos similares)
  - `[INST]_equivalencias_disciplinas.json` (disciplinas equivalentes)
- Navegue pelas equivalências identificadas
- Edite e ajuste conforme necessário

### Construtor Manual
- Crie equivalências do zero
- Selecione instituição e curso
- Monte o mapeamento disciplina por disciplina

## 🔧 Requisitos

- Node.js (v14+)
- NPM ou Yarn

## 📦 Dependências

- **express**: Servidor web
- **cors**: Suporte a CORS
- **multer**: Upload de arquivos

## 🗂️ Dados

Os dados das instituições estão incluídos na pasta `dados/` e são carregados automaticamente pelo servidor. Estes arquivos contém a estrutura curricular completa de cada universidade.

Para atualizar os dados, substitua os arquivos JSON na pasta `dados/` pelos novos dados gerados pelo pipeline.

## 🌐 Autocontido

**Importante**: Esta pasta contém tudo necessário para rodar o visualizador:
- Servidor backend (`server.js`)
- Interface frontend (`public/`)
- Dados das instituições (`dados/`)

Não é necessário acessar arquivos fora desta pasta para o funcionamento do sistema.

## 📝 Notas

- Os dados são carregados em memória ao iniciar o servidor
- Sessões de upload ficam em memória (reiniciar o servidor limpa as sessões)
- Suporta CORS para desenvolvimento
- Layout responsivo e moderno

---

**Sistema de Equivalências Curriculares — 2026**
