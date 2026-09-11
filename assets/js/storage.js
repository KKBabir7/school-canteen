/**
 * LocalStorage helper — sole persistence for the validation prototype.
 * Future: services will call Java REST APIs instead of Storage.
 */
(function (global) {
  'use strict';

  const prefix = () => (global.APP_CONFIG && global.APP_CONFIG.storagePrefix) || 'schoolFood_';

  const Storage = {
    key(name) {
      return prefix() + name;
    },

    get(name, fallback) {
      try {
        const raw = localStorage.getItem(this.key(name));
        if (raw === null || raw === undefined) return fallback !== undefined ? fallback : null;
        return JSON.parse(raw);
      } catch (e) {
        console.warn('Storage.get failed', name, e);
        return fallback !== undefined ? fallback : null;
      }
    },

    set(name, value) {
      try {
        localStorage.setItem(this.key(name), JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn('Storage.set failed', name, e);
        return false;
      }
    },

    remove(name) {
      try {
        localStorage.removeItem(this.key(name));
      } catch (e) { /* ignore */ }
    },

    clearAll() {
      const p = prefix();
      Object.keys(localStorage).forEach((k) => {
        if (k.indexOf(p) === 0) localStorage.removeItem(k);
      });
    }
  };

  global.Storage = Storage;
})(window);
