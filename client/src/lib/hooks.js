import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';

const SITE = 'House of Love International Ministries';

/** Sets the document title, meta description and Open Graph tags for a page. */
export function usePageMeta(title, description) {
  useEffect(() => {
    const full = title ? `${title} | ${SITE}` : `${SITE} | Faith, Love & Community`;
    document.title = full;
    const set = (selector, attr, value) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [, key, name] = selector.match(/\[(\w+)="([^"]+)"\]/);
        el.setAttribute(key, name);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    set('meta[property="og:title"]', 'content', full);
    set('meta[property="og:url"]', 'content', window.location.href);
    if (description) {
      set('meta[name="description"]', 'content', description);
      set('meta[property="og:description"]', 'content', description);
    }
  }, [title, description]);
}

/** Fetches JSON from the API with loading / error state. */
export function useApi(path, { skip = false } = {}) {
  const [state, setState] = useState({ data: null, loading: !skip, error: null });
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (skip || !path) return undefined;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, { signal: ctrl.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: null, loading: false, error });
      });
    return () => ctrl.abort();
  }, [path, skip, nonce]);

  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data })) };
}

/** Adds the .is-visible class when an element scrolls into view. */
export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-visible');
      return undefined;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

export function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function safeStorage() {
  try {
    const k = '__holim_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    return null;
  }
}
