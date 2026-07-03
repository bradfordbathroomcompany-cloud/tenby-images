/* Freestanding Bath Co — product page:
   variant selection, gallery + zoom, quantity, sticky add-to-cart,
   complementary cross-sell fetch. Works alongside Dawn's product-form.js. */

class FbcProduct extends HTMLElement {
  connectedCallback() {
    const data = this.querySelector('[data-product-variants]');
    try { this.variants = JSON.parse(data.textContent); } catch { this.variants = []; }

    this.idInput = this.querySelector('[data-variant-id]');
    this.selects = Array.from(this.querySelectorAll('[data-option-index]'));
    this.priceBlock = this.querySelector('[data-price-block]');
    this.financeEl = this.querySelector('[data-finance]');
    this.addButton = this.querySelector('[data-add-button]');
    this.addText = this.querySelector('[data-add-text]');
    this.gallery = this.querySelector('fbc-product-gallery');
    this.financeMonths = 12;

    this.selects.forEach((sel) => sel.addEventListener('change', () => this.onVariantChange()));
    this.bindQuantity();
    this.bindStickyBar();

    // discover finance divisor from server-rendered strong text if present
    this.moneyFormat = window.Shopify && window.Shopify.currency ? window.Shopify.currency.active : 'GBP';
  }

  currentOptions() {
    return this.selects
      .sort((a, b) => a.dataset.optionIndex - b.dataset.optionIndex)
      .map((s) => s.value);
  }

  onVariantChange() {
    const opts = this.currentOptions();
    const variant = this.variants.find((v) => JSON.stringify(v.options) === JSON.stringify(opts));

    // reflect selected value labels
    this.querySelectorAll('[data-option-selected]').forEach((el) => {
      const i = parseInt(el.dataset.optionSelected, 10);
      if (this.selects[i]) el.textContent = this.selects[i].value;
    });

    if (!variant) {
      this.setUnavailable();
      return;
    }

    this.current = variant;
    if (this.idInput) this.idInput.value = variant.id;

    // URL
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url);

    this.updatePrice(variant);
    this.updateFinance(variant);
    this.updateButton(variant);
    this.updateGallery(variant);
  }

  updatePrice(variant) {
    if (!this.priceBlock) return;
    const cur = this.priceBlock.querySelector('[data-current-price]');
    const cmp = this.priceBlock.querySelector('[data-compare-price]');
    const save = this.priceBlock.querySelector('[data-save-price]');
    if (cur) cur.innerHTML = this.money(variant.price);
    const onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
    if (cmp) { cmp.innerHTML = onSale ? this.money(variant.compare_at_price) : ''; cmp.hidden = !onSale; }
    if (save) { save.innerHTML = onSale ? `Save ${this.money(variant.compare_at_price - variant.price)}` : ''; save.hidden = !onSale; }
    if (cur) cur.classList.toggle('fbc-price--sale', onSale);
  }

  updateFinance(variant) {
    if (!this.financeEl) return;
    const strong = this.financeEl.querySelector('strong');
    if (strong) strong.textContent = `${this.money(Math.round(variant.price / this.financeMonths))}/month`;
  }

  updateButton(variant) {
    if (!this.addButton) return;
    if (variant.available) {
      this.addButton.removeAttribute('disabled');
      if (this.addText) this.addText.textContent = 'Add to Basket';
    } else {
      this.setUnavailable();
    }
  }

  setUnavailable() {
    if (this.addButton) this.addButton.setAttribute('disabled', 'disabled');
    if (this.addText) this.addText.textContent = 'Sold out';
  }

  updateGallery(variant) {
    if (!this.gallery || !variant.featured_media) return;
    this.gallery.showMedia(variant.featured_media.id);
  }

  bindQuantity() {
    const input = this.querySelector('[data-qty-input]');
    if (!input) return;
    this.querySelector('[data-qty-minus]')?.addEventListener('click', () => {
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
    });
    this.querySelector('[data-qty-plus]')?.addEventListener('click', () => {
      input.value = (parseInt(input.value, 10) || 1) + 1;
    });
  }

  /* Sticky ATC bar appears when the main button scrolls out of view */
  bindStickyBar() {
    if (!this.addButton) return;
    const bar = document.createElement('div');
    bar.className = 'fbc-sticky-atc';
    bar.hidden = true;
    bar.innerHTML = `
      <div class="page-width fbc-sticky-atc__inner">
        <span class="fbc-sticky-atc__title">${this.dataset.title || document.title.split('–')[0].trim()}</span>
        <span class="fbc-sticky-atc__price" data-sticky-price>${this.priceBlock ? this.priceBlock.querySelector('[data-current-price]').innerHTML : ''}</span>
        <button type="button" class="button button--primary fbc-sticky-atc__btn">Add to Basket</button>
      </div>`;
    document.body.appendChild(bar);
    this.stickyBar = bar;
    bar.querySelector('button').addEventListener('click', () => {
      this.querySelector('[data-add-button]').click();
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const show = !e.isIntersecting && e.boundingClientRect.top < 0;
        bar.hidden = !show;
        bar.classList.toggle('is-visible', show);
        // keep sticky price synced
        const sp = bar.querySelector('[data-sticky-price]');
        if (sp && this.priceBlock) sp.innerHTML = this.priceBlock.querySelector('[data-current-price]').innerHTML;
      });
    }, { rootMargin: '0px 0px 0px 0px', threshold: 0 });
    io.observe(this.addButton);
  }

  money(cents) {
    if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
      return window.Shopify.formatMoney(cents, window.Shopify.money_format);
    }
    const v = (cents / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 });
    return `£${v}`;
  }
}
customElements.define('fbc-product', FbcProduct);

