(function (Inkwell) {
  'use strict';

  const { store, router, ui, markdown } = Inkwell;
  const { $, $$, escapeHtml, safeUrl, countWords, readingTime, debounce } = Inkwell.utils;

  const MAX_TAGS = 5;
  const AUTOSAVE_DELAY = 1500;
  const MIN_TITLE_LENGTH = 5;
  const MIN_WORDS = 30;

  const TOOLBAR = [
    { action: 'bold', label: 'Bold (Ctrl+B)', html: '<strong>B</strong>' },
    { action: 'italic', label: 'Italic (Ctrl+I)', html: '<em>I</em>' },
    { action: 'heading', label: 'Heading', html: 'H2' },
    { action: 'quote', label: 'Quote', html: '&ldquo;' },
    { action: 'list', label: 'Bulleted list', html: '&bull;&nbsp;List' },
    { action: 'numbered', label: 'Numbered list', html: '1.&nbsp;List' },
    { action: 'code', label: 'Inline code', html: '&lt;/&gt;' },
    { action: 'codeblock', label: 'Code block', html: '{ }' },
    { action: 'link', label: 'Link', html: 'Link' },
  ];

  function clock() {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function missing(root) {
    root.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <h1>Article not found</h1>
          <p>It may have been deleted, so there is nothing to edit.</p>
          <a class="btn btn-primary" href="#/write">Write a new article</a>
        </div>
      </div>`;
    return { title: 'Article not found' };
  }

  function wrapSelection(textarea, before, after, placeholder) {
    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const selected = value.slice(start, end) || placeholder;
    textarea.setRangeText(`${before}${selected}${after}`, start, end, 'preserve');
    textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
  }

  function prefixLines(textarea, prefix) {
    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const nextBreak = value.indexOf('\n', end);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const lines = value.slice(lineStart, lineEnd).split('\n');
    const alreadyPrefixed = lines.every((line) => line.startsWith(prefix));
    const updated = lines.map((line) => (alreadyPrefixed ? line.slice(prefix.length) : prefix + line)).join('\n');

    textarea.setRangeText(updated, lineStart, lineEnd, 'preserve');
    textarea.setSelectionRange(lineStart, lineStart + updated.length);
  }

  function insertLink(textarea) {
    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const label = value.slice(start, end) || 'link text';
    const replacement = `[${label}](https://)`;
    textarea.setRangeText(replacement, start, end, 'preserve');
    const urlStart = start + label.length + 3;
    textarea.setSelectionRange(urlStart, urlStart + 8);
  }

  function view(ctx, root) {
    const editingId = ctx.params.id || null;
    const existing = editingId ? store.getPost(editingId) : null;
    if (editingId && !existing) return missing(root);

    let currentId = existing ? existing.id : null;
    let status = existing ? existing.status : 'draft';
    let tags = existing ? existing.tags.slice() : [];
    let dirty = false;

    const covers = Inkwell.covers.slice(0, 8);

    root.innerHTML = `
      <div class="container page-editor">
        <div class="editor-bar">
          <div class="editor-status" id="save-status" role="status"></div>
          <div class="editor-actions">
            <button type="button" class="btn btn-ghost btn-sm preview-toggle" id="btn-preview" aria-pressed="false">${ui.icon('eye', 16)} Preview</button>
            <button type="button" class="btn btn-ghost btn-sm danger-text" id="btn-delete" hidden>${ui.icon('trash', 16)} Delete</button>
            <button type="button" class="btn btn-outline btn-sm" id="btn-save"></button>
            <button type="button" class="btn btn-primary btn-sm" id="btn-publish">Publish</button>
          </div>
        </div>

        <div class="editor-grid" id="editor-grid">
          <section class="editor-pane" aria-label="Editor">
            <label class="sr-only" for="title">Article title</label>
            <input class="title-input" id="title" type="text" maxlength="120" placeholder="Article title" autocomplete="off">

            <div class="field">
              <label class="field-label" for="cover">Cover image</label>
              <input class="input" id="cover" type="url" placeholder="Paste an image link (https://...) or pick one below" autocomplete="off">
              <div class="cover-picker" id="cover-picker">
                ${covers
                  .map(
                    (item) => `
                  <button type="button" class="cover-option" data-cover="${escapeHtml(item.url)}" title="${escapeHtml(item.label)}">
                    <img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.label)}" loading="lazy">
                  </button>`
                  )
                  .join('')}
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="tag-input">Tags <span class="muted">(up to ${MAX_TAGS}, press Enter or comma to add)</span></label>
              <div class="tag-field" id="tag-field">
                <span class="tag-chips" id="tag-chips"></span>
                <input id="tag-input" type="text" maxlength="24" placeholder="Add a tag" autocomplete="off">
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="excerpt">Short summary <span class="muted">(optional, shown on cards)</span></label>
              <textarea class="input" id="excerpt" rows="2" maxlength="200" placeholder="One or two sentences that make people want to read more"></textarea>
            </div>

            <div class="field">
              <label class="field-label" for="content">Article <span class="muted">(Markdown)</span></label>
              <div class="toolbar" role="toolbar" aria-label="Formatting">
                ${TOOLBAR.map((item) => `<button type="button" class="tool-btn" data-action="${item.action}" title="${item.label}" aria-label="${item.label}">${item.html}</button>`).join('')}
              </div>
              <textarea class="content-input" id="content" placeholder="Start writing. Use the toolbar or Markdown such as ## Heading, **bold** and - lists."></textarea>
              <div class="editor-meta" id="editor-meta"></div>
            </div>
          </section>

          <section class="preview-pane" aria-label="Live preview">
            <div class="preview-label">Live preview</div>
            <div class="preview-surface" id="preview"></div>
          </section>
        </div>
      </div>`;

    const page = $('.page-editor', root);
    const titleInput = $('#title', root);
    const coverInput = $('#cover', root);
    const excerptInput = $('#excerpt', root);
    const contentInput = $('#content', root);
    const tagInput = $('#tag-input', root);
    const tagChips = $('#tag-chips', root);
    const statusEl = $('#save-status', root);
    const preview = $('#preview', root);
    const meta = $('#editor-meta', root);
    const grid = $('#editor-grid', root);
    const btnSave = $('#btn-save', root);
    const btnPublish = $('#btn-publish', root);
    const btnDelete = $('#btn-delete', root);
    const btnPreview = $('#btn-preview', root);

    titleInput.value = existing ? existing.title : '';
    coverInput.value = existing ? existing.cover : '';
    excerptInput.value = existing ? existing.excerpt : '';
    contentInput.value = existing ? existing.content : '';

    const isPublished = () => status === 'published';

    function collect() {
      return {
        title: titleInput.value,
        content: contentInput.value,
        excerpt: excerptInput.value.trim(),
        cover: coverInput.value.trim(),
        tags: tags.slice(),
      };
    }

    function setStatus(message, kind = '') {
      statusEl.textContent = message;
      statusEl.className = `editor-status ${kind}`.trim();
    }

    function refreshActions() {
      btnSave.textContent = isPublished() ? 'Update article' : 'Save draft';
      btnSave.className = isPublished() ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
      btnPublish.hidden = isPublished();
      btnDelete.hidden = !currentId;
    }

    function refreshMeta() {
      const words = countWords(contentInput.value);
      meta.textContent = `${words} ${words === 1 ? 'word' : 'words'} \u00b7 ${readingTime(contentInput.value)} min read`;
    }

    function refreshCoverPicker() {
      $$('.cover-option', root).forEach((button) => {
        button.classList.toggle('selected', button.dataset.cover === coverInput.value.trim());
      });
    }

    const refreshPreview = debounce(() => {
      const cover = safeUrl(coverInput.value);
      const { html } = markdown.render(contentInput.value);
      const title = titleInput.value.trim();

      preview.innerHTML = `
        ${cover ? `<div class="preview-cover">${ui.cover(cover)}</div>` : ''}
        ${title ? `<h1 class="preview-title">${escapeHtml(title)}</h1>` : ''}
        <div class="prose">${html || '<p class="muted">Your article will appear here as you write.</p>'}</div>`;
    }, 120);

    function renderTags() {
      tagChips.innerHTML = tags
        .map(
          (tag, index) => `
        <span class="tag-chip">${escapeHtml(tag)}
          <button type="button" data-remove-tag="${index}" aria-label="Remove tag ${escapeHtml(tag)}">&times;</button>
        </span>`
        )
        .join('');
    }

    function addTag(raw) {
      const clean = raw.trim().replace(/\s+/g, ' ').slice(0, 24);
      tagInput.value = '';
      if (!clean) return;
      if (tags.some((tag) => tag.toLowerCase() === clean.toLowerCase())) return;
      if (tags.length >= MAX_TAGS) {
        ui.toast(`You can add up to ${MAX_TAGS} tags`, 'error');
        return;
      }
      tags.push(clean);
      tagInput.removeAttribute('aria-invalid');
      renderTags();
      markDirty();
    }

    function persist(nextStatus) {
      const data = { ...collect(), status: nextStatus };
      if (!data.title.trim()) data.title = 'Untitled draft';

      if (currentId) {
        store.updatePost(currentId, data);
      } else {
        const created = store.createPost(data);
        currentId = created.id;
        history.replaceState(null, '', `#/edit/${encodeURIComponent(created.id)}`);
      }
      status = nextStatus;

      if (store.hasSaveError()) ui.toast('Your browser storage is full. Export a backup and remove old posts.', 'error', 6000);
    }

    function autosave() {
      if (isPublished() || !dirty) return;
      const data = collect();
      if (!data.title.trim() && !data.content.trim()) return;
      persist('draft');
      dirty = false;
      setStatus(`Draft saved at ${clock()}`, 'saved');
      refreshActions();
    }

    const scheduleAutosave = debounce(autosave, AUTOSAVE_DELAY);

    function markDirty() {
      dirty = true;
      if (isPublished()) {
        setStatus('Unsaved changes', 'unsaved');
      } else {
        setStatus('Typing...', '');
        scheduleAutosave();
      }
    }

    function validate(data) {
      const problems = [];
      const words = countWords(data.content);

      if (data.title.trim().length < MIN_TITLE_LENGTH) {
        problems.push({ field: titleInput, message: `Give your article a title of at least ${MIN_TITLE_LENGTH} characters.` });
      }
      if (data.cover && !safeUrl(data.cover)) {
        problems.push({ field: coverInput, message: 'The cover must be a link that starts with https://' });
      }
      if (!data.tags.length) {
        problems.push({ field: tagInput, message: 'Add at least one tag so readers can find your article.' });
      }
      if (words < MIN_WORDS) {
        problems.push({ field: contentInput, message: `Write at least ${MIN_WORDS} words before publishing. You have ${words}.` });
      }
      return problems;
    }

    function saveDraft() {
      const data = collect();
      if (!data.title.trim() && !data.content.trim()) {
        ui.toast('Add a title or some content first', 'error');
        return;
      }
      scheduleAutosave.cancel();
      persist('draft');
      dirty = false;
      setStatus(`Draft saved at ${clock()}`, 'saved');
      refreshActions();
      ui.toast('Draft saved', 'success');
    }

    function publish() {
      const problems = validate(collect());
      if (problems.length) {
        problems.forEach(({ field }) => field.setAttribute('aria-invalid', 'true'));
        ui.toast(problems[0].message, 'error', 4500);
        problems[0].field.focus();
        return;
      }

      const wasPublished = isPublished();
      scheduleAutosave.cancel();
      persist('published');
      dirty = false;
      ui.toast(wasPublished ? 'Changes saved' : 'Your article is live', 'success');
      router.navigate(`/post/${encodeURIComponent(currentId)}`);
    }

    btnSave.addEventListener('click', () => (isPublished() ? publish() : saveDraft()));
    btnPublish.addEventListener('click', publish);

    btnDelete.addEventListener('click', async () => {
      const confirmed = await ui.confirm({
        title: 'Delete this article?',
        message: 'It will be permanently removed along with its comments.',
        confirmLabel: 'Delete article',
        danger: true,
      });
      if (!confirmed) return;
      scheduleAutosave.cancel();
      dirty = false;
      store.deletePost(currentId);
      ui.toast('Article deleted', 'success');
      router.navigate('/dashboard');
    });

    btnPreview.addEventListener('click', () => {
      const showing = grid.classList.toggle('show-preview');
      btnPreview.setAttribute('aria-pressed', String(showing));
      btnPreview.lastChild.textContent = showing ? ' Edit' : ' Preview';
      refreshPreview();
    });

    [titleInput, coverInput, excerptInput, contentInput].forEach((field) => {
      field.addEventListener('input', () => {
        field.removeAttribute('aria-invalid');
        markDirty();
        refreshMeta();
        refreshPreview();
        if (field === coverInput) refreshCoverPicker();
      });
    });

    $('#cover-picker', root).addEventListener('click', (event) => {
      const option = event.target.closest('[data-cover]');
      if (!option) return;
      coverInput.value = coverInput.value.trim() === option.dataset.cover ? '' : option.dataset.cover;
      coverInput.removeAttribute('aria-invalid');
      refreshCoverPicker();
      refreshPreview();
      markDirty();
    });

    tagInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        addTag(tagInput.value);
      } else if (event.key === 'Backspace' && !tagInput.value && tags.length) {
        tags.pop();
        renderTags();
        markDirty();
      }
    });
    tagInput.addEventListener('blur', () => addTag(tagInput.value));
    tagChips.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-tag]');
      if (!button) return;
      tags.splice(Number(button.dataset.removeTag), 1);
      renderTags();
      markDirty();
    });

    const actions = {
      bold: () => wrapSelection(contentInput, '**', '**', 'bold text'),
      italic: () => wrapSelection(contentInput, '*', '*', 'italic text'),
      heading: () => prefixLines(contentInput, '## '),
      quote: () => prefixLines(contentInput, '> '),
      list: () => prefixLines(contentInput, '- '),
      numbered: () => prefixLines(contentInput, '1. '),
      code: () => wrapSelection(contentInput, '`', '`', 'code'),
      codeblock: () => wrapSelection(contentInput, '\n```\n', '\n```\n', 'code'),
      link: () => insertLink(contentInput),
    };

    $('.toolbar', root).addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      contentInput.focus();
      actions[button.dataset.action]();
      contentInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    function onKeyDown(event) {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();

      if (key === 's') {
        event.preventDefault();
        isPublished() ? publish() : saveDraft();
      } else if (event.target === contentInput && (key === 'b' || key === 'i')) {
        event.preventDefault();
        actions[key === 'b' ? 'bold' : 'italic']();
        contentInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    function onBeforeUnload(event) {
      if (!dirty) return;
      if (isPublished()) {
        event.preventDefault();
        event.returnValue = '';
      } else {
        autosave();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('beforeunload', onBeforeUnload);

    router.setLeaveGuard(
      () => !(dirty && isPublished()) || window.confirm('You have unsaved changes. Leave without saving?')
    );

    renderTags();
    refreshActions();
    refreshMeta();
    refreshCoverPicker();
    refreshPreview();
    setStatus(existing ? (isPublished() ? 'Editing a published article' : 'Editing draft') : 'New article');

    return {
      title: existing ? `Edit: ${existing.title}` : 'Write an article',
      cleanup() {
        scheduleAutosave.cancel();
        refreshPreview.cancel();
        if (dirty && !isPublished()) autosave();
        document.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('beforeunload', onBeforeUnload);
      },
    };
  }

  router.register('/write', view);
  router.register('/edit/:id', view);
})((window.Inkwell = window.Inkwell || {}));