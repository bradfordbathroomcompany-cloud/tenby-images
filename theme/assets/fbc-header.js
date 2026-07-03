/* Freestanding Bath Co — header behaviours:
   rotating announcement bar, mega/dropdown nav, mobile drawer,
   search panel toggle, predictive search. Vanilla ES module-free
   (loaded with defer). Respects prefers-reduced-motion. */

/* ---------- Announcement bar rotation ---------- */
class FbcAnnouncementBar extends HTMLElement {
  connectedCallback() {
    this.messages = Array.from(this.querySelectorAll('.fbc-announcement__message'));
    this.pauseBtn = this.querySelector('[data-announcement-pause]');
    this.index = 0;
    this.paused = false;

    if (this.messages.length < 2) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.interval = Math.max(3000, parseInt(this.dataset.interval, 10) || 5000);

    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => this.togglePause());
    }
    if (!reduce) this.start();
  }

  start() {
    this.stop();
    this.timer = setInterval(() => this.advance(), this.interval);
  }
  stop() { if (this.timer) clearInterval(this.timer); }

  advance() {
    this.messages[this.index].classList.remove('is-active');
    this.index = (this.index + 1) % this.messages.length;
    this.messages[this.index].classList.add('is-active');
  }

  togglePause() {
    this.paused = !this.paused;
    this.pauseBtn.setAttribute('aria-pressed', String(this.paused));
    this.pauseBtn.setAttribute('aria-label', this.paused ? 'Play announcements' : 'Pause announcements');
    if (this.paused) this.stop(); else this.start();
  }

  disconnectedCallback() { this.stop(); }
}
customElements.define('fbc-announcement-bar', FbcAnnouncementBar);

/* ---------- Header (nav, drawer, search, sticky shadow) ---------- */
class FbcHeader extends HTMLElement {
  connectedCallback() {
    this.navDetails = Array.from(this.querySelectorAll('[data-nav-item]'));
    this.drawer = this.querySelector('#FbcMobileDrawer');
    this.searchPanel = this.querySelector('#FbcSearchPanel');
    this.searchInput = this.querySelector('[data-search-input]');

    this.bindNav();
    this.bindDrawer();
    this.bindSearch();
    this.bindStickyShadow();
    this.bindGlobalKeys();
  }

