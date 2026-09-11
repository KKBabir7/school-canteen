/**
 * Orders page + details via OrderService.
 */
(function (global, $) {
  'use strict';

  const Orders = {
    currentTab: 'new',
    sortBy: 'newest',

    initOrdersPage() {
      this.currentTab = 'new';
      this.renderOrders();
      this.bindOrdersPage();
    },

    getCanteenId() {
      return APP_CONFIG.roles.canteenManager.canteenId;
    },

    async getFilteredOrders() {
      let list = await OrderService.getAll(this.getCanteenId());

      if (this.currentTab === 'history') {
        list = list.filter((o) => o.status === 'completed' || o.status === 'cancelled');
      } else {
        list = list.filter((o) => o.status === this.currentTab);
      }

      const q = ($('#searchOrders').val() || '').toLowerCase().trim();
      if (q) {
        list = list.filter((o) =>
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.studentName || '').toLowerCase().includes(q) ||
          (o.classroom || o.className || '').toLowerCase().includes(q)
        );
      }

      list.sort((a, b) => {
        if (this.sortBy === 'highest') return (b.total || 0) - (a.total || 0);
        if (this.sortBy === 'lowest') return (a.total || 0) - (b.total || 0);
        const ta = new Date(a.orderTime).getTime();
        const tb = new Date(b.orderTime).getTime();
        return this.sortBy === 'oldest' ? ta - tb : tb - ta;
      });

      return list;
    },

    async updateTabCounts() {
      const orders = await OrderService.getAll(this.getCanteenId());
      const counts = { new: 0, preparing: 0, ready: 0, upcoming: 0, history: 0 };
      orders.forEach((o) => {
        if (o.status === 'completed' || o.status === 'cancelled') counts.history++;
        else if (counts[o.status] !== undefined) counts[o.status]++;
      });
      Object.keys(counts).forEach((key) => {
        $(`#count-${key}`).text(counts[key]);
      });
    },

    async renderOrders() {
      await this.updateTabCounts();
      const list = await this.getFilteredOrders();
      const $list = $('#ordersList');
      const $empty = $('#ordersEmpty');

      if (!list.length) {
        $list.hide();
        const labels = {
          new: I18n.t('newOrders'),
          preparing: I18n.t('preparing'),
          ready: I18n.t('ready'),
          upcoming: I18n.t('upcoming'),
          history: I18n.t('history')
        };
        $empty.show().html(Components.renderEmptyState(
          'bi-bag',
          labels[this.currentTab] || I18n.t('noOrders'),
          ''
        ));
        return;
      }

      $empty.hide();
      $list.show().html(list.map((o) => Components.renderOrder(o)).join(''));
    },

    bindOrdersPage() {
      $('.order-tabs .tab-btn').on('click', (e) => {
        this.currentTab = $(e.currentTarget).data('tab');
        $('.order-tabs .tab-btn').removeClass('active').attr('aria-selected', 'false');
        $(e.currentTarget).addClass('active').attr('aria-selected', 'true');
        this.renderOrders();
      });

      $('#searchOrders').on('input', Utils.debounce(() => this.renderOrders(), 250));

      $('#sortOrders').on('change', () => {
        this.sortBy = $('#sortOrders').val();
        this.renderOrders();
      });

      $(document).on('click', '.btn-view-order, .order-card', function (e) {
        if ($(e.target).closest('.btn-order-action, .action-menu').length) return;
        const id = $(this).data('id') || $(this).closest('.order-card').data('id');
        if (id) window.location.href = 'order-details.html?id=' + id;
      });

      $(document).on('click', '.btn-order-action', async function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        const action = $(this).data('action');
        const map = { start: 'preparing', ready: 'ready', complete: 'completed' };
        if (action === 'start') await OrderService.updateOrderStatus(id, 'preparing');
        else if (action === 'ready') await OrderService.updateOrderStatus(id, 'ready');
        else if (action === 'complete') await OrderService.updateOrderStatus(id, 'completed');
        Components.showToast(I18n.t('success'), 'success');
        Orders.renderOrders();
      });
    },

    async initOrderDetails() {
      const id = Components.getQueryParam('id');
      if (!id) {
        window.location.href = 'orders.html';
        return;
      }

      const order = await OrderService.getById(id);
      if (!order) {
        window.location.href = 'orders.html';
        return;
      }

      $('#odNumber').text('#' + order.orderNumber);
      $('#odStudent').text(order.studentName);
      $('#odClassroom').text(order.classroom || order.className || '—');
      $('#odTime').text(Utils.formatTime(order.orderTime) + ' · ' + Utils.formatDate(order.orderTime));
      $('#odTotal').text(Utils.money(order.total));
      $('#odStatus').html(Components.renderStatusBadge(order.status));
      $('#odStepper').html(Components.renderStatusStepper(order.status));

      $('#odItems').html((order.items || []).map((item) => `
        <div class="order-line-item">
          <img src="${item.image || ''}" alt="" class="order-line-img object-cover" loading="lazy">
          <div class="flex-grow-1">
            <strong>${Utils.localized(item.name) || item.name}</strong>
            <span class="text-muted">× ${item.qty || 1}</span>
          </div>
          <span>${Utils.money((item.price || 0) * (item.qty || 1))}</span>
        </div>
      `).join(''));

      this.renderDetailActions(order);

      if ($('#printOrderNumber').length) {
        $('#printOrderNumber').text('#' + order.orderNumber);
        $('#printStudent').text(order.studentName);
        $('#printClass').text(order.classroom || order.className || '—');
        $('#printTime').text(Utils.formatTime(order.orderTime));
        $('#printTotal').text(Utils.money(order.total));
        $('#printItems').html($('#odItems').html());
      }

      $('#btnPrintOrder').on('click', () => window.print());
    },

    renderDetailActions(order) {
      const $actions = $('#odActions');
      $actions.empty();

      if (order.status === 'new') {
        $actions.append(`<button type="button" class="btn-app btn-primary-app" id="btnAdvanceOrder">${I18n.t('startPreparing')}</button>`);
      } else if (order.status === 'preparing') {
        $actions.append(`<button type="button" class="btn-app btn-primary-app" id="btnAdvanceOrder">${I18n.t('markReady')}</button>`);
      } else if (order.status === 'ready') {
        $actions.append(`<button type="button" class="btn-app btn-primary-app" id="btnAdvanceOrder">${I18n.t('completeOrder')}</button>`);
      }

      $('#btnAdvanceOrder').on('click', async () => {
        await OrderService.advanceStatus(order.id);
        Components.showSuccess(I18n.t('success'), '');
        Orders.initOrderDetails();
      });
    }
  };

  global.Orders = Orders;
})(window, jQuery);
