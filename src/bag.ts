/**
 * Styling Bag implementation (localStorage + dialog + toast + export)
 */

import { CATALOG_ITEMS, CatalogItem, ProductVariant } from './catalog.ts';

export interface BagEntry {
  id: number;
  quantity: number;
}

const STORAGE_KEY = 'runway-styling-bag-v3';

// Lookup variant ID -> { product, variant, size }
export function findVariantInfo(variantId: number): { product: CatalogItem; variant: ProductVariant; size: string } | null {
  for (const item of Object.values(CATALOG_ITEMS)) {
    for (const v of item.variants) {
      if (v.id === variantId) {
        return { product: item, variant: v, size: v.o[0] || '' };
      }
    }
  }
  return null;
}

class StylingBag {
  private entries: BagEntry[] = [];
  private toastTimer: number | null = null;

  constructor() {
    this.load();
    this.updateCounters();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.entries = [];
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        this.entries = [];
        return;
      }
      this.entries = parsed
        .filter((entry): entry is BagEntry => {
          return (
            entry &&
            typeof entry === 'object' &&
            Number.isSafeInteger(entry.id) &&
            Number.isSafeInteger(entry.quantity) &&
            entry.quantity >= 1 &&
            entry.quantity <= 20
          );
        })
        .slice(0, 50);
    } catch {
      this.entries = [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
    this.updateCounters();
  }

  public getCount(): number {
    return this.entries.reduce((sum, item) => sum + item.quantity, 0);
  }

  public updateCounters(): void {
    const total = this.getCount();
    const countEls = document.querySelectorAll<HTMLElement>('[data-cart-count]');
    countEls.forEach((el) => {
      el.textContent = String(total);
    });
  }

  public showToast(message: string): void {
    const toast = document.getElementById('bag-status');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-on');

    if (this.toastTimer !== null) {
      window.clearTimeout(this.toastTimer);
    }
    this.toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-on');
      this.toastTimer = null;
    }, 2500);
  }

  public add(items: Array<{ id: number; quantity: number }>): void {
    if (!items.length) return;

    for (const item of items) {
      const info = findVariantInfo(item.id);
      if (!info || !info.variant.a) {
        throw new Error('Please choose an available size.');
      }
    }

    for (const item of items) {
      const existing = this.entries.find((e) => e.id === item.id);
      if (existing) {
        existing.quantity = Math.min(20, existing.quantity + item.quantity);
      } else {
        if (this.entries.length < 50) {
          this.entries.push({ id: item.id, quantity: Math.min(20, item.quantity) });
        }
      }
    }

    this.save();
    this.renderDialog();

    if (items.length === 1) {
      this.showToast('Piece saved to your styling bag');
    } else {
      this.showToast('Look saved to your styling bag');
    }
  }

  public remove(variantId: number): void {
    this.entries = this.entries.filter((e) => e.id !== variantId);
    this.save();
    this.renderDialog();
  }

  public renderDialog(): void {
    const itemsContainer = document.getElementById('bag-items');
    const totalEl = document.getElementById('bag-total');
    const exportBtn = document.getElementById('export-bag') as HTMLButtonElement | null;
    if (!itemsContainer) return;

    if (this.entries.length === 0) {
      itemsContainer.innerHTML =
        '<p class="bag-note">Your styling bag is empty. Choose a size beside a piece to save it.</p>';
      if (totalEl) totalEl.textContent = '';
      if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.style.opacity = '0.4';
      }
      return;
    }

    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.style.opacity = '1';
    }

    let subtotal = 0;
    let html = '';

    for (const entry of this.entries) {
      const info = findVariantInfo(entry.id);
      if (!info) continue;

      const urlObj = new URL(info.product.url);
      if (urlObj.hostname !== 'nike-makknzjs.myshopify.com') {
        throw new Error('Invalid product hostname');
      }

      const itemTotal = info.product.price * entry.quantity;
      subtotal += itemTotal;

      const formattedPrice = `$${info.product.price.toFixed(2)}`;

      html += `
        <div class="bag-row" data-id="${entry.id}">
          <img src="${info.product.image}" alt="${info.product.name}" class="bag-row-img" width="60" height="80" />
          <div class="bag-row-info">
            <h3 class="bag-row-title">${info.product.name}</h3>
            <p class="bag-row-meta">Size ${info.size} · Quantity ${entry.quantity} · ${formattedPrice}</p>
            <a href="${info.product.url}" target="_blank" rel="noopener noreferrer" class="bag-row-link">View original piece ↗</a>
          </div>
          <button class="bag-remove" data-remove-id="${entry.id}" aria-label="Remove ${info.product.name}">×</button>
        </div>
      `;
    }

    itemsContainer.innerHTML = html;

    if (totalEl) {
      totalEl.textContent = `Reference subtotal $${subtotal.toFixed(2)}`;
    }

    // Attach remove handlers
    const removeBtns = itemsContainer.querySelectorAll<HTMLButtonElement>('[data-remove-id]');
    removeBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.getAttribute('data-remove-id'));
        if (id) {
          this.remove(id);
        }
      });
    });
  }

  public exportShortlist(): void {
    if (this.entries.length === 0) return;

    const lines: string[] = [
      'RUNWAY — STYLING SHORTLIST',
      '',
      'Reference prices; no order or payment has been placed.',
      '',
    ];

    for (const entry of this.entries) {
      const info = findVariantInfo(entry.id);
      if (!info) continue;
      lines.push(`${info.product.name} · Size ${info.size} · Quantity ${entry.quantity}`);
      lines.push(info.product.url);
      lines.push('');
    }

    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'runway-outfit-shortlist.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    window.setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  }

  public setupUI(): void {
    const openBtn = document.getElementById('open-bag');
    const dialog = document.getElementById('bag-dialog') as HTMLDialogElement | null;
    const closeBtn = document.getElementById('close-bag');
    const exportBtn = document.getElementById('export-bag');

    if (openBtn && dialog) {
      openBtn.addEventListener('click', () => {
        this.renderDialog();
        dialog.showModal();
      });
    }

    if (closeBtn && dialog) {
      closeBtn.addEventListener('click', () => {
        dialog.close();
      });
    }

    if (dialog) {
      dialog.addEventListener('click', (e) => {
        const rect = dialog.getBoundingClientRect();
        const inDialog =
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width;
        if (!inDialog) {
          dialog.close();
        }
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportShortlist();
      });
    }
  }
}

export const bag = new StylingBag();
