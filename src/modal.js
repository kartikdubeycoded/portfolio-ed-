import { details } from './data.js';

const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
const modalDocId = document.getElementById('modal-docid');
let lenisRef = null;

// Stable doc-id labels per key — gives the dossier feeling of indexing
const DOC_IDS = {
  'katti':      'DOC · K/00 · katti',
  'katti-os':   'DOC · P/01 · katti-os',
  'lexara':     'DOC · P/02 · lexara',
  'grpo':       'DOC · P/03 · grpo',
  'tribe':      'DOC · P/04 · tribe',
  'tcs':        'DOC · E/01 · tcs',
  'reliance':   'DOC · E/02 · reliance',
  'independent':'DOC · E/03 · independent',
};

export function initModal(lenis) {
  lenisRef = lenis;

  document.querySelectorAll('[data-modal]').forEach((el) => {
    el.addEventListener('click', () => open(el.dataset.modal));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(el.dataset.modal);
      }
    });
  });

  modal.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
}

function open(key) {
  const d = details[key];
  if (!d) return;
  modalContent.innerHTML = `
    <p class="modal-tag">${d.tag}</p>
    <h2 class="modal-title">${d.title}</h2>
    <div class="modal-body">${d.body}</div>
  `;
  if (modalDocId) modalDocId.textContent = DOC_IDS[key] || 'DOC · ——';
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  modalContent.scrollTop = 0;
  if (lenisRef) lenisRef.stop();
}

function close() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  if (lenisRef) lenisRef.start();
}
