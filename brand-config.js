// =====================================================
//  BRAND CONFIG — White-Label Theming System
//  To customise for a new client, edit the values below.
//  All CSS variables are injected into :root automatically.
// =====================================================

const BRAND_CONFIG = {

  // ── IDENTITY ──────────────────────────────────────
  appName:    'EatClub',           // Shown in navbar, title, PWA manifest
  tagline:    'Order Food Online', // Browser title suffix & meta description
  logoUrl:    '',                  // URL to logo image (leave '' to use text logo)
  logoText:   'Eat',              // Text part of logo (shown before accent span)
  logoAccent: 'Club',             // Accent part of logo (shown in brand color)
  faviconUrl: '',                  // URL to favicon (leave '' to use default emoji)

  // ── COLORS ────────────────────────────────────────
  // Primary accent — buttons, highlights, prices
  accent:       '#ff6b2c',
  accentLight:  '#ff8c5a',
  accentGlow:   'rgba(255, 107, 44, 0.18)',

  // Backgrounds (dark theme — swap for a light theme if needed)
  bgPrimary:    '#0d0f14',
  bgSecondary:  '#13161e',
  bgCard:       '#1a1d27',
  bgCardHover:  '#1f2333',
  bgElevated:   '#222638',

  // Text
  textPrimary:   '#f0f2f8',
  textSecondary: '#9aa3bf',
  textMuted:     '#5c6585',

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  info:    '#3b82f6',
  danger:  '#ef4444',

  // ── CURRENCY & LOCALE ─────────────────────────────
  currencySymbol: '₹',
  locale:         'en-IN',

  // ── DELIVERY DEFAULTS ─────────────────────────────
  deliveryFee: 39,      // ₹ flat delivery charge
  taxPercent:  5,       // GST / tax %
  loyaltyRate: 10,      // spend ₹10 → earn 1 point
  loyaltyRedeem: 100,   // 100 pts → ₹10 discount

  // ── RAZORPAY ──────────────────────────────────────
  // Get your key from https://dashboard.razorpay.com/
  razorpayKeyId: 'rzp_test_REPLACE_WITH_YOUR_KEY',
  razorpayCompanyName: 'EatClub',
  razorpayDescription: 'Food Order Payment',
  razorpayThemeColor: '#ff6b2c',

  // ── WHATSAPP NOTIFICATIONS ────────────────────────
  // Owner's WhatsApp number to receive new order alerts (with country code, no +)
  ownerWhatsApp: '',    // e.g. '919876543210'

  // ── SOCIAL / CONTACT ──────────────────────────────
  supportPhone:  '',
  supportEmail:  '',
  instagramUrl:  '',
  facebookUrl:   '',

  // ── PWA / MANIFEST ────────────────────────────────
  themeColor:      '#0d0f14',
  backgroundColor: '#0d0f14',
};

// ── Auto-inject CSS variables ─────────────────────
(function applyBrandTheme() {
  const root = document.documentElement;
  const c = BRAND_CONFIG;
  root.style.setProperty('--accent',         c.accent);
  root.style.setProperty('--accent-light',   c.accentLight);
  root.style.setProperty('--accent-glow',    c.accentGlow);
  root.style.setProperty('--bg-primary',     c.bgPrimary);
  root.style.setProperty('--bg-secondary',   c.bgSecondary);
  root.style.setProperty('--bg-card',        c.bgCard);
  root.style.setProperty('--bg-card-hover',  c.bgCardHover);
  root.style.setProperty('--bg-elevated',    c.bgElevated);
  root.style.setProperty('--text-primary',   c.textPrimary);
  root.style.setProperty('--text-secondary', c.textSecondary);
  root.style.setProperty('--text-muted',     c.textMuted);
  root.style.setProperty('--success',        c.success);
  root.style.setProperty('--warning',        c.warning);
  root.style.setProperty('--info',           c.info);
  root.style.setProperty('--danger',         c.danger);

  // Update page title
  document.title = c.appName + ' — ' + c.tagline;

  // Update meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', 'Order from ' + c.appName + '. Fast delivery, great food.');

  // Update theme-color meta
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', c.themeColor);

  // Apply favicon if provided
  if (c.faviconUrl) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = c.faviconUrl;
  }
})();
