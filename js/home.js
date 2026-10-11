(function (Inkwell) {
  'use strict';

  const { store, router, ui } = Inkwell;
  const { $, escapeHtml, debounce, pluralize, excerpt, safeUrl } = Inkwell.utils;

  const PAGE_SIZE = 6;
  const SORTS = [
    ['newest', 'Newest first'],
    ['oldest', 'Oldest first'],
    ['popular', 'Most liked'],
    ['longest', 'Longest read'],
  ];

  function featuredHtml(post) {
    const href = `#/post/${encodeURIComponent(post.id)}`;
    return `
      <article class="featured">
        <a class="featured-cover" href="${href}" tabindex="-1" aria-hidden="true">${ui.cover(safeUrl(post.cover))}</a>
        <div class="featured-body">
          <span class="eyebrow">Latest article</span>
          <div class="tag-row">${ui.tagButtons(post.tags, 3)}</div>
          <h2 class="featured-title"><a href="${href}">${escapeHtml(post.title)}</a></h2>
          <p class="featured-excerpt">${escapeHtml(excerpt(post, 200))}</p>
          ${ui.meta(post)}
          <a class="btn btn-primary" href="${href}">Read article</a>
        </div>
      </article>`;
  }

  function view(ctx, root) {
    const requestedSort = ctx.query.get('sort');
    const state = {
      q: ctx.query.get('q') || '',
      tag: ctx.query.get('tag') || '',
      sort: SORTS.some(([value]) => value === requestedSort) ? requestedSort : 'newest',
      visible: PAGE_SIZE,
    };

    const published = store.getPosts();
    const writers = new Set(published.map((post) => post.author)).size;

    root.innerHTML = `
      <div class="page-home">
      <section class="hero">
        <div class="container">
          <span class="eyebrow">Welcome to Inkwell</span>
          <h1 class="hero-title">Stories, ideas and tutorials worth your time</h1>
          <p class="hero-text">
            ${pluralize(published.length, 'article')} from ${pluralize(writers, 'writer')}.
            Read, search by topic, or <a href="#/write">write one of your own</a>.
          </p>
        </div>
      </section>

      <div class="container">
        <div class="controls">
          <label class="search-box">
            ${ui.icon('search', 18)}
            <span class="sr-only">Search articles</span>
            <input id="search" type="search" placeholder="Search articles, topics or authors" autocomplete="off" value="${escapeHtml(state.q)}">
            <kbd title="Press / to search">/</kbd>
          </label>
          <label class="sort-box">
            <span class="sr-only">Sort articles</span>
            <select id="sort">
              ${SORTS.map(([value, label]) => `<option value="${value}"${value === state.sort ? ' selected' : ''}>${label}</option>`).join('')}
            </select>
          </label>
        </div>
        <div class="tag-filter" id="tag-filter" role="group" aria-label="Filter by topic"></div>
        <div id="results" aria-live="polite"></div>
      </div>
      </div>`;

    const page = $('.page-home', root);
    const searchInput = $('#search', root);
    const tagFilter = $('#tag-filter', root);
    const results = $('#results', root);

    function syncUrl() {
      router.replaceQuery('/', {
        q: state.q,
        tag: state.tag,
        sort: state.sort === 'newest' ? '' : state.sort,
      });
    }

    function renderTags() {
      const tags = store.getTags();
      const chip = (value, label, count) => {
        const active = value.toLowerCase() === state.tag.toLowerCase();
        return `<button type="button" class="chip" data-tag="${escapeHtml(value)}" aria-pressed="${active}">${escapeHtml(label)}<span class="chip-count">${count}</span></button>`;
      };
      tagFilter.innerHTML =
        chip('', 'All', published.length) + tags.map(({ tag, count }) => chip(tag, tag, count)).join('');
    }

    function renderResults() {
      const posts = store.getPosts({ query: state.q, tag: state.tag, sort: state.sort });
      const filtering = Boolean(state.q || state.tag);

      if (!posts.length) {
        results.innerHTML = `
          <div class="empty-state">
            <h2>No articles found</h2>
            <p>${filtering ? 'Nothing matches your search. Try different words or clear the filters.' : 'There are no published articles yet.'}</p>
            ${filtering ? '<button type="button" class="btn btn-outline" data-clear>Clear filters</button>' : '<a class="btn btn-primary" href="#/write">Write the first one</a>'}
          </div>`;
        return;
      }

      const featured = !filtering && state.sort === 'newest' ? posts[0] : null;
      const rest = featured ? posts.slice(1) : posts;
      const shown = rest.slice(0, state.visible);
      const heading = state.tag ? `Articles tagged "${escapeHtml(state.tag)}"` : state.q ? 'Search results' : 'All articles';
      const count = shown.length + (featured ? 1 : 0);

      results.innerHTML = `
        ${featured ? featuredHtml(featured) : ''}
        <div class="results-head">
          <h2 class="section-title">${heading}</h2>
          <span class="results-count">Showing ${count} of ${posts.length}</span>
          ${filtering ? '<button type="button" class="link-btn" data-clear>Clear filters</button>' : ''}
        </div>
        <div class="card-grid">${shown.map(ui.postCard).join('')}</div>
        ${rest.length > shown.length ? '<div class="load-more"><button type="button" class="btn btn-outline" data-more>Load more articles</button></div>' : ''}`;
    }

    function refresh() {
      renderTags();
      renderResults();
      syncUrl();
    }

    const onSearch = debounce(() => {
      state.q = searchInput.value.trim();
      state.visible = PAGE_SIZE;
      refresh();
    }, 200);

    searchInput.addEventListener('input', onSearch);
    $('#sort', root).addEventListener('change', (event) => {
      state.sort = event.target.value;
      state.visible = PAGE_SIZE;
      refresh();
    });

    page.addEventListener('click', (event) => {
      const tagButton = event.target.closest('[data-tag]');
      if (tagButton) {
        const value = tagButton.dataset.tag;
        const same = value.toLowerCase() === state.tag.toLowerCase();
        state.tag = same ? '' : value;
        state.visible = PAGE_SIZE;
        refresh();
        const controls = $('.controls', root);
        if (tagButton.closest('.card, .featured') && controls.scrollIntoView) {
          controls.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      if (event.target.closest('[data-clear]')) {
        state.q = '';
        state.tag = '';
        state.visible = PAGE_SIZE;
        searchInput.value = '';
        refresh();
        return;
      }

      if (event.target.closest('[data-more]')) {
        state.visible += PAGE_SIZE;
        renderResults();
      }
    });

    function onKeyDown(event) {
      const target = event.target;
      const typing = target.matches && target.matches('input, textarea, select, [contenteditable]');
      if (event.key === '/' && !typing && !document.querySelector('.modal')) {
        event.preventDefault();
        searchInput.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);

    renderTags();
    renderResults();

    return {
      cleanup() {
        onSearch.cancel();
        document.removeEventListener('keydown', onKeyDown);
      },
    };
  }

  router.register('/', view);
})((window.Inkwell = window.Inkwell || {}));