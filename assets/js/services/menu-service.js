/**
 * MenuService — menus, sections, items, assignments.
 * Future Java: /api/menus, /api/menu-assignments
 */
(function (global) {
  'use strict';

  const KEY = 'menus';

  function ensure() {
    let data = Storage.get(KEY);
    if (!data || !data.length) {
      data = Utils.clone(SchoolFoodSeed.menus);
      Storage.set(KEY, data);
    }
    return data;
  }

  function save(list) {
    Storage.set(KEY, list);
    return list;
  }

  function findMenu(list, id) {
    return list.find((m) => m.id === id);
  }

  const MenuService = {
    async getAll() {
      await Utils.simulateDelay(80);
      return Utils.clone(ensure());
    },

    async getById(id) {
      await Utils.simulateDelay(50);
      const m = findMenu(ensure(), id);
      return m ? Utils.clone(m) : null;
    },

    async create(payload) {
      await Utils.simulateDelay(120);
      const list = ensure();
      const menu = {
        id: Utils.uid('menu'),
        name: {
          en: payload.nameEn || '',
          ar: payload.nameAr || ''
        },
        description: {
          en: payload.descEn || '',
          ar: payload.descAr || ''
        },
        status: payload.status || 'draft',
        availability: payload.status === 'active' ? 'available' : 'unavailable',
        availabilityDates: null,
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        assignedCanteenIds: [],
        lastUpdated: new Date().toISOString(),
        sections: payload.sections || []
      };
      list.unshift(menu);
      save(list);
      return Utils.clone(menu);
    },

    async update(id, payload) {
      await Utils.simulateDelay(100);
      const list = ensure();
      const idx = list.findIndex((m) => m.id === id);
      if (idx < 0) throw new Error('Menu not found');
      list[idx] = Object.assign({}, list[idx], payload, { lastUpdated: new Date().toISOString() });
      save(list);
      return Utils.clone(list[idx]);
    },

    async delete(id) {
      await Utils.simulateDelay(80);
      let list = ensure().filter((m) => m.id !== id);
      save(list);
      // also unassign from canteens
      const canteens = Storage.get('canteens') || [];
      canteens.forEach((c) => {
        c.assignedMenuIds = (c.assignedMenuIds || []).filter((mid) => mid !== id);
      });
      Storage.set('canteens', canteens);
      return true;
    },

    async setStatus(id, status) {
      const patch = { status };
      if (status === 'active') patch.availability = 'available';
      if (status === 'draft' || status === 'inactive') patch.availability = 'unavailable';
      return this.update(id, patch);
    },

    countItems(menu) {
      if (!menu || !menu.sections) return 0;
      return menu.sections.reduce((s, sec) => s + (sec.items ? sec.items.length : 0), 0);
    },

    countSections(menu) {
      return menu && menu.sections ? menu.sections.length : 0;
    },

    async assignMenuToCanteens(menuId, canteenIds, options) {
      options = options || {};
      await Utils.simulateDelay(120);
      const list = ensure();
      const menu = findMenu(list, menuId);
      if (!menu) throw new Error('Menu not found');

      menu.assignedCanteenIds = menu.assignedCanteenIds || [];
      canteenIds.forEach((cid) => {
        if (menu.assignedCanteenIds.indexOf(cid) < 0) menu.assignedCanteenIds.push(cid);
      });

      if (options.useDates) {
        menu.availabilityDates = { from: options.from || null, to: options.to || null };
      }
      if (options.weekdays) menu.weekdays = options.weekdays;
      if (options.status) {
        menu.status = options.status;
        menu.availability = options.status === 'active' ? 'available' : 'unavailable';
      }
      menu.lastUpdated = new Date().toISOString();
      save(list);

      for (const cid of canteenIds) {
        await CanteenService.assignMenu(cid, menuId);
      }
      return Utils.clone(menu);
    },

    async updateAvailability(menuId, payload) {
      return this.update(menuId, {
        weekdays: payload.weekdays,
        availabilityDates: payload.availabilityDates || null
      });
    },

    async updateItemAvailability(menuId, itemId, payload) {
      const list = ensure();
      const menu = findMenu(list, menuId);
      if (!menu) throw new Error('Menu not found');
      let found = null;
      (menu.sections || []).forEach((sec) => {
        (sec.items || []).forEach((item) => {
          if (item.id === itemId) found = item;
        });
      });
      if (!found) throw new Error('Item not found');
      Object.assign(found, payload);
      menu.lastUpdated = new Date().toISOString();
      save(list);
      return Utils.clone(found);
    },

    async updateItemPrice(menuId, itemId, price) {
      return this.updateItemAvailability(menuId, itemId, { menuPrice: Number(price) });
    },

    async getForCanteen(canteenId) {
      const all = await this.getAll();
      return all.filter((m) => (m.assignedCanteenIds || []).indexOf(canteenId) >= 0);
    }
  };

  global.MenuService = MenuService;
})(window);