/* ---------- Gallery ---------- */
class FbcProductGallery extends HTMLElement {
  connectedCallback() {
    this.slides = Array.from(this.querySelectorAll('.fbc-gallery__slide'));
    this.thumbs = Array.from(this.querySelectorAll('[data-thumb]'));
    this.thumbs.forEach((t) => t.addEventListener('click', () => this.showMedia(t.dataset.thumb)));
    this.querySelectorAll('.fbc-gallery__image').forEach((img) => {
      img.addEventListener('click', () => this.zoom(img));
    });
  }

  showMedia(id) {
    id = String(id);
    this.slides.forEach((s) => {
      const match = s.dataset.mediaId === id;
      s.hidden = !match;
      s.classList.toggle('is-active', match);
    });
    this.thumbs.forEach((t) => t.classList.toggle('is-active', t.dataset.thumb === id));
  }

  zoom(img) {
    const src = img.dataset.zoomSrc || img.currentSrc || img.src;
    const dialog = document.createElement('div');
    dialog.className = 'fbc-zoom';
    dialog.innerHTML = `<button class="fbc-zoom__close" aria-label="Close">&times;</button><img src="${src}" alt="">`;
    dialog.addEventListener('click', () => dialog.remove());
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { dialog.remove(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(dialog);
  }
}
customElements.define('fbc-product-gallery', FbcProductGallery);

/* ---------- Cross-sell (complementary recommendations) ---------- */
class FbcCrossSell {
  static init() {
    document.querySelectorAll('[data-cross-sell]').forEach((el) => {
      const url = el.dataset.url;
      const grid = el.querySelector('[data-cross-sell-grid]');
      if (!url || !grid) return;
      fetch(url)
        .then((r) => r.text())
        .then((text) => {
          const doc = new DOMParser().parseFromString(text, 'text/html');
          const items = doc.querySelectorAll('li');
          if (items.length) { grid.innerHTML = ''; items.forEach((li) => grid.appendChild(li)); }
        })
        .catch(() => {});
    });
  }
}
document.addEventListener('DOMContentLoaded', () => FbcCrossSell.init(), { once: true });
