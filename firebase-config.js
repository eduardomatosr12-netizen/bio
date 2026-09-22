/* ================================================================
   Axiumlink — Configuração do Firebase (Firestore + Auth)
   ----------------------------------------------------------------
   COMO CONFIGURAR (2 minutos):
   1. Acesse https://console.firebase.google.com → Criar projeto.
   2. Ative o Firestore (FIREBASE MENU → Firestore Database → Criar banco →
      modo "Produção").
   3. No Console: ⚙ Configurações do projeto → Seus apps → Adicionar app
      (Web). Copie o objeto `firebaseConfig` e cole abaixo.
   4. Ative o login por E-mail/Senha: Build → Authentication → Sign-in
      method → Ativar "E-mail/Senha".
   5. Crie seu usuário (Auth → Users → Add user).
   6. Ajuste as regras do Firestore (ver README) para leitura pública e
      escrita somente autenticada.

   Se este objeto ficar VAZIO, a plataforma funciona em modo local
   (config.js + localStorage) sem nenhuma nuvem.
   ================================================================ */
window.AXIUMLINK_FIREBASE = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};