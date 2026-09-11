/**
 * ChildService — parent children / student profile.
 * Future Java: /api/children
 */
(function (global) {
  'use strict';

  const KEY = 'children';

  function ensure() {
    let data = Storage.get(KEY);
    if (!data || !data.length) {
      data = Utils.clone(SchoolFoodSeed.children);
      Storage.set(KEY, data);
    }
    return data;
  }

  function save(list) {
    Storage.set(KEY, list);
    return list;
  }

  const ChildService = {
    async getAll(parentId) {
      await Utils.simulateDelay(60);
      let list = ensure();
      if (parentId) list = list.filter((c) => c.parentId === parentId);
      return Utils.clone(list);
    },

    async getById(id) {
      await Utils.simulateDelay(40);
      const c = ensure().find((x) => x.id === id);
      return c ? Utils.clone(c) : null;
    },

    async create(payload) {
      await Utils.simulateDelay(120);
      const list = ensure();
      const child = Object.assign({
        id: Utils.uid('child'),
        walletBalance: 0,
        dailyLimitEnabled: false,
        dailyLimit: 30,
        spentToday: 0,
        canOrderApp: true,
        canOrderCanteen: true,
        foodControlMode: 'all',
        blockedProductIds: [],
        allowedProductIds: [],
        avatarKey: 'sarah'
      }, payload);
      list.push(child);
      save(list);
      return Utils.clone(child);
    },

    async update(id, payload) {
      await Utils.simulateDelay(100);
      const list = ensure();
      const idx = list.findIndex((c) => c.id === id);
      if (idx < 0) throw new Error('Child not found');
      list[idx] = Object.assign({}, list[idx], payload);
      save(list);
      return Utils.clone(list[idx]);
    },

    isProductAllowed(child, productId) {
      if (!child) return true;
      const mode = child.foodControlMode || 'all';
      if (mode === 'all') return true;
      if (mode === 'block') return !(child.blockedProductIds || []).includes(productId);
      if (mode === 'allow') return (child.allowedProductIds || []).includes(productId);
      return true;
    },

    remainingDaily(child) {
      if (!child || !child.dailyLimitEnabled) return Infinity;
      return Math.max(0, (child.dailyLimit || 0) - (child.spentToday || 0));
    }
  };

  global.ChildService = ChildService;
})(window);
