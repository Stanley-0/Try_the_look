/**
 * Custom Element <runway-section>
 * Complete recreation of the Shopify "Try the Look. — Runway" section.
 */

import { CATALOG_ITEMS, LOOKS_DATA } from './catalog.ts';
import { bag } from './bag.ts';

interface ClassicBodyState {
  x: number;
  vx: number;
  g: number;
  from: number;
  tripping: boolean;
  prevGoal: number;
}

export class RunwaySection extends HTMLElement {
  public index = 0;
  public target = 0;
  public cur = -1.15; // entrance offset (0 under reduced motion)
  public vel = 0;
  public still = false;
  public isMobile = false;

  private playing = false;
  private panelHover = false;
  private zoomed = false;
  private engaged = false;

  private W = 0;
  private H = 0;
  private fs = 1.08;
  private unit = 120;
  private modelH = 560;

  // Reduced motion
  private reducedMotion = false;

  // DOM elements inside section
  private stage!: HTMLElement;
  private actors!: HTMLElement;
  private heroesEl!: HTMLElement;
  private sweepEl!: HTMLElement;
  private walkLine!: HTMLElement;
  private liveRegion!: HTMLElement;
  private panelContainer!: HTMLElement;
  private controlsEl!: HTMLElement;
  private prevBtn!: HTMLButtonElement;
  private nextBtn!: HTMLButtonElement;
  private autoBtn: HTMLButtonElement | null = null;
  private ticks: HTMLButtonElement[] = [];
  private heroEls: HTMLElement[] = [];
  private bodyEls: HTMLElement[] = [];
  private lookPanels: HTMLElement[] = [];
  private lbEl!: HTMLElement;
  private lbStage!: HTMLElement;
  private lbKicker!: HTMLElement;
  private lbName!: HTMLElement;
  private lbCloseBtn!: HTMLButtonElement;

  // Classic mode body states
  private classicStates: ClassicBodyState[] = [];

  // Animation & Drag state
  private rAFId: number | null = null;
  private lastTime = 0;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartTarget = 0;
  private dragPointerId = -1;
  private dragSamples: Array<{ x: number; time: number }> = [];
  private suppressClicksUntil = 0;
  private wheelAcc = 0;
  private wheelLockUntil = 0;

  // Phone size sheet host
  private sheetHost: HTMLElement | null = null;
  private currentActivePicker: HTMLElement | null = null;
  private pickerParentCard: HTMLElement | null = null;

  // Intersection observers
  private stageObserver: ResizeObserver | null = null;
  private roRAF: number | null = null;
  private visObserver: IntersectionObserver | null = null;
  private revealObserver: IntersectionObserver | null = null;

  connectedCallback(): void {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.reducedMotion) {
      this.cur = 0;
      this.target = 0;
    }

    this.classList.add('rw--js');

    this.initDOM();
    this.cloneBodies();
    this.initClassicStates();
    this.measure();
    this.setupEvents();
    this.detectFeet();
    this.setupObservers();

    // Start with silent initial index
    this.setIndex(0, true);

