/**
 * ProductService — mock catalog. Future Java: /api/products
 */
(function (global) {
  'use strict';

  const KEY = 'products';

  function ensure() {
    let data = Storage.get(KEY);
    if (!data || !data.length) {
      data = Utils.clone(SchoolFoodSeed.products);
      Storage.set(KEY, data);
    }
    return data;
  }

  const ProductService = {
    async getAll() {
      await Utils.simulateDelay(60);
      return Utils.clone(ensure());
    },

    async getById(id) {
      const p = ensure().find((x) => x.id === id);
      return p ? Utils.clone(p) : null;
    },

    async search(query) {
      const q = (query || '').toLowerCase().trim();
      const list = ensure();
      if (!q) return Utils.clone(list);
      return Utils.clone(list.filter((p) => {
        const en = (p.name && p.name.en) || '';
        const ar = (p.name && p.name.ar) || '';
        return en.toLowerCase().includes(q) || ar.includes(q);
      }));
    },

    async create(payload) {
      await Utils.simulateDelay(100);
      const list = ensure();
      const product = {
        id: Utils.uid('prd'),
        name: {
          en: payload.nameEn || payload.name?.en || '',
          ar: payload.nameAr || payload.name?.ar || ''
        },
        description: {
          en: payload.descEn || payload.description?.en || '',
          ar: payload.descAr || payload.description?.ar || ''
        },
        price: Number(payload.price) || 0,
        image: payload.image || SchoolFoodSeed.images.burger,
        available: payload.available !== false,
        type: payload.type || 'provider'
      };
      list.push(product);
      Storage.set(KEY, list);
      return Utils.clone(product);
    },

    async update(id, payload) {
      await Utils.simulateDelay(80);
      const list = ensure();
      const idx = list.findIndex((p) => p.id === id);
      if (idx < 0) throw new Error('Product not found');
      const cur = list[idx];
      list[idx] = Object.assign({}, cur, {
        name: {
          en: payload.nameEn != null ? payload.nameEn : cur.name.en,
          ar: payload.nameAr != null ? payload.nameAr : cur.name.ar
        },
        description: {
          en: payload.descEn != null ? payload.descEn : (cur.description && cur.description.en) || '',
          ar: payload.descAr != null ? payload.descAr : (cur.description && cur.description.ar) || ''
        },
        price: payload.price != null ? Number(payload.price) : cur.price,
        available: payload.available != null ? !!payload.available : cur.available,
        type: payload.type || cur.type,
        image: payload.image || cur.image
      });
      Storage.set(KEY, list);
      return Utils.clone(list[idx]);
    },

    async toggleAvailable(id) {
      const p = await this.getById(id);
      if (!p) throw new Error('Product not found');
      return this.update(id, {
        nameEn: p.name.en,
        nameAr: p.name.ar,
        descEn: p.description && p.description.en,
        descAr: p.description && p.description.ar,
        price: p.price,
        available: !p.available,
        type: p.type,
        image: p.image
      });
    }
  };

  global.ProductService = ProductService;
})(window);
