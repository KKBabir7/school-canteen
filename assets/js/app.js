/**
 * School Food Platform — App Core & State
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'schoolFoodMVP';

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function getDefaultState() {
    const mock = global.SchoolFoodMock;
    return {
      canteens: deepClone(mock.canteens),
      menus: deepClone(mock.menus),
      products: deepClone(mock.products),
      orders: deepClone(mock.orders),
      activity: deepClone(mock.activity),
      settings: deepClone(mock.settings),
      schools: deepClone(mock.schools)
    };
  }

  const AppState = {
    data: null,

    init() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.canteens && parsed.menus) {
            this.data = parsed;
            return;
          }
        }
      } catch (e) {
        console.warn('Could not load saved state', e);
      }
      this.data = getDefaultState();
      this.persist();
    },

    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.warn('Could not persist state', e);
      }
    },

    reset() {
      this.data = getDefaultState();
      this.persist();
    },

    getSchool(id) {
      return this.data.schools.find((s) => s.id === id) || null;
    },

    getCanteen(id) {
      return this.data.canteens.find((c) => c.id === id) || null;
    },

    getMenu(id) {
      return this.data.menus.find((m) => m.id === id) || null;
    },

    getProduct(id) {
      return this.data.products.find((p) => p.id === id) || null;
    },

    getOrder(id) {
      return this.data.orders.find((o) => o.id === id) || null;
    },

    getOrderByNumber(num) {
      return this.data.orders.find((o) => o.orderNumber === String(num)) || null;
    },

    uid(prefix) {
      return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    },

    formatMoney(amount) {
      const cur = global.SchoolFoodMock.currency || '₪';
      return cur + Number(amount).toFixed(0);
    },

    formatTime(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    },

    formatDate(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    formatRelative(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      const now = new Date();
      const diff = (now - d) / 1000;
      if (diff < 60) return 'Just now';
      if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
      if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
      if (diff < 172800) return 'Yesterday';
      return this.formatDate(iso);
    },

    greeting() {
      const h = new Date().getHours();
      if (h < 12) return 'Good morning';
      if (h < 17) return 'Good afternoon';
      return 'Good evening';
    },

    countMenuItems(menu) {
      if (!menu || !menu.sections) return 0;
      return menu.sections.reduce((sum, s) => sum + (s.items ? s.items.length : 0), 0);
    },

    countSections(menu) {
      return menu && menu.sections ? menu.sections.length : 0;
    }
  };

  AppState.init();
  global.AppState = AppState;
})(window);
