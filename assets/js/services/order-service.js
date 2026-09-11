/**
 * OrderService — canteen order workflow.
 * Future Java: /api/orders + status transitions
 */
(function (global) {
  'use strict';

  const KEY = 'orders';
  const FLOW = { new: 'preparing', preparing: 'ready', ready: 'completed' };

  function ensure() {
    let data = Storage.get(KEY);
    if (!data || !data.length) {
      data = Utils.clone(SchoolFoodSeed.orders);
      Storage.set(KEY, data);
    }
    return data;
  }

  function save(list) {
    Storage.set(KEY, list);
    return list;
  }

  const OrderService = {
    async getAll(canteenId) {
      await Utils.simulateDelay(80);
      let list = ensure();
      if (canteenId) list = list.filter((o) => o.canteenId === canteenId);
      return Utils.clone(list);
    },

    async getByParent(parentId) {
      await Utils.simulateDelay(80);
      return Utils.clone(ensure().filter((o) => o.parentId === parentId));
    },

    async getByChild(childId) {
      await Utils.simulateDelay(80);
      return Utils.clone(ensure().filter((o) => o.childId === childId));
    },

    async getById(id) {
      await Utils.simulateDelay(50);
      const o = ensure().find((x) => x.id === id || x.orderNumber === id);
      return o ? Utils.clone(o) : null;
    },

    async create(payload) {
      await Utils.simulateDelay(150);
      const list = ensure();
      const num = 'SC-' + (10260 + list.length);
      const order = {
        id: num,
        orderNumber: num,
        studentName: payload.studentName,
        childId: payload.childId || null,
        parentId: payload.parentId || null,
        classroom: payload.classroom || '',
        canteenId: payload.canteenId,
        orderDate: payload.orderDate || new Date().toISOString().slice(0, 10),
        orderTime: payload.orderTime || new Date().toISOString(),
        status: payload.status || 'new',
        total: payload.total,
        items: payload.items || []
      };
      list.unshift(order);
      save(list);
      return Utils.clone(order);
    },

    async updateOrderStatus(id, status) {
      await Utils.simulateDelay(100);
      const list = ensure();
      const o = list.find((x) => x.id === id || x.orderNumber === id);
      if (!o) throw new Error('Order not found');
      o.status = status;
      save(list);
      return Utils.clone(o);
    },

    async advanceStatus(id) {
      const o = await this.getById(id);
      if (!o) throw new Error('Order not found');
      const next = FLOW[o.status];
      if (!next) throw new Error('Cannot advance status');
      return this.updateOrderStatus(o.id, next);
    },

    async getCounts(canteenId) {
      const list = await this.getAll(canteenId);
      const counts = { new: 0, preparing: 0, ready: 0, upcoming: 0, history: 0, today: 0, revenue: 0 };
      list.forEach((o) => {
        if (o.status === 'completed' || o.status === 'cancelled') counts.history++;
        else if (counts[o.status] !== undefined) counts[o.status]++;
        if (o.status !== 'upcoming') {
          counts.today++;
          if (o.status === 'completed') counts.revenue += Number(o.total) || 0;
        }
      });
      return counts;
    }
  };

  global.OrderService = OrderService;
  global.updateOrderStatus = function (id, status) {
    return OrderService.updateOrderStatus(id, status);
  };
})(window);
