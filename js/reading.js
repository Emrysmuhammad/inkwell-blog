(function (Inkwell) {
  'use strict';

  const { store, ui } = Inkwell;
  const { $, $$, escapeHtml } = Inkwell.utils;

  function renderToc(container, headings, postId) {
    const items = headings.filter((heading) => heading.level === 2 || heading.level === 3);
    if (items.length < 3) {
      container.closest('.article-layout').classList.add('no-toc');
      return;
    }

    container.innerHTML = `
      <nav class="toc" aria-label="Table of contents">
        <h2 class="toc-title">On this page</h2>
        <ul>
          ${items
            .map(
              (heading) => `
            <li class="toc-level-${heading.level}">
              <a href="#/post/${encodeURIComponent(postId)}" data-scroll="${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a>
            </li>`
            )
            .join('')}
        </ul>
      </nav>`;

    container.addEventListener('click', (event) => {
      const link = event.target.closest('[data-scroll]');
      if (!link) return;
      event.preventDefault();
      const target = document.getElementById(link.dataset.scroll);
      if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function renderRelated(container, post) {
    const tags = post.tags.map((tag) => tag.toLowerCase());
    const picks = store
      .getPosts()
      .filter((other) => other.id !== post.id)
      .map((other) => ({
        other,
        score: other.tags.filter((tag) => tags.includes(tag.toLowerCase())).length,
      }))
      .sort((a, b) => b.score - a.score || new Date(b.other.date) - new Date(a.other.date))
      .slice(0, 3)
      .map((entry) => entry.other);

    if (!picks.length) return;

    container.innerHTML = `
      <div class="related">
        <h2 class="section-title">Keep reading</h2>
        <div class="card-grid">${picks.map(ui.postCard).join('')}</div>
      </div>`;
  }

  function mount(page, post, headings) {
    const progress = document.getElementById('progress');
    const body = $('#article-body', page);

    renderToc($('#toc-mount', page), headings, post.id);
    renderRelated($('#related-mount', page), post);

    const tocLinks = $$('[data-scroll]', page);
    let frame = null;

    function update() {
      frame = null;
      const rect = body.getBoundingClientRect();
      const ratio = (window.innerHeight * 0.6 - rect.top) / Math.max(rect.height, 1);
      progress.style.width = `${Math.min(Math.max(ratio, 0), 1) * 100}%`;

      let activeId = null;
      tocLinks.forEach((link) => {
        const heading = document.getElementById(link.dataset.scroll);
        if (heading && heading.getBoundingClientRect().top <= 140) activeId = link.dataset.scroll;
      });
      tocLinks.forEach((link) => link.classList.toggle('active', link.dataset.scroll === activeId));
    }

    function onScroll() {
      if (frame === null) frame = requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
      progress.style.width = '0';
    };
  }

  Inkwell.reading = { mount };
})((window.Inkwell = window.Inkwell || {}));