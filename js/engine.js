/* ================================================================
   Axiumlink — Motor da página pública (index.html)
   ----------------------------------------------------------------
   Aplica a configuração do cliente (config.js, localStorage ou Firebase)
   no DOM: textos, cores, fundos, banner, avatar, ações rápidas, links,
   PIX e PWA. Substitui o antigo bloco inline (que ficou truncado).
   ================================================================ */
(function () {
  'use strict';

  /* ================================================================
     HELPERS
     ================================================================ */
  function getSlug() {
    const params = new URLSearchParams(window.location.search);
    return (params.get('s') || params.get('slug') || '').trim();
  }

  function getStorageKey() {
    return 'axiumlink-preview-v1-' + (getSlug() || 'default');
  }

  function hexToRgb(hex) {
    let h = String(hex || '').replace('#', '').trim();
    if (!h) return null;
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6) return null;
    const n = parseInt(h, 16);
    if (isNaN(n)) return null;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  /* hex + alpha → rgba() */
  function toRgba(hex, alpha) {
    const c = hexToRgb(hex);
    if (!c) return 'rgba(0,0,0,0)';
    const a = alpha == null ? 1 : Math.max(0, Math.min(100, Number(alpha))) / 100;
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }

  /* mistura c1 (peso w, 0..1) com c2 → hex */
  function mixHex(c1, c2, w) {
    const a = hexToRgb(c1), b = hexToRgb(c2);
    if (!a || !b) return c1;
    const mix = (x, y) => Math.round(x + (y - x) * Math.max(0, Math.min(1, w)));
    const r = mix(a.r, b.r), g = mix(a.g, b.g), bl = mix(a.b, b.b);
    return '#' + [r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  function uid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  const $ = (id) => document.getElementById(id);
  const root = () => document.documentElement.style;
  const setVar = (name, value) => {
    if (value != null && value !== '') root().setProperty(name, value);
    else root().removeProperty(name);
  };
  const cssVar = (el, name, value) => {
    if (value != null && value !== '') el.style.setProperty(name, value);
    else el.style.removeProperty(name);
  };

  /* ================================================================
     LEITURA DA CONFIG
     (prioridade: localStorage salvo pelo painel → config.js)
     ================================================================ */
  function readLocalConfig() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(getStorageKey()) || 'null'); } catch (e) { /* ignore */ }
    const defaults = (typeof window.AXIUMLINK_CONFIG !== 'undefined' && window.AXIUMLINK_CONFIG)
      ? window.AXIUMLINK_CONFIG : null;
    return saved || defaults;
  }

  async function readConfig() {
    const slug = getSlug();
    if (!slug) {
      console.warn('[Axiumlink] Acesso sem slug (?s=). Usando config local. Use ?s=meu-slug para dados da nuvem.');
      return readLocalConfig();
    }

    /* 1) Firebase (Firestore) — se configurado */
    const FB = window.AXIUM_FB;
    if (FB && FB.configured()) {
      try {
        const remote = await FB.readConfig(slug);
        if (remote && typeof remote === 'object') {
          try { localStorage.setItem(getStorageKey(), JSON.stringify(remote)); } catch (e) { /* quota */ }
          return remote;
        }
        console.warn('[Axiumlink] Nenhum documento com slug "' + slug + '" na coleção "clients". Verifique o slug.');
      } catch (e) {
        console.error('[Axiumlink] Erro ao ler do Firestore:', e && e.message ? e.message : e);
        if (String((e && e.message) || '').indexOf('permission-denied') !== -1) {
          console.error('[Axiumlink] Regras do Firestore sem leitura pública. Use: allow read: if true; — veja o README.');
        }
      }
    } else if (slug) {
      console.warn('[Axiumlink] Firebase não configurado (firebase-config.js vazio). Usando config local. Cole as chaves do seu projeto para buscar "' + slug + '" na nuvem.');
    }

    /* 2) Fallback: localStorage → config.js */
    return readLocalConfig();
  }

  /* ---- Migrações (compat com dados antigos do painel) ---- */
  function migrar(cfg) {
    if (!cfg) return cfg;

    const curarEstiloIndividual = (o) => {
      if (o && o.btnBg === '#ffffff' && o.btnColor === '#000000' && o.btnBorderColor === '#000000') {
        o.btnBg = ''; o.btnColor = ''; o.btnBorderColor = '';
      }
      return o;
    };
    const qa = cfg.quickActions;
    const lk = cfg.links;
    if (qa && Array.isArray(qa.items)) qa.items.forEach(curarEstiloIndividual);
    if (lk && Array.isArray(lk.items)) lk.items.forEach(curarEstiloIndividual);

    const pagMig = (cfg.design && cfg.design.page) || {};
    const ehPadraoOpaco =
      Array.isArray(pagMig.stops) && pagMig.stops.length === 2
      && pagMig.stops[0].color === '#e2e8f0' && (pagMig.stops[0].pos == null ? 0 : pagMig.stops[0].pos) === 0 && (pagMig.stops[0].alpha == null ? 100 : pagMig.stops[0].alpha) >= 99
      && pagMig.stops[1].color === '#ffffff' && (pagMig.stops[1].pos == null ? 0 : pagMig.stops[1].pos) === 100 && (pagMig.stops[1].alpha == null ? 100 : pagMig.stops[1].alpha) >= 99;
    if (pagMig.gradientOn !== false && ehPadraoOpaco && (!pagMig.blend || pagMig.blend === 'normal')) {
      pagMig.stops = pagMig.stops.map((s) => Object.assign({}, s, { alpha: 35 }));
    }

    /* Normaliza estruturas */
    if (qa && !Array.isArray(qa.items)) qa.items = [];
    if (lk && !Array.isArray(lk.items)) lk.items = [];
    if (!qa || !qa.mode) { if (!cfg.quickActions) cfg.quickActions = {}; cfg.quickActions.mode = cfg.quickActions.mode || 'grid'; }
    if (!cfg.links || !cfg.links.mode) { if (!cfg.links) cfg.links = {}; cfg.links.mode = cfg.links.mode || 'list'; }

    return cfg;
  }

  /* ================================================================
     RENDERIZAÇÃO
     ================================================================ */
  const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

  function buildAnchor(item) {
    const a = document.createElement('a');
    a.className = 'featured__card';
    if (item && item.type === 'pix') {
      a.setAttribute('data-dialog-open', '');
      a.href = '#';
      a.setAttribute('data-no-nav', '1');
    } else {
      a.href = (item && item.url) ? item.url : '#';
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    }
    a.setAttribute('aria-label', esc((item && item.label) || ''));
    return a;
  }

  /* Estilos por item (sobrescrevem o estilo global de botões) */
  function applyItemStyle(el, item) {
    if (!el || !item) return;
    cssVar(el, '--ui-bg', item.btnBg || '');
    cssVar(el, '--btn-text-color-global', item.btnColor || '');
    if (item.btnBorderColor) cssVar(el, '--ui-border', '1px solid ' + item.btnBorderColor);
    else cssVar(el, '--ui-border', '');
    if (item.radius != null && item.radius !== '') {
      el.style.setProperty('--global-radius', item.radius + 'px');
      el.style.borderRadius = item.radius + 'px';
    }
    if (item.blur != null && item.blur > 0) cssVar(el, '--ui-blur', 'blur(' + item.blur + 'px)');
    else cssVar(el, '--ui-blur', '');
    if (item.shadow === false) cssVar(el, '--ui-shadow', 'none');
    else cssVar(el, '--ui-shadow', '');
    if (item.isPrimary) el.classList.add('featured__card--primary');
    if (item.anim && item.anim !== 'none') el.classList.add('anim-' + item.anim);
  }

  function iconEl(item, cls) {
    const wrap = document.createElement('span');
    wrap.className = cls || 'featured__icon';
    if (item && item.image) {
      const img = document.createElement('img');
      img.className = 'featured__icon-img';
      img.src = item.image;
      img.alt = '';
      wrap.appendChild(img);
    } else {
      const svgHtml = (item && item.customSvg)
        ? item.customSvg
        : (item && item.icon && window.AXIUMLINK_ICONS && window.AXIUMLINK_ICONS[item.icon])
          ? window.AXIUMLINK_ICONS[item.icon]
          : (window.AXIUMLINK_ICON_FALLBACK || '');
      const holder = document.createElement('span');
      holder.innerHTML = svgHtml;
      while (holder.firstChild) wrap.appendChild(holder.firstChild);
    }
    return wrap;
  }

  /* Card de link/ação no padrão .featured__card */
  function buildCard(item, ctx) {
    const mode = (ctx && ctx.mode) || 'grid';
    const zone = (ctx && ctx.zone) || 'links';
    const kind = (item && item.type === 'pix') ? 'pix' : 'link';
    const isPix = kind === 'pix';

    /* Card com imagem de capa (modo banner) */
    if (item && item.bannerImage) {
      const a = buildAnchor(item);
      a.classList.add('featured__card--banner');
      applyItemStyle(a, item);
      const img = document.createElement('img');
      img.className = 'featured__banner-img';
      img.src = item.bannerImage;
      img.alt = esc(item.label || '');
      img.loading = 'lazy';
      a.appendChild(img);
      return a;
    }

    const a = buildAnchor(item);
    applyItemStyle(a, item);

    /* largura por zona/modo */
    const w = (item && item.width) || (mode === 'social' ? 'auto' : (zone === 'quick' ? 'half' : 'full'));
    if (w === 'full') a.classList.add('featured__card--full');
    else if (w === 'half' && mode === 'grid') a.classList.add('featured__card--half');
    else if (w === 'compact') a.classList.add('featured__card--compact');
    else if (zone === 'quick' && (mode === 'list' || mode === 'scroll') && w === 'half') a.classList.add('featured__card--half');

    a.appendChild(iconEl(item, 'featured__icon'));

    const body = document.createElement('span');
    body.className = 'featured__body';
    const strong = document.createElement('strong');
    strong.textContent = (item && item.label) || '';
    body.appendChild(strong);
    if (item && item.description) {
      const d = document.createElement('span');
      d.textContent = item.description;
      body.appendChild(d);
    }
    a.appendChild(body);

    /* seta: somente modos texto (escondida em grade) */
    if (mode !== 'social') {
      const ar = document.createElement('span');
      ar.className = 'featured__arrow';
      ar.innerHTML = CHEVRON;
      a.appendChild(ar);
    }
    return a;
  }

  /* Círculos de redes sociais */
  function buildSocial(item) {
    const a = buildAnchor(item);
    a.classList.remove('featured__card');
    a.classList.add('social-icon');
    a.removeChild(a.querySelector('.featured__body'));
    a.removeChild(a.querySelector('.featured__arrow'));
    const ic = a.querySelector('.featured__icon');
    ic.className = 'social-icon__inner';
    /* formato angular */
    if (item && item.shape && item.shape !== 'circle') {
      cssVar(a, '--social-icon-radius', item.shape === 'square' ? '18%' : '12px');
    }
    cssVar(a, '--ui-bg', item && item.btnBg ? item.btnBg : '');
    cssVar(a, '--btn-text-color-global', item && item.btnColor ? item.btnColor : '');
    if (item && item.shadow === false) cssVar(a, '--ui-shadow', 'none');
    return a;
  }

  /* ================================================================
     APLICAR CONFIG
     ================================================================ */
  function applyTexts(cfg) {
    const p = cfg.profile || {};
    const flat = { profileName: p.name, profileBio: p.bio, profileAddress: p.address };
    document.querySelectorAll('[data-bind]').forEach((el) => {
      const val = flat[el.dataset.bind];
      if (val != null) el.textContent = val;
    });

    /* link do endereço + visibilidade */
    const addr = $('pgAddress');
    if (addr) {
      const hasAddr = p.address || p.addressUrl;
      addr.hidden = !hasAddr;
      if (hasAddr) {
        const url = p.addressUrl && p.addressUrl.trim()
          ? p.addressUrl.trim()
          : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.address || '');
        addr.setAttribute('href', url);
      }
    }

    /* título / SEO */
    if (p.name) {
      document.title = p.name + ' | Link Bio';
      const setMeta = (sel, attr, val) => {
        const m = document.querySelector(sel);
        if (m) m.setAttribute(attr, val);
      };
      setMeta('meta[name="description"]', 'content', p.bio || ('Links e contatos de ' + p.name));
      setMeta('meta[property="og:title"]', 'content', p.name + ' | Link Bio');
      setMeta('meta[property="og:description"]', 'content', p.bio || ('Links e contatos de ' + p.name));
      setMeta('meta[name="apple-mobile-web-app-title"]', 'content', p.name);
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg) ogImg.setAttribute('content', location.origin + '/icon-512.png');
    }
  }

  function applyVisual(cfg) {
    const v = cfg.visual || {};
    const rootEl = document.documentElement;

    /* fonte da página */
    if (v.font) {
      const safe = String(v.font).replace(/[^a-zA-Z ]/g, '').replace(/ /g, ' ');
      setVar('--font-main', "'" + safe + "', sans-serif");
    }

    const pageBg = String(v.pageBg || '').trim();
    const isGradient = /^(repeating-)?(linear|radial|conic)-gradient\(/i.test(pageBg);
    const isSolidHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(pageBg);

    if (pageBg) setVar('--page-bg', pageBg);
    else rootEl.style.removeProperty('--page-bg');

    setVar('--btn-text-color-global', v.textColor || v.quickText || v.cardText || '');
    setVar('--btn-border-color', v.borderColor || '');
    setVar('--btn-quick-bg', v.quickBg || '');
    setVar('--btn-quick-text', v.quickText || '');
    setVar('--card-destaque-bg', v.cardBg || '');
    setVar('--card-destaque-text', v.cardText || '');

    /* corpo: cor + gradiente (design.page) + imagem (visual.bgImage) */
    const pgd = (cfg.design && cfg.design.page) || {};
    const pageGrad = (pgd.gradientOn !== false && Array.isArray(pgd.stops) && pgd.stops.length >= 2)
      ? 'linear-gradient(' + (pgd.angle || 180) + 'deg, '
        + pgd.stops.map((s) => toRgba(s.color || '#e2e8f0', s.alpha == null ? 100 : s.alpha) + ' ' + (s.pos == null ? 0 : s.pos) + '%').join(', ') + ')'
      : '';
    const bgImageUrl = v.bgImage ? 'url(' + v.bgImage + ')' : '';
    document.body.style.backgroundColor = isGradient ? '' : (pageBg || '');
    const pageBgGradient = isGradient ? pageBg : '';
    const bgLayers = [pageGrad, pageBgGradient, bgImageUrl].filter(Boolean);
    document.body.style.backgroundImage = bgLayers.length ? bgLayers.join(', ') : '';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundBlendMode = (pageGrad && pgd.blend && pgd.blend !== 'normal') ? pgd.blend : '';

    if (isSolidHex) setVar('--text-body', mixHex('#000000', pageBg, 0.72));
    else rootEl.style.removeProperty('--text-body');
  }

  function applyGlobalButtonStyle(cfg) {
    const bs = cfg.buttonStyle || {};
    if (bs.bg) setVar('--ui-bg', bs.bg);
    if (bs.text) setVar('--btn-text-color-global', bs.text);
    if (bs.borderColor) setVar('--ui-border', '1px solid ' + bs.borderColor);
    if (bs.radius != null && bs.radius !== '') setVar('--global-radius', bs.radius + 'px');
    if (bs.glassBlur && bs.glassBlur > 0) setVar('--ui-blur', 'blur(' + bs.glassBlur + 'px)');
  }

  function applyAvatar(cfg) {
    const p = cfg.profile || {};
    const img = $('pgAvatarImg');
    const letter = $('pgAvatarLetter');
    if (p.photo && img && letter) {
      img.src = p.photo;
      img.hidden = false;
      letter.hidden = true;
    } else if (letter && img) {
      letter.hidden = false;
      img.hidden = true;
      if (p.name) letter.textContent = String(p.name).trim().charAt(0).toUpperCase() || '?';
    }
  }

  function applyVerified(cfg) {
    const el = $('pgVerified');
    if (!el) return;
    const p = cfg.profile || {};
    if (p.verified) {
      el.hidden = false;
      el.setAttribute('aria-label', 'Perfil verificado');
    } else {
      el.hidden = true;
    }
  }

  function applyDesignProfile(cfg) {
    const dp = (cfg.design && cfg.design.profile) || {};
    const title = $('pgTitle');
    const sub = $('pgSubtitle');
    const addr = $('pgAddress');
    const profile = $('pageProfile');

    if (title) cssVar(title, '--profile-name-color', dp.nameColor || '');
    if (sub) cssVar(sub, '--profile-bio-color', dp.bioColor || '');
    if (addr) {
      cssVar(addr, '--profile-address-bg', dp.addressBg || '');
      cssVar(addr, '--profile-address-text', dp.addressText || '');
    }
    if (profile && dp.align && dp.align !== 'center') {
      profile.style.textAlign = dp.align;
    } else if (profile) {
      profile.style.removeProperty('text-align');
    }

    /* vidro/sombra do avatar */
    const card = $('pgAvatarCard');
    if (card) {
      const g = dp.glass || {};
      if (dp.shadowOn) {
        card.classList.add('avatar-ring');
        cssVar(card, '--glass-pad', g.pad ? g.pad + 'px' : '');
        cssVar(card, '--glass-bg', g.bg || '');
        cssVar(card, '--glass-border', g.border || '');
        cssVar(card, '--glass-blur', g.blur ? g.blur + 'px' : '');
      } else {
        card.classList.remove('avatar-ring');
        cssVar(card, '--glass-pad', '');
        cssVar(card, '--glass-bg', '');
        cssVar(card, '--glass-border', '');
        cssVar(card, '--glass-blur', '');
      }
    }
  }

  function applyBanner(cfg) {
    const banner = $('pgBanner');
    const scrim = $('pgScrim');
    if (!banner) return;
    const b = (cfg.design && cfg.design.banner) || {};
    if (!b.visible) {
      banner.hidden = true;
      return;
    }
    banner.hidden = false;

    /* background do banner (cálculo) */
    let bg = 'linear-gradient(135deg, #0f172a 0%, #334155 55%, #64748b 100%)';
    if (b.type === 'color' && b.color) bg = b.color;
    else if (b.type === 'gradient' && Array.isArray(b.gradient) && b.gradient.length >= 2) {
      bg = 'linear-gradient(135deg, ' + b.gradient[0] + ' 0%, ' + b.gradient[1] + ' 100%)';
    }
    banner.style.background = '';

    /* camada de imagem com blur (se houver) */
    let layer = banner.querySelector('.ax-banner-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'ax-banner-layer';
      layer.style.position = 'absolute';
      layer.style.inset = '0';
      layer.style.zIndex = '0';
      layer.style.backgroundSize = 'cover';
      layer.style.backgroundPosition = 'center';
      banner.insertBefore(layer, scrim);
    }
    if (b.type === 'image' && b.image) {
      layer.style.backgroundImage = 'url(' + b.image + ')';
      layer.style.filter = b.blur ? 'blur(' + b.blur + 'px)' : '';
      const s = (b.blur && b.blur > 0) ? 'scale(1.08)' : '';
      layer.style.transform = s;
      banner.style.background = bg; /* fallback de cor por trás */
    } else {
      layer.style.backgroundImage = 'none';
      layer.style.filter = '';
      layer.style.transform = '';
      banner.style.background = bg;
    }

    /* escurecimento via scrim */
    if (scrim) {
      const dk = Math.max(0, Math.min(80, Number(b.darken) || 0));
      scrim.style.background = dk ? 'rgba(0,0,0,' + (dk / 100) + ')' : '';
    }
  }

  function renderQuickActions(cfg) {
    const container = $('pgQuick');
    if (!container) return;
    const qa = cfg.quickActions || {};
    const items = Array.isArray(qa.items) ? qa.items : [];
    const mode = qa.mode || 'grid';

    container.classList.remove('quick-grid--list', 'quick-grid--scroll');
    if (mode === 'list') container.classList.add('quick-grid--list');
    if (mode === 'scroll') container.classList.add('quick-grid--scroll');

    container.hidden = !items.length;
    if (!items.length) { container.innerHTML = ''; return; }

    const frag = document.createDocumentFragment();
    items.forEach((item) => frag.appendChild(buildCard(item, { zone: 'quick', mode: mode })));
    container.innerHTML = '';
    container.appendChild(frag);
  }

  function renderLinks(cfg) {
    const container = $('pgLinks');
    if (!container) return;
    const lk = cfg.links || {};
    const items = Array.isArray(lk.items) ? lk.items : [];
    const mode = lk.mode || 'list';

    container.className = 'pg-links';
    if (mode === 'list') container.classList.add('pg-links--list');
    if (mode === 'grid') container.classList.add('pg-links--grid');
    if (mode === 'scroll') container.classList.add('pg-links--scroll');

    container.hidden = !items.length;
    if (!items.length) { container.innerHTML = ''; return; }

    const frag = document.createDocumentFragment();
    items.forEach((item) => {
      frag.appendChild(mode === 'social' ? buildSocial(item) : buildCard(item, { zone: 'links', mode: mode }));
    });
    container.innerHTML = '';
    container.appendChild(frag);
  }

  function applySectionsOrder(cfg) {
    const flow = $('pageFlow');
    if (!flow) return;
    const order = (cfg.design && cfg.design.sections) || ['profile', 'quick', 'links'];
    const map = { profile: 'pageProfile', quick: 'pgQuick', links: 'pgLinks' };
    order.forEach((key) => {
      const el = $(map[key]);
      if (el) flow.appendChild(el);
    });
  }

  function applyPix(cfg) {
    const px = cfg.pix || {};
    const keyEl = $('pix-key');
    const qrEl = $('pix-qr');
    const cta = document.querySelector('.pix-modal__cta');
    if (keyEl && px.key) keyEl.textContent = px.key;
    if (qrEl) {
      if (px.qrcode) {
        qrEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = px.qrcode;
        img.alt = 'QR Code PIX';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '8px';
        qrEl.style.background = '#ffffff';
        qrEl.appendChild(img);
      } else if (!qrEl.querySelector('img')) {
        qrEl.innerHTML = 'QR Code aqui';
        qrEl.style.background = '';
      }
    }
    if (cta) {
      if (px.ctaUrl) cta.setAttribute('href', px.ctaUrl);
      else cta.setAttribute('href', '#');
    }
  }

  /* ================================================================
     APP
     ================================================================ */
  function applyConfig(cfg) {
    if (!cfg) return;
    const c = migrar(cfg);
    applySectionsOrder(c);
    applyTexts(c);
    applyVisual(c);
    applyGlobalButtonStyle(c);
    applyAvatar(c);
    applyVerified(c);
    applyDesignProfile(c);
    applyBanner(c);
    renderQuickActions(c);
    renderLinks(c);
    applyPix(c);

    /* links tipo PIX abrem o modal (evita navegação para "#") */
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-dialog-open]');
      if (t && t.hasAttribute('data-no-nav')) e.preventDefault();
    }, true);
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    const ok = location.protocol === 'https:' ||
      location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!ok) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline-friendly */ });
    });
  }

  async function init() {
    registerSW();
    const cfg = await readConfig();
    applyConfig(cfg);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();