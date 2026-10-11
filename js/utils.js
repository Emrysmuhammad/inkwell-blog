(function (Inkwell) {
  'use strict';

  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);
  }

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  function pluralize(count, word) {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
  }

  function countWords(text) {
    const words = String(text).trim().match(/\S+/g);
    return words ? words.length : 0;
  }

  function readingTime(text) {
    return Math.max(1, Math.ceil(countWords(text) / 200));
  }

  function formatDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function timeAgo(iso) {
    const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (Number.isNaN(seconds) || seconds < 45) return 'just now';

    const units = [
      ['year', 31536000],
      ['month', 2592000],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
    ];

    for (const [name, size] of units) {
      const value = Math.floor(seconds / size);
      if (value >= 1) return `${value} ${name}${value > 1 ? 's' : ''} ago`;
    }
    return 'just now';
  }

  function stripMarkdown(markdown) {
    return String(markdown)
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/^\s*([-*]|\d+\.)\s+/gm, '')
      .replace(/(\*\*|~~|`|\*)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function truncate(text, limit) {
    if (text.length <= limit) return text;
    const cut = text.slice(0, limit);
    const lastSpace = cut.lastIndexOf(' ');
    return `${cut.slice(0, lastSpace > 40 ? lastSpace : limit).replace(/[.,;:!?-]+$/, '')}…`;
  }

  function excerpt(post, limit = 150) {
    return truncate(post.excerpt ? post.excerpt : stripMarkdown(post.content), limit);
  }

  function initials(name) {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  function avatar(name, size = '') {
    let hue = 0;
    for (const char of String(name)) hue = (hue * 31 + char.charCodeAt(0)) % 360;
    return `<span class="avatar ${size}" style="--hue:${hue}" aria-hidden="true">${escapeHtml(initials(name))}</span>`;
  }

  function safeUrl(url) {
    const value = String(url ?? '').trim();
    return /^https?:\/\//i.test(value) ? value : '';
  }

  function debounce(fn, wait) {
    let timer;
    const debounced = (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
  }

  function legacyCopy(text) {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }
    field.remove();
    return copied;
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        return legacyCopy(text);
      }
    }
    return legacyCopy(text);
  }

  function downloadFile(filename, content, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  Inkwell.utils = {
    $,
    $$,
    escapeHtml,
    slugify,
    uid,
    pluralize,
    countWords,
    readingTime,
    formatDate,
    timeAgo,
    stripMarkdown,
    truncate,
    excerpt,
    initials,
    avatar,
    safeUrl,
    debounce,
    copyToClipboard,
    downloadFile,
  };
})((window.Inkwell = window.Inkwell || {}));