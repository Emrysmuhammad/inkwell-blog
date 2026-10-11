(function (Inkwell) {
  'use strict';

  const { $, avatar } = Inkwell.utils;

  function updateProfile() {
    const name = Inkwell.store.getAuthor();
    const button = $('#profile-btn');
    button.innerHTML = avatar(name);
    button.setAttribute('aria-label', `Writing as ${name}. Change display name`);
    button.title = `Writing as ${name}. Click to change`;
  }

  async function changeName() {
    const name = await Inkwell.ui.promptText({
      title: 'Your display name',
      label: 'This name appears on the articles and comments you write.',
      value: Inkwell.store.getAuthor(),
      confirmLabel: 'Save name',
    });

    if (name) {
      Inkwell.store.setAuthor(name);
      Inkwell.ui.toast(`Display name updated to ${name}`, 'success');
    }
  }

  function setupMenu() {
    const header = $('#site-header');
    const button = $('#menu-btn');

    function setOpen(open) {
      header.classList.toggle('nav-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    button.addEventListener('click', () => setOpen(!header.classList.contains('nav-open')));
    window.addEventListener('hashchange', () => setOpen(false));
  }

  function start() {
    Inkwell.store.load();
    updateProfile();
    Inkwell.store.subscribe(updateProfile);
    $('#profile-btn').addEventListener('click', changeName);
    setupMenu();
    Inkwell.router.start();
  }

  document.addEventListener(
    'error',
    (event) => {
      if (event.target.tagName === 'IMG') event.target.classList.add('img-error');
    },
    true
  );

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})((window.Inkwell = window.Inkwell || {}));