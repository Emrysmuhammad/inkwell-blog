(function (Inkwell) {
  'use strict';

  const { store, ui } = Inkwell;
  const { $, escapeHtml, avatar, timeAgo, formatDate } = Inkwell.utils;

  const MAX_LENGTH = 1000;

  function itemHtml(comment) {
    return `
      <li class="comment" data-comment="${escapeHtml(comment.id)}">
        ${avatar(comment.author, 'md')}
        <div class="comment-main">
          <div class="comment-head">
            <strong class="comment-author">${escapeHtml(comment.author)}</strong>
            <time datetime="${escapeHtml(comment.date)}" title="${escapeHtml(formatDate(comment.date))}">${timeAgo(comment.date)}</time>
            <button type="button" class="comment-delete" data-delete-comment aria-label="Delete comment by ${escapeHtml(comment.author)}">${ui.icon('trash', 15)}</button>
          </div>
          <p class="comment-text">${escapeHtml(comment.text)}</p>
        </div>
      </li>`;
  }

  function mount(container, post, page) {
    container.innerHTML = `
      <h2 class="section-title" id="comments-title">Comments <span class="count" data-count>0</span></h2>
      <form class="comment-form" novalidate>
        <div class="form-row">
          <label class="field-label" for="comment-name">Your name</label>
          <input class="input" id="comment-name" type="text" maxlength="40" autocomplete="name" value="${escapeHtml(store.getAuthor())}">
        </div>
        <div class="form-row">
          <label class="field-label" for="comment-text">Comment</label>
          <textarea class="input" id="comment-text" rows="4" maxlength="${MAX_LENGTH}" placeholder="Share your thoughts about this article..."></textarea>
          <div class="form-hint">
            <span class="field-error" id="comment-error" role="alert"></span>
            <span class="counter" id="comment-counter">0 / ${MAX_LENGTH}</span>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">Post comment</button>
      </form>
      <ul class="comment-list" id="comment-list"></ul>`;

    const form = $('.comment-form', container);
    const nameInput = $('#comment-name', container);
    const textInput = $('#comment-text', container);
    const error = $('#comment-error', container);
    const counter = $('#comment-counter', container);
    const list = $('#comment-list', container);

    function renderList() {
      const comments = store.getComments(post.id);
      list.innerHTML = comments.length
        ? comments.map(itemHtml).join('')
        : '<li class="comment-empty">No comments yet. Be the first to share your thoughts.</li>';
      $('[data-count]', container).textContent = comments.length;
      page.querySelectorAll('[data-comment-count]').forEach((element) => {
        element.textContent = comments.length;
      });
    }

    function showError(message, field) {
      error.textContent = message;
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }

    textInput.addEventListener('input', () => {
      counter.textContent = `${textInput.value.length} / ${MAX_LENGTH}`;
      textInput.removeAttribute('aria-invalid');
      error.textContent = '';
    });
    nameInput.addEventListener('input', () => {
      nameInput.removeAttribute('aria-invalid');
      error.textContent = '';
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const author = nameInput.value.trim();
      const text = textInput.value.trim();

      if (author.length < 2) return showError('Please enter your name (at least 2 characters).', nameInput);
      if (text.length < 2) return showError('Please write a comment before posting.', textInput);

      store.addComment({ postId: post.id, author, text });
      textInput.value = '';
      counter.textContent = `0 / ${MAX_LENGTH}`;
      error.textContent = '';
      renderList();
      ui.toast('Comment posted', 'success');
    });

    list.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-delete-comment]');
      if (!button) return;

      const id = button.closest('[data-comment]').dataset.comment;
      const confirmed = await ui.confirm({
        title: 'Delete this comment?',
        message: 'This cannot be undone.',
        confirmLabel: 'Delete comment',
        danger: true,
      });

      if (confirmed) {
        store.deleteComment(id);
        renderList();
        ui.toast('Comment deleted', 'success');
      }
    });

    renderList();
  }

  Inkwell.comments = { mount };
})((window.Inkwell = window.Inkwell || {}));