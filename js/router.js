(function (Inkwell) {
  'use strict';

  const { escapeHtml } = Inkwell.utils;

  const routes = [];
  let cleanup = null;
  let leaveGuard = null;

  function register(path, view) {
    const keys = [];
    const source = path.replace(/:([a-z]+)/gi, (match, key) => {
      keys.push(key);
      return '([^/]+)';
    });
    routes.push({ pattern: new RegExp(`^${source}/?$`), keys, view });
  }

  function parse(hash) {
    const raw = hash.replace(/^#/, '') || '/';
    const [path, search = ''] = raw.split('?');
    return { path: path || '/', query: new URLSearchParams(search) };
  }

  function match(path) {
    for (const route of routes) {
      const found = path.match(route.pattern);
      if (found) {
        const params = {};
        route.keys.forEach((key, index) => {
          params[key] = decodeURIComponent(found[index + 1]);
        });
        return { route, params };
      }
    }
    return null;
  }

  function navKey(path) {
    if (path === '/') return 'home';
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/write') || path.startsWith('/edit')) return 'write';
    return '';
  }

  function highlightNav(path) {
    const active = navKey(path);
    document.querySelectorAll('[data-nav]').forEach((link) => {
      if (link.dataset.nav === active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function notFound(root, path) {
    root.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <h1>Page not found</h1>
          <p>We could not find <code>${escapeHtml(path)}</code>.</p>
          <a class="btn btn-primary" href="#/">Back to the homepage</a>
        </div>
      </div>`;
    return { title: 'Page not found' };
  }

  function render() {
    const root = document.getElementById('app');
    const { path, query } = parse(window.location.hash);

    if (typeof cleanup === 'function') {
      try {
        cleanup();
      } catch (error) {
        console.error(error);
      }
    }
    cleanup = null;
    leaveGuard = null;

    const found = match(path);
    root.innerHTML = '';

    let result = null;
    try {
      result = found ? found.route.view({ path, query, params: found.params }, root) : notFound(root, path);
    } catch (error) {
      console.error(error);
      root.innerHTML = `
        <div class="container">
          <div class="empty-state">
            <h1>Something went wrong</h1>
            <p>This page could not be displayed. Try going back to the homepage.</p>
            <a class="btn btn-primary" href="#/">Back to the homepage</a>
          </div>
        </div>`;
    }

    cleanup = result && result.cleanup ? result.cleanup : null;
    document.title = result && result.title ? `${result.title} | Inkwell` : 'Inkwell';
    highlightNav(path);
    window.scrollTo(0, 0);
    root.focus({ preventScroll: true });
  }

  function navigate(path, { replace = false } = {}) {
    const target = `#${path}`;
    if (replace) {
      history.replaceState(null, '', target);
      render();
    } else if (window.location.hash === target) {
      render();
    } else {
      window.location.hash = target;
    }
  }

  function replaceQuery(path, params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
    const query = search.toString();
    history.replaceState(null, '', `#${path}${query ? `?${query}` : ''}`);
  }

  function setLeaveGuard(guard) {
    leaveGuard = guard;
  }

  function start() {
    window.addEventListener('hashchange', (event) => {
      if (leaveGuard && !leaveGuard()) {
        history.replaceState(null, '', event.oldURL);
        return;
      }
      render();
    });
    render();
  }

  Inkwell.router = { register, navigate, replaceQuery, setLeaveGuard, start };
})((window.Inkwell = window.Inkwell || {}));