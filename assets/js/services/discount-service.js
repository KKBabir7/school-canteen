/**
 * DiscountService — canteen manager discounts (mock).
 * Future Java: /api/discounts
 */
(function (global) {
  'use strict';

  const KEY = 'discounts';

  function seed() {
    return [
      {
        id: 'disc-1',
        canteenId: 'can-1',
        name: { en: 'Combo lunch -10%', ar: 'وجبة كومبو -١٠٪' },
        type: 'percent',
        value: 10,
        active: true,
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        createdAt: '2026-09-01T10:00:00'
      },
      {
        id: 'disc-2',
        canteenId: 'can-1',
        name: { en: 'Drink deal ₪2 off', ar: 'خصم ₪٢ على المشروب' },
        type: 'fixed',
        value: 2,
        active: false,
        weekdays: ['fri'],
        createdAt: '2026-09-05T10:00:00'
      }
    ];
  }

  function ensure() {
    let data = Storage.get(KEY);
    if (!data || !data.length) {
      data = seed();
      Storage.set(KEY, data);
    }
    return data;
  }

  const DiscountService = {
    async getAll(canteenId) {
      await Utils.simulateDelay(50);
      let list = ensure();
      if (canteenId) list = list.filter((d) => d.canteenId === canteenId);
      return Utils.clone(list);
    },

    async create(payload) {
      const list = ensure();
      const d = Object.assign({
        id: Utils.uid('disc'),
        active: true,
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        createdAt: new Date().toISOString()
      }, payload);
      list.unshift(d);
      Storage.set(KEY, list);
      return Utils.clone(d);
    },

    async update(id, payload) {
      const list = ensure();
      const idx = list.findIndex((d) => d.id === id);
      if (idx < 0) throw new Error('Discount not found');
      list[idx] = Object.assign({}, list[idx], payload);
      Storage.set(KEY, list);
      return Utils.clone(list[idx]);
    },

    async toggle(id) {
      const list = ensure();
      const d = list.find((x) => x.id === id);
      if (!d) throw new Error('Discount not found');
      d.active = !d.active;
      Storage.set(KEY, list);
      return Utils.clone(d);
    },

    async remove(id) {
      let list = ensure().filter((d) => d.id !== id);
      Storage.set(KEY, list);
      return true;
    }
  };

  global.DiscountService = DiscountService;
})(window);
