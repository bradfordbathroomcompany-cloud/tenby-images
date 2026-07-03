/* Freestanding Bath Co — "Will it fit?" panel.
   Pure client-side: compares a room dimension against the bath length
   (custom.size_mm) with 100mm clearance guidance each side. */

class FbcWillItFit extends HTMLElement {
  connectedCallback() {
    this.bathLength = parseInt(this.dataset.bathLength, 10);
    this.input = this.querySelector('[data-fit-input]');
    this.result = this.querySelector('[data-fit-result]');
    this.roomRect = this.querySelector('[data-fit-room]');
    this.roomLabel = this.querySelector('[data-fit-room-label]');

    if (!this.bathLength || !this.input) return;

    this.input.addEventListener('input', () => this.update());
    this.input.addEventListener('change', () => this.update());
  }

  update() {
    const room = parseInt(this.input.value, 10);
    this.result.classList.remove('is-fits', 'is-tight', 'is-no');

    if (!room || room < 300) {
      this.result.textContent = '';
      this.result.removeAttribute('data-state');
      this.drawRoom(null);
      return;
    }

    const comfortable = this.bathLength + 200; // 100mm clearance each side
    let state;
    let message;

    if (room >= comfortable) {
      state = 'fits';
      message = `Fits comfortably — ${this.format(room - this.bathLength)} to spare (we suggest 100mm clearance each side).`;
    } else if (room >= this.bathLength) {
      state = 'tight';
      message = `A tight fit — the bath fits, but with less than 100mm clearance each side. Worth double-checking waste and tap positions.`;
    } else {
      state = 'no';
      message = `Won't fit — this bath is ${this.format(this.bathLength)} long, ${this.format(this.bathLength - room)} more than your wall. A smaller bath will suit better.`;
    }

    this.result.textContent = message;
    this.result.classList.add(`is-${state}`);
    this.result.setAttribute('data-state', state);
    this.drawRoom(room);
  }

  drawRoom(room) {
    if (!this.roomRect) return;
    // The SVG viewBox is 400 wide; the bath is drawn at a fixed 240 units.
    // Scale the room outline relative to the bath so proportion reads true.
    const bathUnits = 240;
    if (!room) {
      this.roomRect.setAttribute('width', bathUnits + 80);
      this.roomRect.setAttribute('x', (400 - (bathUnits + 80)) / 2);
      if (this.roomLabel) this.roomLabel.textContent = 'Your wall';
      return;
    }
    const units = Math.max(80, Math.min(392, (room / this.bathLength) * bathUnits));
    this.roomRect.setAttribute('width', units);
    this.roomRect.setAttribute('x', (400 - units) / 2);
    if (this.roomLabel) this.roomLabel.textContent = `Your wall — ${this.format(room)}`;
  }

  format(mm) {
    return `${mm}mm`;
  }
}

customElements.define('fbc-will-it-fit', FbcWillItFit);
