/**
 * Shared utilities
 */
(function (global) {
  'use strict';

  const Utils = {
    uid(prefix) {
      return (prefix || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    },

    clone(obj) {
      return JSON.parse(JSON.stringify(obj));
    },

    money(amount) {
      const cur = (global.APP_CONFIG && global.APP_CONFIG.currency) || '₪';
      const n = Number(amount);
      if (isNaN(n)) return cur + '0';
      return cur + n.toFixed(n % 1 === 0 ? 0 : 2);
    },

    formatTime(iso) {
      if (!iso) return '—';
      if (/^\d{1,2}:\d{2}/.test(String(iso))) return iso;
      const d = new Date(iso);
      if (isNaN(d)) return String(iso);
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    },

    formatDate(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      if (isNaN(d)) return String(iso);
      return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    },

    formatRelative(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      if (isNaN(d)) return '—';
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return 'Just now';
      if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      if (diff < 172800) return 'Yesterday';
      return this.formatDate(iso);
    },

    greeting() {
      const h = new Date().getHours();
      if (h < 12) return 'Good morning';
      if (h < 17) return 'Good afternoon';
      return 'Good evening';
    },

    query(name) {
      return new URLSearchParams(window.location.search).get(name);
    },

    localized(field, lang) {
      if (field == null) return '';
      if (typeof field === 'string') return field;
      lang = lang || (global.I18n && I18n.lang) || 'en';
      return field[lang] || field.en || field.ar || '';
    },

    emailOk(email) {
      if (!email) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    debounce(fn, wait) {
      let t;
      return function () {
        const ctx = this, args = arguments;
        clearTimeout(t);
        t = setTimeout(() => fn.apply(ctx, args), wait);
      };
    },

    simulateDelay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms || 180));
    }
  };

  global.Utils = Utils;
})(window);
