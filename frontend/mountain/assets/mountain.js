/*
 * Mountain Racing Co — design preview storefront.
 * Static pages under /mountain/. Sample catalog, prices, reviews and orders; no backend calls,
 * nothing is charged or saved on the server. The cart, wishlist and sample sign-in live in this browser only.
 * Its own code and its own look (forest green, white, black; slab type; topo lines; mountain ridges).
 * There is deliberately no vehicle picker / garage / fit filter: what a part fits is plain product text.
 */
(function () {
  'use strict';

  const CAT = window.PREVIEW_CATALOG;
  const ART = window.PartsArt;
  const BASE = '/mountain';
  const BRAND = 'Mountain Racing Co';
  const TIER = 'cheap';
  const GREEN = '#1d6b43';
  const P = CAT.products;

  // Customer rules from the CFOODS handoff (Nov 5, 2026). Same for every CFOODS store unless the owner overrides.
  const FREE_SHIP = 30;
  const SHIP_FLAT = 7;
  const SHIP_ZONES = { us: ['Lower 48 states', null], akhi: ['Alaska or Hawaii', 50], ca: ['Canada', 100], intl: ['Other countries', 150] };
  const RETURN_DAYS = 7;
  const RESTOCK = 0.05;
  const shipFor = (zone, subtotal) => (zone === 'us' || !SHIP_ZONES[zone] ? (subtotal >= FREE_SHIP || subtotal <= 0 ? 0 : SHIP_FLAT) : SHIP_ZONES[zone][1]);

  // ------------------------------------------------------------------ helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => `$${Number(n).toFixed(2)}`;
  const params = new URLSearchParams(window.location.search);
  const byId = (id) => P.find((p) => p.id === id);
  const price = (p) => p.price[TIER];
  const dash = (s) => String(s).replace(/(\d{4})-(\d{4})/g, '$1–$2');
  const title = (p) => dash(p.title);
  const catById = (id) => CAT.categories.find((c) => c.id === id);

  const store = {
    get(key, fallback) {
      try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked: the page still works for this visit */ }
    },
    session(key, value) {
      try {
        if (value === undefined) { const v = window.sessionStorage.getItem(key); return v ? JSON.parse(v) : null; }
        if (value === null) window.sessionStorage.removeItem(key); else window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch (e) { /* ignore */ }
      return null;
    },
  };

  const url = {
    home: `${BASE}/home/`,
    all: `${BASE}/collection/`,
    cat: (id) => `${BASE}/collection/?category=${encodeURIComponent(id)}`,
    product: (p) => `${BASE}/product/?p=${encodeURIComponent(p.id)}`,
    search: (q) => `${BASE}/search/?q=${encodeURIComponent(q)}`,
    page: (name) => `${BASE}/${name}/`,
  };

  const I = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    cart: '<path d="M5 8h14l-1.5 11a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    truck: '<path d="M2 6h11v10H2zM13 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    returns: '<path d="M4 10h11a5 5 0 0 1 0 10H9"/><path d="M8 6l-4 4 4 4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    menu: '<path d="M4 7h16M4 12h11M4 17h16"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    wrench: '<path d="M15 4a5 5 0 0 0-4.6 6.9L4 17.3V20h2.7l6.4-6.4A5 5 0 0 0 20 9l-3 1-2-2 1-3z"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    medal: '<circle cx="12" cy="15" r="6"/><path d="M8 3l4 6 4-6M12 12.5v5"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
    out: '<path d="M14 4h6v16h-6M10 12h10M6 8l-4 4 4 4"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v1.5M12 16v1.5"/>',
    mountain: '<path d="M2 20l7-12 4 6 3-4 6 10z"/><path d="M9 8l-2 3.4 2-.9 1.6 1"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  };
  const icon = (name, cls = '') => `<svg class="mt-i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name] || ''}</svg>`;

  // Mountain shows its parts in black ceramic coating, with green filters and couplers.
  const art = (p, view = 'main') => ART.svg(p.art, { finish: 'black', accent: GREEN, coupler: GREEN, view, label: title(p) });
  const catArt = (c) => ART.svg(c.art, { finish: 'black', accent: GREEN, coupler: GREEN, label: c.name });

  const priceTag = (n, cls = '') => `<span class="mt-price ${cls}">${money(n)}</span>`;
  const stars = (r) => `<span class="mt-stars" style="--r:${((r / 5) * 100).toFixed(0)}%" role="img" aria-label="${r} out of 5 stars"></span>`;

  const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const daysAgo = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return isoDay(d); };
  const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return isoDay(d); };
  const niceDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ------------------------------------------------------------------ cart and wishlist
  const cart = {
    read() { return store.get('mt_preview_cart', []).filter((l) => l && byId(l.id) && l.qty > 0); },
    write(lines) { store.set('mt_preview_cart', lines); updateBadges(); },
    add(id, qty = 1) {
      const lines = this.read();
      const line = lines.find((l) => l.id === id);
      if (line) line.qty = Math.min(20, line.qty + qty); else lines.push({ id, qty: Math.min(20, qty) });
      this.write(lines);
    },
    setQty(id, qty) { this.write(this.read().map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(20, qty)) } : l))); },
    remove(id) { this.write(this.read().filter((l) => l.id !== id)); },
    clear() { this.write([]); },
    count() { return this.read().reduce((a, l) => a + l.qty, 0); },
    subtotal() { return this.read().reduce((a, l) => a + price(byId(l.id)) * l.qty, 0); },
  };
  const wish = {
    read() { return store.get('mt_preview_wishlist', []).filter((id) => byId(id)); },
    has(id) { return this.read().includes(id); },
    set(id, on) { const list = this.read().filter((x) => x !== id); store.set('mt_preview_wishlist', on ? [...list, id] : list); return on; },
    toggle(id) { return this.set(id, !this.has(id)); },
  };
  const wishButton = (p) => `<button class="mt-save${wish.has(p.id) ? ' is-on' : ''}" type="button" data-wish="${p.id}" aria-pressed="${wish.has(p.id)}" aria-label="Save ${esc(title(p))} to your wishlist">${icon('heart')}<span>${wish.has(p.id) ? 'Saved' : 'Save'}</span></button>`;

  // What a part fits is plain product text (like the title). There is no vehicle picker or garage.
  const fitText = (p) => (p.universal ? 'Universal fit' : p.fits.map((f) => `${f.from}–${f.to} ${f.make} ${f.model}`).join(', '));

  // Install difficulty, marked like ski trails: green circle, blue square, black diamond. Sample estimates.
  const DIFF = {
    easy: { label: 'Easy install', short: 'Easy', time: 'About 30–60 minutes', note: 'Basic hand tools in the driveway.' },
    moderate: { label: 'Moderate install', short: 'Moderate', time: 'About 1–3 hours', note: 'Jack stands, penetrating oil and some patience.' },
    advanced: { label: 'Advanced install', short: 'Advanced', time: 'About 3–6 hours', note: 'A lift or a long afternoon. Some parts need welding or a tune.' },
  };
  const DIFF_BY_ART = { header: 'advanced', downpipe: 'advanced', testpipe: 'moderate', intake: 'easy', cnc: 'advanced', spacer: 'easy', tip: 'easy', resonator: 'moderate', kit: 'easy' };
  const diffOf = (p) => DIFF_BY_ART[p.art] || 'moderate';
  const diffMark = (d, withText = true) => `<span class="mt-diff mt-diff-${d}"><i aria-hidden="true"></i>${withText ? DIFF[d].short : `<span class="mt-visually-hidden">${DIFF[d].label}</span>`}</span>`;

  // Budget bands, named like a climb.
  const BANDS = { all: [0, Infinity, 'Any budget', ''], u50: [0, 50, 'Trailhead', 'Under $50'], '50-100': [50, 100, 'Switchbacks', '$50–$100'], '100-150': [100, 150, 'Ridge', '$100–$150'], o150: [150, Infinity, 'Summit', '$150 and up'] };
  const inBand = (p, band) => { const [lo, hi] = BANDS[band] || BANDS.all; return price(p) >= lo && price(p) < hi; };

  // ------------------------------------------------------------------ search
  // Plain keyword search over what a product already has: title, category, engine and part number.
  function searchProducts(q) {
    const tokens = String(q || '').toLowerCase().replace(/["'(),]/g, ' ').split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    return P.map((p) => {
      const hay = [p.title, p.categoryName, p.category.replace(/-/g, ' '), p.engine, p.sku, p.art, p.universal ? 'universal' : ''].join(' ').toLowerCase();
      const t0 = p.title.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        const single = t.length > 3 ? t.replace(/(es|s)$/, '') : t;
        if (!hay.includes(t) && !hay.includes(single)) return null;
        score += t0.includes(t) || t0.includes(single) ? 3 : 1;
        if (p.categoryName.toLowerCase().includes(single)) score += 2;
      }
      return { p, score: score + p.reviewCount / 1000 };
    }).filter(Boolean).sort((a, b) => b.score - a.score).map((x) => x.p);
  }
  function highlight(text, q) {
    let out = esc(text);
    String(q || '').toLowerCase().split(/\s+/).filter((t) => t.length > 1).forEach((t) => {
      const safe = esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(`(${safe})(?![^<]*>)`, 'ig'), '<mark>$1</mark>');
    });
    return out;
  }

  // ------------------------------------------------------------------ shared pieces
  const peak = (light) => `<svg class="mt-logo-mark${light ? ' is-light' : ''}" viewBox="0 0 44 30" aria-hidden="true"><path d="M1 29 L15 7 L22 17 L29 4 L43 29 Z" fill="currentColor"/><path d="M29 4 L25.2 10.6 L28 9.4 L30 11 L32.6 9.6 Z" fill="#fff"/><path d="M15 7 L12.2 11.4 L14.4 10.6 L16.4 11.6 Z" fill="#fff"/></svg>`;
  const logo = (light = false) => `${peak(light)}<span class="mt-logo-text${light ? ' is-light' : ''}"><b>MOUNTAIN</b><small>RACING CO.</small></span>`;
  const RIDGE = '<svg viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 90 L0 58 L90 34 L170 52 L260 18 L350 46 L430 30 L540 62 L640 12 L730 44 L820 26 L930 56 L1030 8 L1130 40 L1210 24 L1320 50 L1440 30 L1440 90 Z"/></svg>';

  function card(p) {
    const out = p.stock <= 0;
    const badge = out ? '<span class="mt-badge mt-badge-dark">Sold out</span>' : p.isNew ? '<span class="mt-badge mt-badge-dark">New</span>' : p.best ? '<span class="mt-badge">Trail pick</span>' : '';
    return `<article class="mt-card${out ? ' is-out' : ''}">
      <a class="mt-card-media" href="${url.product(p)}" tabindex="-1" aria-hidden="true">${art(p)}${badge}</a>
      <div class="mt-card-body">
        <p class="mt-card-meta">${esc(p.categoryName)} ${diffMark(diffOf(p))}</p>
        <h3 class="mt-card-title"><a href="${url.product(p)}">${esc(title(p))}</a></h3>
        <p class="mt-card-fit">${p.universal ? 'Universal fit' : `Fits ${esc(p.fits.length > 1 ? `${p.fits.length} models` : fitText(p))}`}</p>
        <p class="mt-card-rating">${stars(p.rating)}<span>${p.rating} (${p.reviewCount})</span></p>
        <div class="mt-card-foot">
          ${priceTag(price(p))}
          ${out ? '<span class="mt-card-soldout">Back soon</span>' : `<button class="mt-add" type="button" data-add="${p.id}" aria-label="Add ${esc(title(p))} to cart">${icon('plus')}</button>`}
        </div>
      </div>
    </article>`;
  }
  const grid = (list, cls = '') => `<div class="mt-grid ${cls}">${list.map(card).join('')}</div>`;

  function shipProgress(sub) {
    const left = FREE_SHIP - sub;
    const pct = Math.max(6, Math.min(100, (sub / FREE_SHIP) * 100));
    return `<div class="mt-climb${left <= 0 ? ' is-done' : ''}">
      <p>${left > 0 ? `${icon('flag')}<span><b>${money(left)}</b> to go until free shipping</span>` : `${icon('check')}<span><b>Free shipping</b> on this order</span>`}</p>
      <div class="mt-climb-track" aria-hidden="true"><span style="width:${pct}%"></span><i style="left:${pct}%"></i></div>
    </div>`;
  }

  const crumbs = (items) => `<nav class="mt-crumbs" aria-label="Breadcrumb">${items.map(([label, href], i) => (href && i < items.length - 1 ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`)).join(icon('chev'))}</nav>`;

  function header() {
    const page = document.body.dataset.page;
    return `<a class="mt-skip" href="#main">Skip to content</a>
    <div class="mt-topbar"><div class="mt-wrap mt-topbar-inner">
      <span>${icon('truck')}Free shipping on orders $${FREE_SHIP}+</span>
      <span class="mt-hide-sm">${icon('returns')}${RETURN_DAYS}-day returns, free return label</span>
      <span class="mt-hide-sm">${icon('chat')}Help 24/7</span>
    </div></div>
    <header class="mt-header">
      <div class="mt-wrap mt-header-inner">
        <div class="mt-header-left">
          <button class="mt-icon-btn mt-menu-btn" type="button" data-open-menu aria-label="Open menu">${icon('menu')}</button>
          <nav class="mt-nav" aria-label="Main">
            <button class="mt-nav-link mt-mega-btn" type="button" aria-expanded="false" aria-controls="mtMega">Shop${icon('down')}</button>
            <a class="mt-nav-link" href="${url.all}?sort=new"${page === 'collection' && params.get('sort') === 'new' ? ' aria-current="page"' : ''}>New</a>
            <a class="mt-nav-link" href="${url.all}?price=u50"${page === 'collection' && params.get('price') === 'u50' ? ' aria-current="page"' : ''}>Under $50</a>
            <a class="mt-nav-link" href="${url.page('reviews')}"${page === 'reviews' ? ' aria-current="page"' : ''}>Reviews</a>
          </nav>
        </div>
        <a class="mt-logo" href="${url.home}" aria-label="Mountain Racing Co home">${logo()}</a>
        <div class="mt-header-right">
          <button class="mt-icon-btn" type="button" data-open-search aria-label="Search parts">${icon('search')}</button>
          <a class="mt-icon-btn" href="${url.page('account')}" aria-label="Account">${icon('user')}</a>
          <a class="mt-icon-btn mt-cart-btn" href="${url.page('cart')}" aria-label="Cart">${icon('cart')}<span class="mt-cart-count">0</span></a>
        </div>
      </div>
      <div class="mt-mega" id="mtMega" hidden>
        <div class="mt-wrap mt-mega-inner">
          <div class="mt-mega-cats">${CAT.categories.map((c) => `<a class="mt-mega-cat" href="${url.cat(c.id)}"><span class="mt-mega-art">${catArt(c)}</span><span><b>${esc(c.name)}</b><small>${P.filter((p) => p.category === c.id).length} parts</small></span></a>`).join('')}</div>
          <div class="mt-mega-side">
            <p class="mt-label">Shop by budget</p>
            <ul>${['u50', '50-100', '100-150', 'o150'].map((b) => `<li><a href="${url.all}?price=${b}"><b>${BANDS[b][2]}</b><span>${BANDS[b][3]}</span></a></li>`).join('')}</ul>
            <a class="mt-btn mt-btn-dark mt-btn-sm" href="${url.all}">All parts${icon('chev')}</a>
          </div>
        </div>
      </div>
    </header>`;
  }

  const HELP_LINKS = [['Track order', 'track'], ['Start a return or claim', 'request'], ['Shipping', 'shipping'], ['Returns & refunds', 'refund'], ['Warranty', 'warranty'], ['FAQ', 'faq'], ['Contact us', 'contact']];
  const COMPANY_LINKS = [['About us', 'about'], ['Customer reviews', 'reviews'], ['Military discount', 'military'], ['Social', 'social']];
  const LEGAL_LINKS = [['Privacy policy', 'privacy'], ['Terms & conditions', 'terms'], ['Vehicle compliance waiver', 'vcw'], ['Consumer use agreement', 'cua'], ['Proposition 65', 'prop65']];
  const linkList = (list) => list.map(([label, page]) => `<li><a href="${url.page(page)}">${esc(label)}</a></li>`).join('');

  function footer() {
    return `<footer class="mt-footer">
      <div class="mt-ridge">${RIDGE}</div>
      <div class="mt-footer-body"><div class="mt-wrap">
        <ul class="mt-promises" aria-label="Our promises">
          <li>${icon('truck')}<span><b>Free shipping $${FREE_SHIP}+</b>Lower 48, tracking on every order</span></li>
          <li>${icon('returns')}<span><b>${RETURN_DAYS}-day returns</b>Unused parts, free label</span></li>
          <li>${icon('shield')}<span><b>Warranty on every part</b>Replacement first</span></li>
          <li>${icon('chat')}<span><b>Help 24/7</b>Chat or email</span></li>
        </ul>
        <div class="mt-footer-grid">
          <div class="mt-footer-brand">
            <a class="mt-logo" href="${url.home}" aria-label="Mountain Racing Co home">${logo(true)}</a>
            <p>Budget performance parts for canyon runs, hill climbs and daily drives.</p>
            <form class="mt-news" id="footNews" novalidate>
              <label for="footEmail">Join the climb: new parts and deals, now and then.</label>
              <div><input id="footEmail" type="email" placeholder="you@email.com" autocomplete="email"><button class="mt-btn mt-btn-light" type="submit">Join</button></div>
              <p class="mt-form-msg" id="footMsg" role="status"></p>
            </form>
          </div>
          <div><h3>Shop</h3><ul><li><a href="${url.all}">All parts</a></li>${CAT.categories.map((c) => `<li><a href="${url.cat(c.id)}">${esc(c.name)}</a></li>`).join('')}</ul></div>
          <div><h3>Help</h3><ul>${linkList(HELP_LINKS)}</ul></div>
          <div><h3>Company</h3><ul>${linkList(COMPANY_LINKS)}<li><a href="${url.page('account')}">My account</a></li></ul></div>
          <div><h3>Legal</h3><ul>${linkList(LEGAL_LINKS)}</ul></div>
        </div>
        <div class="mt-footer-bottom">
          <p>&copy; 2026 Mountain Racing Co. All rights reserved.</p>
          <p>Design preview: sample products, prices, reviews and orders. Nothing here can be bought. <a href="${url.page('emails')}">See the email designs</a></p>
        </div>
      </div></div>
    </footer>`;
  }

  function overlays(withChat = true) {
    return `<div class="mt-overlay" id="mtMenu" hidden>
      <div class="mt-overlay-backdrop" data-close-overlay></div>
      <div class="mt-sheet mt-sheet-top" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="mt-sheet-head"><span class="mt-logo">${logo()}</span><button class="mt-icon-btn" type="button" data-close-overlay aria-label="Close menu">${icon('x')}</button></div>
        <div class="mt-sheet-body">
          <button class="mt-menu-search" type="button" data-open-search>${icon('search')}Search parts</button>
          <p class="mt-label">Shop</p>
          <ul class="mt-menu-cats">
            <li><a href="${url.all}"><span class="mt-menu-art">${art(byId('accord-94-97-header'))}</span><b>All parts</b>${icon('chev')}</a></li>
            ${CAT.categories.map((c) => `<li><a href="${url.cat(c.id)}"><span class="mt-menu-art">${catArt(c)}</span><b>${esc(c.name)}</b>${icon('chev')}</a></li>`).join('')}
          </ul>
          <p class="mt-label">Shop by budget</p>
          <div class="mt-menu-bands">${['u50', '50-100', '100-150', 'o150'].map((b) => `<a href="${url.all}?price=${b}"><b>${BANDS[b][2]}</b><span>${BANDS[b][3]}</span></a>`).join('')}</div>
          <p class="mt-label">Help</p>
          <ul class="mt-menu-links">${linkList(HELP_LINKS)}<li><a href="${url.page('account')}">My account</a></li></ul>
        </div>
      </div>
    </div>
    <div class="mt-overlay" id="mtSearch" hidden>
      <div class="mt-overlay-backdrop" data-close-overlay></div>
      <div class="mt-sheet mt-sheet-top mt-search-sheet" role="dialog" aria-modal="true" aria-label="Search">
        <div class="mt-wrap">
          <form class="mt-search-form" action="${BASE}/search/" method="get" role="search" autocomplete="off">
            ${icon('search')}<input name="q" type="search" id="mtSearchInput" placeholder="Search parts or part numbers" aria-label="Search parts">
            <button class="mt-icon-btn" type="button" data-close-overlay aria-label="Close search">${icon('x')}</button>
          </form>
          <div id="mtSearchBody"></div>
        </div>
      </div>
    </div>
    <aside class="mt-added" id="mtAdded" hidden aria-live="polite" aria-label="Added to cart"></aside>
    <div class="mt-toast" id="mtToast" role="status" aria-live="polite"></div>
    ${withChat ? `<button class="mt-chat-launch" type="button" data-open-chat aria-label="Chat with Mountain Racing support" aria-controls="mtChat" aria-expanded="false">${icon('chat')}</button>
    <section class="mt-chat" id="mtChat" hidden role="dialog" aria-labelledby="mtChatTitle">
      <div class="mt-chat-head"><span class="mt-chat-peak">${peak(true)}</span><div><b id="mtChatTitle">Trail help</b><small>We're here 24/7</small></div><button class="mt-icon-btn" type="button" data-close-chat aria-label="Close chat">${icon('x')}</button></div>
      <div class="mt-chat-body" id="mtChatBody" aria-live="polite"><div class="mt-bubble is-team"><small>Mountain Racing support</small><p>Hey! We’re here to help with orders, shipping, returns and part fitment. What can we help with?</p></div></div>
      <form class="mt-chat-form" id="mtChatForm" novalidate><label class="mt-visually-hidden" for="mtChatInput">Message</label><input id="mtChatInput" placeholder="Type a message" autocomplete="off"><button class="mt-btn mt-btn-primary mt-btn-sm" type="submit">Send</button></form>
      <p class="mt-chat-note">Preview: replies aren't live yet.</p>
    </section>` : ''}`;
  }

  function updateBadges() {
    const n = cart.count();
    $$('.mt-cart-count').forEach((el) => { el.textContent = n; el.classList.toggle('is-empty', n === 0); });
  }

  let lastFocus = null;
  function openOverlay(id) {
    const el = document.getElementById(id);
    if (!el) return;
    $$('.mt-overlay.is-open').forEach((o) => { if (o !== el) { o.classList.remove('is-open'); o.hidden = true; } });
    lastFocus = document.activeElement;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-open'));
    document.documentElement.classList.add('mt-lock');
    const target = $('input', el) || $('[data-close-overlay].mt-icon-btn', el);
    if (target) setTimeout(() => target.focus(), 40);
  }
  function closeOverlay(el) {
    if (!el || el.hidden) return;
    el.classList.remove('is-open');
    el.hidden = true;
    if (!$$('.mt-overlay.is-open').length) document.documentElement.classList.remove('mt-lock');
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
  }
  function setMega(open) {
    const mega = document.getElementById('mtMega');
    const btn = $('.mt-mega-btn');
    if (!mega || !btn) return;
    mega.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  }
  function openChat() {
    const panel = document.getElementById('mtChat');
    if (!panel) return;
    panel.hidden = false;
    $$('.mt-chat-launch').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    setTimeout(() => { const input = document.getElementById('mtChatInput'); if (input) input.focus(); }, 30);
  }
  function closeChat() {
    const panel = document.getElementById('mtChat');
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    $$('.mt-chat-launch').forEach((b) => { b.setAttribute('aria-expanded', 'false'); b.focus(); });
  }

  function toast(text) {
    const el = document.getElementById('mtToast');
    if (!el) return;
    el.innerHTML = `${icon('check')}<span>${esc(text)}</span>`;
    el.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  // Mountain confirms an add with a small pop-up instead of a cart drawer.
  function showAdded(id, qty) {
    const el = document.getElementById('mtAdded');
    const p = byId(id);
    if (!el || !p) return;
    const sub = cart.subtotal();
    el.innerHTML = `<div class="mt-added-head"><b>${icon('check')}Added to cart</b><button class="mt-icon-btn" type="button" data-close-added aria-label="Close">${icon('x')}</button></div>
      <div class="mt-added-item"><span class="mt-mini-art">${art(p)}</span><span><b>${esc(title(p))}</b><small>Qty ${qty} &middot; ${money(price(p))} each</small></span></div>
      ${shipProgress(sub)}
      <div class="mt-added-actions"><a class="mt-btn mt-btn-ghost mt-btn-sm" href="${url.page('cart')}">View cart (${cart.count()})</a><a class="mt-btn mt-btn-primary mt-btn-sm" href="${url.page('checkout')}">Checkout</a></div>`;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-on'));
    clearTimeout(showAdded.t);
    showAdded.t = setTimeout(hideAdded, 7000);
  }
  function hideAdded() {
    const el = document.getElementById('mtAdded');
    if (!el || el.hidden) return;
    el.classList.remove('is-on');
    el.hidden = true;
  }

  const POPULAR = ['headers', 'downpipe', 'intake', 'test pipes', 'flange', 'HDR-1001'];
  function drawSearch(q) {
    const body = document.getElementById('mtSearchBody');
    if (!body) return;
    const found = q.trim().length >= 2 ? searchProducts(q) : [];
    if (!q.trim()) {
      body.innerHTML = `<p class="mt-label">Popular searches</p><div class="mt-chips">${POPULAR.map((t) => `<a class="mt-chip" href="${url.search(t)}">${esc(t)}</a>`).join('')}</div>
        <p class="mt-label">Pick your trail</p><div class="mt-search-cats">${CAT.categories.map((c) => `<a href="${url.cat(c.id)}"><span class="mt-mini-art">${catArt(c)}</span>${esc(c.name)}</a>`).join('')}</div>`;
      return;
    }
    body.innerHTML = found.length
      ? `<p class="mt-search-count">${found.length} part${found.length === 1 ? '' : 's'} for &ldquo;${esc(q)}&rdquo;</p>
        <div class="mt-search-hits">${found.slice(0, 6).map((p) => `<a class="mt-hit" href="${url.product(p)}"><span class="mt-mini-art">${art(p)}</span><span><b>${highlight(title(p), q)}</b><small>${esc(p.categoryName)} &middot; ${money(price(p))}</small></span></a>`).join('')}</div>
        <a class="mt-btn mt-btn-primary" href="${url.search(q)}">See all ${found.length} result${found.length === 1 ? '' : 's'}${icon('chev')}</a>`
      : `<p class="mt-search-count">No parts match &ldquo;${esc(q)}&rdquo;. Try a part type like &ldquo;header&rdquo; or a part number.</p><div class="mt-chips">${POPULAR.map((t) => `<a class="mt-chip" href="${url.search(t)}">${esc(t)}</a>`).join('')}</div>`;
  }
  function bindSearchOverlay() {
    const input = document.getElementById('mtSearchInput');
    if (!input) return;
    drawSearch('');
    input.addEventListener('input', () => drawSearch(input.value));
    input.form.addEventListener('submit', (e) => { if (!input.value.trim()) { e.preventDefault(); input.focus(); } });
  }

  // ------------------------------------------------------------------ pages
  const PAGES = {};
  let onCartChange = null; // the cart page sets this so it redraws when something is added
  let onWishChange = null; // the account wishlist tab sets this


  // The mountains behind the home hero. A road is cut into the middle range: it comes out from behind the
  // dark front hills, climbs the face in switchbacks and goes over the pass, out of sight. It is drawn
  // inside the middle range's outline (clip), so it can never stick out past the mountain.
  const RANGE_MID = 'M0 320 V220 L150 160 L260 200 L420 120 L560 158 L700 130 L820 200 L980 140 L1120 210 L1270 150 L1440 200 V320 Z';
  const MT_ROAD = (() => {
    // Switchback corners, from the bottom (hidden behind the front hills) to beyond the pass.
    const pts = [[748, 282], [640, 214], [756, 186], [588, 165], [546, 134]];
    const r = 16;
    const f = (n) => Math.round(n * 10) / 10;
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i += 1) {
      const [px, py] = pts[i - 1];
      const [x, y] = pts[i];
      const [nx, ny] = pts[i + 1];
      const l1 = Math.hypot(x - px, y - py);
      const l2 = Math.hypot(nx - x, ny - y);
      d += ` L${f(x - ((x - px) * r) / l1)} ${f(y - ((y - py) * r) / l1)} Q${x} ${y} ${f(x + ((nx - x) * r) / l2)} ${f(y + ((ny - y) * r) / l2)}`;
    }
    const [lx, ly] = pts[pts.length - 1];
    return `${d} L${lx} ${ly}`;
  })();
  // A few pines on the slopes around the road.
  const pine = ([x, y, s]) => `<path d="M${x} ${y - 14 * s} L${x + 5 * s} ${y - 5 * s} H${x + 2.6 * s} L${x + 6 * s} ${y} H${x - 6 * s} L${x - 2.6 * s} ${y - 5 * s} H${x - 5 * s} Z"/>`;
  const RANGE = `<svg class="mt-range-svg" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><clipPath id="mtMidRange"><path d="${RANGE_MID}"/></clipPath></defs>
    <path class="mt-range-3" d="M0 320 V170 L120 120 L230 160 L360 70 L470 140 L590 90 L720 150 L860 60 L990 130 L1110 80 L1240 140 L1360 100 L1440 130 V320 Z"/>
    <path class="mt-range-2" d="${RANGE_MID}"/>
    <path class="mt-range-2-shade" d="M420 120 L560 158 L600 320 H380 Z M700 130 L820 200 L830 320 H730 Z M980 140 L1120 210 L1130 320 H1010 Z M150 160 L260 200 L270 320 H170 Z M1270 150 L1440 200 V320 H1300 Z" clip-path="url(#mtMidRange)"/>
    <g class="mt-road" clip-path="url(#mtMidRange)">
      <path class="mt-road-cut" d="${MT_ROAD}" transform="translate(0 -2.5)"/>
      <path class="mt-road-edge" d="${MT_ROAD}" transform="translate(0 2.5)"/>
      <path class="mt-road-top" d="${MT_ROAD}"/>
      <path class="mt-road-line" d="${MT_ROAD}"/>
    </g>
    <g class="mt-pines">${[[700, 238, 1], [716, 242, .8], [608, 200, .9], [624, 204, .7], [790, 214, .9], [668, 190, .7], [530, 186, .8], [806, 222, .7]].map(pine).join('')}</g>
    <path class="mt-range-1" d="M0 320 V270 L180 210 L330 250 L520 190 L700 260 L900 200 L1080 255 L1260 205 L1440 245 V320 Z"/>
  </svg>`;

  PAGES.home = () => {
    const pick = byId('accord-94-97-header');
    const favorites = P.slice().sort((a, b) => (b.best - a.best) || (b.reviewCount - a.reviewCount)).filter((p) => p.stock > 0).slice(0, 8);
    const fresh = P.filter((p) => p.isNew);
    const homeReviews = [byId('370z-09-20-test-pipes'), byId('civic-06-11-intake'), byId('wrx-08-14-downpipe')].map((p) => ({ p, r: CAT.featuredReview(p, 1) }));
    const steps = ['u50', '50-100', '100-150', 'o150'];
    return {
      title: 'Budget Performance Parts, Built for the Climb',
      html: `
      <section class="mt-hero">
        <div class="mt-wrap mt-hero-grid">
          <div class="mt-hero-copy">
            <p class="mt-eyebrow">${icon('mountain')}Budget performance parts</p>
            <h1>Built for<br>the climb.</h1>
            <p class="mt-hero-sub">Headers, downpipes and intakes for canyon runs, hill climbs and the daily drive. Fair prices, free shipping over $${FREE_SHIP} and a warranty on every part.</p>
            <div class="mt-hero-ctas">
              <a class="mt-btn mt-btn-primary mt-btn-lg" href="${url.all}">Shop all parts${icon('chev')}</a>
              <a class="mt-btn mt-btn-ghost mt-btn-lg" href="#budget">${icon('compass')}Shop by budget</a>
            </div>
            <ul class="mt-hero-facts">
              <li><b>${P.length}</b><span>parts</span></li>
              <li><b>4.7</b><span>average rating</span></li>
              <li><b>$${FREE_SHIP}+</b><span>ships free</span></li>
            </ul>
          </div>
          <a class="mt-pick" href="${url.product(pick)}">
            <span class="mt-pick-label">${icon('flag')}Trail pick</span>
            <span class="mt-pick-art">${art(pick)}</span>
            <span class="mt-pick-info"><b>${esc(title(pick))}</b><span>${diffMark(diffOf(pick))}${stars(pick.rating)}</span></span>
            <span class="mt-pick-price">${priceTag(price(pick))}<span class="mt-pick-go">View part${icon('chev')}</span></span>
          </a>
        </div>
        <div class="mt-hero-range">${RANGE}</div>
      </section>

      <section class="mt-section mt-section-pine-top" aria-labelledby="trailTitle">
        <div class="mt-wrap">
          <div class="mt-section-head"><div><p class="mt-label">Six kinds of parts</p><h2 id="trailTitle">Pick your trail</h2></div><a class="mt-link" href="${url.all}">All parts${icon('chev')}</a></div>
          <div class="mt-trails">${CAT.categories.map((c) => {
            const list = P.filter((p) => p.category === c.id);
            const diffs = [...new Set(list.map(diffOf))];
            return `<a class="mt-trail" href="${url.cat(c.id)}"><span class="mt-trail-art">${catArt(c)}</span><span class="mt-trail-info"><b>${esc(c.name)}</b><small>${list.length} parts &middot; from ${money(Math.min(...list.map(price)))}</small><span class="mt-trail-diffs">${diffs.map((d) => diffMark(d)).join('')}</span></span>${icon('chev')}</a>`;
          }).join('')}</div>
        </div>
      </section>

      <section class="mt-section mt-section-sage" aria-labelledby="favTitle">
        <div class="mt-wrap">
          <div class="mt-section-head"><div><p class="mt-label">Most bought, best rated</p><h2 id="favTitle">Trail-tested favorites</h2></div><a class="mt-link" href="${url.all}">Shop all${icon('chev')}</a></div>
          ${grid(favorites)}
        </div>
      </section>

      <section class="mt-section mt-budget" id="budget" aria-labelledby="budgetTitle">
        <div class="mt-wrap">
          <div class="mt-section-head"><div><p class="mt-label">Shop by budget</p><h2 id="budgetTitle">How high do you want to go?</h2></div></div>
          <div class="mt-profile">${steps.map((b, i) => `<a class="mt-step-band" href="${url.all}?price=${b}" style="--h:${40 + i * 20}%"><span class="mt-band-top"><b>${BANDS[b][2]}</b><small>${BANDS[b][3]}</small></span><span class="mt-band-count">${P.filter((p) => inBand(p, b)).length} parts${icon('chev')}</span></a>`).join('')}</div>
        </div>
      </section>

      <section class="mt-section mt-know" aria-labelledby="knowTitle">
        <div class="mt-wrap">
          <div class="mt-section-head"><div><p class="mt-label">Every part is marked</p><h2 id="knowTitle">Know before you wrench</h2></div></div>
          <div class="mt-know-grid">${['easy', 'moderate', 'advanced'].map((d) => `<a class="mt-know-card" href="${url.all}?difficulty=${d}">${diffMark(d, false)}<b>${DIFF[d].label}</b><span>${DIFF[d].time}. ${DIFF[d].note}</span><small>${P.filter((p) => diffOf(p) === d).length} parts${icon('chev')}</small></a>`).join('')}</div>
        </div>
      </section>

      <section class="mt-section" aria-labelledby="newTitle">
        <div class="mt-wrap">
          <div class="mt-section-head"><div><p class="mt-label">Fresh tracks</p><h2 id="newTitle">New on the mountain</h2></div><a class="mt-link" href="${url.all}?sort=new">See what's new${icon('chev')}</a></div>
          ${grid(fresh)}
        </div>
      </section>

      <section class="mt-section mt-section-sage" aria-labelledby="revTitle">
        <div class="mt-wrap mt-home-reviews">
          <div class="mt-score"><p class="mt-big">4.7</p>${stars(4.7)}<p>from ${P.reduce((a, p) => a + p.reviewCount, 0).toLocaleString()} reviews</p><a class="mt-btn mt-btn-ghost" href="${url.page('reviews')}">Read reviews</a></div>
          <div class="mt-quotes"><h2 id="revTitle" class="mt-visually-hidden">What drivers say</h2>${homeReviews.map(({ p, r }) => `<figure class="mt-quote">${stars(r.rating)}<blockquote><b>&ldquo;${esc(r.title)}&rdquo;</b><p>${esc(r.body)}</p></blockquote><figcaption>${esc(r.name)}${r.vehicle ? ` &middot; ${esc(r.vehicle)}` : ''}<a href="${url.product(p)}">${esc(title(p))}</a></figcaption></figure>`).join('')}</div>
        </div>
      </section>`,
    };
  };

  PAGES.collection = () => {
    const SORTS = { featured: 'Featured', 'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low', rating: 'Top rated', new: 'Newest' };
    const pick = (name, valid) => (params.get(name) || '').split(',').filter((v) => valid.includes(v));
    const state = {
      cats: new Set(pick('category', CAT.categories.map((c) => c.id))),
      bands: new Set(pick('price', ['u50', '50-100', '100-150', 'o150'])),
      diffs: new Set(pick('difficulty', Object.keys(DIFF))),
      stock: false,
      sort: SORTS[params.get('sort')] ? params.get('sort') : 'featured',
    };
    const filtered = () => P.filter((p) => (!state.cats.size || state.cats.has(p.category))
      && (!state.bands.size || [...state.bands].some((b) => inBand(p, b)))
      && (!state.diffs.size || state.diffs.has(diffOf(p)))
      && !(state.stock && p.stock <= 0));
    const one = () => (state.cats.size === 1 ? catById([...state.cats][0]) : null);
    const pills = () => [
      ...[...state.cats].map((id) => [`cat:${id}`, catById(id).name]),
      ...[...state.bands].map((b) => [`band:${b}`, `${BANDS[b][2]} (${BANDS[b][3]})`]),
      ...[...state.diffs].map((d) => [`diff:${d}`, DIFF[d].label]),
      ...(state.stock ? [['stock:1', 'In stock']] : []),
    ];
    const count = (fn) => P.filter(fn).length;
    const filterForm = `
      <form class="mt-filters" id="filters" aria-label="Filter parts">
        <div class="mt-filters-head"><b>${icon('sliders')}Filters</b><button class="mt-icon-btn mt-filters-close" type="button" data-close-filters aria-label="Close filters">${icon('x')}</button></div>
        <div class="mt-filters-body">
          <fieldset><legend>Part type</legend>${CAT.categories.map((c) => `<label class="mt-check"><input type="checkbox" name="cat" value="${c.id}"><span>${esc(c.name)}</span><small>${count((p) => p.category === c.id)}</small></label>`).join('')}</fieldset>
          <fieldset><legend>Budget</legend>${['u50', '50-100', '100-150', 'o150'].map((b) => `<label class="mt-check"><input type="checkbox" name="band" value="${b}"><span>${BANDS[b][2]} <i>${BANDS[b][3]}</i></span><small>${count((p) => inBand(p, b))}</small></label>`).join('')}</fieldset>
          <fieldset><legend>Install difficulty</legend>${Object.keys(DIFF).map((d) => `<label class="mt-check"><input type="checkbox" name="diff" value="${d}"><span>${diffMark(d)}</span><small>${count((p) => diffOf(p) === d)}</small></label>`).join('')}</fieldset>
          <fieldset><legend>Availability</legend><label class="mt-check"><input type="checkbox" name="stock" value="1"><span>In stock only</span></label></fieldset>
        </div>
        <div class="mt-filters-foot"><button class="mt-btn mt-btn-ghost" type="button" data-clear-filters>Clear all</button><button class="mt-btn mt-btn-primary" type="button" data-close-filters id="showN">Show parts</button></div>
      </form>`;
    const draw = () => {
      const sorters = {
        featured: (a, b) => (b.best - a.best) || (b.reviewCount - a.reviewCount),
        'price-asc': (a, b) => price(a) - price(b),
        'price-desc': (a, b) => price(b) - price(a),
        rating: (a, b) => b.rating - a.rating,
        new: (a, b) => (b.isNew - a.isNew) || (b.reviewCount - a.reviewCount),
      };
      const list = filtered().sort(sorters[state.sort] || sorters.featured);
      const c = one();
      document.getElementById('colTitle').textContent = c ? c.name : 'All parts';
      document.getElementById('colSub').textContent = c ? c.blurb : 'Every part we carry. Filter by type, budget or how hard it is to install.';
      document.getElementById('colArt').innerHTML = c ? catArt(c) : art(byId('wrx-08-14-downpipe'));
      document.getElementById('colCount').textContent = `${list.length} part${list.length === 1 ? '' : 's'}`;
      document.getElementById('showN').textContent = `Show ${list.length} part${list.length === 1 ? '' : 's'}`;
      document.getElementById('colPills').innerHTML = pills().map(([k, label]) => `<button class="mt-pill" type="button" data-unpick="${k}" aria-label="Remove filter: ${esc(label)}">${esc(label)}${icon('x')}</button>`).join('') + (pills().length > 1 ? '<button class="mt-link-btn" type="button" data-clear-filters>Clear all</button>' : '');
      document.getElementById('colGrid').innerHTML = list.length ? grid(list, 'mt-grid-3') : `<div class="mt-empty">${icon('compass')}<h2>No parts on this trail</h2><p>Try a different budget or remove a filter.</p><button class="mt-btn mt-btn-primary" type="button" data-clear-filters>Clear filters</button></div>`;
      $$('#filters input').forEach((i) => {
        i.checked = (i.name === 'cat' && state.cats.has(i.value)) || (i.name === 'band' && state.bands.has(i.value)) || (i.name === 'diff' && state.diffs.has(i.value)) || (i.name === 'stock' && state.stock);
      });
    };
    const setFilters = (open) => {
      const f = document.getElementById('filters');
      f.classList.toggle('is-open', open);
      document.getElementById('filtersBackdrop').hidden = !open;
      document.documentElement.classList.toggle('mt-lock', open);
      $('[data-open-filters]').setAttribute('aria-expanded', String(open));
      if (open) setTimeout(() => $('input', f).focus(), 40);
    };
    return {
      title: 'Shop parts',
      html: `
      <section class="mt-page-head mt-topo">
        <div class="mt-wrap mt-page-head-grid">
          <div>${crumbs([['Home', url.home], ['Shop']])}<h1 class="mt-page-title" id="colTitle">All parts</h1><p class="mt-page-sub" id="colSub"></p></div>
          <span class="mt-page-art" id="colArt" aria-hidden="true"></span>
        </div>
      </section>
      <div class="mt-wrap mt-shop">
        <div class="mt-filters-backdrop" id="filtersBackdrop" data-close-filters hidden></div>
        ${filterForm}
        <div class="mt-shop-main">
          <div class="mt-shop-bar">
            <button class="mt-btn mt-btn-ghost mt-btn-sm mt-filters-btn" type="button" data-open-filters aria-controls="filters" aria-expanded="false">${icon('sliders')}Filters</button>
            <span class="mt-count" id="colCount" aria-live="polite"></span>
            <label class="mt-sort"><span>Sort</span><select id="fSort">${Object.entries(SORTS).map(([k, s]) => `<option value="${k}"${k === state.sort ? ' selected' : ''}>${s}</option>`).join('')}</select></label>
          </div>
          <div class="mt-pills" id="colPills"></div>
          <div id="colGrid"></div>
        </div>
      </div>`,
      after() {
        const form = document.getElementById('filters');
        form.addEventListener('change', (e) => {
          const t = e.target;
          const set = { cat: state.cats, band: state.bands, diff: state.diffs }[t.name];
          if (set) { if (t.checked) set.add(t.value); else set.delete(t.value); }
          if (t.name === 'stock') state.stock = t.checked;
          draw();
        });
        document.getElementById('fSort').addEventListener('change', (e) => { state.sort = e.target.value; draw(); });
        document.querySelector('.mt-shop').addEventListener('click', (e) => {
          const un = e.target.closest('[data-unpick]');
          if (un) {
            const [kind, val] = un.dataset.unpick.split(':');
            if (kind === 'stock') state.stock = false; else ({ cat: state.cats, band: state.bands, diff: state.diffs })[kind].delete(val);
            draw();
            return;
          }
          if (e.target.closest('[data-clear-filters]')) { state.cats.clear(); state.bands.clear(); state.diffs.clear(); state.stock = false; draw(); return; }
          if (e.target.closest('[data-open-filters]')) { setFilters(true); return; }
          if (e.target.closest('[data-close-filters]')) setFilters(false);
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && form.classList.contains('is-open')) setFilters(false); });
        draw();
      },
    };
  };

  PAGES.search = () => {
    const q = (params.get('q') || '').trim();
    const results = q ? searchProducts(q) : [];
    const groups = CAT.categories.map((c) => [c, results.filter((p) => p.category === c.id)]).filter(([, l]) => l.length);
    return {
      title: q ? `Search: ${q}` : 'Search',
      html: `
      <section class="mt-page-head mt-topo">
        <div class="mt-wrap">
          ${crumbs([['Home', url.home], ['Search']])}
          <form class="mt-search-page-form" action="${BASE}/search/" method="get" role="search">
            ${icon('search')}<input name="q" type="search" value="${esc(q)}" placeholder="Search parts or part numbers" aria-label="Search parts"><button class="mt-btn mt-btn-primary" type="submit">Search</button>
          </form>
          <h1 class="mt-search-title">${q ? (results.length ? `${results.length} part${results.length === 1 ? '' : 's'} for <span>&ldquo;${esc(q)}&rdquo;</span>` : `Nothing for <span>&ldquo;${esc(q)}&rdquo;</span> yet`) : 'Search the catalog'}</h1>
          ${groups.length > 1 ? `<nav class="mt-chips mt-jump" aria-label="Jump to a part type">${groups.map(([c, l]) => `<a class="mt-chip" href="#g-${c.id}">${esc(c.name)} <b>${l.length}</b></a>`).join('')}</nav>` : ''}
        </div>
      </section>
      <div class="mt-wrap mt-search-results">
        ${groups.length ? groups.map(([c, l]) => `<section class="mt-group" id="g-${c.id}" aria-labelledby="gh-${c.id}">
          <div class="mt-group-head"><span class="mt-group-art">${catArt(c)}</span><h2 id="gh-${c.id}">${esc(c.name)} <small>${l.length}</small></h2><a class="mt-link" href="${url.cat(c.id)}">All ${esc(c.name.toLowerCase())}${icon('chev')}</a></div>
          <div class="mt-grid mt-grid-4">${l.map((p) => card(p).replace(`<a href="${url.product(p)}">${esc(title(p))}</a>`, `<a href="${url.product(p)}">${highlight(title(p), q)}</a>`)).join('')}</div>
        </section>`).join('') : `
        <div class="mt-empty">${icon('compass')}<h2>${q ? 'No parts match that search' : 'What are you looking for?'}</h2><p>${q ? 'Try a part type, like &ldquo;header&rdquo; or &ldquo;intake&rdquo;, or a part number.' : 'Search by part type or part number.'}</p><div class="mt-chips">${POPULAR.map((t) => `<a class="mt-chip" href="${url.search(t)}">${esc(t)}</a>`).join('')}</div></div>
        <div class="mt-section-head"><div><h2>Trail-tested favorites</h2></div></div>${grid(P.filter((p) => p.best).slice(0, 4))}`}
      </div>`,
    };
  };

  const COMPLEMENTS = {
    header: ['header-install-kit', 'o2-spacer-90-pair', 'flange-3-bolt-3in'],
    downpipe: ['flange-3-bolt-3in', 'o2-spacer-90-pair', 'header-install-kit'],
    'test-pipe': ['resonator-3in', 'slant-tip-3-4', 'o2-spacer-90-pair'],
    'cold-air-intake': ['slant-tip-3-4', 'resonator-3in', 'header-install-kit'],
    'cnc-part': ['header-install-kit', 'o2-spacer-90-pair', 'flange-3-bolt-3in'],
    'more-products': ['slant-tip-3-4', 'header-install-kit', 'resonator-3in'],
  };
  const isOffroad = (p) => p.category === 'downpipe' || p.category === 'test-pipe';

  function describe(p) {
    const c = catById(p.category);
    const where = p.universal ? 'all kinds of builds' : p.fits.map((f) => `the ${f.from}–${f.to} ${f.make} ${f.model}`).join(' and the ');
    const lines = {
      header: `Trade the choked factory manifold for primaries that breathe. Made for ${where} with the ${p.engine}, and coated black so it shrugs off heat.`,
      downpipe: `A full 3" path off the turbo for ${where} with the ${p.engine}. Plan on a tune to go with it.`,
      'test-pipe': `Straight-through pipe that replaces the factory section on ${where}. For off-road and competition use.`,
      'cold-air-intake': `Cooler air from outside the engine bay through a washable filter. Made for ${where} with the ${p.engine}.`,
      'cnc-part': `Machined flat and true from solid stock. Fits ${where}.`,
      'more-products': `A simple, solid part that finishes the job. Works on ${where}.`,
    };
    return `<p>${esc(lines[p.category] || c.blurb)}</p><p>${esc(c.blurb)} Every part is checked before it ships and comes with a ${p.warranty} warranty against defects like cracked welds and warped flanges.</p>`;
  }

  PAGES.product = () => {
    const p = byId(params.get('p'));
    if (!p) {
      return { title: 'Part not found', html: `<div class="mt-wrap"><div class="mt-empty">${icon('compass')}<h1>This trail doesn't go anywhere</h1><p>That part may have moved. Search or browse below.</p><a class="mt-btn mt-btn-primary" href="${url.all}">Shop all parts</a></div></div>` };
    }
    const c = catById(p.category);
    const out = p.stock <= 0;
    const d = diffOf(p);
    const reviews = CAT.reviewsFor(p);
    const reviewCard = (r) => `<article class="mt-review"><div class="mt-review-top">${stars(r.rating)}<b>${esc(r.title)}</b></div><p>${esc(r.body)}</p><p class="mt-review-by">${esc(r.name)}${r.vehicle ? ` &middot; ${esc(r.vehicle)}` : ''} &middot; ${niceDate(r.date)}${r.verified ? ` <span class="mt-verified">${icon('check')}Verified buyer</span>` : ''}</p></article>`;
    const related = P.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    const pairs = (COMPLEMENTS[p.category] || []).filter((id) => id !== p.id).map(byId).concat(P.filter((x) => x.best && x.id !== p.id && x.category !== p.category).slice(0, 3));
    const split = CAT.ratingSplit(p);
    const views = [['main', 'Front'], ['flip', 'Side'], ['detail', 'Close-up'], ['box', 'In the box']];
    const quick = Object.entries(p.specs).filter(([k]) => !['Engine', 'Warranty'].includes(k)).slice(0, 4);
    return {
      title: title(p),
      html: `
      <div class="mt-wrap">
        ${crumbs([['Home', url.home], [c.name, url.cat(c.id)], [title(p)]])}
        <div class="mt-pdp">
          <div class="mt-gallery">
            <div class="mt-thumbs" role="tablist" aria-label="Product pictures">${views.map(([vw, label], i) => `<button type="button" class="mt-thumb${i === 0 ? ' is-on' : ''}" data-view="${vw}" role="tab" aria-selected="${i === 0}" aria-label="${label}">${art(p, vw)}</button>`).join('')}</div>
            <div class="mt-gallery-main mt-topo" id="gMain">${art(p)}</div>
          </div>
          <div class="mt-buy">
            <p class="mt-buy-cat"><a href="${url.cat(c.id)}">${esc(c.name)}</a> &middot; SKU ${esc(p.sku)}</p>
            <h1 class="mt-buy-title">${esc(title(p))}</h1>
            <div class="mt-buy-row1"><a class="mt-buy-rating" href="#reviews">${stars(p.rating)}<span>${p.rating} &middot; ${p.reviewCount} reviews</span></a>${wishButton(p)}</div>
            <div class="mt-buy-price">${priceTag(price(p), 'mt-price-lg')}<span>${price(p) >= FREE_SHIP ? `${icon('truck')}Ships free` : `${icon('truck')}Free shipping over $${FREE_SHIP}`}</span></div>
            <div class="mt-fitline">${icon('pin')}<p>${p.universal ? '<b>Universal part.</b> Check the sizes in Specs before ordering.' : `<b>Fits ${esc(fitText(p))}</b><span>${esc(p.engine)}</span>`} <a href="${url.page('contact')}">Not sure? Ask us</a></p></div>
            <div class="mt-diff-panel mt-diff-panel-${d}">${diffMark(d, false)}<p><b>${DIFF[d].label}</b><span>${DIFF[d].time}. ${DIFF[d].note}</span></p></div>
            <dl class="mt-quick">${quick.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
            <p class="mt-stock ${out ? 'is-out' : ''}">${out ? 'Sold out right now' : p.stock < 10 ? `Only ${p.stock} left` : 'In stock and ready to ship'}</p>
            ${out ? `<div class="mt-notify"><b>Get a heads-up when it's back</b><p>We'll email you once. This doesn't hold a part for you.</p><form class="mt-inline" id="notifyForm" novalidate><input type="email" placeholder="you@email.com" aria-label="Email for a restock alert"><button class="mt-btn mt-btn-dark" type="submit">Notify me</button></form><p class="mt-form-msg" id="notifyMsg" role="status"></p></div>` : `
            <div class="mt-buy-actions">
              <label class="mt-qty"><span>Qty</span><select id="pdpQty" aria-label="Quantity">${Array.from({ length: 10 }, (_, i) => `<option>${i + 1}</option>`).join('')}</select></label>
              <button class="mt-btn mt-btn-primary mt-btn-lg mt-grow" type="button" id="pdpAdd">${icon('cart')}Add to cart</button>
            </div>
            <button class="mt-btn mt-btn-dark mt-btn-block" type="button" id="pdpBuy">Buy it now</button>`}
            <ul class="mt-buy-trust">
              <li>${icon('truck')}Tracking emailed as soon as it ships</li>
              <li>${icon('shield')}<span><b>${esc(p.warranty)}</b> warranty, replacement first</span></li>
              <li>${icon('returns')}${RETURN_DAYS}-day returns on unused parts, free return label</li>
            </ul>
            ${isOffroad(p) ? `<p class="mt-legal">${icon('wrench')}For off-road and competition use only. Not legal for street use in California or states with similar emissions laws. <a href="${url.page('vcw')}">Read the waiver</a></p>` : ''}
          </div>
        </div>

        <section class="mt-notes" aria-labelledby="notesTitle">
          <h2 id="notesTitle">Trail notes</h2>
          <details class="mt-note" open><summary>Overview${icon('plus')}</summary><div>${describe(p)}<h3>In the box</h3><ul class="mt-ticks">${p.inBox.map((x) => `<li>${icon('check')}${esc(x)}</li>`).join('')}</ul></div></details>
          <details class="mt-note"><summary>Specs${icon('plus')}</summary><div><table class="mt-table"><tbody>${Object.entries({ SKU: p.sku, Type: c.single, ...p.specs }).map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table></div></details>
          <details class="mt-note"><summary>Install${icon('plus')}</summary><div><p>${diffMark(d)} <b>${DIFF[d].time}.</b> ${DIFF[d].note}</p><p>Times are estimates for a home garage. If you're not sure, a local shop can install it, and you can always <a href="${url.page('contact')}">ask us</a> first.</p></div></details>
          <details class="mt-note"><summary>Shipping &amp; returns${icon('plus')}</summary><div>
            <p><b>Shipping:</b> free to the lower 48 states on orders of $${FREE_SHIP} or more, otherwise $${SHIP_FLAT}. Alaska and Hawaii $${SHIP_ZONES.akhi[1]}, Canada $${SHIP_ZONES.ca[1]}, other countries $${SHIP_ZONES.intl[1]}.</p>
            <p><b>Returns:</b> unused, uninstalled parts within ${RETURN_DAYS} days of delivery, free return label. Refunds to your card have a 5% restocking fee; take store credit and there's no fee. <a href="${url.page('refund')}">Return policy</a>.</p>
            <p><b>Warranty:</b> ${esc(p.warranty)} against defects. We replace first. <a href="${url.page('warranty')}">Warranty details</a>.</p></div></details>
        </section>

        <section class="mt-pairs" aria-labelledby="pairsTitle">
          <div class="mt-section-head"><div><p class="mt-label">Finish the job</p><h2 id="pairsTitle">Pairs well with</h2></div></div>
          <div class="mt-pair-row">${pairs.slice(0, 5).map((x) => `<article class="mt-pair"><a href="${url.product(x)}" class="mt-pair-art">${art(x)}</a><a class="mt-pair-title" href="${url.product(x)}">${esc(title(x))}</a><div class="mt-pair-foot">${priceTag(price(x))}${x.stock > 0 ? `<button class="mt-add mt-add-sm" type="button" data-add="${x.id}" aria-label="Add ${esc(title(x))} to cart">${icon('plus')}</button>` : ''}</div></article>`).join('')}</div>
        </section>

        <section class="mt-reviews" id="reviews" aria-labelledby="revsTitle">
          <div class="mt-section-head"><div><p class="mt-label">From people who installed it</p><h2 id="revsTitle">Reviews</h2></div><button class="mt-btn mt-btn-ghost mt-btn-sm" type="button" id="writeReview">Write a review</button></div>
          <p class="mt-form-msg" id="reviewMsg" role="status"></p>
          <div class="mt-reviews-grid">
            <div class="mt-score"><p class="mt-big">${p.rating}</p>${stars(p.rating)}<p>${p.reviewCount} reviews</p>
              <ul class="mt-dist">${[5, 4, 3, 2, 1].map((s, i) => `<li><span>${s}</span><span class="mt-dist-bar"><i style="width:${split[i]}%"></i></span><span>${split[i]}%</span></li>`).join('')}</ul></div>
            <div class="mt-review-main"><div class="mt-review-tools"><p class="mt-review-count" id="revCount"></p><label class="mt-select"><span>Sort</span><select id="revSort"><option value="new">Most recent</option><option value="high">Highest rated</option><option value="low">Lowest rated</option></select></label></div><div class="mt-review-list" id="revList"></div><div class="mt-review-more"><button class="mt-btn mt-btn-ghost" type="button" id="revMore"></button><button class="mt-btn mt-btn-ghost" type="button" id="revAll"></button></div></div>
          </div>
        </section>

        ${related.length ? `<section class="mt-section mt-related"><div class="mt-section-head"><div><h2>More ${esc(c.name.toLowerCase())}</h2></div><a class="mt-link" href="${url.cat(c.id)}">See all${icon('chev')}</a></div>${grid(related)}</section>` : ''}
      </div>
      ${out ? '' : `<div class="mt-sticky-buy" id="stickyBuy" aria-hidden="true"><div><b>${esc(title(p))}</b>${priceTag(price(p))}</div><button class="mt-btn mt-btn-primary" type="button" data-add="${p.id}" tabindex="-1">${icon('cart')}Add to cart</button></div>`}`,
      after() {
        const main = document.getElementById('gMain');
        $$('.mt-thumb').forEach((t) => t.addEventListener('click', () => {
          main.innerHTML = art(p, t.dataset.view);
          $$('.mt-thumb').forEach((x) => { x.classList.toggle('is-on', x === t); x.setAttribute('aria-selected', String(x === t)); });
        }));
        const add = document.getElementById('pdpAdd');
        if (add) {
          const qty = () => Number(document.getElementById('pdpQty').value) || 1;
          add.addEventListener('click', () => addToCart(p.id, qty()));
          document.getElementById('pdpBuy').addEventListener('click', () => { cart.add(p.id, qty()); window.location.href = url.page('checkout'); });
        }
        const notify = document.getElementById('notifyForm');
        if (notify) notify.addEventListener('submit', (e) => {
          e.preventDefault();
          const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('input', notify).value.trim());
          const msg = document.getElementById('notifyMsg');
          msg.textContent = ok ? 'Got it. We’ll email you once when it’s back. (Preview: nothing was sent.)' : 'Enter a valid email address.';
          msg.className = `mt-form-msg ${ok ? 'is-ok' : 'is-bad'}`;
        });
        // Every review can be read: a page at a time, or all at once.
        CAT.pageReviews({ reviews: reviews, card: reviewCard, list: document.getElementById('revList'), count: document.getElementById('revCount'), more: document.getElementById('revMore'), all: document.getElementById('revAll'), sort: document.getElementById('revSort') });
        document.getElementById('writeReview').addEventListener('click', () => {
          const msg = document.getElementById('reviewMsg');
          msg.textContent = 'We email you a review link 7 days after delivery. We read every review before it goes up, good or bad. (Preview)';
          msg.className = 'mt-form-msg is-ok';
        });
        const sticky = document.getElementById('stickyBuy');
        if (sticky && add && 'IntersectionObserver' in window) {
          new IntersectionObserver(([entry]) => {
            const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
            sticky.classList.toggle('is-on', show);
            sticky.setAttribute('aria-hidden', String(!show));
            $('button', sticky).tabIndex = show ? 0 : -1;
          }).observe(add);
        }
      },
    };
  };

  function totals(lines, zone = 'us', discount = 0, credit = 0) {
    const sub = lines.reduce((a, l) => a + price(byId(l.id)) * l.qty, 0);
    const off = Math.round(sub * discount * 100) / 100;
    const ship = lines.length ? shipFor(zone, sub - off) : 0;
    const before = sub - off + ship;
    const used = Math.min(credit, before);
    return { sub, off, ship, tax: 0, credit: used, total: Math.round((before - used) * 100) / 100 };
  }
  // When CFOODS can't confirm stock, browsing stays up and checkout pauses. Preview it with ?checkout=paused.
  const checkoutPaused = () => params.get('checkout') === 'paused';
  const pausedNote = () => `<div class="mt-paused" role="status">${icon('clock')}<div><b>Checkout is paused for a few minutes.</b><span>Your cart is saved and you can keep browsing. Try again shortly.</span></div></div>`;

  PAGES.cart = () => {
    const draw = () => {
      const lines = cart.read();
      const holder = document.getElementById('cartHolder');
      if (!lines.length) {
        const saved = wish.read().map(byId);
        holder.innerHTML = `<div class="mt-empty">${icon('cart')}<h2>Your cart is empty</h2><p>Pick a trail to get started.</p><div class="mt-empty-actions"><a class="mt-btn mt-btn-primary" href="${url.all}">Shop all parts</a><a class="mt-btn mt-btn-ghost" href="${url.all}?price=u50">Trailhead: under $50</a></div></div>
          <div class="mt-section-head"><div><h2>${saved.length ? 'Saved for later' : 'Trail-tested favorites'}</h2></div></div>${grid(saved.length ? saved : P.filter((p) => p.best).slice(0, 4))}`;
        return;
      }
      const t = totals(lines);
      holder.innerHTML = `<div class="mt-cart">
        <div class="mt-cart-main">
          ${shipProgress(t.sub)}
          <ul class="mt-lines">${lines.map((l) => { const p = byId(l.id); return `<li class="mt-line">
            <a class="mt-line-art" href="${url.product(p)}" tabindex="-1" aria-hidden="true">${art(p)}</a>
            <div class="mt-line-info">
              <a class="mt-line-title" href="${url.product(p)}">${esc(title(p))}</a>
              <p class="mt-line-meta">${diffMark(diffOf(p))}<span>SKU ${esc(p.sku)} &middot; ${money(price(p))} each</span></p>
              <div class="mt-line-actions">
                <label class="mt-qty mt-qty-sm"><span>Qty</span><select data-line-qty="${p.id}" aria-label="Quantity for ${esc(title(p))}">${Array.from({ length: 20 }, (_, i) => `<option${i + 1 === l.qty ? ' selected' : ''}>${i + 1}</option>`).join('')}</select></label>
                <button class="mt-link-btn" type="button" data-later="${p.id}">${icon('heart')}Save for later</button>
                <button class="mt-link-btn" type="button" data-remove="${p.id}">${icon('trash')}Remove</button>
              </div>
            </div>
            <strong class="mt-line-total">${money(price(p) * l.qty)}</strong>
          </li>`; }).join('')}</ul>
        </div>
        <aside class="mt-summary" aria-label="Order summary">
          <h2>Summary</h2>
          <dl>
            <div><dt>Subtotal (${cart.count()} item${cart.count() === 1 ? '' : 's'})</dt><dd>${money(t.sub)}</dd></div>
            <div><dt>Shipping (lower 48)</dt><dd>${t.ship ? money(t.ship) : '<b class="mt-free">Free</b>'}</dd></div>
            <div><dt>Sales tax</dt><dd>${money(0)}</dd></div>
            <div class="mt-total"><dt>Total</dt><dd>${money(t.total)}</dd></div>
          </dl>
          <p class="mt-small">Alaska, Hawaii, Canada and other countries are priced at checkout.</p>
          ${checkoutPaused() ? `${pausedNote()}<button class="mt-btn mt-btn-primary mt-btn-lg mt-btn-block" type="button" disabled>${icon('lock')}Checkout paused</button>` : `<a class="mt-btn mt-btn-primary mt-btn-lg mt-btn-block" href="${url.page('checkout')}">${icon('lock')}Checkout</a>`}
          <p class="mt-pay-ways" aria-label="Ways to pay"><span>Card</span><span>Apple Pay</span><span>Google Pay</span><span>Link</span></p>
          <a class="mt-link" href="${url.all}">${icon('back')}Keep shopping</a>
        </aside>
      </div>
      <section class="mt-section mt-related"><div class="mt-section-head"><div><p class="mt-label">Don't forget</p><h2>Small parts, big difference</h2></div></div>${grid(['header-install-kit', 'o2-spacer-90-pair', 'flange-3-bolt-3in', 'slant-tip-3-4'].map(byId).filter((p) => !lines.some((l) => l.id === p.id)))}</section>`;
    };
    return {
      title: 'Cart',
      html: `<div class="mt-wrap mt-cart-page">${crumbs([['Home', url.home], ['Cart']])}<h1 class="mt-page-title">Your cart</h1><div id="cartHolder"></div></div>`,
      after() {
        draw();
        const holder = document.getElementById('cartHolder');
        holder.addEventListener('click', (e) => {
          const rm = e.target.closest('[data-remove]');
          const later = e.target.closest('[data-later]');
          if (rm) { cart.remove(rm.dataset.remove); draw(); toast('Removed from cart'); }
          if (later) { wish.set(later.dataset.later, true); cart.remove(later.dataset.later); draw(); toast('Saved for later in your wishlist'); }
        });
        holder.addEventListener('change', (e) => {
          const sel = e.target.closest('[data-line-qty]');
          if (sel) { cart.setQty(sel.dataset.lineQty, Number(sel.value) || 1); draw(); }
        });
        onCartChange = draw;
      },
    };
  };

  const STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
  const COUNTRIES = [['US', 'United States'], ['CA', 'Canada'], ['AU', 'Australia'], ['DE', 'Germany'], ['JP', 'Japan'], ['MX', 'Mexico'], ['NZ', 'New Zealand'], ['SE', 'Sweden'], ['GB', 'United Kingdom']];
  const zoneOf = (country, st) => (country === 'US' ? (st === 'AK' || st === 'HI' ? 'akhi' : 'us') : country === 'CA' ? 'ca' : 'intl');
  const zoneLabel = (zone) => (SHIP_ZONES[zone] || SHIP_ZONES.us)[0];
  const signedInUser = () => store.session('mt_preview_user');
  const CREDIT_BALANCE = 15; // sample store credit for the signed-in preview account (see the account ledger)

  // Mountain's checkout is three steps you finish in order.
  PAGES.checkout = () => {
    const lines = cart.read();
    if (!lines.length) {
      return { title: 'Checkout', html: `<div class="mt-wrap"><div class="mt-empty">${icon('cart')}<h1>Your cart is empty</h1><p>Add a part before checking out.</p><a class="mt-btn mt-btn-primary" href="${url.all}">Shop all parts</a></div></div>` };
    }
    if (checkoutPaused()) {
      return { title: 'Checkout', html: `<div class="mt-wrap mt-paused-page">${pausedNote()}<p>Nothing was charged. <a href="${url.page('cart')}">Back to your cart</a> or <a href="${url.all}">keep shopping</a>.</p></div>` };
    }
    const user = signedInUser();
    const offroad = lines.map((l) => byId(l.id)).filter(isOffroad);
    const state = { zone: 'us', country: 'US', discount: 0, code: '', useCredit: false };
    const field = (id, label, type = 'text', extra = '') => `<label class="mt-field" for="${id}"><span>${label}</span><input id="${id}" name="${id}" type="${type}" ${extra}><em class="mt-field-err" id="${id}Err"></em></label>`;
    const drawSummary = () => {
      const t = totals(lines, state.zone, state.discount, state.useCredit ? CREDIT_BALANCE : 0);
      document.getElementById('coSummaryBody').innerHTML = `
        <ul class="mt-co-lines">${lines.map((l) => { const p = byId(l.id); return `<li><span class="mt-co-art">${art(p)}<i>${l.qty}</i></span><span>${esc(title(p))}</span><b>${money(price(p) * l.qty)}</b></li>`; }).join('')}</ul>
        <form class="mt-code" id="codeForm" novalidate><label class="mt-visually-hidden" for="code">Discount code</label><input id="code" placeholder="Discount code" value="${esc(state.code)}" autocomplete="off"><button class="mt-btn mt-btn-ghost mt-btn-sm" type="submit">Apply</button></form>
        <p class="mt-form-msg" id="codeMsg" role="status">${state.discount ? `Code ${esc(state.code)} applied: ${state.discount * 100}% off` : ''}</p>
        <dl>
          <div><dt>Subtotal</dt><dd>${money(t.sub)}</dd></div>
          ${t.off ? `<div class="mt-discount"><dt>Discount</dt><dd>&minus;${money(t.off)}</dd></div>` : ''}
          <div><dt>Shipping (${esc(zoneLabel(state.zone))})</dt><dd>${t.ship ? money(t.ship) : '<b class="mt-free">Free</b>'}</dd></div>
          <div><dt>Sales tax</dt><dd>${money(0)}</dd></div>
          ${t.credit ? `<div class="mt-discount"><dt>Store credit</dt><dd>&minus;${money(t.credit)}</dd></div>` : ''}
          <div class="mt-total"><dt>Total</dt><dd>${money(t.total)}</dd></div>
        </dl>`;
      document.getElementById('coToggleTotal').textContent = money(t.total);
      document.getElementById('coPlace').innerHTML = `${icon('lock')}Place order &middot; ${money(t.total)}`;
      document.getElementById('shipBox').innerHTML = `<div class="mt-ship-row"><span><b>Standard shipping with tracking</b><small>${esc(zoneLabel(state.zone))}${state.zone === 'us' && t.sub - t.off < FREE_SHIP ? ` &middot; free on orders of $${FREE_SHIP}+` : ''}</small></span><em>${t.ship ? money(t.ship) : '<b class="mt-free">Free</b>'}</em></div>
        ${state.zone === 'ca' || state.zone === 'intl' ? `<p class="mt-co-note">${icon('box')}Import duties, taxes and brokerage fees may be charged by your country on delivery. They are paid by you and are not included here.</p>` : ''}`;
      document.getElementById('codeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const val = document.getElementById('code').value.trim().toUpperCase();
        if (val === 'CLIMB10') { state.discount = 0.1; state.code = val; drawSummary(); return; }
        const msg = document.getElementById('codeMsg');
        msg.textContent = val ? 'That code isn’t valid.' : 'Enter a code.';
        msg.className = 'mt-form-msg is-bad';
      });
    };
    const stepHead = (n, name) => `<div class="mt-step-head"><span class="mt-step-num" aria-hidden="true"><b>${n}</b>${icon('check')}</span><div><h2>${name}</h2><p class="mt-step-sum" id="sum${n}"></p></div><button class="mt-link-btn mt-step-edit" type="button" data-edit="${n}" hidden>Edit</button></div>`;
    return {
      title: 'Checkout',
      chrome: 'checkout',
      html: `
      <div class="mt-wrap mt-checkout">
        <div class="mt-co-main">
          <button class="mt-co-toggle" type="button" id="coToggle" aria-expanded="false" aria-controls="coSummary">${icon('cart')}<span>Show order summary</span>${icon('down')}<b id="coToggleTotal"></b></button>
          <p class="mt-co-guest">${icon('user')}<span>${user ? `Signed in as <b>${esc(user.email)}</b>.` : `Checking out as a guest. <a href="${url.page('login')}">Sign in</a> to use store credit and keep this order in your account.`}</span></p>
          <form id="coForm" novalidate>
            <section class="mt-step is-open" data-step="1" aria-label="Step 1, contact">
              ${stepHead(1, 'Contact')}
              <div class="mt-step-body">
                ${field('email', 'Email', 'email', `autocomplete="email" required value="${user ? esc(user.email) : ''}"`)}
                <label class="mt-check-line"><input type="checkbox" id="optin"> Email me deals and new parts (optional)</label>
                <button class="mt-btn mt-btn-primary" type="button" data-next="1">Continue to shipping${icon('chev')}</button>
              </div>
            </section>
            <section class="mt-step" data-step="2" aria-label="Step 2, shipping">
              ${stepHead(2, 'Shipping')}
              <div class="mt-step-body">
                <label class="mt-field" for="country"><span>Country</span><select id="country" autocomplete="country">${COUNTRIES.map(([c, n]) => `<option value="${c}">${n}</option>`).join('')}</select></label>
                <div class="mt-field-row">${field('first', 'First name', 'text', 'autocomplete="given-name" required')}${field('last', 'Last name', 'text', 'autocomplete="family-name" required')}</div>
                ${field('address', 'Street address', 'text', 'autocomplete="address-line1" required')}
                ${field('address2', 'Apartment, suite (optional)', 'text', 'autocomplete="address-line2"')}
                <div class="mt-field-row mt-field-row-3">${field('city', 'City', 'text', 'autocomplete="address-level2" required')}
                  <label class="mt-field" for="state" id="stateWrap"><span>State</span><select id="state" required autocomplete="address-level1"><option value="">State</option>${STATES.map((s) => `<option>${s}</option>`).join('')}</select><em class="mt-field-err" id="stateErr"></em></label>
                  <label class="mt-field" for="region" id="regionWrap" hidden><span>Province / region</span><input id="region" autocomplete="address-level1"><em class="mt-field-err" id="regionErr"></em></label>
                  <label class="mt-field" for="zip"><span id="zipLabel">ZIP code</span><input id="zip" name="zip" autocomplete="postal-code" required><em class="mt-field-err" id="zipErr"></em></label></div>
                ${field('phone', 'Phone (for delivery questions)', 'tel', 'autocomplete="tel"')}
                <div id="shipBox"></div>
                <button class="mt-btn mt-btn-primary" type="button" data-next="2">Continue to payment${icon('chev')}</button>
              </div>
            </section>
            <section class="mt-step" data-step="3" aria-label="Step 3, payment">
              ${stepHead(3, 'Payment')}
              <div class="mt-step-body">
                ${offroad.length ? `<div class="mt-ack"><b>Before you order</b><p>These parts are for off-road and competition use only: ${offroad.map((p) => esc(title(p))).join(', ')}.</p>
                  <label class="mt-check-line"><input type="checkbox" id="ack"> <span>I've read the <a href="${url.page('vcw')}" target="_blank" rel="noopener">vehicle compliance waiver</a> and will only use these parts off-road, where it's legal.</span></label><em class="mt-field-err" id="ackErr"></em></div>` : ''}
                <p class="mt-pay-ways" aria-label="Ways to pay"><span>Card</span><span>Apple Pay</span><span>Google Pay</span><span>Link</span></p>
                <div class="mt-pay-box">${icon('lock')}<div><b>Secure payment form goes here</b><p>On the live store, payment details are entered in Stripe's secure form for Mountain Racing Co's own merchant account, never typed into these pages.</p></div></div>
                ${user ? `<label class="mt-check-line"><input type="checkbox" id="useCredit"> <span>Use store credit (<b>${money(CREDIT_BALANCE)}</b> available). You'll confirm with your passkey or authenticator app.</span></label>` : `<p class="mt-co-note">${icon('coin')}Have store credit? <a href="${url.page('login')}">Sign in</a> to use it.</p>`}
                <p class="mt-preview-flag">Design preview: placing this order does not charge anything. It just shows the confirmation page.</p>
                <button class="mt-btn mt-btn-primary mt-btn-lg mt-btn-block" type="submit" id="coPlace">Place order</button>
                <p class="mt-co-legal">By placing your order you agree to the <a href="${url.page('terms')}">terms</a>, <a href="${url.page('refund')}">return policy</a> and <a href="${url.page('privacy')}">privacy policy</a>.</p>
              </div>
            </section>
          </form>
        </div>
        <aside class="mt-co-summary" id="coSummary" aria-label="Order summary"><h2>Order summary</h2><div id="coSummaryBody"></div></aside>
      </div>`,
      after() {
        const $id = (id) => document.getElementById(id);
        const syncCountry = () => {
          state.country = $id('country').value;
          const us = state.country === 'US';
          $id('stateWrap').hidden = !us;
          $id('regionWrap').hidden = us;
          $id('zipLabel').textContent = us ? 'ZIP code' : 'Postal code';
          state.zone = zoneOf(state.country, $id('state').value);
          drawSummary();
        };
        $id('country').addEventListener('change', syncCountry);
        $id('state').addEventListener('change', syncCountry);
        const credit = $id('useCredit');
        if (credit) credit.addEventListener('change', () => { state.useCredit = credit.checked; drawSummary(); });
        syncCountry();
        const toggle = $id('coToggle');
        toggle.addEventListener('click', () => {
          const open = $id('coSummary').classList.toggle('is-open');
          toggle.setAttribute('aria-expanded', String(open));
          $('span', toggle).textContent = open ? 'Hide order summary' : 'Show order summary';
        });
        const rules = () => {
          const us = state.country === 'US';
          return {
            1: { email: (x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) || 'Enter a valid email.' },
            2: {
              first: (x) => Boolean(x) || 'Enter a first name.',
              last: (x) => Boolean(x) || 'Enter a last name.',
              address: (x) => x.length > 3 || 'Enter a street address.',
              city: (x) => Boolean(x) || 'Enter a city.',
              ...(us ? { state: (x) => Boolean(x) || 'Pick a state.' } : {}),
              ...(state.country === 'CA' ? { region: (x) => Boolean(x) || 'Enter a province.' } : {}),
              zip: (x) => (us ? /^\d{5}(-\d{4})?$/.test(x) || 'Enter a 5-digit ZIP.' : state.country === 'CA' ? /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(x) || 'Enter a postal code like K1A 0B1.' : x.length >= 3 || 'Enter a postal code.'),
            },
          };
        };
        const check = (n) => {
          let first = null;
          Object.entries(rules()[n] || {}).forEach(([id, test]) => {
            const el = $id(id);
            const res = test(el.value.trim());
            $id(`${id}Err`).textContent = res === true ? '' : res;
            if (res !== true) { el.setAttribute('aria-invalid', 'true'); if (!first) first = el; } else el.removeAttribute('aria-invalid');
          });
          return first;
        };
        const val = (id) => $id(id).value.trim();
        const summarize = (n) => {
          if (n === 1) $id('sum1').textContent = val('email');
          if (n === 2) {
            const t = totals(lines, state.zone, state.discount);
            $id('sum2').textContent = `${val('first')} ${val('last')}, ${val('address')}, ${val('city')} · ${t.ship ? money(t.ship) : 'free'} shipping`;
          }
        };
        const openStep = (n) => {
          $$('.mt-step').forEach((s) => {
            const k = Number(s.dataset.step);
            s.classList.toggle('is-open', k === n);
            s.classList.toggle('is-done', k < n);
            $('[data-edit]', s).hidden = k >= n;
            $('.mt-step-sum', s).hidden = k >= n;
          });
          const target = $(`.mt-step[data-step="${n}"]`);
          const input = $('input, select', $('.mt-step-body', target));
          if (input) setTimeout(() => input.focus({ preventScroll: true }), 30);
          target.scrollIntoView({ block: 'start', behavior: 'smooth' });
        };
        const form = $id('coForm');
        form.addEventListener('input', (e) => { const err = $id(`${e.target.id}Err`); if (err) err.textContent = ''; e.target.removeAttribute('aria-invalid'); });
        form.addEventListener('change', (e) => { if (e.target.id === 'ack') $id('ackErr').textContent = ''; });
        form.addEventListener('click', (e) => {
          const next = e.target.closest('[data-next]');
          const edit = e.target.closest('[data-edit]');
          if (next) {
            const n = Number(next.dataset.next);
            const bad = check(n);
            if (bad) { bad.focus(); return; }
            summarize(n);
            openStep(n + 1);
          }
          if (edit) openStep(Number(edit.dataset.edit));
        });
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          for (const n of [1, 2]) {
            const bad = check(n);
            if (bad) { openStep(n); setTimeout(() => bad.focus(), 60); return; }
          }
          const ack = $id('ack');
          if (ack && !ack.checked) { $id('ackErr').textContent = 'Please confirm you’ve read the waiver for off-road parts.'; ack.focus(); return; }
          const us = state.country === 'US';
          const t = totals(lines, state.zone, state.discount, state.useCredit ? CREDIT_BALANCE : 0);
          const countryName = (COUNTRIES.find(([c]) => c === state.country) || [])[1] || '';
          store.session('mt_preview_order', {
            n: `MTN-${String(Date.now()).slice(-6)}`,
            email: val('email'), name: `${val('first')} ${val('last')}`, guest: !user,
            address: [val('address'), val('address2'), us ? `${val('city')}, ${val('state')} ${val('zip')}` : `${val('city')} ${val('region')} ${val('zip')}`.replace(/\s+/g, ' ').trim(), us ? '' : countryName].filter(Boolean),
            zone: state.zone, lines, ...t,
          });
          cart.clear();
          window.location.href = url.page('confirmation');
        });
      },
    };
  };

  // Sample orders, dated relative to today: one being packed, one delivered 2 days ago (still returnable),
  // one delivered two weeks ago (return window closed, warranty open) and an older one.
  const SAMPLE_ORDERS = [
    { n: 'MTN-104611', date: daysAgo(1), status: 1, items: [['civic-06-11-intake', 1]], credit: 10, tracking: '', carrier: 'UPS Ground' },
    { n: 'MTN-104590', date: daysAgo(6), status: 5, items: [['wrx-08-14-downpipe', 1], ['o2-spacer-90-pair', 1]], tracking: '1Z RR4 590 03 1288 4410', carrier: 'UPS Ground' },
    { n: 'MTN-104233', date: daysAgo(18), status: 5, items: [['accord-94-97-header', 1], ['header-install-kit', 1]], tracking: '1Z RR4 233 03 1842 7731', carrier: 'UPS Ground' },
    { n: 'MTN-103871', date: daysAgo(64), status: 5, items: [['slant-tip-3-4', 2]], tracking: '9400 1112 0261 3871 0042 19', carrier: 'USPS Ground Advantage' },
  ];
  const STEPS = ['Order placed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered'];
  const orderTotals = (o) => totals(o.items.map(([id, qty]) => ({ id, qty })), 'us', 0, o.credit || 0);
  const deliveredOn = (o) => (o.status >= 5 ? addDays(o.date, 4) : null);
  const returnUntil = (o) => (deliveredOn(o) ? addDays(deliveredOn(o), RETURN_DAYS) : null);
  const canReturn = (o) => Boolean(returnUntil(o)) && returnUntil(o) >= daysAgo(0);
  function timeline(status, date) {
    const d = new Date(`${date}T12:00:00`);
    return `<ol class="mt-timeline">${STEPS.map((s, i) => {
      const when = new Date(d); when.setDate(d.getDate() + [0, 1, 1, 4, 4][i]);
      const state = i < status ? 'is-done' : i === status ? 'is-now' : '';
      return `<li class="${state}"><span class="mt-dot">${i < status ? icon('check') : ''}</span><b>${s}</b><small>${i < status ? when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : i === status ? 'Next' : ''}</small></li>`;
    }).join('')}</ol>`;
  }
  const signedIn = () => store.session('mt_preview_user') || { first: 'Jamie', last: 'Rivera', email: 'jamie.rivera@example.com' };
  const statusName = (s) => (s >= 5 ? 'Delivered' : STEPS[s - 1] || 'Processing');

  PAGES.confirmation = () => {
    const o = store.session('mt_preview_order') || {
      n: 'MTN-104612', email: 'jamie.rivera@example.com', name: 'Jamie Rivera', address: ['1420 Main Street', 'Apt 3', 'Denver, CO 80202'], zone: 'us', guest: true,
      lines: [{ id: 'accord-94-97-header', qty: 1 }, { id: 'header-install-kit', qty: 1 }], ...totals([{ id: 'accord-94-97-header', qty: 1 }, { id: 'header-install-kit', qty: 1 }]),
    };
    return {
      title: 'Order confirmed',
      html: `<div class="mt-wrap mt-confirm">
        <div class="mt-confirm-head">
          <span class="mt-confirm-check">${icon('check')}</span>
          <p class="mt-kicker"><span class="mt-tick"></span>Order ${esc(o.n)}</p>
          <h1>Thanks, ${esc(o.name.split(' ')[0])}. Your parts are on the list.</h1>
          <p>A receipt is on its way to <b>${esc(o.email)}</b>. We'll email tracking as soon as it ships.</p>
        </div>
        <div class="mt-confirm-grid">
          <section class="mt-card-box"><h2>What happens next</h2>${timeline(1, daysAgo(0))}</section>
          <section class="mt-card-box"><h2>Your order</h2>
            <ul class="mt-co-lines">${o.lines.map((l) => { const p = byId(l.id); return p ? `<li><span class="mt-co-art">${art(p)}<i>${l.qty}</i></span><span>${esc(title(p))}</span><b>${money(price(p) * l.qty)}</b></li>` : ''; }).join('')}</ul>
            <dl><div><dt>Subtotal</dt><dd>${money(o.sub)}</dd></div>${o.off ? `<div class="mt-discount"><dt>Discount</dt><dd>&minus;${money(o.off)}</dd></div>` : ''}<div><dt>Shipping (${esc(zoneLabel(o.zone))})</dt><dd>${o.ship ? money(o.ship) : 'Free'}</dd></div>${o.credit ? `<div class="mt-discount"><dt>Store credit</dt><dd>&minus;${money(o.credit)}</dd></div>` : ''}<div class="mt-summary-total"><dt>Total</dt><dd>${money(o.total)}</dd></div></dl>
          </section>
          <section class="mt-card-box"><h2>Shipping to</h2><p>${esc(o.name)}<br>${o.address.map(esc).join('<br>')}</p>
            ${o.guest ? `<h2>Keep track of it</h2><p>Make a Mountain Racing account with <b>${esc(o.email)}</b> to see this order, start returns and get store credit.</p><a class="mt-btn mt-btn-dark mt-btn-sm" href="${url.page('signup')}">Create account</a>` : ''}
          </section>
        </div>
        <div class="mt-confirm-actions"><a class="mt-btn mt-btn-primary" href="${url.page('track')}?order=${encodeURIComponent(o.n)}">${icon('truck')}Track this order</a><a class="mt-btn mt-btn-ghost" href="${url.all}">Keep shopping</a></div>
        <p class="mt-preview-flag">Design preview: no order was placed and nothing was charged.</p>
      </div>`,
    };
  };

  function authShell(kind) {
    const isLogin = kind === 'login';
    return `<div class="mt-wrap mt-auth">
      <div class="mt-auth-card">
        <h1>${isLogin ? 'Sign in' : 'Create your account'}</h1>
        <p class="mt-muted">${isLogin ? 'Track orders, start returns and check out faster.' : 'Takes 30 seconds. See every order in one place.'}</p>
        <form id="authForm" novalidate>
          ${isLogin ? '' : '<div class="mt-field-row"><label class="mt-field"><span>First name</span><input id="aFirst" autocomplete="given-name" required><em class="mt-field-err" id="aFirstErr"></em></label><label class="mt-field"><span>Last name</span><input id="aLast" autocomplete="family-name" required><em class="mt-field-err" id="aLastErr"></em></label></div>'}
          <label class="mt-field"><span>Email</span><input id="aEmail" type="email" autocomplete="email" required><em class="mt-field-err" id="aEmailErr"></em></label>
          <label class="mt-field"><span>Password${isLogin ? '' : ' (8+ characters)'}</span><span class="mt-pass"><input id="aPass" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required><button type="button" class="mt-link-btn" id="aShow" aria-label="Show password">${icon('eye')}</button></span><em class="mt-field-err" id="aPassErr"></em></label>
          ${isLogin ? `<p class="mt-auth-forgot"><button type="button" class="mt-link-btn" id="aForgot">Forgot password?</button></p>` : ''}
          <button class="mt-btn mt-btn-primary mt-btn-lg mt-btn-block" type="submit">${isLogin ? 'Sign in' : 'Create account'}</button>
          <p class="mt-form-msg" id="authMsg" role="status"></p>
        </form>
        <p class="mt-auth-switch">${isLogin ? `New to Mountain Racing? <a href="${url.page('signup')}">Create an account</a>` : `Already have an account? <a href="${url.page('login')}">Sign in</a>`}</p>
      </div>
      <aside class="mt-auth-side">
        <h2>Why make an account?</h2>
        <ul class="mt-checklist">
          <li>${icon('truck')}Track every order in one place</li>
          <li>${icon('pin')}Save your address for faster checkout</li>
          <li>${icon('returns')}Start returns in two clicks</li>
          <li>${icon('tag')}Get deal drops before anyone else</li>
        </ul>
        <span class="mt-auth-art">${art(byId('wrx-08-14-downpipe'))}</span>
      </aside>
    </div>`;
  }
  function bindAuth(kind) {
    const form = document.getElementById('authForm');
    const pass = document.getElementById('aPass');
    document.getElementById('aShow').addEventListener('click', (e) => { pass.type = pass.type === 'password' ? 'text' : 'password'; e.currentTarget.setAttribute('aria-label', pass.type === 'password' ? 'Show password' : 'Hide password'); });
    const forgot = document.getElementById('aForgot');
    if (forgot) forgot.addEventListener('click', () => {
      const msg = document.getElementById('authMsg');
      const email = document.getElementById('aEmail').value.trim();
      msg.className = `mt-form-msg ${email ? 'is-ok' : 'is-bad'}`;
      msg.textContent = email ? `If there's an account for ${email}, a reset link is on its way. (Preview: nothing was sent.)` : 'Enter your email first, then press Forgot password.';
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rules = [['aEmail', (x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) || 'Enter a valid email.'], ['aPass', (x) => (kind === 'login' ? x.length > 0 : x.length >= 8) || (kind === 'login' ? 'Enter your password.' : 'Use at least 8 characters.')]];
      if (kind === 'signup') rules.unshift(['aFirst', (x) => Boolean(x) || 'Enter your first name.'], ['aLast', (x) => Boolean(x) || 'Enter your last name.']);
      let bad = null;
      rules.forEach(([id, test]) => { const el = document.getElementById(id); const r = test(el.value.trim()); document.getElementById(`${id}Err`).textContent = r === true ? '' : r; if (r !== true && !bad) bad = el; });
      if (bad) { bad.focus(); return; }
      const email = document.getElementById('aEmail').value.trim();
      const first = kind === 'signup' ? document.getElementById('aFirst').value.trim() : 'Jamie';
      const last = kind === 'signup' ? document.getElementById('aLast').value.trim() : 'Rivera';
      store.session('mt_preview_user', { first, last, email });
      window.location.href = url.page('account');
    });
  }
  PAGES.login = () => ({ title: 'Sign in', html: authShell('login'), after: () => bindAuth('login') });
  PAGES.signup = () => ({ title: 'Create account', html: authShell('signup'), after: () => bindAuth('signup') });

  // Sample support threads (Messages tab).
  const THREADS = [
    { subject: 'When will my intake ship?', order: 'MTN-104611', date: daysAgo(1), status: 'Answered', messages: [
      ['you', 'Hi, I ordered the Civic intake yesterday. When will it ship?'],
      ['team', 'Thanks for your order! MTN-104611 is being packed now. You’ll get an email with tracking as soon as the label is made.'],
    ] },
    { subject: 'Will the WRX downpipe fit a 2011 STI?', order: '', date: daysAgo(9), status: 'Answered', messages: [
      ['you', 'Will the 3" downpipe for the 2008–2014 WRX fit my 2011 STI?'],
      ['team', 'Good question. This downpipe is listed for the 2008–2014 Subaru WRX with the 2.5L EJ255. The STI uses a different engine, so we can’t confirm it fits yet. We’re checking with our parts team and will reply here.'],
      ['staff', 'Checked it: the STI’s turbo outlet and length are different, so this one won’t fit. Sorry about that!'],
    ] },
  ];
  const CREDIT_LEDGER = [
    { date: daysAgo(58), what: 'Refund as store credit: 1 × Slant-Cut Exhaust Tip (MTN-103871). No restocking fee.', amount: 25 },
    { date: daysAgo(1), what: 'Used on order MTN-104611', amount: -10 },
  ];

  PAGES.account = () => {
    const u = signedIn();
    const tabs = [['orders', 'Orders', 'box'], ['messages', 'Messages', 'chat'], ['credit', 'Store credit', 'coin'], ['wishlist', 'Wishlist', 'heart'], ['addresses', 'Addresses', 'pin'], ['security', 'Security', 'lock']];
    const twoStep = () => store.session('mt_preview_2fa') === true;
    let balance = 0;
    const ledger = CREDIT_LEDGER.map((r) => { balance += r.amount; return { ...r, balance }; });
    const drawWishlist = () => {
      const list = wish.read().map(byId);
      document.getElementById('wishHolder').innerHTML = list.length ? grid(list) : `<div class="mt-empty-small">${icon('heart')}<p>Nothing saved yet. Tap <b>Save</b> on any part to keep it here.</p><a class="mt-btn mt-btn-primary" href="${url.all}">Shop parts</a></div>`;
    };
    const securityState = () => `<span class="mt-status ${twoStep() ? 's5' : 's3'}">${twoStep() ? 'On' : 'Off'}</span>`;
    const creditGuard = () => (twoStep()
      ? `<p class="mt-credit-guard is-on">${icon('shield')}Protected. You'll confirm with your authenticator app or passkey each time you use credit.</p>`
      : `<p class="mt-credit-guard">${icon('lock')}To use store credit, turn on two-step sign-in or add a passkey. <button class="mt-link-btn" type="button" data-goto="security">Set it up</button></p>`);
    return {
      title: 'My account',
      html: `<div class="mt-wrap">
        ${crumbs([['Home', url.home], ['My account']])}
        <div class="mt-account-head"><div><p class="mt-kicker"><span class="mt-tick"></span>My account</p><h1 class="mt-page-title">Hey, ${esc(u.first)}.</h1><p class="mt-muted">${esc(u.email)}</p></div><button class="mt-btn mt-btn-ghost mt-btn-sm" type="button" id="signOut">${icon('out')}Sign out</button></div>
        <div class="mt-account">
          <nav class="mt-account-nav" role="tablist" aria-label="Account sections">${tabs.map(([id, label, ic]) => `<button type="button" role="tab" class="mt-account-tab" data-acct="${id}" aria-selected="false">${icon(ic)}${label}</button>`).join('')}</nav>
          <div class="mt-account-body">
            <section data-acct-panel="orders" role="tabpanel">
              <h2>Orders</h2>
              <ul class="mt-order-list">${SAMPLE_ORDERS.map((o) => { const t = orderTotals(o); return `<li class="mt-order">
                <div class="mt-order-top"><div><b>${o.n}</b><span>${niceDate(o.date)}</span></div><span class="mt-status s${o.status}">${statusName(o.status)}</span><strong>${money(t.total)}</strong></div>
                <div class="mt-order-items">${o.items.map(([id, q]) => `<span class="mt-mini-art" title="${esc(title(byId(id)))}">${art(byId(id))}${q > 1 ? `<i>${q}</i>` : ''}</span>`).join('')}<p>${o.items.map(([id]) => esc(title(byId(id)))).join(', ')}</p></div>
                <div class="mt-order-actions"><a class="mt-btn mt-btn-dark mt-btn-sm" href="${url.page('orderview')}?n=${o.n}">View order</a><a class="mt-btn mt-btn-ghost mt-btn-sm" href="${url.page('track')}?order=${o.n}">Track</a>${canReturn(o) ? `<a class="mt-btn mt-btn-ghost mt-btn-sm" href="${url.page('request')}?type=return&n=${o.n}">Return</a>` : ''}</div>
              </li>`; }).join('')}</ul>
            </section>
            <section data-acct-panel="messages" role="tabpanel" hidden>
              <h2>Messages</h2>
              <p class="mt-muted mt-panel-intro">Your conversations with Mountain Racing support. Message us any time of day; we reply right here and by email.</p>
              <div class="mt-threads">${THREADS.map((th, i) => `<details class="mt-thread"${i === 0 ? ' open' : ''}>
                <summary><span><b>${esc(th.subject)}</b><small>${th.order ? `${th.order} &middot; ` : ''}${niceDate(th.date)}</small></span><span class="mt-status s5">${th.status}</span></summary>
                <div class="mt-bubbles">${th.messages.map(([who, text]) => `<div class="mt-bubble is-${who}"><small>${who === 'you' ? 'You' : who === 'team' ? 'Mountain Racing support' : 'Sam at Mountain Racing'}</small><p>${esc(text)}</p></div>`).join('')}</div>
                <form class="mt-reply" data-reply novalidate><label class="mt-visually-hidden" for="reply${i}">Reply</label><textarea id="reply${i}" rows="2" placeholder="Write a reply"></textarea><button class="mt-btn mt-btn-dark mt-btn-sm" type="submit">Send</button></form>
              </details>`).join('')}</div>
              <a class="mt-btn mt-btn-ghost" href="${url.page('contact')}">${icon('chat')}Start a new message</a>
            </section>
            <section data-acct-panel="credit" role="tabpanel" hidden>
              <h2>Store credit</h2>
              <div class="mt-credit-card"><div><small>Available</small><strong>${money(balance)}</strong></div><p>Mountain Racing only &middot; never expires &middot; can't be cashed out</p></div>
              <div id="creditGuard">${creditGuard()}</div>
              <div class="mt-table-wrap"><table class="mt-spec-table mt-ledger"><thead><tr><th>Date</th><th>What happened</th><th>Amount</th><th>Balance</th></tr></thead><tbody>${ledger.slice().reverse().map((r) => `<tr><td>${niceDate(r.date)}</td><td>${esc(r.what)}</td><td class="${r.amount > 0 ? 'mt-plus' : 'mt-minus'}">${r.amount > 0 ? '+' : '&minus;'}${money(Math.abs(r.amount))}</td><td>${money(r.balance)}</td></tr>`).join('')}</tbody></table></div>
              <p class="mt-muted mt-small">Store credit comes from refunds you choose to take as credit, or from our support team. Every change is listed here and emailed to you. Credit can pay for parts, shipping and tax, and works with discount codes.</p>
            </section>
            <section data-acct-panel="wishlist" role="tabpanel" hidden>
              <h2>Wishlist</h2>
              <div id="wishHolder"></div>
            </section>
            <section data-acct-panel="addresses" role="tabpanel" hidden>
              <h2>Addresses</h2>
              <div class="mt-address-card"><span class="mt-badge mt-badge-dark">Default</span><p><b>${esc(u.first)} ${esc(u.last)}</b><br>1420 Main Street, Apt 3<br>Denver, CO 80202</p><button class="mt-link-btn" type="button" data-preview-msg="Editing addresses is not part of the preview.">Edit</button></div>
              <p class="mt-muted mt-small">Saved cards are stored by Stripe, our payment processor. Mountain Racing never sees or keeps your full card number.</p>
            </section>
            <section data-acct-panel="security" role="tabpanel" hidden>
              <h2>Security</h2>
              <div class="mt-sec-list">
                <div class="mt-sec-row">
                  <div class="mt-sec-head">${icon('phone')}<div><b>Two-step sign-in</b><span>Use an authenticator app like Google Authenticator. Needed to use store credit.</span></div><span id="twoStepState">${securityState()}</span></div>
                  <div id="twoStepBody">${twoStep() ? '<p class="mt-muted">On. You’ll enter a 6-digit code when you sign in on a new device and each time you use store credit.</p>' : `<button class="mt-btn mt-btn-dark mt-btn-sm" type="button" id="twoStepStart">Set up</button>`}</div>
                </div>
                <div class="mt-sec-row">
                  <div class="mt-sec-head">${icon('key')}<div><b>Passkeys</b><span>Sign in with Face ID, Touch ID or your device PIN instead of a password.</span></div></div>
                  <ul class="mt-passkeys" id="passkeyList"></ul>
                  <button class="mt-btn mt-btn-ghost mt-btn-sm" type="button" id="addPasskey">Add a passkey</button>
                </div>
                <div class="mt-sec-row">
                  <div class="mt-sec-head">${icon('mail')}<div><b>Emails on this account</b><span>Add other emails you've ordered with, to see those guest orders here.</span></div></div>
                  <p class="mt-email-line"><b>${esc(u.email)}</b> <span class="mt-badge mt-badge-dark">Primary</span></p>
                  <form class="mt-inline-form mt-add-email" id="addEmailForm" novalidate><input type="email" id="addEmail" placeholder="another@email.com" aria-label="Another email address"><button class="mt-btn mt-btn-dark" type="submit">Send code</button></form>
                  <p class="mt-form-msg" id="addEmailMsg" role="status"></p>
                </div>
                <form class="mt-sec-row mt-settings-form" id="pwForm" novalidate>
                  <div class="mt-sec-head">${icon('lock')}<div><b>Password</b><span>At least 8 characters.</span></div></div>
                  <label class="mt-field"><span>Current password</span><input type="password" id="pw0" autocomplete="current-password"></label>
                  <label class="mt-field"><span>New password</span><input type="password" id="pw1" autocomplete="new-password"></label>
                  <button class="mt-btn mt-btn-dark" type="submit">Update password</button>
                  <p class="mt-form-msg" id="pwMsg" role="status"></p>
                </form>
                <div class="mt-sec-row">
                  <div class="mt-sec-head">${icon('mail')}<div><b>Email preferences</b><span>Order, shipping and account emails always go out.</span></div></div>
                  <label class="mt-toggle"><input type="checkbox" checked disabled><span class="mt-toggle-ui"></span>Order and shipping emails (always on)</label>
                  <label class="mt-toggle"><input type="checkbox" id="optDeals"><span class="mt-toggle-ui"></span>Deals and new parts</label>
                </div>
                <div class="mt-sec-row mt-sec-danger">
                  <div class="mt-sec-head">${icon('trash')}<div><b>Delete account</b><span>Order records and any store credit are kept as the law requires. You can get your credit back later by proving it's you.</span></div></div>
                  <button class="mt-btn mt-btn-ghost mt-btn-sm" type="button" data-preview-msg="On the live store this asks you to confirm with your password, then deletes your account.">Delete my account</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>`,
      after() {
        const pick = (id) => {
          const valid = tabs.some(([t]) => t === id) ? id : 'orders';
          $$('[data-acct]').forEach((b) => { b.classList.toggle('is-on', b.dataset.acct === valid); b.setAttribute('aria-selected', String(b.dataset.acct === valid)); });
          $$('[data-acct-panel]').forEach((s) => { s.hidden = s.dataset.acctPanel !== valid; });
        };
        const go = (id) => { pick(id); try { window.history.replaceState(null, '', `#${id}`); } catch (e) { /* ignore */ } };
        $$('[data-acct]').forEach((b) => b.addEventListener('click', () => go(b.dataset.acct)));
        document.querySelector('.mt-account-body').addEventListener('click', (e) => { const g = e.target.closest('[data-goto]'); if (g) go(g.dataset.goto); });
        pick(window.location.hash.slice(1));
        drawWishlist();
        onWishChange = drawWishlist;
        document.getElementById('signOut').addEventListener('click', () => { store.session('mt_preview_user', null); window.location.href = url.page('login'); });
        $$('[data-reply]').forEach((f) => f.addEventListener('submit', (e) => {
          e.preventDefault();
          const box = $('textarea', f);
          if (!box.value.trim()) { box.focus(); return; }
          box.value = '';
          toast('Sent to Mountain Racing support (preview)');
        }));
        // Two-step sign-in setup (sample: any 6 digits works)
        const body = document.getElementById('twoStepBody');
        const start = document.getElementById('twoStepStart');
        if (start) start.addEventListener('click', () => {
          body.innerHTML = `<div class="mt-totp"><div class="mt-qr" aria-hidden="true"></div><div><p>Scan this with your authenticator app, or type the key:</p><p class="mt-totp-key">RRPV 7K2M 4QXD 9LTA</p>
            <form class="mt-inline-form" id="totpForm" novalidate><input id="totpCode" inputmode="numeric" maxlength="6" placeholder="6-digit code" aria-label="6-digit code" autocomplete="one-time-code"><button class="mt-btn mt-btn-dark" type="submit">Turn on</button></form><p class="mt-form-msg" id="totpMsg" role="status"></p></div></div>`;
          document.getElementById('totpForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const code = document.getElementById('totpCode').value.trim();
            const msg = document.getElementById('totpMsg');
            if (!/^\d{6}$/.test(code)) { msg.textContent = 'Enter the 6-digit code from your app.'; msg.className = 'mt-form-msg is-bad'; return; }
            store.session('mt_preview_2fa', true);
            body.innerHTML = '<p class="mt-form-msg is-ok">Two-step sign-in is on. Save your recovery codes somewhere safe. (Preview)</p>';
            document.getElementById('twoStepState').innerHTML = securityState();
            document.getElementById('creditGuard').innerHTML = creditGuard();
          });
        });
        const keys = document.getElementById('passkeyList');
        const drawKeys = () => { const list = store.session('mt_preview_passkeys') || []; keys.innerHTML = list.length ? list.map((k) => `<li>${icon('key')}<span>${esc(k)}</span></li>`).join('') : '<li class="mt-muted">No passkeys yet.</li>'; };
        drawKeys();
        document.getElementById('addPasskey').addEventListener('click', () => {
          const list = store.session('mt_preview_passkeys') || [];
          store.session('mt_preview_passkeys', [...list, `This device · added ${niceDate(daysAgo(0))}`]);
          drawKeys();
          toast('Passkey added (preview: your device would ask for Face ID or your PIN)');
        });
        document.getElementById('addEmailForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const v = document.getElementById('addEmail').value.trim();
          const msg = document.getElementById('addEmailMsg');
          const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          msg.textContent = ok ? `We sent a code to ${v}. Enter it to add the email. (Preview: nothing was sent.)` : 'Enter a valid email address.';
          msg.className = `mt-form-msg ${ok ? 'is-ok' : 'is-bad'}`;
        });
        document.getElementById('pwForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const msg = document.getElementById('pwMsg');
          const ok = document.getElementById('pw0').value && document.getElementById('pw1').value.length >= 8;
          msg.textContent = ok ? 'Password updated. (Preview: nothing was saved.)' : 'Enter your current password and a new one with 8+ characters.';
          msg.className = `mt-form-msg ${ok ? 'is-ok' : 'is-bad'}`;
        });
      },
    };
  };

  PAGES.orderview = () => {
    const o = SAMPLE_ORDERS.find((x) => x.n === params.get('n')) || SAMPLE_ORDERS[1];
    const t = orderTotals(o);
    const u = signedIn();
    const returnLine = o.status < 5 ? 'Returns open once it’s delivered.' : canReturn(o) ? `Returns open until ${niceDate(returnUntil(o))}.` : `The return window closed ${niceDate(returnUntil(o))}. Warranty claims are still open.`;
    return {
      title: `Order ${o.n}`,
      html: `<div class="mt-wrap">
        ${crumbs([['Home', url.home], ['My account', url.page('account')], [`Order ${o.n}`]])}
        <div class="mt-account-head"><div><h1 class="mt-page-title">Order ${o.n}</h1><p class="mt-muted">Placed ${niceDate(o.date)} &middot; <span class="mt-status s${o.status}">${statusName(o.status)}</span></p></div><a class="mt-btn mt-btn-ghost mt-btn-sm" href="${url.page('account')}">${icon('back')}All orders</a></div>
        <section class="mt-card-box">${timeline(o.status, o.date)}<p class="mt-tracking">${icon('truck')}${o.tracking ? `${esc(o.carrier)} &middot; <b>${esc(o.tracking)}</b>` : 'Tracking is emailed as soon as the label is made.'}</p></section>
        <div class="mt-confirm-grid">
          <section class="mt-card-box"><h2>Items</h2>
            <ul class="mt-co-lines">${o.items.map(([id, q]) => { const p = byId(id); return `<li><span class="mt-co-art">${art(p)}<i>${q}</i></span><span><a href="${url.product(p)}">${esc(title(p))}</a></span><b>${money(price(p) * q)}</b></li>`; }).join('')}</ul>
            <dl><div><dt>Subtotal</dt><dd>${money(t.sub)}</dd></div><div><dt>Shipping</dt><dd>${t.ship ? money(t.ship) : 'Free'}</dd></div><div><dt>Sales tax</dt><dd>${money(0)}</dd></div>${t.credit ? `<div class="mt-discount"><dt>Store credit</dt><dd>&minus;${money(t.credit)}</dd></div>` : ''}<div class="mt-summary-total"><dt>Total</dt><dd>${money(t.total)}</dd></div></dl>
          </section>
          <section class="mt-card-box"><h2>Shipped to</h2><p>${esc(u.first)} ${esc(u.last)}<br>1420 Main Street, Apt 3<br>Denver, CO 80202</p><h2>Paid with</h2><p>Visa ending in 4242${t.credit ? ` and ${money(t.credit)} store credit` : ''}</p></section>
          <section class="mt-card-box"><h2>Need something?</h2>
            <p class="mt-muted mt-small">${returnLine}</p>
            <div class="mt-stack">
              ${canReturn(o) ? `<a class="mt-btn mt-btn-dark mt-btn-block" href="${url.page('request')}?type=return&n=${o.n}">${icon('returns')}Start a return</a>` : ''}
              ${o.status >= 5 ? `<a class="mt-btn mt-btn-ghost mt-btn-block" href="${url.page('request')}?type=warranty&n=${o.n}">${icon('shield')}Warranty claim</a>` : ''}
              ${o.status < 3 ? `<button class="mt-btn mt-btn-ghost mt-btn-block" type="button" data-preview-msg="You can cancel before it ships. Refunds to your card have a 5% fee where allowed; choose store credit and there's no fee.">${icon('x')}Cancel order</button>` : ''}
              <a class="mt-btn mt-btn-ghost mt-btn-block" href="${url.page('account')}#messages">${icon('chat')}Ask about this order</a>
              ${o.status >= 5 ? `<button class="mt-btn mt-btn-ghost mt-btn-block" type="button" data-preview-msg="We email a review link 7 days after delivery. We read every review before it goes up.">${icon('star')}Review your parts</button>` : ''}
            </div>
          </section>
        </div>
      </div>`,
    };
  };

  PAGES.track = () => {
    const n = (params.get('order') || '').trim().toUpperCase();
    const o = n ? (SAMPLE_ORDERS.find((x) => x.n === n) || (/^MTN-\d{6}$/.test(n) ? { n, date: daysAgo(0), status: 1, carrier: 'UPS Ground', tracking: '' } : null)) : null;
    return {
      title: 'Track your order',
      html: `<div class="mt-wrap mt-track">
        <div class="mt-track-card">
          <span class="mt-modal-icon">${icon('truck')}</span>
          <h1>Track your order</h1>
          <p class="mt-muted">Enter the order number from your receipt (it starts with MTN-).</p>
          <form class="mt-track-form" action="${url.page('track')}" method="get" novalidate>
            <label class="mt-field"><span>Order number</span><input name="order" value="${esc(n)}" placeholder="MTN-104590" required></label>
            <label class="mt-field"><span>Email or ZIP code</span><input name="check" value="${esc(params.get('check') || '')}" placeholder="you@email.com"></label>
            <button class="mt-btn mt-btn-primary mt-btn-lg" type="submit">Track</button>
          </form>
        </div>
        ${n ? (o ? `<section class="mt-card-box mt-track-result"><div class="mt-track-result-head"><div><p class="mt-kicker"><span class="mt-tick"></span>Order ${esc(o.n)}</p><h2>${statusName(o.status)}</h2></div><span class="mt-status s${o.status}">${statusName(o.status)}</span></div>${timeline(o.status, o.date)}<p class="mt-tracking">${icon('truck')}${o.tracking ? `${esc(o.carrier)} &middot; <b>${esc(o.tracking)}</b>` : 'Tracking is emailed as soon as the label is made.'}</p>${o.status >= 5 ? `<p class="mt-track-more"><a class="mt-btn mt-btn-ghost mt-btn-sm" href="${url.page('request')}?n=${o.n}&type=${canReturn(o) ? 'return' : 'warranty'}">${canReturn(o) ? 'Start a return' : 'Start a warranty claim'}</a></p>` : ''}</section>` : `<div class="mt-empty">${icon('search')}<h2>No order matches ${esc(n)}</h2><p>Check the number on your receipt email. Sample numbers: ${SAMPLE_ORDERS.map((x) => `<a href="${url.page('track')}?order=${x.n}">${x.n}</a>`).join(', ')}.</p></div>`) : ''}
      </div>`,
    };
  };

  // Returns and warranty claims: from the account, or as a guest with order number + email.
  PAGES.request = () => {
    const type = params.get('type') === 'warranty' ? 'warranty' : 'return';
    const n = (params.get('n') || '').trim().toUpperCase();
    const o = SAMPLE_ORDERS.find((x) => x.n === n);
    const isReturn = type === 'return';
    const tabsHtml = `<div class="mt-chips mt-req-tabs" role="navigation" aria-label="Request type"><a class="mt-chip${isReturn ? ' is-on' : ''}" href="${url.page('request')}?type=return${o ? `&n=${o.n}` : ''}">Return</a><a class="mt-chip${isReturn ? '' : ' is-on'}" href="${url.page('request')}?type=warranty${o ? `&n=${o.n}` : ''}">Warranty claim</a></div>`;
    const head = `<section class="mt-info-head"><div class="mt-wrap">${crumbs([['Home', url.home], ['Returns & warranty claims']])}<p class="mt-kicker"><span class="mt-tick"></span>Help</p><h1 class="mt-page-title">${isReturn ? 'Start a return' : 'Warranty claim'}</h1><p class="mt-page-sub">${isReturn ? `Unused, uninstalled parts within ${RETURN_DAYS} days of delivery. The return label is free.` : 'A part failed or arrived broken? We replace first.'}</p></div></section>`;
    if (!o) {
      return {
        title: isReturn ? 'Start a return' : 'Warranty claim',
        html: `${head}<div class="mt-wrap mt-request">${tabsHtml}
          <form class="mt-card-box mt-lookup" action="${url.page('request')}" method="get" novalidate>
            <h2>Find your order</h2>
            <input type="hidden" name="type" value="${type}">
            <label class="mt-field"><span>Order number</span><input name="n" value="${esc(n)}" placeholder="MTN-104590" required></label>
            <label class="mt-field"><span>Email used for the order</span><input name="email" type="email" placeholder="you@email.com"></label>
            <button class="mt-btn mt-btn-primary" type="submit">Continue</button>
            ${n ? `<p class="mt-form-msg is-bad">We couldn't find ${esc(n)}. Check your receipt email.</p>` : ''}
            <p class="mt-muted mt-small">Signed in? Your orders are in <a href="${url.page('account')}">your account</a>. Sample orders: ${SAMPLE_ORDERS.filter((x) => x.status >= 5).map((x) => `<a href="${url.page('request')}?type=${type}&n=${x.n}">${x.n}</a>`).join(', ')}.</p>
          </form></div>`,
      };
    }
    const blocked = isReturn && !canReturn(o)
      ? (o.status < 5 ? 'You can start a return once this order is delivered.' : `The ${RETURN_DAYS}-day return window for this order closed ${niceDate(returnUntil(o))}. If a part failed or arrived broken, start a warranty claim instead.`)
      : (!isReturn && o.status < 5 ? 'Warranty claims open once the order is delivered.' : '');
    const REASONS = isReturn
      ? [['changed', 'Changed my mind'], ['wrong-order', 'Ordered the wrong part'], ['nofit', "Doesn't fit my car"], ['damaged', 'Arrived damaged'], ['wrong-item', 'You sent the wrong item'], ['other', 'Something else']]
      : [['cracked', 'Cracked weld or crack'], ['warped', 'Warped flange or leak'], ['broken', 'Part broke or failed'], ['other', 'Something else']];
    const OUR_FAULT = ['damaged', 'wrong-item'];
    return {
      title: isReturn ? `Return for ${o.n}` : `Warranty claim for ${o.n}`,
      html: `${head}<div class="mt-wrap mt-request">${tabsHtml}
        <p class="mt-req-order">${icon('box')}Order <b>${o.n}</b> &middot; placed ${niceDate(o.date)}${deliveredOn(o) ? ` &middot; delivered ${niceDate(deliveredOn(o))}` : ''}</p>
        ${blocked ? `<div class="mt-callout">${icon('clock')}<div><b>${isReturn ? 'Return not available' : 'Not yet'}</b><p>${blocked}</p>${isReturn && o.status >= 5 ? `<p><a class="mt-btn mt-btn-dark mt-btn-sm" href="${url.page('request')}?type=warranty&n=${o.n}">Start a warranty claim</a></p>` : ''}</div></div>` : `
        <form class="mt-req-grid" id="reqForm" novalidate>
          <div class="mt-req-main">
            <section class="mt-card-box"><h2>Which parts?</h2>
              <ul class="mt-req-items">${o.items.map(([id, q]) => { const p = byId(id); return `<li><label class="mt-check"><input type="checkbox" data-item="${id}"><span class="mt-mini-art">${art(p)}</span><span>${esc(title(p))}<small>${money(price(p))} each${isReturn ? '' : ` &middot; ${esc(p.warranty)} warranty`}</small></span></label>${q > 1 ? `<label class="mt-select"><span>Qty</span><select data-qty="${id}">${Array.from({ length: q }, (_, k) => `<option>${k + 1}</option>`).join('')}</select></label>` : ''}</li>`; }).join('')}</ul>
              <em class="mt-field-err" id="itemsErr"></em>
            </section>
            <section class="mt-card-box"><h2>${isReturn ? 'Why are you returning it?' : 'What went wrong?'}</h2>
              <label class="mt-field"><span>Reason</span><select id="reason"><option value="">Choose a reason</option>${REASONS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select><em class="mt-field-err" id="reasonErr"></em></label>
              <label class="mt-field"><span>Tell us more${isReturn ? ' (optional)' : ''}</span><textarea id="details" rows="4" placeholder="${isReturn ? 'Anything we should know' : 'When did it happen, and how is the part installed?'}"></textarea><em class="mt-field-err" id="detailsErr"></em></label>
              <label class="mt-field mt-upload"><span>Photos or video ${isReturn ? '(needed if it arrived damaged or wrong)' : '(needed)'}</span><input type="file" id="photos" multiple accept="image/*,video/*,application/pdf"><em class="mt-field-err" id="photosErr"></em></label>
              <ul class="mt-file-list" id="fileList"></ul>
            </section>
            ${isReturn ? `<section class="mt-card-box"><h2>How should we refund you?</h2>
              <label class="mt-radio-card"><input type="radio" name="refund" value="card" checked><span><b>Original payment</b><small id="cardNote">5% restocking fee</small></span><em id="cardAmt"></em></label>
              <label class="mt-radio-card"><input type="radio" name="refund" value="credit"><span><b>Mountain Racing store credit</b><small>No fee &middot; never expires &middot; needs two-step sign-in or a passkey</small></span><em id="creditAmt"></em></label>
            </section>` : `<section class="mt-card-box"><h2>What happens next</h2><ol class="mt-steps-list"><li><b>We review it</b><span>Usually within one business day. We may ask for more photos.</span></li><li><b>Send it back if needed</b><span>If we need the part, we email a free return label.</span></li><li><b>We replace it</b><span>Replacement comes first. If we're out, you're first in line for the next delivery.</span></li></ol></section>`}
          </div>
          <aside class="mt-card-box mt-req-summary"><h2>Summary</h2>
            <dl id="reqSummary"></dl>
            <button class="mt-btn mt-btn-primary mt-btn-lg mt-btn-block" type="submit">${isReturn ? 'Request return' : 'Send claim'}</button>
            <p class="mt-muted mt-small">${isReturn ? 'Tax is refunded in proportion. Parts that were used or broken in use go through warranty instead.' : 'Warranty covers the original buyer. It doesn’t change any rights you have by law.'}</p>
          </aside>
        </form>
        <div id="reqDone" hidden></div>`}
      </div>`,
      after() {
        const form = document.getElementById('reqForm');
        if (!form) return;
        const $id = (id) => document.getElementById(id);
        const picked = () => $$('[data-item]').filter((c) => c.checked).map((c) => { const sel = $(`[data-qty="${c.dataset.item}"]`); return { p: byId(c.dataset.item), qty: sel ? Number(sel.value) : 1 }; });
        const calc = () => {
          const value = picked().reduce((a, x) => a + price(x.p) * x.qty, 0);
          const waived = OUR_FAULT.includes($id('reason').value);
          const fee = isReturn && !waived ? Math.round(value * RESTOCK * 100) / 100 : 0;
          return { value, fee, waived };
        };
        const draw = () => {
          const { value, fee, waived } = calc();
          if (isReturn) {
            const toCard = $$('input[name="refund"]').find((r) => r.checked).value === 'card';
            $id('cardNote').textContent = waived ? 'No fee: this one is on us' : '5% restocking fee';
            $id('cardAmt').textContent = money(value - fee);
            $id('creditAmt').textContent = money(value);
            $id('reqSummary').innerHTML = `<div><dt>Parts</dt><dd>${money(value)}</dd></div>${toCard && fee ? `<div><dt>Restocking fee (5%)</dt><dd>&minus;${money(fee)}</dd></div>` : ''}<div><dt>Return label</dt><dd><b class="mt-free">Free</b></dd></div><div class="mt-summary-total"><dt>${toCard ? 'Back to your card' : 'Store credit'}</dt><dd>${money(toCard ? value - fee : value)}</dd></div>`;
          } else {
            $id('reqSummary').innerHTML = `<div><dt>Parts</dt><dd>${picked().reduce((a, x) => a + x.qty, 0) || 0}</dd></div><div><dt>Remedy</dt><dd>Replacement</dd></div><div><dt>Return label</dt><dd><b class="mt-free">Free if needed</b></dd></div>`;
          }
        };
        form.addEventListener('change', (e) => {
          if (e.target.id === 'photos') $id('fileList').innerHTML = Array.from(e.target.files || []).map((f) => `<li>${icon('upload')}${esc(f.name)}</li>`).join('');
          ['itemsErr', 'reasonErr', 'photosErr', 'detailsErr'].forEach((k) => { $id(k).textContent = ''; });
          draw();
        });
        draw();
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const reason = $id('reason').value;
          const needPhotos = !isReturn || OUR_FAULT.includes(reason);
          let ok = true;
          if (!picked().length) { $id('itemsErr').textContent = 'Pick at least one part.'; ok = false; }
          if (!reason) { $id('reasonErr').textContent = 'Choose a reason.'; ok = false; }
          if (!isReturn && $id('details').value.trim().length < 10) { $id('detailsErr').textContent = 'Tell us what happened (10+ characters).'; ok = false; }
          if (needPhotos && !($id('photos').files || []).length) { $id('photosErr').textContent = 'Add at least one photo or video.'; ok = false; }
          if (!ok) return;
          const ref = `${isReturn ? 'MTN-R' : 'MTN-W'}-${String(Date.now()).slice(-5)}`;
          form.hidden = true;
          const done = $id('reqDone');
          done.hidden = false;
          done.innerHTML = `<div class="mt-card-box mt-req-done"><span class="mt-confirm-check">${icon('check')}</span><h2>Request ${ref} sent</h2><p>${isReturn ? 'We review it within one business day, then email your free return label. Your refund goes out once the part is back and checked.' : 'We review it within one business day and email you what happens next.'}</p><p class="mt-preview-flag">Design preview: nothing was sent or uploaded.</p><a class="mt-btn mt-btn-ghost" href="${url.page('account')}">Back to my account</a></div>`;
          done.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
      },
    };
  };

  // ------------------------------------------------------------------ help, company and legal pages
  const SAMPLE_LEGAL = '<p class="mt-sample-note">Sample text for the design preview. Replace with Mountain Racing’s real policy before launch.</p>';
  const INFO = {
    about: {
      title: 'About us', kicker: 'Our story', lead: 'Parts for the climb, at prices that leave room for gas money.',
      body: () => `<p>Mountain Racing Co started on a canyon road with a stock car and a small budget. The parts we wanted were either flimsy or priced like race-team gear, so we sell the middle: solid parts, coated black, at prices that make sense for weekend drivers.</p>
        <div class="mt-values">${[['tag', 'Fair prices', 'No fake sales or inflated compare-at prices. The price you see is the price.'], ['wrench', 'Honest install info', 'Every part is marked easy, moderate or advanced, with a time estimate.'], ['truck', `Free shipping over $${FREE_SHIP}`, 'To the lower 48 states, with tracking on every order.'], ['shield', 'Warranty on every part', 'Cracked weld or warped flange? We replace it first.']].map(([ic, h, t]) => `<div>${icon(ic)}<h3>${h}</h3><p>${t}</p></div>`).join('')}</div>
        <div class="mt-stat-band"><div><b>${P.length}</b><span>parts</span></div><div><b>4.7</b><span>average rating</span></div><div><b>24/7</b><span>help by chat or email</span></div></div>
        <p>If something isn't right, tell us and we'll make it right.</p>`,
    },
    contact: {
      title: 'Contact us', kicker: 'Help', lead: 'Chat or email any time. We answer fast and we’re here to help with anything about your order or your car.',
      body: () => `<div class="mt-contact-grid">
        <form class="mt-contact-form" id="contactForm" novalidate>
          <div class="mt-field-row"><label class="mt-field"><span>Name</span><input id="cName" autocomplete="name" required><em class="mt-field-err" id="cNameErr"></em></label><label class="mt-field"><span>Email</span><input id="cEmail" type="email" autocomplete="email" required><em class="mt-field-err" id="cEmailErr"></em></label></div>
          <div class="mt-field-row"><label class="mt-field"><span>Order number (optional)</span><input id="cOrder" placeholder="MTN-104590"></label><label class="mt-field"><span>Topic</span><select id="cTopic"><option>Fitment question</option><option>Order status</option><option>Return or exchange</option><option>Warranty claim</option><option>Something else</option></select></label></div>
          <label class="mt-field"><span>Message</span><textarea id="cMsg" rows="6" required></textarea><em class="mt-field-err" id="cMsgErr"></em></label>
          <button class="mt-btn mt-btn-primary mt-btn-lg" type="submit">Send message</button>
          <p class="mt-form-msg" id="contactMsg" role="status"></p>
        </form>
        <div class="mt-contact-side">
          <div class="mt-card-box">${icon('chat')}<h3>Help 24/7</h3><p>Chat from any page, or send this form. Orders, fit, returns or anything else, we’ve got you.</p><button class="mt-btn mt-btn-dark mt-btn-sm" type="button" data-open-chat>Open chat</button></div>
          <div class="mt-card-box">${icon('wrench')}<h3>Fitment questions</h3><p>Include your year, make, model and engine. A VIN is even better.</p></div>
          <div class="mt-card-box">${icon('truck')}<h3>Where's my order?</h3><p><a href="${url.page('track')}">Track it here</a> with your order number.</p></div>
        </div>
      </div>`,
      after() {
        document.getElementById('contactForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const rules = [['cName', (x) => Boolean(x) || 'Enter your name.'], ['cEmail', (x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) || 'Enter a valid email.'], ['cMsg', (x) => x.length >= 10 || 'Tell us a bit more (10+ characters).']];
          let bad = null;
          rules.forEach(([id, test]) => { const el = document.getElementById(id); const r = test(el.value.trim()); document.getElementById(`${id}Err`).textContent = r === true ? '' : r; if (r !== true && !bad) bad = el; });
          const msg = document.getElementById('contactMsg');
          if (bad) { bad.focus(); msg.textContent = ''; return; }
          msg.textContent = 'Thanks. You’ll get an answer by email, and it will show up under Messages in your account. (Preview: nothing was sent.)';
          msg.className = 'mt-form-msg is-ok';
          e.target.reset();
        });
      },
    },
    reviews: {
      title: 'Customer reviews', kicker: 'Reviews', lead: 'What people say after the parts are on the car.',
      body: () => {
        const total = P.reduce((a, p) => a + p.reviewCount, 0);
        const avg = (P.reduce((a, p) => a + CAT.reviewsFor(p).reduce((b, r) => b + r.rating, 0), 0) / total).toFixed(1);
        return `<div class="mt-reviews-top"><div><p class="mt-big-score">${avg}</p>${stars(Number(avg))}<p>${total.toLocaleString()} reviews across ${P.length} parts</p></div>
          <div class="mt-chips" id="revChips"><button type="button" class="mt-chip is-on" data-rcat="">All</button>${CAT.categories.map((c) => `<button type="button" class="mt-chip" data-rcat="${c.id}">${esc(c.name)}</button>`).join('')}</div></div>
          <div class="mt-review-tools"><p class="mt-review-count" id="revCount"></p><label class="mt-select"><span>Sort</span><select id="revSort"><option value="new">Most recent</option><option value="high">Highest rated</option><option value="low">Lowest rated</option></select></label></div><div class="mt-review-wall" id="revWall"></div><div class="mt-review-more"><button class="mt-btn mt-btn-ghost" type="button" id="revMore"></button><button class="mt-btn mt-btn-ghost" type="button" id="revAll"></button></div>`;
      },
      after() {
        // Every review from every part, newest first, a page at a time; the chips narrow it to one kind of part.
        const all = P.flatMap((p) => CAT.reviewsFor(p).map((r) => ({ ...r, p })));
        const card = (r) => `<article class="mt-review" data-rc="${r.p.category}"><div class="mt-review-top">${stars(r.rating)}<b>${esc(r.title)}</b></div><p>${esc(r.body)}</p><p class="mt-review-by">${esc(r.name)}${r.vehicle ? ` &middot; ${esc(r.vehicle)}` : ''} &middot; ${niceDate(r.date)}</p><a class="mt-review-product" href="${url.product(r.p)}"><span class="mt-mini-art">${art(r.p)}</span>${esc(title(r.p))}</a></article>`;
        const wall = CAT.pageReviews({ reviews: all, card: card, list: document.getElementById('revWall'), count: document.getElementById('revCount'), more: document.getElementById('revMore'), all: document.getElementById('revAll'), sort: document.getElementById('revSort'), first: 24, step: 24 });
        $$('[data-rcat]').forEach((b) => b.addEventListener('click', () => {
          $$('[data-rcat]').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
          wall.filter(b.dataset.rcat ? (r) => r.p.category === b.dataset.rcat : null);
        }));
      },
      wide: true,
    },
    shipping: {
      title: 'Shipping', kicker: 'Help', lead: `Free shipping to the lower 48 states on orders of $${FREE_SHIP} or more.`,
      body: () => `${SAMPLE_LEGAL}<table class="mt-spec-table mt-ship-table"><thead><tr><th>Where it's going</th><th>Shipping</th></tr></thead><tbody>
          <tr><td>Lower 48 states</td><td>Free on orders of $${FREE_SHIP}+, otherwise $${SHIP_FLAT}</td></tr>
          <tr><td>Alaska and Hawaii</td><td>$${SHIP_ZONES.akhi[1]}</td></tr>
          <tr><td>Canada</td><td>$${SHIP_ZONES.ca[1]}</td></tr>
          <tr><td>Other countries we ship to</td><td>$${SHIP_ZONES.intl[1]}</td></tr></tbody></table>
        <h2>How it ships</h2><p>Every order ships with tracking from our warehouse, using the best carrier for where it's going. You get an email with the tracking number as soon as the label is made. Big orders can ship in more than one box, each with its own tracking.</p>
        <h2>Outside the US</h2><p>Import duties, taxes and brokerage fees are set by your country, are paid by you on delivery and are not included in our prices or shipping.</p>
        <h2>Damaged in shipping</h2><p>Send photos of the box and the part through a <a href="${url.page('request')}?type=return">return request</a> and we'll sort it out. Keep the packaging until it's settled.</p>`,
    },
    refund: {
      title: 'Returns & refunds', kicker: 'Help', lead: `${RETURN_DAYS} days to send back a part you haven't used. The return label is free.`,
      body: () => `${SAMPLE_LEGAL}<ol class="mt-steps-list"><li><b>Start the return</b><span>From your account, open the order and press Start a return. No account? <a href="${url.page('request')}?type=return">Start it with your order number and email</a>.</span></li><li><b>Tell us why, add photos</b><span>Pick the parts and the reason. Photos are needed if a part arrived damaged or wrong.</span></li><li><b>Ship it free</b><span>Once we approve it, we email you a prepaid return label.</span></li><li><b>Get your refund</b><span>We check the part when it arrives, then refund you the way you chose.</span></li></ol>
        <h2>What can be returned</h2><p>Parts that are unused and uninstalled, within ${RETURN_DAYS} days of delivery. Test-fitting a part without running it is fine. A part that broke while in use is a <a href="${url.page('warranty')}">warranty claim</a>, not a return.</p>
        <h2>Your refund</h2><table class="mt-spec-table"><tbody>
          <tr><th scope="row">Back to your card</th><td>Minus a 5% restocking fee</td></tr>
          <tr><th scope="row">As Mountain Racing store credit</th><td>Full amount, no fee</td></tr>
          <tr><th scope="row">Our mistake (damaged, wrong item, defect)</th><td>No fee either way</td></tr></tbody></table>
        <p>Tax is refunded in proportion to what you return. If you paid partly with store credit, that part comes back as credit.</p>
        <h2>Cancelling an order</h2><p>You can cancel before it ships. Refunds to your card have the same 5% fee where allowed; choose store credit and there's no fee. If we cancel, or a delay means you're owed a full refund, there's no fee.</p>`,
    },
    warranty: {
      title: 'Warranty', kicker: 'Help', lead: 'Every part has a warranty. We replace first.',
      body: () => `${SAMPLE_LEGAL}<p>Each part's warranty period is listed on its page, under Specs. It covers defects in materials and workmanship, like a cracked weld or a warped flange, for the original buyer.</p>
        <h2>Making a claim</h2><ol class="mt-steps-list"><li><b>Start a claim</b><span>From your account, or <a href="${url.page('request')}?type=warranty">with your order number and email</a>. Your receipt works too.</span></li><li><b>Show us</b><span>Add photos or a short video. Sometimes we'll need the part back, and we send a free label for it.</span></li><li><b>Get a replacement</b><span>If we're out of stock, you're first in line when the next ones arrive. You keep the rest of your original warranty on the replacement.</span></li></ol>
        <h2>Not covered</h2><ul class="mt-bullets"><li>Damage from installation mistakes, accidents or impacts</li><li>Discoloring from heat (normal on stainless)</li><li>Parts that have been modified</li><li>Labor, tuning or other costs</li></ul>
        <p>This warranty doesn't take away any rights you have by law.</p>`,
    },
    faq: {
      title: 'FAQ', kicker: 'Help', lead: 'Quick answers to what people ask most.',
      body: () => `<div class="mt-faq">${[
        ['How do I know a part fits my car?', `Every part lists the years, models and engine it fits, right under the price. Still not sure? <a href="${url.page('contact')}">Send us your VIN</a> and we'll confirm before you order.`],
        ['How much is shipping?', `Free to the lower 48 states on orders of $${FREE_SHIP}+, otherwise $${SHIP_FLAT}. Alaska and Hawaii $${SHIP_ZONES.akhi[1]}, Canada $${SHIP_ZONES.ca[1]}, other countries $${SHIP_ZONES.intl[1]}. <a href="${url.page('shipping')}">Shipping details</a>.`],
        ['Do you ship outside the US?', `Yes, to Canada and many other countries. Import duties and taxes are paid by you on delivery.`],
        ['Can I return a part?', `Yes, within ${RETURN_DAYS} days of delivery if it's unused and uninstalled. The return label is free. Refunds to your card have a 5% restocking fee; store credit has none. <a href="${url.page('refund')}">Return policy</a>.`],
        ['What is store credit?', 'Money in your Mountain Racing account from a refund you chose to take as credit. It never expires, works on anything (including shipping), and is protected by two-step sign-in or a passkey.'],
        ['Do I need a tune for a downpipe?', 'On most turbo cars, yes. Without one the car may run poorly or show a check engine light.'],
        ['Are your parts street legal?', 'Parts marked for off-road use are for off-road and competition vehicles only. Check your state’s emissions laws before installing.'],
        ['Can I change or cancel my order?', 'Yes, before it ships. Message us right away. Refunds to your card have a 5% fee where allowed; store credit has none.'],
        ['Do you sell gift cards?', 'Not right now.'],
        ['Do you offer a military discount?', `Yes. See the <a href="${url.page('military')}">military discount page</a>.`],
      ].map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}${icon('plus')}</summary><p>${a}</p></details>`).join('')}</div>`,
    },
    military: {
      title: 'Military discount', kicker: 'Company', lead: '10% off for active duty, veterans, Guard and Reserve.',
      body: () => `<div class="mt-callout">${icon('medal')}<div><b>Thank you for your service.</b><p>Get 10% off every order, with no limit on how often you use it.</p></div></div>
        <ol class="mt-steps-list"><li><b>Send proof</b><span>Use the <a href="${url.page('contact')}">contact form</a> and pick Something else. A photo of a military ID or DD-214 with personal numbers covered is fine.</span></li><li><b>Get your code</b><span>We reply with a personal code within one business day.</span></li><li><b>Save on every order</b><span>Enter the code at checkout.</span></li></ol>`,
    },
    social: {
      title: 'Social', kicker: 'Company', lead: 'Builds, installs and new parts. Tag yours with #MountainRacingCo.',
      body: () => `<div class="mt-social-cards">${[['camera', 'Instagram', 'Build photos and new parts'], ['play', 'YouTube', 'Install walk-throughs and sound clips'], ['bolt', 'TikTok', 'Quick before-and-after sound checks'], ['chat', 'Facebook', 'Group for owners and questions']].map(([ic, n, t]) => `<div class="mt-card-box">${icon(ic)}<h3>${n}</h3><p>${t}</p><span class="mt-soon">Coming soon</span></div>`).join('')}</div>
        <h2>From the community</h2>
        <div class="mt-builds">${[['wrx-08-14-downpipe', '2011 WRX', '3" downpipe and a pro tune'], ['accord-94-97-header', '1996 Accord', 'The $100 header, installed in an afternoon'], ['370z-09-20-test-pipes', '2015 370Z', 'Test pipes for track days'], ['civic-06-11-intake', '2009 Civic', 'Intake and a cleaner sound'], ['mustang-gt-11-14-x-pipe', '2013 Mustang GT', 'X-pipe for the crossover rasp'], ['miata-99-05-intake', '2003 Miata', 'Weekend autocross build']].map(([id, car, cap]) => `<a class="mt-build" href="${url.product(byId(id))}"><span>${art(byId(id))}</span><b>${car}</b><small>${cap}</small></a>`).join('')}</div>`,
      wide: true,
    },
    privacy: {
      title: 'Privacy policy', kicker: 'Legal', lead: 'What we collect, why, and what you can do about it.',
      body: () => `${SAMPLE_LEGAL}<h2>What we collect</h2><p>Your name, email, shipping address and phone number when you order. Your order history, wishlist and support messages if you make an account. Basic device and browsing data to keep the site working.</p>
        <h2>Your Mountain Racing account is only for Mountain Racing</h2><p>Your account, orders, store credit and emails here are kept separate from any other store.</p>
        <h2>How we use it</h2><p>To fill and ship orders, answer questions, prevent fraud and, if you opt in, send deal emails.</p>
        <h2>Who we share it with</h2><p>Only the companies that help us run the store: our payment processor, shipping carriers and email provider. We never sell your information.</p>
        <h2>Payments</h2><p>Card details go straight to our payment processor. Mountain Racing never sees or stores your full card number.</p>
        <h2>Your choices</h2><p>Deal emails are only sent if you opt in, and you can unsubscribe at any time. You can delete your account yourself; order and payment records are kept as the law requires. Ask us to see or correct your data through the <a href="${url.page('contact')}">contact page</a>.</p>`,
    },
    terms: {
      title: 'Terms & conditions', kicker: 'Legal', lead: 'The rules for buying from Mountain Racing.',
      body: () => `${SAMPLE_LEGAL}<h2>Orders</h2><p>An order is accepted when it ships. We may cancel an order with a pricing or stock error and refund it in full.</p>
        <h2>Prices</h2><p>Prices are in US dollars and can change without notice. The price at checkout is the price you pay.</p>
        <h2>Installation and use</h2><p>Performance parts should be installed by someone qualified. You are responsible for following the laws where you drive, including emissions laws.</p>
        <h2>Off-road parts</h2><p>Parts marked for off-road use may not be installed on vehicles driven on public roads. See the <a href="${url.page('vcw')}">vehicle compliance waiver</a>.</p>
        <h2>Returns, cancellations and store credit</h2><p>See the <a href="${url.page('refund')}">return policy</a>. Store credit can only be used at Mountain Racing, doesn't expire and can't be exchanged for cash unless the law requires it.</p>
        <h2>Limits</h2><p>Our responsibility is limited to the price you paid for the part, except where the law says otherwise.</p>`,
    },
    vcw: {
      title: 'Vehicle compliance waiver', kicker: 'Legal', lead: 'Read this before buying parts marked for off-road use.',
      body: () => `${SAMPLE_LEGAL}<p>Some parts on this site, including catless downpipes and test pipes, change or remove emissions equipment. They are sold for off-road and competition vehicles only.</p>
        <h2>By buying an off-road part you confirm that</h2><ul class="mt-bullets"><li>The part will be installed on a vehicle that is not driven on public roads</li><li>You understand federal and state emissions laws and will follow them</li><li>You are responsible for any fines, failed inspections or warranty loss that come from installing the part</li></ul>
        <h2>California and similar states</h2><p>These parts are not legal for use on public roads in California or states that follow California emissions rules.</p>`,
    },
    cua: {
      title: 'Consumer use agreement', kicker: 'Legal', lead: 'How Mountain Racing parts are meant to be used.',
      body: () => `${SAMPLE_LEGAL}<p>Performance parts change how a vehicle runs. Installing them can affect drivability, emissions, noise and manufacturer warranties.</p>
        <h2>You agree to</h2><ul class="mt-bullets"><li>Have parts installed by a qualified person</li><li>Check fitment before installing</li><li>Use parts only where it is legal to do so</li><li>Stop using a part that is damaged or not working correctly</li></ul>`,
    },
    prop65: {
      title: 'Proposition 65', kicker: 'Legal', lead: 'Information for California customers.',
      body: () => `${SAMPLE_LEGAL}<div class="mt-callout mt-callout-warn">${icon('shield')}<div><b>WARNING</b><p>These products can expose you to chemicals including nickel and chromium (hexavalent compounds), which are known to the State of California to cause cancer. For more information go to www.P65Warnings.ca.gov.</p></div></div>
        <p>Stainless steel exhaust parts contain nickel and chromium. Wear gloves when handling and cutting parts, and wash your hands after installation.</p>`,
    },
  };
  const INFO_NAV = [['Help', HELP_LINKS.filter(([, k]) => k !== 'track' && k !== 'request')], ['Company', COMPANY_LINKS], ['Legal', LEGAL_LINKS]];

  Object.entries(INFO).forEach(([key, info]) => {
    PAGES[key] = () => ({
      title: info.title,
      html: `<section class="mt-info-head"><div class="mt-wrap">${crumbs([['Home', url.home], [info.title]])}<p class="mt-kicker"><span class="mt-tick"></span>${esc(info.kicker)}</p><h1 class="mt-page-title">${esc(info.title)}</h1><p class="mt-page-sub">${esc(info.lead)}</p></div></section>
        <div class="mt-wrap mt-info${info.wide ? ' is-wide' : ''}">
          ${info.wide ? '' : `<nav class="mt-info-nav" aria-label="Help pages">${INFO_NAV.map(([group, links]) => `<p>${group}</p><ul>${links.map(([label, k]) => `<li><a href="${url.page(k)}"${k === key ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`).join('')}</ul>`).join('')}</nav>`}
          <article class="mt-prose">${info.body()}</article>
        </div>`,
      after: info.after,
    });
  });

  // Mountain Racing's transactional email designs (each store sends its own, from its own domain).
  PAGES.emails = () => {
    const o = SAMPLE_ORDERS[1];
    const t = orderTotals(o);
    const u = signedIn();
    const btn = (label) => `<span class="mt-mail-btn">${label}</span>`;
    const itemRows = o.items.map(([id, q]) => { const p = byId(id); return `<tr><td class="mt-mail-art">${art(p)}</td><td>${esc(title(p))}<small>Qty ${q}</small></td><td>${money(price(p) * q)}</td></tr>`; }).join('');
    const mail = (id, label, subject, inner) => `<section class="mt-mail-wrap" id="${id}">
      <p class="mt-mail-label">${label}</p>
      <div class="mt-mail-meta"><p><b>From</b> Mountain Racing Co</p><p><b>Subject</b> ${subject}</p></div>
      <div class="mt-mail">
        <div class="mt-mail-top"><span class="mt-logo">${logo(true)}</span></div>
        <div class="mt-mail-rails" aria-hidden="true"></div>
        <div class="mt-mail-body">${inner}</div>
        <div class="mt-mail-foot"><p><b>Mountain Racing Co</b> &middot; Help 24/7: reply to this email or chat on the site</p><p>You're getting this email because you ordered from Mountain Racing.</p></div>
      </div>
    </section>`;
    const list = [
      ['confirm', 'Order confirmed', `Order ${o.n} confirmed`, `<h1>Thanks, ${esc(u.first)}. We've got your order.</h1><p>We'll email tracking as soon as it ships.</p>
        <table class="mt-mail-items">${itemRows}</table>
        <table class="mt-mail-totals"><tr><td>Subtotal</td><td>${money(t.sub)}</td></tr><tr><td>Shipping</td><td>${t.ship ? money(t.ship) : 'Free'}</td></tr><tr class="is-total"><td>Total</td><td>${money(t.total)}</td></tr></table>${btn('View your order')}`],
      ['shipped', 'Shipped', 'Your Mountain Racing order is on the way', `<h1>It's on the way.</h1><p>Order ${o.n} left our warehouse.</p><div class="mt-mail-box"><small>${esc(o.carrier)}</small><b>${esc(o.tracking)}</b></div>${btn('Track package')}<p class="mt-mail-small">Big orders can ship in more than one box. Each one gets its own tracking email.</p>`],
      ['return', 'Return approved', 'Return approved: your free label is ready', `<h1>Your return is approved.</h1><ol class="mt-mail-steps"><li>Print the label below.</li><li>Pack the part, in its original box if you can.</li><li>Drop it off with the carrier within 7 days.</li></ol>${btn('Download return label')}<p class="mt-mail-small">We'll refund you the way you chose once the part is back and checked: to your card (minus the 5% restocking fee) or as store credit with no fee.</p>`],
      ['credit', 'Store credit added', 'You have $25.00 in Mountain Racing store credit', `<h1>$25.00 store credit added.</h1><div class="mt-mail-box mt-mail-credit"><small>Your balance</small><b>${money(25)}</b></div><p>From your return on order MTN-103871. It never expires and works on anything at Mountain Racing, including shipping.</p><p class="mt-mail-small">To use it you'll confirm with your passkey or authenticator app, so only you can spend it.</p>${btn('See your store credit')}`],
      ['review', 'Review request (7 days after delivery)', `How's the ${esc(title(byId(o.items[0][0])))}?`, `<h1>How's it going on the car?</h1><p>Rate your ${esc(title(byId(o.items[0][0])))}. It helps other people pick the right part.</p><p class="mt-mail-stars">${[1, 2, 3, 4, 5].map((n) => `<span aria-label="${n} stars">&#9733;</span>`).join('')}</p><p class="mt-mail-small">We read every review before it's posted, good or bad.</p>`],
    ];
    return {
      title: 'Email designs',
      html: `<section class="mt-info-head"><div class="mt-wrap">${crumbs([['Home', url.home], ['Email designs']])}<p class="mt-kicker"><span class="mt-tick"></span>Design preview</p><h1 class="mt-page-title">Mountain Racing emails</h1><p class="mt-page-sub">How Mountain Racing's order emails look. Each store sends its own, from its own address.</p></div></section>
        <div class="mt-wrap mt-mails">
          <div class="mt-chips">${list.map(([id, label]) => `<a class="mt-chip" href="#${id}">${label.replace(/ \(.*\)/, '')}</a>`).join('')}</div>
          <div class="mt-mail-grid">${list.map(([id, label, subject, inner]) => mail(id, label, subject, inner)).join('')}</div>
        </div>`,
    };
  };

  PAGES.notfound = () => ({ title: 'Page not found', html: `<div class="mt-wrap"><div class="mt-empty">${icon('search')}<h1>This trail doesn\u2019t go anywhere</h1><p>Try the search, or head back home.</p><a class="mt-btn mt-btn-primary" href="${url.home}">Go home</a></div></div>` });


  // ------------------------------------------------------------------ render and global events
  function addToCart(id, qty = 1) {
    const p = byId(id);
    if (!p || p.stock <= 0) return;
    cart.add(id, qty);
    if (onCartChange) onCartChange();
    showAdded(id, qty);
  }

  function render() {
    const root = document.getElementById('mt-root');
    const key = document.body.dataset.page;
    const view = (PAGES[key] || PAGES.notfound)();
    document.title = `${view.title} | ${BRAND}`;
    const checkoutChrome = view.chrome === 'checkout';
    root.innerHTML = (checkoutChrome
      ? `<header class="mt-co-header"><div class="mt-wrap mt-co-header-inner"><a class="mt-logo" href="${url.home}" aria-label="Mountain Racing Co home">${logo()}</a><span class="mt-co-secure">${icon('lock')}Secure checkout</span><a class="mt-link" href="${url.page('cart')}">${icon('back')}<span>Back to cart</span></a></div></header>`
      : header())
      + `<main id="main" class="mt-main mt-page-${esc(key)}" tabindex="-1">${view.html}</main>`
      + (checkoutChrome ? `<footer class="mt-co-footer"><div class="mt-wrap"><a href="${url.page('refund')}">Returns</a><a href="${url.page('shipping')}">Shipping</a><a href="${url.page('privacy')}">Privacy</a><a href="${url.page('terms')}">Terms</a></div></footer>` : footer())
      + overlays(!checkoutChrome);
    updateBadges();
    bindSearchOverlay();
    onCartChange = null;
    onWishChange = null;
    if (view.after) view.after();
  }

  document.addEventListener('click', (e) => {
    const mega = document.getElementById('mtMega');
    if (mega && !mega.hidden && !e.target.closest('#mtMega, .mt-mega-btn')) setMega(false);
    const added = document.getElementById('mtAdded');
    if (added && !added.hidden && !e.target.closest('#mtAdded, [data-add], #pdpAdd')) hideAdded();
    const add = e.target.closest('[data-add]');
    if (add) {
      e.preventDefault();
      addToCart(add.dataset.add, 1);
      add.classList.add('is-added');
      setTimeout(() => add.classList.remove('is-added'), 1200);
      return;
    }
    if (e.target.closest('.mt-mega-btn')) { setMega(document.getElementById('mtMega').hidden); return; }
    if (e.target.closest('[data-open-search]')) { setMega(false); openOverlay('mtSearch'); return; }
    if (e.target.closest('[data-open-menu]')) { openOverlay('mtMenu'); return; }
    if (e.target.closest('[data-close-overlay]')) { closeOverlay(e.target.closest('.mt-overlay')); return; }
    if (e.target.closest('[data-close-added]')) { hideAdded(); return; }
    if (e.target.closest('[data-open-chat]')) { const p = document.getElementById('mtChat'); if (p && !p.hidden && e.target.closest('.mt-chat-launch')) closeChat(); else openChat(); return; }
    if (e.target.closest('[data-close-chat]')) { closeChat(); return; }
    const save = e.target.closest('[data-wish]');
    if (save) {
      const on = wish.toggle(save.dataset.wish);
      $$(`[data-wish="${save.dataset.wish}"]`).forEach((b) => { b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); const s = $('span', b); if (s) s.textContent = on ? 'Saved' : 'Save'; });
      toast(on ? 'Saved to your wishlist' : 'Removed from your wishlist');
      if (onWishChange) onWishChange();
      return;
    }
    const msg = e.target.closest('[data-preview-msg]');
    if (msg) toast(msg.dataset.previewMsg);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    $$('.mt-overlay.is-open').forEach(closeOverlay);
    setMega(false);
    hideAdded();
    closeChat();
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'footNews') {
      e.preventDefault();
      const email = document.getElementById('footEmail');
      const msg = document.getElementById('footMsg');
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      msg.textContent = ok ? 'You’re in. (Preview: nothing was sent.)' : 'Enter a valid email address.';
      msg.className = `mt-form-msg ${ok ? 'is-ok' : 'is-bad'}`;
      if (ok) email.value = '';
      return;
    }
    if (e.target.id !== 'mtChatForm') return;
    e.preventDefault();
    const input = document.getElementById('mtChatInput');
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    const body = document.getElementById('mtChatBody');
    body.insertAdjacentHTML('beforeend', `<div class="mt-bubble is-you"><small>You</small><p>${esc(text)}</p></div>`);
    input.value = '';
    setTimeout(() => {
      body.insertAdjacentHTML('beforeend', '<div class="mt-bubble is-team"><small>Mountain Racing support</small><p>Thanks! On the live store we’d answer you right here, any time of day. (Preview)</p></div>');
      body.scrollTop = body.scrollHeight;
    }, 450);
    body.scrollTop = body.scrollHeight;
  });
  window.addEventListener('storage', (e) => { if (e.key === 'mt_preview_cart') { updateBadges(); if (onCartChange) onCartChange(); } });
  window.addEventListener('scroll', () => { document.documentElement.classList.toggle('mt-scrolled', window.scrollY > 30); }, { passive: true });

  render();
})();
