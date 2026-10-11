(function (Inkwell) {
  'use strict';

  const { store, router, ui } = Inkwell;
  const { $, escapeHtml, avatar, formatDate, readingTime, safeUrl, copyToClipboard } = Inkwell.utils;

  function missing(root) {
    root.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <h1>Article not found</h1>
          <p>It may have been deleted, or the link is incorrect.</p>
          <a class="btn btn-primary" href="#/">Browse all articles</a>
        </div>
      </div>`;
    return { title: 'Article not found' };
  }

  function view(ctx, root) {
    const post = store.getPost(ctx.params.id);
    if (!post) return missing(root);

    const { html, headings } = Inkwell.markdown.render(post.content);
    const id = encodeURIComponent(post.id);
    const cover = safeUrl(post.cover);
    const liked = store.isLiked(post.id);
    const authorLink = `#/?q=${encodeURIComponent(post.author)}`;
    const tagLinks = post.tags
      .map((tag) => `<a class="tag" href="#/?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`)
      .join('');

    root.innerHTML = `
      <div class="container page-post">
        <article class="article">
          <a class="back-link" href="#/">${ui.icon('arrow-left', 16)} All articles</a>

          ${post.status === 'draft' ? `<div class="draft-banner" role="status"><strong>Draft preview.</strong> This article is not published yet, so only you can see it. <a href="#/edit/${id}">Keep editing</a></div>` : ''}

          <header class="article-header">
            <div class="tag-row">${tagLinks}</div>
            <h1 class="article-title">${escapeHtml(post.title)}</h1>
            <div class="byline">
              <div class="byline-author">
                ${avatar(post.author, 'lg')}
                <div>
                  <a class="author-name" href="${authorLink}">${escapeHtml(post.author)}</a>
                  <div class="byline-meta">
                    <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
                    <span aria-hidden="true">&middot;</span>
                    <span>${readingTime(post.content)} min read</span>
                  </div>
                </div>
              </div>
              <div class="byline-actions">
                <a class="btn btn-ghost btn-sm" href="#/edit/${id}">${ui.icon('edit', 16)} Edit</a>
                <button type="button" class="btn btn-ghost btn-sm danger-text" data-delete>${ui.icon('trash', 16)} Delete</button>
              </div>
            </div>
          </header>

          ${cover ? `<div class="article-cover">${ui.cover(cover, post.title)}</div>` : ''}

          <div class="article-layout">
            <div class="article-main">
              <div class="prose" id="article-body">${html || '<p class="muted">Nothing has been written yet.</p>'}</div>

              <div class="action-bar">
                <button type="button" class="action-btn like-btn" data-like aria-pressed="${liked}">
                  ${ui.icon('heart', 18)} <span data-like-count>${post.likes}</span> <span class="sr-only">likes</span>
                </button>
                <button type="button" class="action-btn" data-jump-comments>
                  ${ui.icon('comment', 18)} <span data-comment-count>${store.getComments(post.id).length}</span> <span class="sr-only">comments</span>
                </button>
                <button type="button" class="action-btn" data-copy>${ui.icon('link', 18)} Copy link</button>
              </div>

              <div class="author-box">
                ${avatar(post.author, 'lg')}
                <div>
                  <p class="author-box-label">Written by</p>
                  <p class="author-box-name">${escapeHtml(post.author)}</p>
                  <a href="${authorLink}">See all articles by this author</a>
                </div>
              </div>
            </div>
            <aside class="article-aside"><div id="toc-mount"></div></aside>
          </div>

          <section id="related-mount"></section>
          <section id="comments-mount" class="comments" aria-labelledby="comments-title"></section>
        </article>
      </div>`;

    const page = $('.page-post', root);

    page.addEventListener('click', async (event) => {
      const tagButton = event.target.closest('[data-tag]');
      if (tagButton) {
        router.navigate(`/?tag=${encodeURIComponent(tagButton.dataset.tag)}`);
        return;
      }

      const likeButton = event.target.closest('[data-like]');
      if (likeButton) {
        const result = store.toggleLike(post.id);
        if (!result) return;
        likeButton.setAttribute('aria-pressed', String(result.liked));
        $('[data-like-count]', likeButton).textContent = result.likes;
        likeButton.classList.remove('pop');
        void likeButton.offsetWidth;
        likeButton.classList.add('pop');
        return;
      }

      if (event.target.closest('[data-copy]')) {
        const copied = await copyToClipboard(window.location.href);
        ui.toast(copied ? 'Link copied to clipboard' : 'Could not copy the link', copied ? 'success' : 'error');
        return;
      }

      if (event.target.closest('[data-jump-comments]')) {
        const target = $('#comments-mount', page);
        if (target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (event.target.closest('[data-delete]')) {
        const confirmed = await ui.confirm({
          title: 'Delete this article?',
          message: `"${post.title}" and its comments will be permanently removed.`,
          confirmLabel: 'Delete article',
          danger: true,
        });
        if (confirmed) {
          store.deletePost(post.id);
          ui.toast('Article deleted', 'success');
          router.navigate('/');
        }
      }
    });

    const cleanups = [];
    if (Inkwell.reading) cleanups.push(Inkwell.reading.mount(page, post, headings));
    if (Inkwell.comments) cleanups.push(Inkwell.comments.mount($('#comments-mount', page), post, page));

    return {
      title: post.title,
      cleanup() {
        cleanups.forEach((cleanup) => typeof cleanup === 'function' && cleanup());
      },
    };
  }

  router.register('/post/:id', view);
})((window.Inkwell = window.Inkwell || {}));