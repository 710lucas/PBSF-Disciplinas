# 🚀 Início Rápido

## Passo 1: Instalar Dependências

```bash
npm install
```

## Passo 2: Iniciar o Servidor

```bash
npm start
```

Ou para desenvolvimento com auto-reload:

```bash
npm run dev
```

## Passo 3: Acessar o Sistema

Abra seu navegador em: **http://localhost:3000**

---

## 📚 Principais Funcionalidades

### 1. Explorador de Instituições
**URL:** `http://localhost:3000/instituicoes.html`

- ✅ Visualize todos os cursos de UFPB, UFCG, IFPB e UEPB
- ✅ Busque por curso ou disciplina
- ✅ **Baixe os dados** em JSON com um clique
- ✅ Veja estatísticas em tempo real

**Dados incluídos:**
- **UFPB**: 647KB (maior banco)
- **UFCG**: 452KB
- **IFPB**: 224KB
- **UEPB**: 5.4KB

### 2. Visualizador de Equivalências
**URL:** `http://localhost:3000/index.html`

- Faça upload dos 3 arquivos gerados pelo pipeline
- Visualize equivalências identificadas
- Edite e ajuste mapeamentos

### 3. Construtor Manual
**URL:** `http://localhost:3000/construtor.html`

- Crie equivalências do zero
- Selecione instituição e curso
- Monte mapeamento disciplina por disciplina

---

## 🗂️ Estrutura da Pasta

```
visualizador/
├── 📁 dados/              ← Bancos de dados (UFPB, UFCG, IFPB, UEPB)
├── 📁 public/             ← Interface web
├── 📄 server.js           ← Servidor Express
├── 📄 package.json        ← Dependências
└── 📄 README.md           ← Documentação completa
```

---

## ❓ Problemas Comuns

### Dropdown não mostra instituições
- Verifique se os arquivos JSON existem em `dados/`
- Reinicie o servidor
- Abra o console do navegador (F12) para ver erros

### Erro ao carregar dados
- Certifique-se que o servidor está rodando
- Verifique a URL: deve ser `localhost:3000`
- Limpe o cache do navegador (Ctrl+Shift+R)

### Porta 3000 já em uso
Mude a porta no `server.js` ou use variável de ambiente:
```bash
PORT=3001 npm start
```

---

## 📝 Notas Importantes

✅ **Autocontido**: Tudo necessário está nesta pasta
✅ **Sem dependências externas**: Não precisa acessar arquivos fora desta pasta
✅ **Dados incluídos**: 4 instituições já disponíveis
✅ **Pronto para uso**: Basta instalar e rodar

---

**Desenvolvido para o Sistema de Equivalências Curriculares — 2026**
