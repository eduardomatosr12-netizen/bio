/* ================================================================
   Axiumlink — Adaptador Firebase (Firestore + Auth)
   ----------------------------------------------------------------
   Requisitos (carregados no HTML antes deste arquivo):
   - firebase-config.js  → window.AXIUMLINK_FIREBASE
   - Firebase compat SDK → firebase-app-compat / firebase-auth-compat /
                           firebase-firestore-compat (CDN gstatic)

   Banco de dados:
   - Coleção "clients", documento = slug do cliente.
   - Campos: slug, config (objeto), owner (uid), updatedAt (timestamp).

   Sem configuração válida, tudo degrada para o modo local
   (config.js + localStorage) sem erros.
   ================================================================ */
(function () {
  'use strict';

  var CFG = (typeof window.AXIUMLINK_FIREBASE === 'object' && window.AXIUMLINK_FIREBASE)
    ? window.AXIUMLINK_FIREBASE
    : null;

  function isValid() {
    return !!CFG && !!(CFG.projectId && CFG.apiKey && CFG.appId);
  }

  var app = null;
  var db = null;
  var auth = null;
  var started = false;

  function init() {
    if (started) return;
    started = true;
    if (!isValid()) return;
    if (typeof firebase === 'undefined') {
      console.error('[Axiumlink] SDK do Firebase não carregado no HTML.');
      return;
    }
    try {
      app = firebase.initializeApp(CFG, 'axiumlink');
      db = firebase.firestore(app);
      auth = firebase.auth(app);
    } catch (e) {
      console.error('[Axiumlink] Falha ao iniciar Firebase:', e && e.message);
      app = null; db = null; auth = null;
    }
  }

  function configured() {
    init();
    return isValid() && !!db;
  }

  /* ---- leitura pública (por slug) ---- */
  function readConfig(slug) {
    init();
    if (!configured() || !slug) return Promise.resolve(null);
    return db.collection('clients').doc(String(slug)).get()
      .then(function (snap) {
        if (!snap.exists) return null;
        var d = snap.data() || {};
        var raw = d.config;
        if (raw == null) return null;
        var cfg = (typeof raw === 'string') ? JSON.parse(raw) : raw;
        if (!cfg || typeof cfg !== 'object') return null;
        cfg.slug = String(slug);
        return cfg;
      });
  }

  /* ---- escrita (requer login) ---- */
  function currentUser() {
    init();
    return (auth && auth.currentUser) || null;
  }

  function saveConfig(slug, config) {
    init();
    if (!configured() || !slug) {
      return Promise.reject(Object.assign(new Error('Firebase não configurado.'), { code: 'config/missing' }));
    }
    var user = currentUser();
    if (!user) {
      return Promise.reject(Object.assign(new Error('Faça login para publicar.'), { code: 'auth/requires-login' }));
    }
    var payload = {
      slug: String(slug),
      config: config,
      owner: user.uid,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    return db.collection('clients').doc(String(slug)).set(payload, { merge: true });
  }

  /* ---- autenticação ---- */
  function onAuth(cb) {
    init();
    if (!auth) return function () {};
    return auth.onAuthStateChanged(function (user) { cb(user); });
  }

  function signIn(email, password) {
    init();
    if (!auth) return Promise.reject(Object.assign(new Error('Auth indisponível.'), { code: 'config/missing' }));
    return auth.signInWithEmailAndPassword(email, password);
  }

  function signOut() {
    init();
    if (!auth) return Promise.resolve();
    return auth.signOut();
  }

  function errMsg(e) {
    if (!e) return 'Erro desconhecido.';
    var map = {
      'auth/email-already-in-use': 'E-mail já cadastrado.',
      'auth/invalid-email': 'E-mail inválido.',
      'auth/user-disabled': 'Usuário desativado.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/network-request-failed': 'Falha de rede. Verifique sua conexão.',
      'auth/requires-login': 'Faça login para publicar.',
      'config/missing': 'Firebase não configurado (firebase-config.js).'
    };
    var key = String(e.code || '');
    if (map[key]) return map[key];
    var m = String(e.message || e);
    if (m.indexOf('permission-denied') !== -1) return 'Regras do Firestore bloqueiam esta ação.';
    return m;
  }

  window.AXIUM_FB = {
    configured: configured,
    readConfig: readConfig,
    saveConfig: saveConfig,
    currentUser: currentUser,
    onAuth: onAuth,
    signIn: signIn,
    signOut: signOut,
    errMsg: errMsg
  };
})();