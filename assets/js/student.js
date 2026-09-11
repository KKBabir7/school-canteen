/**
 * Student role — order within wallet + parent limits.
 */
(function (global, $) {
  'use strict';

  const StudentApp = {
    childId() { return APP_CONFIG.roles.student.childId; },

    money(n) { return (APP_CONFIG.currency || '₪') + Number(n || 0).toFixed(0); },

    async initHome() {
      const child = await ChildService.getById(this.childId());
      $('#stuWelcome').text((I18n.lang === 'ar' ? 'مرحباً' : 'Hi') + ', ' + child.firstName);
      $('#stuBalance').text(this.money(child.walletBalance));
      $('#stuLimit').text(child.dailyLimitEnabled
        ? this.money(ChildService.remainingDaily(child)) + ' ' + I18n.t('dailyLimit').toLowerCase()
        : '—');
    },

    async initWallet() {
      const child = await ChildService.getById(this.childId());
      $('#stuWalletBal').text(this.money(child.walletBalance));
      $('#stuSpentToday').text(this.money(child.spentToday || 0));
      $('#stuDailyLimit').text(child.dailyLimitEnabled ? this.money(child.dailyLimit) : '—');
    },

    async initOrder() {
      // Reuse parent order flow with forced child
      ParentApp.selectedChildId = this.childId();
      ParentApp.parentId = () => APP_CONFIG.roles.parent.id;
      ParentApp.tray = [];
      ParentApp.orderDate = new Date().toISOString().slice(0, 10);

      const child = await ChildService.getById(this.childId());
      $('#orderChildSelect').html(`<option value="${child.id}">${child.firstName}</option>`).prop('disabled', true);
      $('#orderFamilyBal').closest('.d-flex').find('span').first().text(I18n.t('wallet'));
      $('#orderFamilyBal').text(ParentApp.money(child.walletBalance));
      $('#orderDateSelect').val('today');
      ParentApp.bindOrderUI();
      await ParentApp.renderOrderMenu();
      // Override placeOrder messages for student restrictions
      const orig = ParentApp.placeOrder.bind(ParentApp);
      $('#btnPlaceOrder').off('click').on('click', async () => {
        try {
          await orig();
        } catch (e) { /* ParentApp already toasts */ }
      });
    },

    async initOrders() {
      const orders = await OrderService.getByChild(this.childId());
      const render = (tab) => {
        let list = orders;
        if (tab === 'upcoming') list = orders.filter((o) => ['upcoming', 'new', 'preparing', 'ready'].includes(o.status));
        if (tab === 'past') list = orders.filter((o) => o.status === 'completed');
        if (tab === 'cancelled') list = orders.filter((o) => o.status === 'cancelled');
        $('#studentOrders').html(list.map((o) => `
          <div class="order-card">
            <div class="order-card-main">
              <div class="order-number">#${o.orderNumber}</div>
              <div class="order-meta-item"><strong>${I18n.t('total')}</strong>${ParentApp.money(o.total)}</div>
              ${Components.renderStatusBadge(o.status)}
            </div>
          </div>`).join('') || Components.renderEmptyState('bi-bag', I18n.t('noOrders'), ''));
      };
      render('upcoming');
      $('.order-tabs .tab-btn').on('click', function () {
        $('.order-tabs .tab-btn').removeClass('active');
        $(this).addClass('active');
        render($(this).data('tab'));
      });
    },

    async initProfile() {
      const child = await ChildService.getById(this.childId());
      $('#profName').text(child.firstName + ' ' + child.lastName);
      $('#profSchool').text(CanteenService.getSchoolName(child.schoolId));
      $('#profCode').text(child.studentCode || '—');
      $('#profEmail').text(APP_CONFIG.roles.student.email);
    }
  };

  global.StudentApp = StudentApp;
})(window, jQuery);