  /* Desktop nav: close others on open; close on outside click / hover-out */
  bindNav() {
    this.navDetails.forEach((details) => {
      const summary = details.querySelector('summary');
      summary.addEventListener('click', () => {
        // sync aria-expanded after native toggle
        requestAnimationFrame(() => summary.setAttribute('aria-expanded', String(details.open)));
        this.navDetails.forEach((other) => {
          if (other !== details) { other.open = false; other.querySelector('summary').setAttribute('aria-expanded', 'false'); }
        });
      });

      // Pointer users: open on hover for a fast, boutique feel
      details.addEventListener('mouseenter', () => {
        if (window.matchMedia('(hover: hover) and (min-width: 990px)').matches) {
          this.navDetails.forEach((other) => { if (other !== details) other.open = false; });
          details.open = true;
          summary.setAttribute('aria-expanded', 'true');
        }
      });
      details.addEventListener('mouseleave', () => {
        if (window.matchMedia('(hover: hover) and (min-width: 990px)').matches) {
          details.open = false;
          summary.setAttribute('aria-expanded', 'false');
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-nav-item]')) this.closeNav();
    });
  }

  closeNav() {
    this.navDetails.forEach((d) => { d.open = false; d.querySelector('summary').setAttribute('aria-expanded', 'false'); });
  }

  /* Mobile drawer */
  bindDrawer() {
    if (!this.drawer) return;
    this.drawerOpeners = Array.from(this.querySelectorAll('[data-drawer-open]'));
    this.drawerClosers = Array.from(this.drawer.querySelectorAll('[data-drawer-close]'));

    this.drawerOpeners.forEach((btn) => btn.addEventListener('click', () => this.openDrawer(btn)));
    this.drawerClosers.forEach((btn) => btn.addEventListener('click', () => this.closeDrawer()));

    // Keep aria-expanded in sync on accordion summaries
    this.drawer.querySelectorAll('.fbc-drawer__group > summary').forEach((s) => {
      s.addEventListener('click', () => {
        requestAnimationFrame(() => s.setAttribute('aria-expanded', String(s.parentElement.open)));
      });
    });
  }

  openDrawer(opener) {
    this.drawer.hidden = false;
    this.lastFocused = opener;
    requestAnimationFrame(() => {
      this.drawer.classList.add('is-open');
      document.body.classList.add('fbc-lock');
      this.drawerOpeners.forEach((b) => b.setAttribute('aria-expanded', 'true'));
      this.trapFocus(this.drawer.querySelector('.fbc-drawer__panel'));
    });
  }

  closeDrawer() {
    this.drawer.classList.remove('is-open');
    document.body.classList.remove('fbc-lock');
    this.drawerOpeners.forEach((b) => b.setAttribute('aria-expanded', 'false'));
    this.releaseFocus();
    const done = () => { this.drawer.hidden = true; this.drawer.removeEventListener('transitionend', done); };
    this.drawer.addEventListener('transitionend', done);
    if (this.lastFocused) this.lastFocused.focus();
  }

  /* Search panel */
  bindSearch() {
    if (!this.searchPanel) return;
    this.searchOpeners = Array.from(this.querySelectorAll('[data-search-open]'));
    this.searchClosers = Array.from(this.searchPanel.querySelectorAll('[data-search-close]'));
    this.searchOpeners.forEach((b) => b.addEventListener('click', () => this.openSearch(b)));
    this.searchClosers.forEach((b) => b.addEventListener('click', () => this.closeSearch()));
  }

  openSearch(opener) {
    this.closeNav();
    this.searchPanel.hidden = false;
    this.searchLastFocused = opener;
    this.searchOpeners.forEach((b) => b.setAttribute('aria-expanded', 'true'));
    requestAnimationFrame(() => this.searchInput && this.searchInput.focus());
  }

  closeSearch() {
    this.searchPanel.hidden = true;
    this.searchOpeners.forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (this.searchLastFocused) this.searchLastFocused.focus();
  }

  bindStickyShadow() {
    if (!this.classList.contains('fbc-header-wrap--sticky')) return;
    const onScroll = () => this.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  bindGlobalKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (this.drawer && this.drawer.classList.contains('is-open')) this.closeDrawer();
      else if (this.searchPanel && !this.searchPanel.hidden) this.closeSearch();
      else this.closeNav();
    });
  }

  /* Minimal focus trap for the drawer */
  trapFocus(container) {
    this.trapContainer = container;
    this.trapHandler = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = container.querySelectorAll('a[href], button:not([disabled]), input, summary, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    container.addEventListener('keydown', this.trapHandler);
    const firstLink = container.querySelector('button, a[href]');
    if (firstLink) firstLink.focus();
  }
  releaseFocus() {
    if (this.trapContainer && this.trapHandler) this.trapContainer.removeEventListener('keydown', this.trapHandler);
  }
}
customElements.define('fbc-header', FbcHeader);

/* ---------- Predictive search ---------- */
class FbcPredictiveSearch extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('[data-search-input]');
    this.results = this.querySelector('[data-search-results]');
    this.currency = this.dataset.shopCurrency || '';
    this.cache = {};
    this.abort = null;

