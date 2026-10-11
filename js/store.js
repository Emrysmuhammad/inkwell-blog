(function (Inkwell) {
  'use strict';

  const { countWords, safeUrl, uid } = Inkwell.utils;

  const KEY = 'inkwell:data';
  const DEFAULT_AUTHOR = 'Guest Writer';
  const STATUSES = ['published', 'draft'];
  const MAX_TAGS = 5;

  let state = null;
  let saveFailed = false;
  const listeners = new Set();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function text(value, max) {
    return typeof value === 'string' ? value.slice(0, max) : '';
  }

  function validDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function cleanTags(tags) {
    const seen = new Set();
    const result = [];

    tags.forEach((tag) => {
      if (typeof tag !== 'string') return;
      const clean = tag.trim().replace(/\s+/g, ' ').slice(0, 24);
      const key = clean.toLowerCase();
      if (clean && !seen.has(key)) {
        seen.add(key);
        result.push(clean);
      }
    });

    return result.slice(0, MAX_TAGS);
  }

  function normalizePost(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const id = text(raw.id, 80);
    const title = text(raw.title, 140).trim();
    const date = validDate(raw.date);
    if (!id || !title || !date) return null;

    return {
      id,
      title,
      content: text(raw.content, 100000),
      excerpt: text(raw.excerpt, 300),
      cover: safeUrl(raw.cover),
      tags: Array.isArray(raw.tags) ? cleanTags(raw.tags) : [],
      author: text(raw.author, 60).trim() || DEFAULT_AUTHOR,
      status: STATUSES.includes(raw.status) ? raw.status : 'draft',
      date,
      updatedAt: validDate(raw.updatedAt) || date,
      likes: Number.isFinite(raw.likes) && raw.likes >= 0 ? Math.floor(raw.likes) : 0,
    };
  }

  function normalizeComment(raw, postIds) {
    if (!raw || typeof raw !== 'object') return null;

    const id = text(raw.id, 80);
    const body = text(raw.text, 1000).trim();
    const date = validDate(raw.date);
    if (!id || !body || !date || !postIds.has(raw.postId)) return null;

    return {
      id,
      postId: raw.postId,
      author: text(raw.author, 40).trim() || 'Anonymous',
      text: body,
      date,
    };
  }

  function normalize(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.posts)) {
      throw new Error('This file is not a valid Inkwell backup.');
    }

    const seen = new Set();
    const posts = data.posts
      .map(normalizePost)
      .filter((post) => post && !seen.has(post.id) && seen.add(post.id));

    const comments = (Array.isArray(data.comments) ? data.comments : [])
      .map((comment) => normalizeComment(comment, seen))
      .filter(Boolean);

    const liked = (Array.isArray(data.liked) ? data.liked : []).filter((id) => seen.has(id));

    return {
      posts,
      comments,
      liked,
      author: text(data.author, 40).trim() || DEFAULT_AUTHOR,
    };
  }

  function seedState() {
    return {
      posts: clone(Inkwell.seed.posts).map((post) => ({ ...post, updatedAt: post.date })),
      comments: clone(Inkwell.seed.comments),
      liked: [],
      author: DEFAULT_AUTHOR,
    };
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.warn('Unable to save data', error);
      return false;
    }
  }

  function commit() {
    saveFailed = !persist();
    listeners.forEach((listener) => listener(state));
  }

  function hasSaveError() {
    return saveFailed;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        state = normalize(JSON.parse(raw));
        return state;
      }
    } catch (error) {
      console.warn('Stored data could not be read, starting fresh', error);
    }

    state = seedState();
    persist();
    return state;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getPost(id) {
    return state.posts.find((post) => post.id === id) || null;
  }

  function getPosts({ status = 'published', query = '', tag = '', sort = 'newest' } = {}) {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    let list = state.posts.filter((post) => status === 'all' || post.status === status);

    if (tag) {
      list = list.filter((post) => post.tags.some((item) => item.toLowerCase() === tag.toLowerCase()));
    }

    if (tokens.length) {
      list = list.filter((post) => {
        const haystack = [post.title, post.excerpt, post.content, post.author, post.tags.join(' ')]
          .join(' ')
          .toLowerCase();
        return tokens.every((token) => haystack.includes(token));
      });
    }

    const sorters = {
      newest: (a, b) => new Date(b.date) - new Date(a.date),
      oldest: (a, b) => new Date(a.date) - new Date(b.date),
      popular: (a, b) => b.likes - a.likes,
      longest: (a, b) => countWords(b.content) - countWords(a.content),
    };

    return list.slice().sort(sorters[sort] || sorters.newest);
  }

  function getTags() {
    const counts = new Map();

    state.posts
      .filter((post) => post.status === 'published')
      .forEach((post) => {
        post.tags.forEach((tag) => {
          const key = tag.toLowerCase();
          const entry = counts.get(key) || { tag, count: 0 };
          entry.count += 1;
          counts.set(key, entry);
        });
      });

    return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }

  function createPost(data) {
    const now = new Date().toISOString();
    const post = normalizePost({
      id: uid('post'),
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      cover: data.cover,
      tags: data.tags,
      author: state.author,
      status: data.status,
      date: now,
      updatedAt: now,
      likes: 0,
    });

    if (!post) throw new Error('A post needs a title.');
    state.posts.push(post);
    commit();
    return post;
  }

  function updatePost(id, patch) {
    const existing = getPost(id);
    if (!existing) throw new Error('That post no longer exists.');

    const now = new Date().toISOString();
    const publishing = patch.status === 'published' && existing.status !== 'published';
    const updated = normalizePost({
      ...existing,
      ...patch,
      id: existing.id,
      likes: existing.likes,
      date: publishing ? now : existing.date,
      updatedAt: now,
    });

    if (!updated) throw new Error('A post needs a title.');
    state.posts[state.posts.indexOf(existing)] = updated;
    commit();
    return updated;
  }

  function deletePost(id) {
    state.posts = state.posts.filter((post) => post.id !== id);
    state.comments = state.comments.filter((comment) => comment.postId !== id);
    state.liked = state.liked.filter((likedId) => likedId !== id);
    commit();
  }

  function isLiked(id) {
    return state.liked.includes(id);
  }

  function toggleLike(id) {
    const post = getPost(id);
    if (!post) return null;

    const liked = !isLiked(id);
    post.likes = Math.max(0, post.likes + (liked ? 1 : -1));
    state.liked = liked ? [...state.liked, id] : state.liked.filter((likedId) => likedId !== id);
    commit();
    return { liked, likes: post.likes };
  }

  function getComments(postId) {
    return state.comments
      .filter((comment) => comment.postId === postId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function addComment({ postId, author, text: body }) {
    const comment = normalizeComment(
      { id: uid('comment'), postId, author, text: body, date: new Date().toISOString() },
      new Set([postId])
    );
    if (!comment || !getPost(postId)) throw new Error('Unable to add that comment.');
    state.comments.push(comment);
    commit();
    return comment;
  }

  function deleteComment(id) {
    state.comments = state.comments.filter((comment) => comment.id !== id);
    commit();
  }

  function getAuthor() {
    return state.author;
  }

  function setAuthor(name) {
    state.author = text(name, 40).trim() || DEFAULT_AUTHOR;
    commit();
    return state.author;
  }

  function stats() {
    return {
      published: state.posts.filter((post) => post.status === 'published').length,
      drafts: state.posts.filter((post) => post.status === 'draft').length,
      likes: state.posts.reduce((total, post) => total + post.likes, 0),
      comments: state.comments.length,
    };
  }

  function exportData() {
    return JSON.stringify({ app: 'inkwell', version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);
  }

  function importData(json) {
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (error) {
      throw new Error('That file is not valid JSON.');
    }

    state = normalize(parsed);
    commit();
    return { posts: state.posts.length, comments: state.comments.length };
  }

  function reset() {
    state = seedState();
    commit();
  }

  Inkwell.store = {
    load,
    subscribe,
    hasSaveError,
    getPost,
    getPosts,
    getTags,
    createPost,
    updatePost,
    deletePost,
    isLiked,
    toggleLike,
    getComments,
    addComment,
    deleteComment,
    getAuthor,
    setAuthor,
    stats,
    exportData,
    importData,
    reset,
  };
})((window.Inkwell = window.Inkwell || {}));