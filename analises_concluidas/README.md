# Análises Concluídas

Estrutura de organização das análises de cursos estrangeiros já processadas.

## Estrutura de Pastas

```
analises_concluidas/
├── Firenze/                          # Universidade Estrangeira
│   ├── Fisica_e_astrofisica/         # Curso Estrangeiro
│   │   ├── resultsCurso.json
│   │   ├── UFPB_cursos_equivalentes.json
│   │   ├── UFPB_equivalencias_disciplinas.json
│   │   ├── UFCG_cursos_equivalentes.json  (opcional)
│   │   └── UFCG_equivalencias_disciplinas.json  (opcional)
│   └── Matematica/
│       ├── resultsCurso.json
│       ├── UFPB_cursos_equivalentes.json
│       └── UFPB_equivalencias_disciplinas.json
├── Torino/
│   └── Informatica/
│       ├── resultsCurso.json
│       ├── UEPB_cursos_equivalentes.json
│       └── UEPB_equivalencias_disciplinas.json
└── Bologna/
    └── ...
```

## Arquivos por Curso

Cada pasta de curso estrangeiro deve conter:

1. **resultsCurso.json** - Dados do curso da universidade estrangeira (insegnamenti, crediti, etc)
2. **{INSTITUICAO}_cursos_equivalentes.json** - Cursos equivalentes identificados na instituição brasileira (UFPB, UFCG, UEPB, IFPB)
3. **{INSTITUICAO}_equivalencias_disciplinas.json** - Mapeamento detalhado de equivalências de disciplinas

## Como Adicionar uma Nova Análise

1. Navegue até `analises_concluidas/`
2. Crie uma pasta com o nome da **universidade estrangeira** (ex: `Firenze`, `Torino`, `Bologna`)
3. Dentro dela, crie uma pasta com o nome do **curso estrangeiro** (use underscores, ex: `Fisica_e_astrofisica`)
4. Adicione os 3 arquivos JSON necessários:
   - `resultsCurso.json`
   - `{INST}_cursos_equivalentes.json`
   - `{INST}_equivalencias_disciplinas.json`
5. A análise ficará automaticamente disponível no site

## Múltiplas Instituições Brasileiras

Você pode adicionar análises para múltiplas instituições brasileiras no mesmo curso:

```
Firenze/
  Fisica_e_astrofisica/
    resultsCurso.json
    UFPB_cursos_equivalentes.json
    UFPB_equivalencias_disciplinas.json
    UFCG_cursos_equivalentes.json
    UFCG_equivalencias_disciplinas.json
    UEPB_cursos_equivalentes.json
    UEPB_equivalencias_disciplinas.json
```

## Exemplo

Veja o exemplo completo em: `analises_concluidas/Firenze/Fisica_e_astrofisica/`

