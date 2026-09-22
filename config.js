/* ================================================================
   Axiumlink — Configuração do cliente (source of truth local)
   ----------------------------------------------------------------
   - Sem ?s=slug na URL, a página pública usa este objeto como fallback.
   - Com ?s=slug, os dados vêm da classe "Client" no Back4App (campo config).
   - O Painel (admin.html) edita, salva no localStorage e publica no Parse.
   ================================================================ */
window.AXIUMLINK_CONFIG = {
  slug: 'cliente-demo',

  /* ---- Perfil ---- */
  profile: {
    name: 'Nome do Cliente',
    bio: 'Biografia curta, serviços ou tags separadas por • vírgulas.',
    address: 'Rua Exemplo, 123 – Cidade/UF',
    addressUrl: '',            // link do Google Maps (vazio = busca pelo endereço)
    verified: false,
    photo: ''                  // dataURL gerada pelo recorte do painel
  },

  /* ---- Visual global ---- */
  visual: {
    font: 'Inter',             // Inter | Roboto | Open Sans | Poppins | Montserrat | Lato | Merriweather | Playfair Display | DM Sans | Outfit | Plus Jakarta Sans
    pageBg: '',                // '' = tema padrão (\u00e9 feita a mistura autom\u00e1tica de texto)
    bgImage: '',               // imagem de fundo da p\u00e1gina (URL ou dataURL)
    quickBg: '',               // fundo das a\u00e7\u00f5es r\u00e1pidas ('' = global)
    quickText: '',
    cardBg: '',                // fundo dos cards de links
    cardText: '',
    textColor: '',             // cor do texto/\u00edcones dos bot\u00f5es
    borderColor: ''
  },

  /* ---- Design (painel) ---- */
  design: {
    profile: {
      align: 'center',         // center | left | right
      nameColor: '',           // '' = padr\u00e3o do tema
      bioColor: '',
      addressBg: '',
      addressText: '',
      shadowOn: false,         // sombra/anel responsivo do avatar
      glass: { pad: 0, bg: '', border: '', blur: 0 }
    },
    page: {                    // gradiente "pel\u00edcula" sobre a p\u00e1gina
      gradientOn: false,
      stops: [
        { color: '#e2e8f0', pos: 0, alpha: 35 },
        { color: '#ffffff', pos: 100, alpha: 35 }
      ],
      angle: 180,
      blend: 'normal'
    },
    banner: {
      visible: false,          // mostra o cover superior
      type: 'color',           // color | gradient | image
      color: '#0f172a',
      gradient: ['#0f172a', '#64748b'],
      image: '',
      blur: 0,                 // desfoque da imagem (px)
      darken: 0                // escurecimento (0-80%)
    },
    sections: ['profile', 'quick', 'links']   // ordem de exibi\u00e7\u00e3o
  },

  /* ---- Estilo global dos bot\u00f5es ---- */
  buttonStyle: {
    bg: '',                    // fundo padr\u00e3o dos bot\u00f5es
    text: '',                  // cor do texto/icone
    radius: 14,                // px (0 = quadrado | 999 = oval)
    borderColor: '',
    glassBlur: 0               // efeito vidro
  },

  /* ---- A\u00e7\u00f5es r\u00e1pidas (cards principais) ---- */
  quickActions: {
    mode: 'grid',              // grid | list | scroll
    items: [
      {
        id: 'qa-whatsapp',
        label: 'WhatsApp',
        description: '',
        url: 'https://wa.me/5500000000000',
        icon: 'whatsapp',
        customSvg: '',
        image: '',
        width: 'half',         // full | half | compact
        btnBg: '', btnColor: '', btnBorderColor: '',
        radius: '', blur: null, shadow: true, anim: '',
        isPrimary: true, type: 'link'
      },
      {
        id: 'qa-instagram',
        label: 'Instagram',
        description: '',
        url: 'https://instagram.com/',
        icon: 'instagram',
        customSvg: '',
        image: '',
        width: 'half',
        btnBg: '', btnColor: '', btnBorderColor: '',
        radius: '', blur: null, shadow: true, anim: '',
        isPrimary: false, type: 'link'
      },
      {
        id: 'qa-maps',
        label: 'Localiza\u00e7\u00e3o',
        description: '',
        url: 'https://www.google.com/maps',
        icon: 'maps',
        customSvg: '',
        image: '',
        width: 'full',
        btnBg: '', btnColor: '', btnBorderColor: '',
        radius: '', blur: null, shadow: true, anim: '',
        isPrimary: false, type: 'link'
      }
    ]
  },

  /* ---- Links (lista principal) ---- */
  links: {
    mode: 'list',              // list | grid | scroll | social
    items: [
      {
        id: 'lk-pix',
        label: 'Pague com PIX',
        description: 'Escaneie e pague na hora',
        url: 'pix:',
        icon: 'pix',
        customSvg: '',
        image: '',
        bannerImage: '',
        width: 'full',
        btnBg: '', btnColor: '', btnBorderColor: '',
        radius: '', blur: null, shadow: true, anim: 'pulse',
        isPrimary: true, type: 'pix'
      },
      {
        id: 'lk-site',
        label: 'Meu site',
        description: 'Conhe\u00e7a mais sobre o trabalho',
        url: 'https://axium.company',
        icon: 'globe',
        customSvg: '',
        image: '',
        bannerImage: '',
        width: 'full',
        btnBg: '', btnColor: '', btnBorderColor: '',
        radius: '', blur: null, shadow: true, anim: '',
        isPrimary: false, type: 'link'
      }
    ]
  },

  /* ---- PIX ---- */
  pix: {
    enabled: false,
    key: 'sua.chave@pix.com.br',
    qrcode: '',                // URL/dataURL da imagem do QR Code
    ctaUrl: ''                 // link de pagamento externo (opcional)
  }
};