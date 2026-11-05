/**
 * Entry point for "Try the Look. — Runway"
 */

import './index.css';
import './runway-section.ts';
import { bag } from './bag.ts';

// Ignore benign ResizeObserver notifications that browsers surface as window errors
window.addEventListener('error', (e) => {
  if (
    e.message?.includes('ResizeObserver loop completed with undelivered notifications') ||
    e.message?.includes('ResizeObserver loop limit exceeded')
  ) {
    e.stopImmediatePropagation();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  bag.setupUI();
});
