/**
 * School Food Platform — Orders Logic
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

    getFilteredOrders() {
      const canteenId = SchoolFoodMock.users.canteenManager.canteenId;
      let list = AppState.data.orders.filter((o) => o.canteenId === canteenId);

      if (this.currentTab === 'history') {
        list = list.filter((o) => o.status === 'completed' || o.status === 'cancelled');
      } else {
        list = list.filter((o) => o.status === this.currentTab);
      }

      const q = ($('#searchOrders').val() || '').toLowerCase().trim();
      if (q) {
        list = list.filter((o) =>
          o.orderNumber.includes(q) ||
          o.studentName.toLowerCase().includes(q) ||
          o.className.toLowerCase().includes(q)
        );
      }

      list.sort((a, b) => {
        const ta = new Date(a.orderTime).getTime();
        const tb = new Date(b.orderTime).getTime();
        return this.sortBy === 'oldest' ? ta - tb : tb - ta;
      });

      return list;
    },

    updateTabCounts() {
      const canteenId = SchoolFoodMock.users.canteenManager.canteenId;
      const orders = AppState.data.orders.filter((o) => o.canteenId === canteenId);
      const counts = {
        new: 0,
        preparing: 0,
        ready: 0,
        upcoming: 0,
        history: 0
      };
      orders.forEach((o) => {
        if (o.status === 'completed' || o.status === 'cancelled') counts.history++;
        else if (counts[o.status] !== undefined) counts[o.status]++;
      });

      Object.keys(counts).forEach((key) => {
        $(`#count-${key}`).text(counts[key]);
      });
    },

    renderOrders() {
      this.updateTabCounts();
      const list = this.getFilteredOrders();
      const $list = $('#ordersList');
      const $empty = $('#ordersEmpty');

      if (!list.length) {
        $list.hide();
        const labels = {
          new: 'No new orders',
          preparing: 'Nothing preparing',
          ready: 'No orders ready',
          upcoming: 'No upcoming orders',
          history: 'No order history yet'
        };
        $empty.show().html(Components.renderEmptyState(
          'bi-bag',
          labels[this.currentTab] || 'No orders',
          'Orders will appear here as students place them.'
        ));
        return;
      }

      $empty.hide();
      $list.show().html(list.map((o) => Components.renderOrder(o)).join(''));
    },

    bindOrdersPage() {
      $('.order-tabs .tab-btn').on('click', (e) => {
        this.currentTab = $(e.currentTarget).data('tab');
        Components.setActiveTab(this.currentTab);
        // custom panels not used — list is shared
        $('.order-tabs .tab-btn').removeClass('active');
        $(e.currentTarget).addClass('active');
        this.renderOrders();
      });

      $('#searchOrders').on('input', () => this.renderOrders());

      const $sort = $('#sortOrders');
      if ($sort.length) {
        Components.initializeSelect2($sort, { minimumResultsForSearch: Infinity });
        $sort.on('change', () => {
          this.sortBy = $sort.val() || 'newest';
          this.renderOrders();
        });
      }

      $(document).on('click', '.order-card', function (e) {
        if ($(e.target).closest('.btn-order-action, .order-actions').length &&
            !$(e.target).closest('.btn-view-order').length) {
          return;
        }
        const id = $(this).data('id');
        if (id) window.location.href = 'order-details.html?id=' + id;
      });

      $(document).on('click', '.btn-view-order', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        if (id) window.location.href = 'order-details.html?id=' + id;
      });

      $(document).on('click', '.btn-order-action', async function (e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        const action = $(this).data('action');
        await Orders.transitionOrder(id, action);
        Orders.renderOrders();
      });
    },

    async transitionOrder(id, action) {
      const order = AppState.getOrder(id);
      if (!order) return false;

      const map = {
        start: { from: 'new', to: 'preparing', title: 'Start preparing?', text: `Order #${order.orderNumber} will move to Preparing.`, confirm: 'Start Preparing' },
        ready: { from: 'preparing', to: 'ready', title: 'Mark as ready?', text: `Order #${order.orderNumber} is ready for pickup.`, confirm: 'Mark Ready' },
        complete: { from: 'ready', to: 'completed', title: 'Mark completed?', text: `Confirm that order #${order.orderNumber} has been picked up.`, confirm: 'Mark Completed' }
      };

      const step = map[action];
      if (!step || order.status !== step.from) return false;

      const ok = await Components.showConfirm({
        title: step.title,
        text: step.text,
        confirmText: step.confirm,
        icon: 'question'
      });
      if (!ok) return false;

      order.status = step.to;
      AppState.persist();
      Components.showToast(`Order #${order.orderNumber} is now ${step.to}.`, 'success');
      return true;
    },

    updateOrderStatus(id, status) {
      const order = AppState.getOrder(id);
      if (!order) return false;
      order.status = status;
      AppState.persist();
      return true;
    },

    initOrderDetails() {
      const id = Components.getQueryParam('id') || 'ord-1';
      let order = AppState.getOrder(id) || AppState.getOrderByNumber(id);
      if (!order) {
        $('#orderDetailRoot').html(Components.renderEmptyState('bi-bag', 'Order not found', 'This order does not exist.',
          '<a href="orders.html" class="btn-app btn-primary-app">Back to Orders</a>'));
        return;
      }

      this.renderOrderDetail(order);
    },

    renderOrderDetail(order) {
      $('#orderNumber').text('#' + order.orderNumber);
      $('#orderStudent').text(order.studentName);
      $('#orderClass').text(order.className);
      $('#orderTime').text(AppState.formatTime(order.orderTime));
      $('#orderStatusBadge').html(Components.renderStatusBadge(order.status));
      $('#orderStepper').html(Components.renderStatusStepper(order.status));

      const itemsHtml = (order.items || []).map((item) => `
        <div class="d-flex justify-content-between align-items-center py-3 border-bottom">
          <div>
            <strong>${item.name}</strong>
            <span class="text-muted"> × ${item.qty}</span>
          </div>
          <div class="fw-600">${AppState.formatMoney(item.price * item.qty)}</div>
        </div>
      `).join('');

      $('#orderItems').html(itemsHtml);
      $('#orderTotal').text(AppState.formatMoney(order.total));

      // Print view
      $('#printOrderNumber').text('#' + order.orderNumber);
      $('#printStudent').text(order.studentName);
      $('#printClass').text('Grade ' + order.className);
      $('#printTime').text(AppState.formatTime(order.orderTime));
      $('#printItems').html((order.items || []).map((item) =>
        `<tr><td>${item.name}</td><td>${item.qty}</td><td>${AppState.formatMoney(item.price * item.qty)}</td></tr>`
      ).join(''));
      $('#printTotal').text(AppState.formatMoney(order.total));

      this.renderPrimaryAction(order);

      $('#btnPrintOrder').off('click').on('click', () => window.print());
    },

    renderPrimaryAction(order) {
      const $wrap = $('#orderPrimaryAction');
      let html = '';

      if (order.status === 'new') {
        html = `<button type="button" class="btn-app btn-primary-app btn-lg-app" id="btnStatusAction" data-action="start">
          <i class="bi bi-play-fill" aria-hidden="true"></i> Start Preparing</button>`;
      } else if (order.status === 'preparing') {
        html = `<button type="button" class="btn-app btn-primary-app btn-lg-app" id="btnStatusAction" data-action="ready">
          <i class="bi bi-check2" aria-hidden="true"></i> Mark Ready</button>`;
      } else if (order.status === 'ready') {
        html = `<button type="button" class="btn-app btn-primary-app btn-lg-app" id="btnStatusAction" data-action="complete">
          <i class="bi bi-check2-all" aria-hidden="true"></i> Mark Completed</button>`;
      } else {
        html = `<span class="text-muted">This order is ${order.status}.</span>`;
      }

      $wrap.html(html);
      $('#btnStatusAction').on('click', async function () {
        const action = $(this).data('action');
        const ok = await Orders.transitionOrder(order.id, action);
        if (ok) {
          const updated = AppState.getOrder(order.id);
          Orders.renderOrderDetail(updated);
        }
      });
    }
  };

  global.Orders = Orders;
  global.updateOrderStatus = function (id, status) {
    return Orders.updateOrderStatus(id, status);
  };
})(window, jQuery);
