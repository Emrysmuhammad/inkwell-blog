(function (Inkwell) {
  'use strict';

  const { escapeHtml, avatar, excerpt, formatDate, readingTime, safeUrl } = Inkwell.utils;

  const ICONS = {
    heart: '<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 000-7.8z"/>',
    comment: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
    link: '<path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>',
    'arrow-left': '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    file: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>',
  };

  function icon(name, size = 18) {
    return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  function toast(message, type = 'info', duration = 3200) {
    const root = document.getElementById('toast-root');
    if (!root) return;

    const element = document.createElement('div');
    element.className = `toast toast-${type}`;
    element.textContent = message;
    root.appendChild(element);

    setTimeout(() => element.classList.add('show'), 10);
    setTimeout(() => {
      element.classList.remove('show');
      setTimeout(() => element.remove(), 300);
    }, duration);
  }

  function openModal({ title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, collect = null }) {
    return new Promise((resolve) => {
      const root = document.getElementById('modal-root');
      const previous = document.activeElement;

      root.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 class="modal-title" id="modal-title">${escapeHtml(title)}</h2>
            <div class="modal-body">${body}</div>
            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" data-cancel>${escapeHtml(cancelLabel)}</button>
              <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${escapeHtml(confirmLabel)}</button>
            </div>
          </div>
        </div>`;

      const backdrop = root.firstElementChild;
      const dialog = backdrop.querySelector('.modal');
      const cancelValue = collect ? null : false;

      function close(value) {
        document.removeEventListener('keydown', onKeyDown);
        root.innerHTML = '';
        if (previous && typeof previous.focus === 'function') previous.focus();
        resolve(value);
      }

      function submit() {
        const value = collect ? collect(dialog) : true;
        if (value !== undefined) close(value);
      }

      function onKeyDown(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          close(cancelValue);
        } else if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
          event.preventDefault();
          submit();
        } else if (event.key === 'Tab') {
          const focusable = Array.from(dialog.querySelectorAll('button, input, textarea, select, a[href]'));
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }

      backdrop.addEventListener('mousedown', (event) => {
        if (event.target === backdrop) close(cancelValue);
      });
      dialog.querySelector('[data-cancel]').addEventListener('click', () => close(cancelValue));
      dialog.querySelector('[data-confirm]').addEventListener('click', submit);
      document.addEventListener('keydown', onKeyDown);

      const firstField = dialog.querySelector('input, textarea');
      (firstField || dialog.querySelector('[data-confirm]')).focus();
    });
  }

  function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false }) {
    return openModal({ title, body: `<p>${escapeHtml(message)}</p>`, confirmLabel, danger }).then(Boolean);
  }

  function promptText({ title, label, value = '', confirmLabel = 'Save', maxLength = 40 }) {
    return openModal({
      title,
      confirmLabel,
      body: `
        <label class="field-label" for="prompt-input">${escapeHtml(label)}</label>
        <input class="input" id="prompt-input" type="text" maxlength="${maxLength}" value="${escapeHtml(value)}" autocomplete="off">
        <p class="field-error" id="prompt-error" role="alert"></p>`,
      collect(dialog) {
        const input = dialog.querySelector('#prompt-input');
        const entered = input.value.trim();
        if (entered.length < 2) {
          dialog.querySelector('#prompt-error').textContent = 'Please enter at least 2 characters.';
          input.focus();
          return undefined;
        }
        return entered;
      },
    });
  }

  function cover(url, alt = '') {
    const source = safeUrl(url);
    const image = source ? `<img src="${escapeHtml(source)}" alt="${escapeHtml(alt)}" loading="lazy">` : '';
    return `<div class="cover">${image}</div>`;
  }

  function tagButtons(tags, limit = tags.length) {
    return tags
      .slice(0, limit)
      .map((tag) => `<button type="button" class="tag" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`)
      .join('');
  }

  function meta(post) {
    return `
      <div class="card-meta">
        ${avatar(post.author, 'sm')}
        <span class="meta-author">${escapeHtml(post.author)}</span>
        <span class="meta-dot" aria-hidden="true">&middot;</span>
        <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
        <span class="meta-dot" aria-hidden="true">&middot;</span>
        <span>${readingTime(post.content)} min read</span>
        <span class="meta-likes" title="Likes">${icon('heart', 14)} ${post.likes}</span>
      </div>`;
  }

  function postCard(post) {
    const href = `#/post/${encodeURIComponent(post.id)}`;
    return `
      <article class="card">
        <a class="card-cover" href="${href}" tabindex="-1" aria-hidden="true">${cover(post.cover)}</a>
        <div class="card-body">
          <div class="tag-row">${tagButtons(post.tags, 2)}</div>
          <h3 class="card-title"><a href="${href}">${escapeHtml(post.title)}</a></h3>
          <p class="card-excerpt">${escapeHtml(excerpt(post, 120))}</p>
          ${meta(post)}
        </div>
      </article>`;
  }

  Inkwell.ui = {
    icon,
    toast,
    confirm: confirmDialog,
    promptText,
    cover,
    tagButtons,
    meta,
    postCard,
  };
})((window.Inkwell = window.Inkwell || {}));