    // Initial measure after layout
    requestAnimationFrame(() => {
      this.measure();
      this.renderAll();
      this.kick();
    });
  }

  disconnectedCallback(): void {
    if (this.rAFId) cancelAnimationFrame(this.rAFId);
    if (this.roRAF !== null) cancelAnimationFrame(this.roRAF);
    if (this.stageObserver) this.stageObserver.disconnect();
    if (this.visObserver) this.visObserver.disconnect();
    if (this.revealObserver) this.revealObserver.disconnect();
    if (this.sheetHost) {
      this.dockSheet();
      this.sheetHost.remove();
    }
  }

  private initDOM(): void {
    this.stage = this.querySelector('[data-rw-stage]') as HTMLElement;
    this.actors = this.querySelector('[data-rw-actors]') as HTMLElement;
    this.heroesEl = this.querySelector('[data-rw-heroes]') as HTMLElement;
    this.sweepEl = this.querySelector('.rw__sweep') as HTMLElement;
    this.walkLine = this.querySelector('.rw__walk-line') as HTMLElement;
    this.liveRegion = this.querySelector('[data-rw-live]') as HTMLElement;
    this.panelContainer = this.querySelector('.rw__panel') as HTMLElement;
    this.controlsEl = this.querySelector('.rw__controls') as HTMLElement;
    this.prevBtn = this.querySelector('[data-rw-prev]') as HTMLButtonElement;
    this.nextBtn = this.querySelector('[data-rw-next]') as HTMLButtonElement;
    this.autoBtn = this.querySelector('[data-rw-auto]') as HTMLButtonElement | null;
    this.ticks = Array.from(this.querySelectorAll<HTMLButtonElement>('[data-rw-tick]'));
    this.heroEls = Array.from(this.querySelectorAll<HTMLElement>('[data-rw-hero]'));
    this.bodyEls = Array.from(this.querySelectorAll<HTMLElement>('[data-rw-model]'));
    this.lookPanels = Array.from(this.querySelectorAll<HTMLElement>('[data-rw-panel]'));

    // Lightbox popup
    this.lbEl = this.querySelector('[data-rw-lb]') as HTMLElement;
    this.lbStage = this.querySelector('[data-rw-lb-stage]') as HTMLElement;
    this.lbKicker = this.querySelector('[data-rw-lb-kicker]') as HTMLElement;
    this.lbName = this.querySelector('[data-rw-lb-name]') as HTMLElement;
    this.lbCloseBtn = this.querySelector('[data-rw-zoom-close]') as HTMLButtonElement;

    // Decode model images
    const modelImgs = this.querySelectorAll<HTMLImageElement>('[data-model-image]');
    modelImgs.forEach((img) => {
      if (img.complete && img.naturalWidth) {
        img.classList.add('is-decoded');
      } else {
        img.decode?.()
          .then(() => img.classList.add('is-decoded'))
          .catch(() => {
            if (img.naturalWidth) img.classList.add('is-decoded');
          });
      }
    });
  }

  private cloneBodies(): void {
    // Clone bodies 0-5 into 6-11
    if (this.bodyEls.length >= 12) return;
    const originals = this.bodyEls.slice(0, 6);
    originals.forEach((orig, idx) => {
      const clone = orig.cloneNode(true) as HTMLElement;
      clone.setAttribute('data-rw-clone', 'true');
      clone.setAttribute('data-index', String(idx + 6));
      clone.setAttribute('aria-hidden', 'true');
      const img = clone.querySelector('img');
      if (img) img.setAttribute('loading', 'lazy');
      const hit = clone.querySelector('.rw__hit');
      if (hit) hit.setAttribute('data-rw-go', String(idx + 6));
      this.actors.appendChild(clone);
    });
    this.bodyEls = Array.from(this.querySelectorAll<HTMLElement>('[data-rw-model]'));
  }

  private initClassicStates(): void {
    this.classicStates = [];
    for (let i = 0; i < 12; i++) {
      this.classicStates.push({
        x: i,
        vx: 0,
        g: i,
        from: i,
        tripping: false,
        prevGoal: i,
      });
    }
  }

  private measure(): void {
    const windowW = window.innerWidth;
    const wasMobile = this.isMobile;
    this.isMobile = windowW <= 749;

    if (wasMobile !== this.isMobile && !this.isMobile) {
      this.dockSheet();
    }

    // Header measurement
    const header = document.querySelector('.shopify-section-group-header-group, .site-header');
    const headerHeight = header ? (header as HTMLElement).offsetHeight : 88;

    let frameH: number;
    if (this.isMobile) {
      const vh = window.innerHeight;
      frameH = (vh * 109) / 100;
    } else {
      frameH = Math.max(380, window.innerHeight - headerHeight);
    }
    const frameHStr = `${frameH}px`;
    if (this.style.getPropertyValue('--rw-frame-h') !== frameHStr) {
      this.style.setProperty('--rw-frame-h', frameHStr);
    }

    const stageRect = this.stage.getBoundingClientRect();
    this.W = stageRect.width || (windowW - (this.isMobile ? 0 : 380));
    this.H = stageRect.height || (frameH - (this.isMobile ? 120 : 150));

    // Scale and heights
    this.fs = this.isMobile ? 1 : 1.08;
    this.style.setProperty('--rw-fs', String(this.fs));

    if (this.isMobile) {
      this.modelH = Math.max(200, Math.round(this.H - 24 - 18));
      this.unit = Math.max(90, this.W * 0.32 * 1.6);
      const hx = 0.3 * this.W;
      const hy = 22;
      this.stage.style.setProperty('--rw-hx', `${hx}px`);
      this.stage.style.setProperty('--rw-hy', `${hy}px`);
      this.style.setProperty('--rw-ax', `${(hx / this.W) * 100}%`);
    } else {
      this.modelH = Math.max(200, Math.round((this.H - 34 - 18) / 1.08));
      this.unit = Math.max(120, 0.3 * this.W);
      const hx = 0.5 * this.W;
      const hy = 34;
      this.stage.style.setProperty('--rw-hx', `${hx}px`);
      this.stage.style.setProperty('--rw-hy', `${hy}px`);
      this.style.setProperty('--rw-ax', '50%');
    }

    const modelHStr = `${this.modelH}px`;
    if (this.stage.style.getPropertyValue('--rw-model-h') !== modelHStr) {
      this.stage.style.setProperty('--rw-model-h', modelHStr);
    }
  }

  private put(
    el: HTMLElement,
    x: number,
    bottom: number,
    scale: number,
    opacity: number,
    blur: number,
    z: number
  ): void {
    const figure = el.querySelector('.rw__figure') as HTMLElement | null;
    const w = figure?.offsetWidth || this.modelH * 0.5625;

    if (x + (w * scale) / 2 < -4 || x - (w * scale) / 2 > this.W + 4) {
      opacity = 0;
    }

    el.style.transform = `translate3d(${x.toFixed(1)}px, ${(-bottom).toFixed(1)}px, 0) translateX(-50%) scale(${scale.toFixed(4)})`;
    el.style.opacity = opacity.toFixed(3);
    el.style.zIndex = String(z);
    el.style.visibility = opacity < 0.01 ? 'hidden' : 'visible';
    el.style.pointerEvents = opacity < 0.5 ? 'none' : '';

    if (blur <= 0.05) {
      el.style.filter = '';
    } else {
      el.style.filter = `blur(${blur.toFixed(1)}px)`;
    }
  }

  private setStill(isStill: boolean): void {
    if (this.still === isStill) return;
    this.still = isStill;
    if (isStill) {
      this.classList.add('rw--still');
    } else {
      this.classList.remove('rw--still');
    }
  }

  private renderAll(): void {
    if (this.W <= 0 || this.H <= 0) return;

    if (!this.isMobile) {
      // Ring mode
      const cx = 0.5 * this.W;
      const R = 0.62 * this.W;
      const P = 1.65 * this.W;
      const floor = this.H - 34;
      const horizon = 0.36 * this.H;
      const step = (2 * Math.PI) / 12;

      for (let a = 0; a < 12; a++) {
        let phi = ((a - this.cur) * step) % (2 * Math.PI);
        while (phi <= -Math.PI) phi += 2 * Math.PI;
        while (phi > Math.PI) phi -= 2 * Math.PI;

        const z = R * (1 - Math.cos(phi));
        const persp = P / (P + z);
        const sl = Math.abs(phi) / step;
        const scale = persp * (1 + (this.fs - 1) * Math.max(0, Math.min(1, 1 - sl)));
        const x = cx + R * Math.sin(phi) * persp;
        const feet = horizon + (floor - horizon) * persp;
        const bottom = this.H - feet;
        const blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
        let opacity = Math.max(0, Math.min(1, (Math.cos(phi) + 0.55) / 0.3));

        if (this.still && sl < 0.02) {
          opacity = 0;
        }

        const zIndex = Math.round(scale * 1000);
        const bodyEl = this.bodyEls[a];
        if (bodyEl) {
          this.put(bodyEl, x, bottom, scale, opacity, blur, zIndex);
        }
      }
    } else {
      // Classic phone mode
      const ax = 0.3;
      const ay = 22;
      const sx = 0.32;
      const sy = 22;
      const sr = 0.76;
      const ex = 0.55;

      for (let a = 0; a < 12; a++) {
        const state = this.classicStates[a];
        const k = state.x;
        let e = -1;

        if (state.tripping) {
          const u =
            Math.abs(state.x - state.from) / Math.max(0.001, Math.abs(state.g - state.from));
          if (state.g > state.from) {
            if (u < 0.5) e = 2 * u * 1.4;
            // else k = state.g + 2 * (1 - u);
          } else {
            if (u >= 0.5) e = 2 * (1 - u) * 1.4;
          }
        } else if (k < 0) {
          e = Math.min(-k, 1.4);
        }

        let xPos: number;
        let bottom: number;
        let scale: number;
        let opacity: number;
        let blur: number;
        let zIndex: number;

        if (e >= 0) {
          xPos = this.W * (ax - ex * e);
          bottom = ay - 22 * e;
          scale = 1 + 0.14 * e;
          opacity = Math.max(0, 1 - 1.05 * e);
          blur = 4 * Math.min(e, 1);
          zIndex = 1100;
        } else {
          xPos = this.W * (ax + sx * k);
          bottom = ay + sy * k;
          scale = Math.pow(sr, Math.max(0, k));
          opacity = k <= 3 ? 1 - 0.13 * k : Math.max(0, 0.61 * (4 - k));
          blur = Math.min(0.9 * Math.max(0, k), 3.2);
          zIndex = 1000 - Math.round(10 * k);

          if (this.still && Math.abs(k) < 0.02) {
            opacity = 0;
          }
        }

        const bodyEl = this.bodyEls[a];
        if (bodyEl) {
          this.put(bodyEl, xPos, bottom, scale, opacity, blur, zIndex);
        }
      }
    }
  }

  private kick(): void {
    if (this.rAFId !== null) return;
    this.lastTime = performance.now();
    this.rAFId = requestAnimationFrame((now) => this.loop(now));
  }

  private loop(now: number): void {
    this.rAFId = null;
    const deltaT = now - this.lastTime;
    this.lastTime = now;

    if (this.reducedMotion) {
      this.cur = this.target;
      this.vel = 0;
      this.setStill(true);
      this.renderAll();
      return;
    }

    const dt = Math.min(0.034, deltaT / 1000 || 1 / 60);
    let moving = false;

    if (!this.isMobile) {
      // Ring spring: K=95, C=19.493588, 3 sub-steps
      const K = 95;
      const C = 2 * Math.sqrt(K);
      const h = dt / 3;

      for (let s = 0; s < 3; s++) {
        const acc = -K * (this.cur - this.target) - C * this.vel;
        this.vel += acc * h;
        this.cur += this.vel * h;
      }

      if (Math.abs(this.cur - this.target) <= 0.0005 && Math.abs(this.vel) <= 0.0005) {
        this.cur = this.target;
        this.vel = 0;
        this.setStill(true);
      } else {
        moving = true;
        this.setStill(false);
      }
    } else {
      // Classic phone bodies spring
      const K = 95;
      const C = 2 * Math.sqrt(K);
      const h = dt / 3;

      for (let a = 0; a < 12; a++) {
        const st = this.classicStates[a];
        const goal = (((a - this.target) % 12) + 12) % 12;

        if (Math.abs(goal - st.prevGoal) > 6) {
          st.from = st.x;
          st.tripping = true;
        }
        st.prevGoal = goal;

        const tau = this.isDragging
          ? 0.016
          : st.tripping
          ? 0.1
          : 0.03 + 0.04 * Math.min(goal, 4);
        st.g += (goal - st.g) * (1 - Math.exp(-dt / tau));

        for (let s = 0; s < 3; s++) {
          const acc = -K * (st.x - st.g) - C * st.vx;
          st.vx += acc * h;
          st.x += st.vx * h;
        }

        if (Math.abs(st.x - goal) < 0.02) {
          st.tripping = false;
        }

        if (Math.abs(st.x - goal) > 0.0006 || Math.abs(st.vx) > 0.0006) {
          moving = true;
        }
      }

      if (!moving) {
        this.setStill(true);
      } else {
        this.setStill(false);
      }
    }

    this.renderAll();

    if (moving || this.isDragging) {
      this.rAFId = requestAnimationFrame((n) => this.loop(n));
    }
  }

  public setIndex(i: number, silent = false): void {
    const oldIndex = this.index;
    this.index = ((i % 6) + 6) % 6;
    const look = LOOKS_DATA[this.index];

    // Progress
    const progress = ((this.index + 1) / 6).toFixed(3);
    this.style.setProperty('--rw-progress', progress);

    // Update body accessibility
    for (let a = 0; a < 12; a++) {
      const body = this.bodyEls[a];
      if (!body) continue;
      const hit = body.querySelector<HTMLButtonElement>('.rw__hit');
      let rank = ((a - this.index) % 12 + 12) % 12;
      if (rank > 6) rank -= 12;

      const accessible = rank !== 0 && Math.abs(rank) <= (this.isMobile ? 3 : 2);
      if (accessible) {
        body.removeAttribute('aria-hidden');
        if (hit) {
          hit.tabIndex = 0;
          hit.setAttribute('aria-hidden', 'false');
        }
      } else {
        body.setAttribute('aria-hidden', 'true');
        if (hit) {
          hit.tabIndex = -1;
          hit.setAttribute('aria-hidden', 'true');
        }
      }
    }

    // Heroes toggle
    this.heroEls.forEach((h, idx) => {
      const isCurrent = idx === this.index;
      const wasCurrent = idx === oldIndex;
      const zoom = h.querySelector<HTMLButtonElement>('[data-rw-zoom]');

      if (isCurrent) {
        h.classList.add('is-on');
        h.classList.remove('was');
        h.setAttribute('aria-hidden', 'false');
        if (zoom) zoom.tabIndex = 0;
      } else if (wasCurrent && !silent) {
        h.classList.remove('is-on');
        h.classList.add('was');
        h.setAttribute('aria-hidden', 'true');
        if (zoom) zoom.tabIndex = -1;
      } else {
        h.classList.remove('is-on', 'was');
        h.setAttribute('aria-hidden', 'true');
        if (zoom) zoom.tabIndex = -1;
      }
    });

    // Ticks toggle
    this.ticks.forEach((t, idx) => {
      const isCur = idx === this.index;
      t.setAttribute('aria-current', isCur ? 'true' : 'false');
      if (idx < this.index) {
        t.classList.add('is-past');
      } else {
        t.classList.remove('is-past');
      }
    });

    // Look panels
    this.lookPanels.forEach((p, idx) => {
      const isCur = idx === this.index;
      if (isCur) {
        p.hidden = false;
        p.classList.remove('is-in');
        if (!silent) {
          void p.offsetWidth; // force reflow
        }
        p.classList.add('is-in');
      } else {
        p.hidden = true;
        p.classList.remove('is-in');
      }
    });

    // Update pieces label
    const piecesLabel = this.querySelector<HTMLElement>('[data-rw-pieces]');
    if (piecesLabel) {
      piecesLabel.textContent = look.piecesLabel;
      if (!silent) {
        piecesLabel.classList.remove('is-swap');
        void piecesLabel.offsetWidth;
        piecesLabel.classList.add('is-swap');
      }
    }

    // Live region
    if (this.liveRegion && !silent) {
      this.liveRegion.textContent = `Look ${this.index + 1}: ${look.name}`;
    }

    // Sweep animation
    if (!silent && !this.reducedMotion && this.stage) {
      this.stage.classList.remove('is-sweep');
      void this.stage.offsetWidth;
      this.stage.classList.add('is-sweep');
    }

    // Clear hot states and close popup / sheet
    this.clearHot();
    if (this.zoomed) {
      this.closePopup();
    }
    if (this.isMobile && this.currentActivePicker) {
      this.dockSheet();
    }

    this.kick();
  }

  public moveTo(T: number): void {
    this.target = T;
    this.setStill(false);
    this.setIndex(((Math.round(T) % 6) + 6) % 6);
  }

  public next(): void {
    this.moveTo(Math.round(this.target) + 1);
  }

  public prev(): void {
    this.moveTo(Math.round(this.target) - 1);
  }

  public go(i: number): void {
    let d = ((i - this.index) % 6 + 6) % 6;
    if (d > 3) d -= 6;
    this.moveTo(Math.round(this.target) + d);
  }

  public play(_play: boolean): void {
    this.playing = false;
  }

  public engage(): void {
    this.engaged = true;
  }

  // --- Hot Linking & Pins ---
  public hot(n: number, scroll = false): void {
    this.clearHot();

    // Hot on pin n in popup or hero
    const pinSelector = `[data-rw-pin="${n}"]`;
    const targetPins = (this.zoomed ? this.lbEl : this.heroEls[this.index])?.querySelectorAll(
      pinSelector
    );
    targetPins?.forEach((p) => p.classList.add('is-hot'));

    // Hot on panel card n
    const activePanel = this.lookPanels[this.index];
    const card = activePanel?.querySelector(`[data-rw-card="${n}"]`) as HTMLElement | null;
    if (card) {
      card.classList.add('is-hot');

      if (scroll) {
        const itemsList = activePanel.querySelector('.rw__items') as HTMLElement | null;
        if (itemsList) {
          const isHorizontal = itemsList.scrollWidth > itemsList.clientWidth;
          const behavior = this.reducedMotion ? 'auto' : 'smooth';

          if (isHorizontal) {
            const listRect = itemsList.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();
            itemsList.scrollTo({
              left: itemsList.scrollLeft + (cardRect.left - listRect.left - 20),
              behavior,
            });
          } else {
            const topOffset = card.offsetTop - itemsList.offsetTop - 12;
            itemsList.scrollTo({ top: topOffset, behavior });
          }
        }
      }
    }
  }

  private clearHot(): void {
    this.querySelectorAll('.is-hot').forEach((el) => el.classList.remove('is-hot'));
  }

  // --- View Look Popup (Lightbox) ---
  public openPopup(): void {
    if (this.zoomed) return;
    this.engage();
    this.clearHot();
    this.zoomed = true;

    const look = LOOKS_DATA[this.index];
    this.lbKicker.textContent = `Look 0${this.index + 1}`;
    this.lbName.textContent = look.name;

    // Clone front hero model into lbStage
    const frontHero = this.heroEls[this.index];
    const figure = frontHero?.querySelector('.rw__figure') as HTMLElement | null;
    const shadow = frontHero?.querySelector('.rw__shadow') as HTMLElement | null;

    if (!figure || !shadow) return;

    this.lbStage.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'rw__lb-model';

    const shadowClone = shadow.cloneNode(true) as HTMLElement;
    const figureClone = figure.cloneNode(true) as HTMLElement;

    // Remove zoom hit button from clone
    figureClone.querySelector('[data-rw-zoom]')?.remove();

    // Enable pins in popup
    const pins = figureClone.querySelectorAll<HTMLButtonElement>('.rw__pin');
    pins.forEach((p) => {
      p.tabIndex = 0;
      p.style.display = 'grid';
    });

    wrapper.appendChild(shadowClone);
    wrapper.appendChild(figureClone);
    this.lbStage.appendChild(wrapper);

    // Set model height inside popup
    const stageRect = this.lbStage.getBoundingClientRect();
    const h = Math.max(160, Math.min(stageRect.height, stageRect.width / 0.5625));
    wrapper.style.setProperty('--rw-model-h', `${h}px`);

    const img = wrapper.querySelector('img');
    if (img) {
      img.sizes = `${Math.round(h * 0.5625)}px`;
      img.loading = 'eager';
      img.classList.add('is-decoded');
    }

    // FLIP grow animation
    if (!this.reducedMotion) {
      const a = figure.getBoundingClientRect();
      const b = figureClone.getBoundingClientRect();

      wrapper.style.transition = 'none';
      wrapper.style.transformOrigin = '0 100%';
      wrapper.style.transform = `translate3d(${a.left - b.left}px, ${a.bottom - b.bottom}px, 0) scale(${a.height / b.height})`;

      void wrapper.offsetWidth; // force reflow

      wrapper.style.transition = 'transform 0.95s var(--rw-ease)';
      wrapper.style.transform = 'translate3d(0, 0, 0) scale(1)';
    }

    this.classList.add('rw--zoom');
    this.lbEl.setAttribute('aria-hidden', 'false');
    this.lbCloseBtn.focus();
  }

  public closePopup(): void {
    if (!this.zoomed) return;
    this.zoomed = false;

    const wrapper = this.lbStage.querySelector('.rw__lb-model') as HTMLElement | null;
    const frontHero = this.heroEls[this.index];
    const figure = frontHero?.querySelector('.rw__figure') as HTMLElement | null;
    const figureClone = wrapper?.querySelector('.rw__figure') as HTMLElement | null;

    if (wrapper && figure && figureClone && !this.reducedMotion) {
      const a = figure.getBoundingClientRect();
      const b = figureClone.getBoundingClientRect();
      wrapper.style.transform = `translate3d(${a.left - b.left}px, ${a.bottom - b.bottom}px, 0) scale(${a.height / b.height})`;
    }

    this.classList.remove('rw--zoom');
    this.lbEl.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
      this.lbStage.innerHTML = '';
      if (document.activeElement && this.lbEl.contains(document.activeElement)) {
        this.stage.focus();
      }
    }, 950);
  }

  // --- Mobile Sheet Host ---
  public openMobileSheet(picker: HTMLElement, card: HTMLElement): void {
    this.dockSheet();

    this.currentActivePicker = picker;
    this.pickerParentCard = card;

    if (!this.sheetHost) {
      this.sheetHost = document.createElement('div');
      this.sheetHost.className = 'rw-sheet-host';
      this.sheetHost.innerHTML = `
        <button class="rw__pick-scrim" data-rw-pick-close tabindex="-1" aria-hidden="true"></button>
      `;
      document.body.appendChild(this.sheetHost);

      this.sheetHost.addEventListener('click', (e) => this.handleGlobalClick(e));
      this.sheetHost.addEventListener('change', () => this.engage());
    }

    // Copy computed styles
    const cs = getComputedStyle(this);
    const vars = [
      '--rw-panel',
      '--rw-text',
      '--rw-muted',
      '--rw-line',
      '--rw-accent',
      '--rw-on-accent',
      '--rw-btn-bg',
      '--rw-btn-fg',
      '--rw-btn-radius',
      '--rw-pill-radius',
      '--rw-bar-r',
      '--rw-thumb-radius',
      '--rw-pt-size',
      '--rw-price',
      '--rw-opt',
      '--rw-ease',
      '--rw-ease-sheet',
      '--rw-ease-spring',
    ];
    vars.forEach((v) => {
      this.sheetHost!.style.setProperty(v, cs.getPropertyValue(v));
    });
    this.sheetHost.style.fontFamily = cs.fontFamily;
    this.sheetHost.style.color = cs.color;

    picker.hidden = false;
    this.sheetHost.appendChild(picker);
    this.sheetHost.classList.add('is-open');
    this.classList.add('rw--picking');

    const firstRadio = picker.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    firstRadio?.focus();
  }

  public dockSheet(): void {
    if (this.currentActivePicker && this.pickerParentCard) {
      this.currentActivePicker.hidden = true;
      this.pickerParentCard.appendChild(this.currentActivePicker);
      this.pickerParentCard.classList.remove('is-picking');
      const addBtn = this.pickerParentCard.querySelector('[data-rw-add]');
      addBtn?.setAttribute('aria-expanded', 'false');
    }
    this.currentActivePicker = null;
    this.pickerParentCard = null;
    this.sheetHost?.classList.remove('is-open');
    this.classList.remove('rw--picking');
  }

  // --- Feet Detection via Canvas ---
  private detectFeet(): void {
    LOOKS_DATA.forEach((look) => {
      const probeUrl = look.model640;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = probeUrl;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 48;
          const h = Math.round((48 * 1956) / 1100);
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, 48, h);
          const data = ctx.getImageData(0, 0, 48, h).data;

          let lastRow = -1;
          for (let y = h - 1; y >= 0; y--) {
            for (let x = 0; x < 48; x++) {
              const alpha = data[(y * 48 + x) * 4 + 3];
              if (alpha > 40) {
                lastRow = y;
                break;
              }
            }
            if (lastRow !== -1) break;
          }

          if (lastRow !== -1) {
            const footFraction = Math.max(0, Math.min(0.4, (h - 1 - lastRow) / h));
            // Apply to matching hero and queue bodies
            const hero = this.heroEls[look.index];
            hero?.style.setProperty('--rw-foot', footFraction.toFixed(4));

            this.bodyEls.forEach((b) => {
              const idx = Number(b.dataset.index) % 6;
              if (idx === look.index) {
                b.style.setProperty('--rw-foot', footFraction.toFixed(4));
              }
            });
          }
        } catch {
          // Silent fallback
        }
      };
    });
  }

  // --- Observers ---
  private setupObservers(): void {
    // Stage resize observer (debounced via requestAnimationFrame to avoid undelivered notifications)
    this.stageObserver = new ResizeObserver(() => {
      if (this.roRAF !== null) {
        cancelAnimationFrame(this.roRAF);
      }
      this.roRAF = requestAnimationFrame(() => {
        this.roRAF = null;
        this.measure();
        this.renderAll();
        this.kick();
      });
    });
    this.stageObserver.observe(this.stage);

    // Section visibility observer
    this.visObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.kick();
          }
        });
      },
      { threshold: 0 }
    );
    this.visObserver.observe(this);

    // Reveal observer
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                this.classList.add('is-revealed');
              });
            });
            this.revealObserver?.disconnect();
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -22% 0px' }
    );
    this.revealObserver.observe(this);
  }

  // --- Events and Click Routing ---
  private setupEvents(): void {
    // Window resize (debounced)
    let resizeTimer: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        this.measure();
        this.renderAll();
        this.kick();
      }, 120);
    });

    // Panel hover
    this.panelContainer.addEventListener('pointerenter', () => {
      this.panelHover = true;
    });
    this.panelContainer.addEventListener('pointerleave', () => {
      this.panelHover = false;
    });

    // Delegated clicks inside section
    this.addEventListener('click', (e) => this.handleGlobalClick(e));

    // Pointer dragging on stage
    this.stage.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointercancel', (e) => this.onPointerUp(e));

    // Wheel navigation
    this.stage.addEventListener(
      'wheel',
      (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault();
          const now = performance.now();
          if (now < this.wheelLockUntil) return;

          this.wheelAcc += e.deltaX;
          if (Math.abs(this.wheelAcc) > 45) {
            if (this.wheelAcc > 0) this.next();
            else this.prev();
            this.wheelAcc = 0;
            this.wheelLockUntil = now + 520;
          }
        }
      },
      { passive: false }
    );

    // Keyboard navigation
    this.stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.isMobile && this.currentActivePicker) {
          const card = this.pickerParentCard;
          this.dockSheet();
          card?.querySelector<HTMLButtonElement>('[data-rw-add]')?.focus();
        } else if (this.zoomed) {
          this.closePopup();
        }
      }
    });

    // Row hover hot linking
    this.panelContainer.addEventListener('pointerover', (e) => {
      const card = (e.target as HTMLElement)?.closest<HTMLElement>('[data-rw-card]');
      if (card && card.dataset.rwCard) {
        this.hot(Number(card.dataset.rwCard), false);
      }
    });
    this.panelContainer.addEventListener('pointerout', (e) => {
      const card = (e.target as HTMLElement)?.closest<HTMLElement>('[data-rw-card]');
      if (card && !card.contains(e.relatedTarget as Node | null)) {
        this.clearHot();
      }
    });
  }

  // --- Click Routing (priority order per section 9.2) ---
  private handleGlobalClick(e: MouseEvent): void {
    if (performance.now() < this.suppressClicksUntil) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const target = e.target as HTMLElement;

    // 1. Pick-close
    const pickClose = target.closest('[data-rw-pick-close]');
    if (pickClose) {
      e.preventDefault();
      this.dockSheet();
      return;
    }

    // 2. Popup close button
    const zoomClose = target.closest('[data-rw-zoom-close]');
    if (zoomClose) {
      e.preventDefault();
      this.closePopup();
      return;
    }

    // 3. Popup backdrop / stage click
    if (this.zoomed && target === this.lbStage) {
      e.preventDefault();
      this.closePopup();
      return;
    }

    // 4. Zoom button
    const zoomBtn = target.closest('[data-rw-zoom]');
    if (zoomBtn) {
      e.preventDefault();
      this.openPopup();
      return;
    }

    // 5. Next
    const nextBtn = target.closest('[data-rw-next]');
    if (nextBtn) {
      e.preventDefault();
      this.next();
      return;
    }

    // 6. Prev
    const prevBtn = target.closest('[data-rw-prev]');
    if (prevBtn) {
      e.preventDefault();
      this.prev();
      return;
    }

    // 7. Tick button
    const tickBtn = target.closest('[data-rw-tick]') as HTMLButtonElement | null;
    if (tickBtn) {
      e.preventDefault();
      const idx = Number(tickBtn.dataset.rwTick);
      this.go(idx);
      return;
    }

    // 9. Pin click
    const pinBtn = target.closest('[data-rw-pin]') as HTMLElement | null;
    if (pinBtn) {
      e.preventDefault();
      this.engage();
      const n = Number(pinBtn.dataset.rwPin);
      this.hot(n, true);
      return;
    }

    // 10. Queue body hit [data-rw-go]
    const hitBtn = target.closest('[data-rw-go]') as HTMLElement | null;
    if (hitBtn) {
      e.preventDefault();
      const a = Number(hitBtn.dataset.rwGo);
      let k = ((a - this.index) % 12 + 12) % 12;
      if (k > 6) k -= 12;

      if (k === 0) {
        this.openPopup();
      } else if (Math.abs(k) < 6) {
        this.moveTo(Math.round(this.target) + k);
      }
      return;
    }

    // 11. Size Confirm button
    const confirmBtn = target.closest('[data-rw-confirm]') as HTMLButtonElement | null;
    if (confirmBtn) {
      e.preventDefault();
      this.engage();
      this.handleConfirm(confirmBtn);
      return;
    }

    // 12. Plus button
    const addBtn = target.closest('[data-rw-add]') as HTMLButtonElement | null;
    if (addBtn) {
      e.preventDefault();
      this.engage();
      this.handleAddToggle(addBtn);
      return;
    }

    // 13. Add full look CTA
    const allBtn = target.closest('[data-rw-all]');
    if (allBtn) {
      e.preventDefault();
      this.engage();
      this.handleAddFullLook();
      return;
    }

    // Pill radio clicks
    const pill = target.closest('.rw__pill');
    if (pill) {
      this.engage();
      const input = pill.querySelector('input');
      if (input && !input.checked) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  // --- Add/Confirm Actions ---
  private handleAddToggle(btn: HTMLButtonElement): void {
    const card = btn.closest<HTMLElement>('.rw__item');
    if (!card || card.classList.contains('is-added')) return;

    const picker = card.querySelector<HTMLElement>('[data-rw-picker]');
    if (!picker) return;

    const isCurrentlyPicking = card.classList.contains('is-picking');

    if (isCurrentlyPicking) {
      // Close picker
      if (this.isMobile) {
        this.dockSheet();
      } else {
        picker.hidden = true;
        card.classList.remove('is-picking');
        btn.setAttribute('aria-expanded', 'false');
      }
    } else {
      // Open picker
      card.classList.add('is-picking');
      btn.setAttribute('aria-expanded', 'true');

      if (this.isMobile) {
        this.openMobileSheet(picker, card);
      } else {
        picker.hidden = false;
        const checkedRadio = picker.querySelector<HTMLInputElement>('input[type="radio"]:checked');
        checkedRadio?.focus({ preventScroll: true });
      }
    }
  }

  private handleConfirm(btn: HTMLButtonElement): void {
    const card = btn.closest<HTMLElement>('.rw__item') || this.pickerParentCard;
    if (!card) return;

    const picker = btn.closest<HTMLElement>('.rw__picker') || this.currentActivePicker;
    if (!picker) return;

    const checkedRadio = picker.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    if (!checkedRadio) return;

    const variantId = Number(checkedRadio.value);
    card.dataset.touched = '1';
    card.dataset.selected = String(variantId);

    // Loading state
    card.classList.add('is-loading');

    setTimeout(() => {
      try {
        bag.add([{ id: variantId, quantity: 1 }]);

        card.classList.remove('is-loading', 'is-picking');
        card.classList.add('is-added');

        const addBtn = card.querySelector<HTMLButtonElement>('[data-rw-add]');
        if (addBtn) {
          addBtn.setAttribute('aria-label', addBtn.dataset.addedLabel || 'Added to bag');
          addBtn.removeAttribute('aria-expanded');
        }

        if (this.isMobile) {
          this.dockSheet();
        } else {
          picker.hidden = true;
        }

        // Haptic feedback
        if ('vibrate' in navigator && !this.reducedMotion) {
          try {
            navigator.vibrate(12);
          } catch {}
        }

        this.checkLookCompletion();
      } catch (err: unknown) {
        card.classList.remove('is-loading');
        const activePanel = this.lookPanels[this.index];
        const msg = activePanel.querySelector('[data-rw-msg]') as HTMLElement | null;
        if (msg) {
          msg.textContent = (err as Error).message || this.dataset.msgError || "Couldn't add to bag.";
          msg.hidden = false;
        }
      }
    }, 400);
  }

  private handleAddFullLook(): void {
    const activePanel = this.lookPanels[this.index];
    if (!activePanel || activePanel.classList.contains('is-complete')) return;

    const cta = activePanel.querySelector<HTMLButtonElement>('[data-rw-all]');
    if (!cta || cta.classList.contains('is-loading')) return;

    const msg = activePanel.querySelector<HTMLElement>('[data-rw-msg]');
    if (msg) {
      msg.textContent = '';
      msg.hidden = true;
    }

    const cards = Array.from(
      activePanel.querySelectorAll<HTMLElement>('.rw__item:not(.is-added)')
    );
    if (!cards.length) return;

    const readyItems: Array<{ id: number; quantity: number }> = [];
    const pendingTitles: string[] = [];
    const pendingCards: HTMLElement[] = [];

    cards.forEach((card) => {
      const touched = card.dataset.touched === '1';
      const selected = card.dataset.selected ? Number(card.dataset.selected) : null;

      if (touched && selected) {
        readyItems.push({ id: selected, quantity: 1 });
      } else {
        const title = card.dataset.title || 'Product';
        pendingTitles.push(title);
        pendingCards.push(card);
      }
    });

    if (pendingCards.length > 0) {
      // Missing sizes
      const chooseTpl = this.dataset.msgChoose || 'Pick a size for: [items]';
      if (msg) {
        msg.textContent = chooseTpl.replace('[items]', pendingTitles.join(', '));
        msg.hidden = false;
      }

      if (this.isMobile) {
        // Open first pending card sheet
        const first = pendingCards[0];
        const picker = first.querySelector<HTMLElement>('[data-rw-picker]');
        if (picker) {
          this.openMobileSheet(picker, first);
        }
      } else {
        // Open all pending pickers
        pendingCards.forEach((c) => {
          c.classList.add('is-picking');
          const picker = c.querySelector<HTMLElement>('[data-rw-picker]');
          if (picker) picker.hidden = false;
          c.querySelector('[data-rw-add]')?.setAttribute('aria-expanded', 'true');
        });
        pendingCards[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    if (readyItems.length > 0) {
      cta.classList.add('is-loading');
      cards
        .filter((c) => c.dataset.touched === '1')
        .forEach((c) => c.classList.add('is-loading'));

      setTimeout(() => {
        try {
          bag.add(readyItems);

          cards
            .filter((c) => c.dataset.touched === '1')
            .forEach((c) => {
              c.classList.remove('is-loading', 'is-picking');
              c.classList.add('is-added');
              const picker = c.querySelector<HTMLElement>('[data-rw-picker]');
              if (picker) picker.hidden = true;
              const addBtn = c.querySelector<HTMLButtonElement>('[data-rw-add]');
              if (addBtn) {
                addBtn.setAttribute('aria-label', addBtn.dataset.addedLabel || 'Added to bag');
                addBtn.removeAttribute('aria-expanded');
              }
            });

          cta.classList.remove('is-loading');
          this.checkLookCompletion();
        } catch {
          cta.classList.remove('is-loading');
          cards.forEach((c) => c.classList.remove('is-loading'));
          if (msg) {
            msg.textContent = this.dataset.msgError || "Couldn't add to bag.";
            msg.hidden = false;
          }
        }
      }, 500);
    }
  }

  private checkLookCompletion(): void {
    const activePanel = this.lookPanels[this.index];
    if (!activePanel) return;

    const cards = Array.from(activePanel.querySelectorAll<HTMLElement>('.rw__item'));
    const allAdded = cards.every((c) => c.classList.contains('is-added'));

    if (allAdded && cards.length >= 2) {
      activePanel.classList.add('is-complete');
      const msg = activePanel.querySelector<HTMLElement>('[data-rw-msg]');
      if (msg) {
        msg.textContent = '';
        msg.hidden = true;
      }
    }
  }

  // --- Pointer Drag / Gesture (Stage) ---
  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    this.isDragging = false;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragStartTarget = this.target;
    this.dragPointerId = e.pointerId;
    this.dragSamples = [{ x: e.clientX, time: performance.now() }];
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.dragPointerId !== e.pointerId) return;

    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;

    if (!this.isDragging) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        this.dragPointerId = -1; // release for vertical scroll
        return;
      }
      if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
        this.isDragging = true;
        this.classList.add('is-dragging');
        this.stage.setPointerCapture?.(this.dragPointerId);
      }
    }

    if (this.isDragging) {
      this.dragSamples.push({ x: e.clientX, time: performance.now() });
      if (this.dragSamples.length > 6) this.dragSamples.shift();

      this.target = this.dragStartTarget - dx / this.unit;
      this.kick();
    }
  }

  private onPointerUp(e: PointerEvent): void {
    if (this.dragPointerId !== e.pointerId) return;
    this.dragPointerId = -1;

    if (!this.isDragging) return;

    this.isDragging = false;
    this.classList.remove('is-dragging');
    this.suppressClicksUntil = performance.now() + 60;

    const first = this.dragSamples[0];
    const last = this.dragSamples[this.dragSamples.length - 1];
    const vx =
      last && first && last.time !== first.time
        ? (last.x - first.x) / (last.time - first.time)
        : 0;

    const dx = e.clientX - this.dragStartX;
    const from = Math.round(this.dragStartTarget);

    if (this.isMobile) {
      if (Math.abs(dx) > 30 || Math.abs(vx) > 0.3) {
        this.moveTo(from + (dx > 0 ? -1 : 1));
      } else {
        this.moveTo(from);
      }
    } else {
      let i = Math.round(this.target - (vx * 160) / this.unit);
      if (i === from && Math.abs(vx) > 0.3) {
        i += vx < 0 ? 1 : -1;
      }
      i = Math.max(from - 2, Math.min(from + 2, i));
      this.moveTo(i);
    }
  }
}

if (!customElements.get('runway-section')) {
  customElements.define('runway-section', RunwaySection);
}
