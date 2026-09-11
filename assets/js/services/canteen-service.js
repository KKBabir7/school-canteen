/**
 * CanteenService — mock now, Java REST later.
 * Future: GET/POST/PUT/PATCH → /api/canteens
 */
(function (global) {
  'use strict';

  const KEY = 'canteens';

  function ensure() {
    let data = Storage.get(KEY);
    if (!data || !data.length) {
      data = Utils.clone(SchoolFoodSeed.canteens);
      Storage.set(KEY, data);
    }
    return data;
  }

  function save(list) {
    Storage.set(KEY, list);
    return list;
  }

  const CanteenService = {
    /** @returns {Promise<Array>} */
    async getAll() {
      await Utils.simulateDelay(80);
      // if (APP_CONFIG.mode === 'api') return fetch(...)
      return Utils.clone(ensure());
    },

    async getById(id) {
      await Utils.simulateDelay(50);
      const item = ensure().find((c) => c.id === id);
      return item ? Utils.clone(item) : null;
    },

    async create(payload) {
      await Utils.simulateDelay(120);
      const list = ensure();
      const canteen = {
        id: Utils.uid('can'),
        name: payload.name,
        schoolId: payload.schoolId,
        phone: payload.phone || '',
        email: payload.email || '',
        status: payload.status === 'inactive' ? 'inactive' : 'active',
        assignedMenuIds: [],
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      list.unshift(canteen);
      save(list);
      return Utils.clone(canteen);
    },

    async update(id, payload) {
      await Utils.simulateDelay(100);
      const list = ensure();
      const idx = list.findIndex((c) => c.id === id);
      if (idx < 0) throw new Error('Canteen not found');
      list[idx] = Object.assign({}, list[idx], payload, { lastUpdated: new Date().toISOString() });
      save(list);
      return Utils.clone(list[idx]);
    },

    async toggleStatus(id) {
      const c = await this.getById(id);
      if (!c) throw new Error('Canteen not found');
      return this.update(id, { status: c.status === 'active' ? 'inactive' : 'active' });
    },

    async assignMenu(canteenId, menuId) {
      const list = ensure();
      const c = list.find((x) => x.id === canteenId);
      if (!c) throw new Error('Canteen not found');
      c.assignedMenuIds = c.assignedMenuIds || [];
      if (c.assignedMenuIds.indexOf(menuId) < 0) c.assignedMenuIds.push(menuId);
      c.lastUpdated = new Date().toISOString();
      save(list);
      return Utils.clone(c);
    },

    async unassignMenu(canteenId, menuId) {
      const list = ensure();
      const c = list.find((x) => x.id === canteenId);
      if (!c) return null;
      c.assignedMenuIds = (c.assignedMenuIds || []).filter((id) => id !== menuId);
      c.lastUpdated = new Date().toISOString();
      save(list);
      return Utils.clone(c);
    },

    getSchools() {
      let schools = Storage.get('schools');
      if (!schools) {
        schools = Utils.clone(SchoolFoodSeed.schools);
        Storage.set('schools', schools);
      }
      return Utils.clone(schools);
    },

    getSchoolName(schoolId) {
      const s = this.getSchools().find((x) => x.id === schoolId);
      return s ? Utils.localized(s.name) : '—';
    }
  };

  global.CanteenService = CanteenService;
})(window);
