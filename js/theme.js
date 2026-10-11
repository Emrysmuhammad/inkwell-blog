(function (Inkwell) {
  'use strict';

  const KEY = 'inkwell:theme';

  function current() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function toggle() {
    const next = current() === 'dark' ? 'light' : 'dark';
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch (error) {
      console.warn('Unable to save the theme preference', error);
    }
    return next;
  }

  function hasSavedPreference() {
    try {
      return localStorage.getItem(KEY) !== null;
    } catch (error) {
      return false;
    }
  }

  function init() {
    apply(current());

    const button = document.getElementById('theme-toggle');
    if (button) button.addEventListener('click', toggle);

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        if (!hasSavedPreference()) apply(event.matches ? 'dark' : 'light');
      });
    }
  }

  Inkwell.theme = { init, toggle, current };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})((window.Inkwell = window.Inkwell || {}));