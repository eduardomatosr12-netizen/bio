# Axiumlink — Plataforma de Link na Bio

Página pública (`index.html`) + painel de edição (`admin.html`) totalmente estáticos
(HTML/CSS/JS), com persistência em **Back4App (Parse)** e fallback offline via
`localStorage` e *Service Worker*.

> **Importante:** os arquivos originais do repositório estavam truncados (sem histórico).
> Esta versão foi **reconstruída** a partir dos vestígios de código e dos padrões visuais
> preservados (.`featured__card`, `#pgQuick`, `#pgLinks`, `data-bind`, schema de `config`).

---

## Estrutura

```
index.html               → página pública do link na bio (/?s=slug)
admin.html               → painel de edição (salva no Parse e no localStorage)
config.js                → configuração padrão (fallback local; define o schema)
js/engine.js             → motor da página pública (lê config, renderiza tudo)
js/icons.js              → biblioteca de ícones SVG (window.AXIUMLINK_ICONS)
sw.js                    → Service Worker (rede primeiro p/ navegação e config.js)
manifest.webmanifest     → manifest PWA
favicon-32x32.png        → ícone
icon-192.png / icon-512.png → ícones PWA
apple-touch-icon.png     → ícone iOS
tools/generate-icons.mjs → regenera os PNGs (Node puro, sem dependências)
```

---

## Como funciona

- A página pública lê o slug da URL: `index.html?s=meu-slug`.
- Com `?s=` presente, o motor consulta a classe **`Client`** no Back4App
  (campo `slug` == valor de `s`, campo `config` com o JSON do cliente) e armazena
  em `localStorage` para reuso offline.
- Sem `?s=` (ou sem rede/Parse indisponível), usa `window.AXIUMLINK_CONFIG`
  (`config.js`) ou o último snapshot salvo no `localStorage`.
- O painel (`admin.html`) edita a config, salva na `localStorage`
  (chave `axiumlink-preview-v1-{slug}`) e publica no Back4App.

---

## Pré-requisitos

1. Conta no [Back4App](https://www.back4app.com) (plano gratuito é suficiente).
2. Qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, Cloudflare Pages).

---

## 1. Configurar o Back4App

1. Crie um app Back4App e anote `Application ID` e `JavaScript Key`
   (Dashboard → App Settings → Security & Keys).
2. Vá em **Database** → **Create a class** → nome: **`Client`** (não é classe de usuário).
3. Adicione os campos:
   - `slug` — `String` (único por cliente)
   - `config` — `String` (JSON do cliente)
4. **Class Permissions (CLP)** da classe `Client`:
   - `Find` → **Public** (obrigatório, senão a página pública não carrega)
   - `Get` → **Public** (recomendado)
   - `Create`/`Update`/`Delete` → **Restrito** (ou proteja com `ACL`, ver seção Segurança)
5. As chaves ficam no início de `admin.html` (bloco `Parse.initialize`).
   Em produção, troque as chaves de exemplo pelas do seu app.

> **Nota:** a página pública só mostra páginas cujo `config` esteja **publicado** (botão
> *Publicar* no painel grava a `Client`). Depois de publicar, use `index.html?s=slug`.

---

## 2. Rodar localmente

```bash
# servir a pasta (SW exige localhost ou https)
python3 -m http.server 8080
# ou: npx serve .
```

Acesse:

- `http://localhost:8080/index.html` → página pública (fallback demo, slug `cliente-demo`)
- `http://localhost:8080/index.html?s=cliente-demo` → buscar no Parse pelo slug
- `http://localhost:8080/admin.html` → painel de edição

---

## 3. Usar o painel

1. Abra `admin.html` e digite o **slug** (ex.: `cliente-demo`).
2. Edite perfil, visual, ações rápidas, links e PIX.
3. **Salvar** → grava no `localStorage` (preview imediato no celular à direita).
4. **Publicar** → grava/atualiza a classe `Client` no Parse (fica disponível em `?s=slug`).
5. **Ver página** → abre a página pública com o slug atual.

Regras de slug: minúsculas, números e hífens (`/^[a-z0-9-]+$/`).

---

## 4. Publicar em hospedagem estática

Basta subir **todos os arquivos** do repositório (mantenha a estrutura de pastas).

### Netlify / Vercel (exemplo)

- Build: nenhum (site estático)
- Diretório de publicação: `/`
- Redirects (opcional, para rotear `/u/:slug` para a página):

**Netlify** — `_redirects`:
```
/u/*   /index.html?s=:splat   200
```

**Vercel** — `vercel.json`:
```json
{ "rewrites": [{ "source": "/u/:slug", "destination": "/index.html?s=:slug" }] }
```

Com isso, um cliente pode compartilhar `https://seudominio/u/meu-slug`.

### GitHub Pages

Hospede na branch `gh-pages` (ou na raiz de `username.github.io`). O `og:image`
da página usa `icon-512.png` na raiz — ajuste `applyTexts()` se publicar em subpasta.

---

## 5. Ícones PNG (favicon/PWA)

Os PNGs são gerados por script Node puro (sem dependências):

```bash
node tools/generate-icons.mjs
```

Gera `favicon-32x32.png`, `icon-192.png`, `icon-512.png` e `apple-touch-icon.png`.

---

## Segurança

- A `JavaScript Key` é **pública** por definição (fica no cliente). Ela só deve
  permitir leitura pública. **Nunca** coloque Master Key em arquivos estáticos.
- Por isso o painel escreve com a Client Key: proteja a classe `Client` no CLP/ACL
  para que apenas você (ou funções autenticadas/Cloud Code) possa criar/atualizar.
- Recomendado para produção:
  1. Restringir `Create`/`Update`/`Delete` no CLP e usar **Cloud Code** ou
     autenticação por **ACL** (`Client` com `acl` por usuário) no painel;
  2. Servir em HTTPS (obrigatório para SW e clipboard em produção);
  3. Adicionar `sw.js` no cache list ao mudar assets (bump `CACHE_NAME`).

---

## Changelog da reconstrução

- `index.html`: bloco final de JS (truncado) substituído por `js/engine.js` +
  `js/icons.js`; link do rodapé `/admin` → `admin.html`.
- `admin.html`: cabeçalho CSS truncado corrigido; corpo completo do painel adicionado
  (topbar, editor, preview mobile, modal de recorte, toast e app JS).
- Novo: `config.js`, `js/engine.js`, `js/icons.js`, `sw.js`, `manifest.webmanifest`,
  `tools/generate-icons.mjs`, PNGs de ícone, `README.md`.