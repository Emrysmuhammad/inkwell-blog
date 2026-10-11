(function (Inkwell) {
  'use strict';

  const { escapeHtml, slugify } = Inkwell.utils;

  const HEADING = /^(#{1,4})\s+(.+?)\s*#*\s*$/;
  const FENCE = /^```([\w-]*)\s*$/;
  const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
  const QUOTE = /^>\s?/;
  const BULLET = /^\s*[-*+]\s+/;
  const NUMBERED = /^\s*\d+[.)]\s+/;

  function safeLink(url) {
    return /^(https?:\/\/|mailto:|#|\/|\.\/)/i.test(url) ? url : '';
  }

  function inline(source) {
    const codes = [];
    let html = escapeHtml(source).replace(/`([^`]+)`/g, (match, code) => {
      codes.push(code);
      return `\u0000${codes.length - 1}\u0000`;
    });

    html = html.replace(/!\[([^\]]*)\]\((https?:\/\/(?:[^()\s]|\([^()\s]*\))+)\)/g, (match, alt, url) => {
      return `<img src="${url}" alt="${alt}" loading="lazy">`;
    });

    html = html.replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (match, label, url) => {
      const href = safeLink(url);
      if (!href) return label;
      const external = /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${href}"${external}>${label}</a>`;
    });

    html = html
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/(^|[\s(])_([^_\s][^_]*?)_(?=$|[\s).,!?:;])/g, '$1<em>$2</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>');

    return html.replace(/\u0000(\d+)\u0000/g, (match, index) => `<code>${codes[Number(index)]}</code>`);
  }

  function startsBlock(line) {
    return FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line) || BULLET.test(line) || NUMBERED.test(line);
  }

  function parseBlocks(lines, headings, usedIds) {
    const out = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];

      const fence = line.match(FENCE);
      if (fence) {
        const code = [];
        index += 1;
        while (index < lines.length && !FENCE.test(lines[index])) {
          code.push(lines[index]);
          index += 1;
        }
        index += 1;
        const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : '';
        out.push(`<pre><code${language}>${escapeHtml(code.join('\n'))}</code></pre>`);
        continue;
      }

      if (!line.trim()) {
        index += 1;
        continue;
      }

      const heading = line.match(HEADING);
      if (heading) {
        const level = heading[1].length;
        const text = heading[2];
        let id = `h-${slugify(text) || 'section'}`;
        let suffix = 2;
        while (usedIds.has(id)) {
          id = `h-${slugify(text) || 'section'}-${suffix}`;
          suffix += 1;
        }
        usedIds.add(id);
        if (headings) headings.push({ level, text: text.replace(/[*`_~]/g, ''), id });
        out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
        index += 1;
        continue;
      }

      if (RULE.test(line)) {
        out.push('<hr>');
        index += 1;
        continue;
      }

      if (QUOTE.test(line)) {
        const quoted = [];
        while (index < lines.length && QUOTE.test(lines[index])) {
          quoted.push(lines[index].replace(QUOTE, ''));
          index += 1;
        }
        out.push(`<blockquote>${parseBlocks(quoted, null, usedIds)}</blockquote>`);
        continue;
      }

      const ordered = NUMBERED.test(line);
      if (ordered || BULLET.test(line)) {
        const pattern = ordered ? NUMBERED : BULLET;
        const items = [];
        while (index < lines.length && pattern.test(lines[index])) {
          items.push(`<li>${inline(lines[index].replace(pattern, ''))}</li>`);
          index += 1;
        }
        const tag = ordered ? 'ol' : 'ul';
        out.push(`<${tag}>${items.join('')}</${tag}>`);
        continue;
      }

      const paragraph = [];
      while (index < lines.length && lines[index].trim() && !(paragraph.length && startsBlock(lines[index]))) {
        paragraph.push(lines[index].trim());
        index += 1;
      }
      out.push(`<p>${inline(paragraph.join(' '))}</p>`);
    }

    return out.join('\n');
  }

  function render(markdown) {
    const lines = String(markdown ?? '').replace(/\r\n?/g, '\n').split('\n');
    const headings = [];
    const html = parseBlocks(lines, headings, new Set());
    return { html, headings };
  }

  Inkwell.markdown = { render, inline };
})((window.Inkwell = window.Inkwell || {}));