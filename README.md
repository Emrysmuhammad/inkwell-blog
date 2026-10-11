# Inkwell

A complete blogging platform that runs entirely in the browser. Read articles, search by topic, write in Markdown with a live preview, publish, like and comment, and manage everything from a dashboard. Built with vanilla JavaScript: no framework, no build step and no server.

## Features

**Reading**
- Home page with a featured article, search, topic filters, sorting and "load more"
- Article pages with reading time, a table of contents, a reading-progress bar and related articles
- Like articles, copy a link to share them, and jump straight to the comments

**Writing**
- Markdown editor with a formatting toolbar and a live side-by-side preview
- Tags, a cover image picker, an optional summary, and word count with reading time
- Drafts are autosaved, and you cannot publish an incomplete article by accident
- Warns you before you leave a published article with unsaved changes

**Community**
- Comments with validation, a character counter and deletion
- A display name that is used for the articles and comments you write

**Management**
- Dashboard with totals, a Published and Drafts filter, publish and unpublish, edit and delete
- Export a full backup as JSON, import it back, or reset to the demo content

**Experience**
- Light and dark themes that follow your system setting and remember your choice
- Responsive layout, keyboard-friendly dialogs, toast notifications and reduced-motion support

## Getting started

```bash
git clone <repository-url>
cd inkwell-blog
```

Then open `index.html` in your browser, or use the Live Server extension in VS Code. There is nothing to install or build.

Routing uses the URL hash, so the site also works as-is on GitHub Pages or any static host.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `/` | Focus the search box on the home page |
| `Ctrl` + `S` | Save the draft, or update the article, in the editor |
| `Ctrl` + `B` / `Ctrl` + `I` | Bold or italic in the editor |
| `Esc` | Close a dialog |

## Markdown support

Headings (`#` to `####`), bold, italic, strikethrough, inline code, fenced code blocks, links, images, bulleted and numbered lists, block quotes and horizontal rules.

All content is escaped before it is rendered, and only `http`, `https`, `mailto` and relative links are allowed, so pasted HTML or `javascript:` links cannot run code.

## How it works

- `js/store.js` keeps posts, comments, likes and settings in `localStorage`, validates everything it loads or imports, and notifies the interface when data changes.
- `js/router.js` is a small hash router with route parameters and a leave guard for unsaved changes.
- `js/markdown.js` is a safe Markdown parser that also collects headings for the table of contents.
- `js/home.js`, `js/post.js`, `js/editor.js` and `js/dashboard.js` are the pages. `js/reading.js` and `js/comments.js` add the reading tools and comments to the article page.
- `js/ui.js` provides toasts, dialogs, icons and the shared article card.
- `css/` holds one stylesheet per area, with all responsive rules in `responsive.css`.

## Your data

Everything is saved in your browser, so nothing is sent to a server. Clearing site data removes your articles, so use **Export backup** on the dashboard to keep a copy.

## License

MIT