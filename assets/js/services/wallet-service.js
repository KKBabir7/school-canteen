/**
 * WalletService — family + child wallets.
 * Future Java: /api/wallets
 */
(function (global) {
  'use strict';

  const KEY = 'wallets';
  const PM_KEY = 'paymentMethods';

  function ensure() {
    let data = Storage.get(KEY);
    if (!data) {
      data = Utils.clone(SchoolFoodSeed.wallets);
      Storage.set(KEY, data);
    }
    return data;
  }

  function save(data) {
    Storage.set(KEY, data);
    return data;
  }

  const WalletService = {
    async getFamily(ownerId) {
      await Utils.simulateDelay(40);
      const data = ensure();
      return Utils.clone({
        balance: data.family.balance,
        ownerId: data.family.ownerId || ownerId,
        activity: data.activity || []
      });
    },

    async topUp(amount, parentId) {
      await Utils.simulateDelay(150);
      amount = Number(amount);
      if (!amount || amount <= 0) throw new Error('Invalid amount');
      const data = ensure();
      data.family.balance = Number(data.family.balance) + amount;
      data.activity = data.activity || [];
      data.activity.unshift({
        id: Utils.uid('wa'),
        type: 'topup',
        amount: amount,
        label: { en: 'Wallet Top Up', ar: 'شحن المحفظة' },
        date: new Date().toISOString(),
        balanceAfter: data.family.balance
      });
      save(data);
      return Utils.clone(data.family);
    },

    async transferToChild(childId, amount) {
      await Utils.simulateDelay(150);
      amount = Number(amount);
      if (!amount || amount <= 0) throw new Error('Invalid amount');
      const data = ensure();
      if (amount > data.family.balance) throw new Error('Insufficient family balance');

      const children = Storage.get('children') || Utils.clone(SchoolFoodSeed.children);
      const child = children.find((c) => c.id === childId);
      if (!child) throw new Error('Child not found');

      data.family.balance -= amount;
      child.walletBalance = Number(child.walletBalance || 0) + amount;
      Storage.set('children', children);

      data.activity.unshift({
        id: Utils.uid('wa'),
        type: 'transfer',
        amount: -amount,
        label: { en: 'Transferred to ' + child.firstName, ar: 'تحويل إلى ' + child.firstName },
        childId: childId,
        date: new Date().toISOString(),
        balanceAfter: data.family.balance
      });
      save(data);
      return { family: Utils.clone(data.family), child: Utils.clone(child) };
    },

    async withdrawFromChild(childId, amount) {
      await Utils.simulateDelay(150);
      amount = Number(amount);
      if (!amount || amount <= 0) throw new Error('Invalid amount');
      const data = ensure();
      const children = Storage.get('children') || Utils.clone(SchoolFoodSeed.children);
      const child = children.find((c) => c.id === childId);
      if (!child) throw new Error('Child not found');
      if (amount > Number(child.walletBalance || 0)) throw new Error('Insufficient child balance');

      child.walletBalance -= amount;
      data.family.balance += amount;
      Storage.set('children', children);
      data.activity.unshift({
        id: Utils.uid('wa'),
        type: 'withdraw',
        amount: amount,
        label: { en: 'Withdrawn from ' + child.firstName, ar: 'سحب من ' + child.firstName },
        childId: childId,
        date: new Date().toISOString(),
        balanceAfter: data.family.balance
      });
      save(data);
      return { family: Utils.clone(data.family), child: Utils.clone(child) };
    },

    async chargeChild(childId, amount, label) {
      await Utils.simulateDelay(80);
      amount = Number(amount);
      const children = Storage.get('children') || Utils.clone(SchoolFoodSeed.children);
      const child = children.find((c) => c.id === childId);
      if (!child) throw new Error('Child not found');
      if (amount > Number(child.walletBalance || 0)) throw new Error('Insufficient child wallet');
      const remaining = ChildService.remainingDaily(child);
      if (amount > remaining) throw new Error('Daily spending limit reached');

      child.walletBalance -= amount;
      child.spentToday = Number(child.spentToday || 0) + amount;
      Storage.set('children', children);
      return Utils.clone(child);
    },

    async getPaymentMethods(parentId) {
      let list = Storage.get(PM_KEY);
      if (!list) {
        list = Utils.clone(SchoolFoodSeed.paymentMethods || []);
        Storage.set(PM_KEY, list);
      }
      return Utils.clone(list.filter((p) => !parentId || p.parentId === parentId));
    },

    async addPaymentMethod(payload) {
      const list = (await this.getPaymentMethods()) || [];
      const pm = Object.assign({ id: Utils.uid('pm') }, payload);
      list.push(pm);
      Storage.set(PM_KEY, list);
      return Utils.clone(pm);
    },

    async removePaymentMethod(id) {
      let list = await this.getPaymentMethods();
      list = list.filter((p) => p.id !== id);
      Storage.set(PM_KEY, list);
      return true;
    }
  };

  global.WalletService = WalletService;
})(window);
