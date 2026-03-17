# Sistema de Análises Concluídas

Sistema implementado para gerenciar e visualizar análises de equivalências de cursos estrangeiros já processadas.

## Estrutura do Sistema

### Diretórios

```
visualizador/
├── analises_concluidas/           # Pasta principal de análises
│   ├── Firenze/                   # Universidade Estrangeira
│   │   └── Fisica_e_astrofisica/  # Curso Estrangeiro
│   │       ├── resultsCurso.json
│   │       ├── UFPB_cursos_equivalentes.json
│   │       └── UFPB_equivalencias_disciplinas.json
│   ├── Torino/
│   └── Bologna/
└── public/
    ├── analises.html              # Interface para explorar análises
    ├── home.html                  # Página inicial com opções
    └── app.js                     # Carregamento via URL
```

## Conceito

A estrutura é organizada por **instituição estrangeira** → **curso estrangeiro**:

- **Nível 1**: Universidade estrangeira (Firenze, Torino, Bologna, etc)
- **Nível 2**: Curso estrangeiro (Fisica_e_astrofisica, Informatica, etc)
- **Nível 3**: Arquivos de análise com equivalências nas instituições brasileiras (UFPB, UFCG, UEPB, IFPB)

## Rotas da API Adicionadas

### 1. GET /api/analises/instituicoes
Lista todas as universidades estrangeiras que possuem análises concluídas.

**Resposta:**
```json
[
  {
    "sigla": "Firenze",
    "nome": "Firenze",
    "totalCursos": 3
  },
  {
    "sigla": "Torino",
    "nome": "Torino",
    "totalCursos": 5
  }
]
```

### 2. GET /api/analises/:instituicao/cursos
Lista todos os cursos estrangeiros disponíveis de uma universidade.

**Exemplo:** `/api/analises/Firenze/cursos`

**Resposta:**
```json
[
  {
    "nome": "Fisica_e_astrofisica",
    "completo": true,
    "arquivos": [
      "resultsCurso.json",
      "UFPB_cursos_equivalentes.json",
      "UFPB_equivalencias_disciplinas.json"
    ]
  }
]
```

### 3. GET /api/analises/:instituicao/:curso
Retorna os dados completos de uma análise específica.

**Exemplo:** `/api/analises/Firenze/Fisica_e_astrofisica`

**Resposta:**
```json
{
  "torino": { ... },
  "cursosEquivalentes": { ... },
  "equivalencias": { ... },
  "metadados": {
    "cursoReferencia": "Fisica e Astrofisica",
    "instituicao": "UFPB",
    "fonte": "analise_concluida"
  }
}
```

## Como Usar

### Para Usuários do Site

1. Acesse `http://localhost:3000`
2. Clique em "Análises Concluídas"
3. Selecione a universidade estrangeira desejada (ex: Firenze, Torino)
4. Escolha o curso estrangeiro (ex: Fisica_e_astrofisica)
5. A análise será carregada automaticamente no visualizador

### Para Adicionar Novas Análises

1. Navegue até `analises_concluidas/`
2. Crie ou acesse a pasta da universidade estrangeira (ex: `Firenze/`)
3. Crie uma pasta com o nome do curso estrangeiro (use underscores: `Fisica_e_astrofisica`)
4. Adicione os 3 arquivos necessários:
   - `resultsCurso.json` - Dados do curso estrangeiro
   - `{INST}_cursos_equivalentes.json` - Cursos equivalentes na instituição brasileira
   - `{INST}_equivalencias_disciplinas.json` - Mapeamento de disciplinas

5. A análise ficará disponível automaticamente no site

**Exemplo de estrutura:**
```
analises_concluidas/
  Firenze/
    Fisica_e_astrofisica/
      resultsCurso.json
      UFPB_cursos_equivalentes.json
      UFPB_equivalencias_disciplinas.json
```

## Exemplo de Estrutura de Curso

Veja o exemplo em: `analises_concluidas/Firenze/Fisica_e_astrofisica/`

### resultsCurso.json
Contém dados do **curso estrangeiro**:
```json
{
  "corso": "Fisica e Astrofisica",
  "universita": "Università degli Studi di Firenze",
  "tipo": "Laurea Triennale",
  "insegnamenti": [
    {
      "codice": "B027500",
      "nome": "ANALISI MATEMATICA I",
      "crediti": 9,
      "ssd": "MAT/05"
    }
  ]
}
```

### {INST}_cursos_equivalentes.json
Cursos brasileiros equivalentes identificados:
```json
{
  "curso_referencia": "Fisica e Astrofisica",
  "universita_referencia": "Università degli Studi di Firenze",
  "instituicao_base": "UFPB",
  "cursos_identificados": [
    {
      "titulo": "BACHARELADO EM FÍSICA",
      "score": 0.92,
      "disciplinas_comuns": 18
    }
  ]
}
```

### {INST}_equivalencias_disciplinas.json
Mapeamento detalhado de disciplinas:
```json
{
  "equivalencias": [
    {
      "disciplina_referencia": {
        "codigo": "B027500",
        "nome": "ANALISI MATEMATICA I",
        "crediti": 9
      },
      "disciplinas_equivalentes": [
        {
          "codigo": "MAT1001",
          "nome": "CÁLCULO DIFERENCIAL E INTEGRAL I",
          "curso": "BACHARELADO EM FÍSICA",
          "score": 0.89
        }
      ]
    }
  ]
}
```

## Fluxo do Sistema

1. **Seleção**: Usuário escolhe universidade estrangeira (Firenze, Torino...) e curso estrangeiro (Fisica_e_astrofisica...)
2. **Carregamento**: Sistema busca os 3 arquivos JSON da análise
3. **Sessão Temporária**: Cria uma sessão temporária no servidor
4. **Visualização**: Redireciona para o visualizador principal (index.html)
5. **Edição**: Usuário pode editar e exportar os resultados

## Validação

O sistema verifica automaticamente se os 3 arquivos necessários estão presentes:
- ✓ **Completo** - Análise pode ser visualizada
- ⚠ **Incompleto** - Faltam arquivos, não pode ser carregada

## Alterações no Código

### server.js
- Adicionadas 3 novas rotas para listar e servir análises concluídas
- Busca dinâmica de universidades estrangeiras (não hardcoded)
- Removido .toUpperCase() para preservar nomenclatura original

### public/home.html
- Atualizado com opções para "Nova Análise" e "Análises Concluídas"

### public/analises.html (novo)
- Interface completa de seleção de universidade e curso estrangeiros
- Indicador de progresso em 3 etapas
- Validação de análises completas/incompletas
- Textos adaptados para mencionar instituições estrangeiras

### public/app.js
- Adicionada função `verificarSessionIdNaURL()` para carregar sessão via parâmetro URL
- Suporte a carregamento automático ao acessar `index.html?id=sessionId`

## Tecnologias

- **Backend**: Express.js + Node.js
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Armazenamento**: Sistema de arquivos JSON
- **Sessões**: Em memória com UUID
