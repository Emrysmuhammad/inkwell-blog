(function (Inkwell) {
  'use strict';

  const { store, router, ui } = Inkwell;
  const { $, escapeHtml, formatDate, countWords, downloadFile, safeUrl } = Inkwell.utils;

  const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
  const MIN_WORDS = 30;

  function statCard(label, value) {
    return `<div class="stat-card"><span class="stat-value">${value}</span><span class="stat-label">${label}</span></div>`;
  }

  function rowHtml(post) {
    const id = encodeURIComponent(post.id);
    const published = post.status === 'published';
    const cover = safeUrl(post.cover);

    return `
      <li class="post-row" data-id="${escapeHtml(post.id)}">
        <a class="row-thumb" href="#/post/${id}" tabindex="-1" aria-hidden="true">${ui.cover(cover)}</a>
        <div class="row-main">
          <a class="row-title" href="#/post/${id}">${escapeHtml(post.title)}</a>
          <div class="row-meta">
            <span class="badge ${published ? 'badge-published' : 'badge-draft'}">${published ? 'Published' : 'Draft'}</span>
            <span>${formatDate(post.date)}</span>
            <span>${countWords(post.content)} words</span>
            <span>${ui.icon('heart', 13)} ${post.likes}</span>
            <span>${ui.icon('comment', 13)} ${store.getComments(post.id).length}</span>
          </div>
        </div>
        <div class="row-actions">
          <a class="btn btn-ghost btn-sm" href="#/edit/${id}">${ui.icon('edit', 15)} Edit</a>
          <a class="btn btn-ghost btn-sm" href="#/post/${id}">${ui.icon('eye', 15)} ${published ? 'View' : 'Preview'}</a>
          <button type="button" class="btn btn-ghost btn-sm" data-toggle-status>${published ? 'Unpublish' : 'Publish'}</button>
          <button type="button" class="btn btn-ghost btn-sm danger-text" data-delete aria-label="Delete ${escapeHtml(post.title)}">${ui.icon('trash', 15)}</button>
        </div>
      </li>`;
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('The file could not be read.'));
      reader.readAsText(file);
    });
  }

  function view(ctx, root) {
    let filter = 'all';

    root.innerHTML = `
      <div class="container page-dashboard">
        <div class="dash-head">
          <div>
            <h1>My posts</h1>
            <p class="muted">Writing as <strong>${escapeHtml(store.getAuthor())}</strong>. Manage your articles, drafts and data.</p>
          </div>
          <a class="btn btn-primary" href="#/write">${ui.icon('plus', 16)} New article</a>
        </div>

        <div class="stat-grid" id="stats"></div>

        <div class="tabs" role="group" aria-label="Filter posts" id="tabs"></div>
        <ul class="post-list" id="post-list"></ul>

        <section class="data-tools">
          <h2 class="section-title">Backup and data</h2>
          <p class="muted">Everything lives in this browser. Export a backup to keep a copy or move to another device.</p>
          <div class="tool-actions">
            <button type="button" class="btn btn-outline" data-export>${ui.icon('download', 16)} Export backup</button>
            <label class="btn btn-outline file-btn">
              ${ui.icon('upload', 16)} Import backup
              <input type="file" id="import-file" accept="application/json,.json" hidden>
            </label>
            <button type="button" class="btn btn-ghost danger-text" data-reset>Reset demo data</button>
          </div>
        </section>
      </div>`;

    const page = $('.page-dashboard', root);
    const list = $('#post-list', root);

    function render() {
      const stats = store.stats();
      const all = store.getPosts({ status: 'all' });
      const shown = filter === 'all' ? all : all.filter((post) => post.status === filter);

      $('#stats', root).innerHTML =
        statCard('Published', stats.published) +
        statCard('Drafts', stats.drafts) +
        statCard('Total likes', stats.likes) +
        statCard('Comments', stats.comments);

      const tabs = [
        ['all', 'All', all.length],
        ['published', 'Published', stats.published],
        ['draft', 'Drafts', stats.drafts],
      ];
      $('#tabs', root).innerHTML = tabs
        .map(
          ([value, label, count]) =>
            `<button type="button" class="tab" data-filter="${value}" aria-pressed="${filter === value}">${label} <span class="tab-count">${count}</span></button>`
        )
        .join('');

      if (!shown.length) {
        list.innerHTML = `
          <li class="empty-state">
            <h2>${all.length ? 'Nothing in this tab' : 'You have not written anything yet'}</h2>
            <p>${all.length ? 'Switch tabs to see your other articles.' : 'Start your first article. It only takes a few minutes.'}</p>
            <a class="btn btn-primary" href="#/write">Write an article</a>
          </li>`;
        return;
      }

      list.innerHTML = shown.map(rowHtml).join('');
    }

    page.addEventListener('click', async (event) => {
      const tab = event.target.closest('[data-filter]');
      if (tab) {
        filter = tab.dataset.filter;
        render();
        return;
      }

      const row = event.target.closest('[data-id]');
      const post = row ? store.getPost(row.dataset.id) : null;

      if (post && event.target.closest('[data-toggle-status]')) {
        if (post.status === 'draft' && (countWords(post.content) < MIN_WORDS || !post.tags.length)) {
          ui.toast(`Finish this draft first: it needs a tag and at least ${MIN_WORDS} words.`, 'error', 4500);
          return;
        }
        const next = post.status === 'published' ? 'draft' : 'published';
        store.updatePost(post.id, { status: next });
        ui.toast(next === 'published' ? 'Article published' : 'Moved back to drafts', 'success');
        render();
        return;
      }

      if (post && event.target.closest('[data-delete]')) {
        const confirmed = await ui.confirm({
          title: 'Delete this article?',
          message: `"${post.title}" and its comments will be permanently removed.`,
          confirmLabel: 'Delete article',
          danger: true,
        });
        if (confirmed) {
          store.deletePost(post.id);
          ui.toast('Article deleted', 'success');
          render();
        }
        return;
      }

      if (event.target.closest('[data-export]')) {
        const stamp = new Date().toISOString().slice(0, 10);
        downloadFile(`inkwell-backup-${stamp}.json`, store.exportData());
        ui.toast('Backup downloaded', 'success');
        return;
      }

      if (event.target.closest('[data-reset]')) {
        const confirmed = await ui.confirm({
          title: 'Reset to demo data?',
          message: 'Your articles, drafts and comments will be replaced with the original sample content.',
          confirmLabel: 'Reset everything',
          danger: true,
        });
        if (confirmed) {
          store.reset();
          ui.toast('Demo data restored', 'success');
          router.navigate('/dashboard', { replace: true });
        }
      }
    });

    $('#import-file', root).addEventListener('change', async (event) => {
      const input = event.target;
      const file = input.files && input.files[0];
      input.value = '';
      if (!file) return;

      if (file.size > MAX_IMPORT_BYTES) {
        ui.toast('That file is too large to be an Inkwell backup.', 'error');
        return;
      }

      try {
        const text = await readFile(file);
        const confirmed = await ui.confirm({
          title: 'Import this backup?',
          message: 'This replaces everything currently stored in this browser.',
          confirmLabel: 'Import backup',
          danger: true,
        });
        if (!confirmed) return;

        const result = store.importData(text);
        ui.toast(`Imported ${result.posts} articles and ${result.comments} comments`, 'success');
        router.navigate('/dashboard', { replace: true });
      } catch (error) {
        ui.toast(error.message, 'error', 5000);
      }
    });

    render();
    return { title: 'My posts' };
  }

  router.register('/dashboard', view);
})((window.Inkwell = window.Inkwell || {}));