    if (!this.input) return;
    this.input.addEventListener('input', this.debounce(() => this.onInput(), 250));
    this.input.addEventListener('keydown', (e) => this.onKeydown(e));
  }

  onInput() {
    const q = this.input.value.trim();
    this.input.setAttribute('aria-expanded', q.length > 1 ? 'true' : 'false');
    if (q.length < 2) { this.results.innerHTML = ''; return; }
    if (this.cache[q]) { this.render(this.cache[q], q); return; }

    if (this.abort) this.abort.abort();
    this.abort = new AbortController();

    const params = new URLSearchParams({
      q,
      'resources[type]': 'product,collection,page',
      'resources[limit]': '6',
      'resources[options][unavailable_products]': 'last',
      'resources[options][fields]': 'title,product_type,variants.title,vendor',
      section_id: 'fbc-predictive',
    });

    fetch(`${window.Shopify.routes.root}search/suggest.json?${params}`, { signal: this.abort.signal })
      .then((r) => r.json())
      .then((data) => { this.cache[q] = data.resources.results; this.render(data.resources.results, q); })
      .catch((e) => { if (e.name !== 'AbortError') this.results.innerHTML = ''; });
  }

  render(results, q) {
    const products = results.products || [];
    const collections = results.collections || [];
    const pages = results.pages || [];

    if (!products.length && !collections.length && !pages.length) {
      this.results.innerHTML = `<p class="fbc-search-results__empty">No matches for "${this.escape(q)}". Try a shape, size or material — or <a class="fbc-link" href="${window.Shopify.routes.root}search?q=${encodeURIComponent(q)}">search everything</a>.</p>`;
      return;
    }

    let html = '<div class="fbc-search-results">';
    html += '<div class="fbc-search-results__col">';
    if (products.length) {
      html += '<p class="fbc-search-results__heading">Baths &amp; accessories</p><div class="fbc-search-results__products" role="group">';
      products.forEach((p) => {
        const img = p.featured_image && p.featured_image.url ? p.featured_image.url : (p.image || '');
        let price = '';
        if (typeof p.price === 'number') price = this.money(p.price);
        else if (typeof p.price === 'string' && p.price) price = p.price.match(/[£$€\d]/) ? p.price : this.money(parseInt(p.price, 10));
        html += `<a class="fbc-search-result" role="option" href="${p.url}">
          ${img ? `<img class="fbc-search-result__image" src="${img}&width=128" alt="" width="64" height="80" loading="lazy">` : '<span class="fbc-search-result__image"></span>'}
          <span>
            <span class="fbc-search-result__title">${p.title}</span>
            <span class="fbc-search-result__meta">
              ${price ? `<span class="fbc-search-result__price">${price}</span>` : ''}
              <span class="fbc-delivery-line">Free delivery, 3–5 working days</span>
            </span>
          </span>
        </a>`;
      });
      html += '</div>';
    }
    html += '</div><div class="fbc-search-results__col">';
    if (collections.length) {
      html += '<p class="fbc-search-results__heading">Collections</p><ul class="fbc-search-results__links" role="group">';
      collections.forEach((c) => { html += `<li><a class="fbc-search-results__link" role="option" href="${c.url}">${c.title}</a></li>`; });
      html += '</ul>';
    }
    if (pages.length) {
      html += '<p class="fbc-search-results__heading">Advice &amp; pages</p><ul class="fbc-search-results__links" role="group">';
      pages.forEach((pg) => { html += `<li><a class="fbc-search-results__link" role="option" href="${pg.url}">${pg.title}</a></li>`; });
      html += '</ul>';
    }
    html += `<a class="fbc-link fbc-search-results__all" href="${window.Shopify.routes.root}search?q=${encodeURIComponent(q)}">See all results for "${this.escape(q)}"</a>`;
    html += '</div></div>';

    this.results.innerHTML = html;
    this.options = Array.from(this.results.querySelectorAll('[role="option"]'));
    this.activeIndex = -1;
  }

  onKeydown(e) {
    if (!this.options || !this.options.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex += e.key === 'ArrowDown' ? 1 : -1;
      if (this.activeIndex < 0) this.activeIndex = this.options.length - 1;
      if (this.activeIndex >= this.options.length) this.activeIndex = 0;
      this.options.forEach((o, i) => o.classList.toggle('is-selected', i === this.activeIndex));
      this.options[this.activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && this.activeIndex > -1) {
      e.preventDefault();
      window.location.href = this.options[this.activeIndex].getAttribute('href');
    }
  }

  money(cents) {
    const value = (cents / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${this.currency || '£'}${value}`;
  }
  escape(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  debounce(fn, wait) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), wait); }; }
}
customElements.define('fbc-predictive-search', FbcPredictiveSearch);
