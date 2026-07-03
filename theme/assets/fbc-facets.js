/* Freestanding Bath Co — collection filtering & sort.
   Progressive enhancement over the native <form>: instant apply on change,
   history push without full reload, mobile filter drawer, sort select. */

class FbcFacetFilters extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('[data-facet-form]');
    if (!this.form) return;
    this.form.addEventListener('input', this.debounce(() => this.apply(), 500));
    this.form.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') this.apply();
    });
    // Clear link → fetch cleared URL
    const clear = this.querySelector('[data-facet-clear]');
    if (clear) clear.addEventListener('click', (e) => { e.preventDefault(); this.navigate(clear.getAttribute('href')); });

    window.addEventListener('popstate', () => this.navigate(location.href, false));
  }

  apply() {
    const data = new FormData(this.form);
    const params = new URLSearchParams();
    for (const [k, v] of data.entries()) { if (v !== '') params.append(k, v); }
    const base = this.form.getAttribute('action') || location.pathname;
    this.navigate(`${location.pathname}?${params.toString()}`);
  }

  navigate(url, push = true) {
    const grid = document.getElementById('FbcProductGrid');
    if (grid) grid.style.opacity = '0.5';
    fetch(url)
      .then((r) => r.text())
      .then((text) => {
        const doc = new DOMParser().parseFromString(text, 'text/html');
        this.replace(doc, '#FbcProductGrid');
        this.replace(doc, '.fbc-active-pills', '.fbc-collection__main');
        this.replace(doc, '.fbc-pagination', '.fbc-collection__main');
        this.replace(doc, '#FbcFacets');
        this.replace(doc, '.fbc-collection__count');
        // rebind after facet DOM swap
        this.form = this.querySelector('[data-facet-form]');
        if (push) history.pushState({}, '', url);
        const grid2 = document.getElementById('FbcProductGrid');
        if (grid2) grid2.style.opacity = '';
        window.scrollTo({ top: this.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
      })
      .catch(() => { window.location.href = url; });
  }

  // Replace #target's content (or remove if absent in the new doc)
  replace(doc, selector, parentSelector) {
    const incoming = doc.querySelector(selector);
    const current = document.querySelector(selector);
    if (incoming && current) {
      current.replaceWith(incoming);
    } else if (incoming && !current && parentSelector) {
      const parent = document.querySelector(parentSelector);
      if (parent) parent.prepend(incoming);
    } else if (!incoming && current) {
      current.remove();
    }
  }

  debounce(fn, wait) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), wait); }; }
}
customElements.define('facet-filters', FbcFacetFilters);

/* Sort select — reload with sort_by */
document.addEventListener('change', (e) => {
  const sel = e.target.closest('[data-sort]');
  if (!sel) return;
  const url = new URL(location.href);
  url.searchParams.set('sort_by', sel.value);
  const ff = document.querySelector('facet-filters');
  if (ff) ff.navigate(url.toString());
  else window.location.href = url.toString();
});

/* Mobile filter drawer open/close */
document.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-facet-open]');
  const closer = e.target.closest('[data-facet-close]');
  const sidebar = document.getElementById('FbcFacets');
  if (!sidebar) return;
  if (opener) {
    sidebar.classList.add('is-open');
    document.body.classList.add('fbc-lock');
    opener.setAttribute('aria-expanded', 'true');
  } else if (closer || e.target.classList.contains('fbc-collection__sidebar')) {
    sidebar.classList.remove('is-open');
    document.body.classList.remove('fbc-lock');
    const o = document.querySelector('[data-facet-open]');
    if (o) o.setAttribute('aria-expanded', 'false');
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const sidebar = document.getElementById('FbcFacets');
    if (sidebar && sidebar.classList.contains('is-open')) {
      sidebar.classList.remove('is-open');
      document.body.classList.remove('fbc-lock');
    }
  }
});
