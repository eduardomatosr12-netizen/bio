# Axiumlink — Plataforma de Link na Bio

Página pública (`index.html`) + painel de edição (`admin.html`) totalmente estáticos
(HTML/CSS/JS), com persistência em **Firebase Firestore** e fallback offline via
`localStorage` e *Service Worker*.

> **Importante:** os arquivos originais do repositório estavam truncados (sem histórico).
> Esta versão foi **reconstruída** a partir dos vestígios de código e dos padrões visuais
> preservados (`.featured__card`, `#pgQuick`, `#pgLinks`, `data-bind`, schema de `config`).

---

## Estrutura

```
index.html               → página pública do link na bio (/?s=slug)
admin.html               → painel de edição (salva no navegador e publica no Firebase)
firebase-config.js       → chaves do seu projeto Firebase (cole aqui; vazio = modo local)
config.js                → configuração padrão (fallback local; define o schema)
js/engine.js             → motor da página pública (lê config, renderiza tudo)
js/firebase.js           → adaptador Firebase (Firestore leitura + Auth para publicar)
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
- Com `?s=` presente, o motor consulta o Firebase Firestore — coleção **`clients`**,
  documento com **o mesmo nome do slug**, campo `config` (objeto JSON do cliente) —
  e armazena em `localStorage` para reuso offline.
- Sem `?s=` (ou sem configuração Firebase), usa `window.AXIUMLINK_CONFIG`
  (`config.js`) ou o último snapshot salvo no `localStorage`.
- O painel (`admin.html`) edita a config, salva na `localStorage`
  (chave `axiumlink-preview-v1-{slug}`) e, **com login**, publica no Firestore.

---

## 1. Configurar o Firebase (grátis, sem cartão)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) →
   **Criar projeto** (pode desativar o Google Analytics).
2. **Ativar o Firestore**: menu lateral → **Firestore Database** → **Criar banco de
   dados** → modo **Produção** → região próxima de você.
3. **Registrar o app Web**: ⚙ **Configurações do projeto** → **Seus apps** →
   **Adicionar app** (ícone `</>` Web). Copie o objeto `firebaseConfig`.
4. Cole as chaves em **`firebase-config.js`**:
   ```js
   window.AXIUMLINK_FIREBASE = {
     apiKey: '…',
     authDomain: '…',
     projectId: '…',
     storageBucket: '…',
     messagingSenderId: '…',
     appId: '…'
   };
   ```
5. **Ativar login por e-mail**: menu **Build → Authentication → Sign-in method** →
   ative **E-mail/Senha**.
6. **Criar seu usuário admin**: **Authentication → Users → Add user**
   (e-mail + senha fortes).
7. **Regras do Firestore**: aba **Rules** do Firestore. Cole e publique:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Leitura pública (a página do link na bio precisa)
       match /clients/{slug} {
         allow read: if true;
         // Escrita só para usuários autenticados (painel)
         allow create, update, delete: if request.auth != null;
       }
       // Bloqueia tudo o mais
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

> Deixou o `firebase-config.js` vazio? Sem problemas: a plataforma roda em **modo
> local** (config.js + localStorage) — a página pública mostra o fallback e o painel
> só salva no navegador.

---

## 2. Rodar localmente

```bash
# servir a pasta (SW exige localhost ou https)
python3 -m http.server 8080
# ou: npx serve .
```

Acesse:

- `http://localhost:8080/index.html` → página pública (fallback demo, slug `cliente-demo`)
- `http://localhost:8080/index.html?s=cliente-demo` → buscar no Firestore pelo slug
- `http://localhost:8080/admin.html` → painel de edição

---

## 3. Usar o painel

1. Abra `admin.html` e digite o **slug** (ex.: `cliente-demo`).
2. Edite perfil, visual, ações rápidas, links e PIX.
3. **Salvar & publicar**:
   - sem login → salva só no navegador (aviso);
   - **Entrar** (botão no topo) → usa o e-mail/senha criado no passo 6 do setup;
   - com login → grava no Firestore (fim da escrita: documento `clients/{slug}`).
4. **Ver página** → abre a página pública com o slug atual.

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

- As chaves do `firebase-config.js` (apiKey etc.) são **públicas** por natureza —
  o Firebase foi feito para isso. A proteção real está nas **regras do Firestore**:
  - **leitura pública** (necessária para a página do cliente);
  - **escrita apenas com login** (User/Password do Firebase Auth).
- Qualquer pessoa que consiga seu e-mail/senha do painel pode publicar. Use senha
  forte e, se quiser mais controle, restrinja a escrita por documento (ex.:
  `allow write: if request.auth != null && request.auth.uid == resource.data.owner`).
- Recomendado em produção:
  1. Servir em HTTPS (obrigatório para SW e clipboard);
  2. Ao alterar assets, suba a versão do cache em `sw.js` (`CACHE_NAME`);
  3. Monitore **Authentication → Users** periodicamente.

---

## Changelog da reconstrução

- `index.html`: bloco final de JS (truncado) substituído por `js/engine.js` +
  `js/icons.js`; link do rodapé `/admin` → `admin.html`; SDK trocado de Parse para
  Firebase Firestore (leitura pública por slug).
- `admin.html`: cabeçalho CSS truncado corrigido; corpo completo do painel adicionado
  (topbar, editor, preview mobile, modal de recorte, toast e app JS); Parse substituído
  por Firebase (login + publicação no Firestore).
- Novo: `config.js`, `firebase-config.js`, `js/engine.js`, `js/firebase.js`,
  `js/icons.js`, `sw.js`, `manifest.webmanifest`, `tools/generate-icons.mjs`,
  PNGs de ícone, `README.md`.