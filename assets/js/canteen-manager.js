/**
 * School Food Platform — Canteen Manager Logic
 */
(function (global, $) {
  'use strict';

  const CanteenManager = {
    getCanteenId() {
      return SchoolFoodMock.users.canteenManager.canteenId;
    },

    initDashboard() {
      const canteenId = this.getCanteenId();
      const orders = AppState.data.orders.filter((o) => o.canteenId === canteenId);

      const counts = {
        new: orders.filter((o) => o.status === 'new').length,
        preparing: orders.filter((o) => o.status === 'preparing').length,
        ready: orders.filter((o) => o.status === 'ready').length,
        today: orders.filter((o) => o.status !== 'upcoming').length
      };

      Components.animateCountUp('#statNewOrders', counts.new);
      Components.animateCountUp('#statPreparing', counts.preparing);
      Components.animateCountUp('#statReady', counts.ready);
      Components.animateCountUp('#statTodayOrders', counts.today);

      this.renderTodayMenu();
      this.renderTodayOrdersSummary(orders);
    },

    renderTodayMenu() {
      const canteen = AppState.getCanteen(this.getCanteenId());
      const $el = $('#todayMenuGrid');
      if (!$el.length || !canteen) return;

      const menuIds = canteen.assignedMenuIds || [];
      const items = [];

      menuIds.forEach((mid) => {
        const menu = AppState.getMenu(mid);
        if (!menu || menu.status !== 'active') return;
        (menu.sections || []).forEach((sec) => {
          (sec.items || []).forEach((item) => {
            const product = AppState.getProduct(item.productId);
            if (product) {
              items.push({ item, product, menuId: mid });
            }
          });
        });
      });

      const featured = items.slice(0, 4);
      if (!featured.length) {
        $el.html(Components.renderEmptyState('bi-egg-fried', 'No menu today', 'Ask your food provider to assign a menu.'));
        return;
      }

      $el.html(featured.map(({ item, product }) => `
        <div class="food-card" data-aos="fade-up">
          <div class="food-card-img">
            <img src="${product.image}" alt="${product.name}" class="object-cover" loading="lazy">
          </div>
          <div class="food-card-body">
            <h4>${product.name}</h4>
            <div class="food-card-footer">
              <span class="food-card-price">${AppState.formatMoney(item.menuPrice)}</span>
              ${Components.renderStatusBadge(item.available !== false ? 'available' : 'unavailable')}
            </div>
          </div>
        </div>
      `).join(''));
    },

    renderTodayOrdersSummary(orders) {
      const $el = $('#todayOrdersSummary');
      if (!$el.length) return;
      const recent = orders
        .filter((o) => o.status !== 'upcoming')
        .sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime))
        .slice(0, 4);

      if (!recent.length) {
        $el.html('<p class="text-muted mb-0">No orders yet today.</p>');
        return;
      }

      $el.html(recent.map((o) => `
        <a href="order-details.html?id=${o.id}" class="d-flex justify-content-between align-items-center py-2 border-bottom text-decoration-none text-reset">
          <div>
            <strong>#${o.orderNumber}</strong>
            <span class="text-muted ms-2">${o.studentName}</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="fw-600">${AppState.formatMoney(o.total)}</span>
            ${Components.renderStatusBadge(o.status)}
          </div>
        </a>
      `).join(''));
    },

    initMyMenus() {
      const canteen = AppState.getCanteen(this.getCanteenId());
      if (!canteen) return;

      const menus = (canteen.assignedMenuIds || [])
        .map((id) => AppState.getMenu(id))
        .filter(Boolean);

      const today = menus.filter((m) => m.status === 'active');
      const upcoming = menus.filter((m) => m.status !== 'active');

      this.renderMenuGroup('#todayMenus', today, 'No menus for today', 'Assigned active menus will show here.');
      this.renderMenuGroup('#upcomingMenus', upcoming.length ? upcoming : menus.filter((m) => m.status === 'draft'),
        'No upcoming menus', 'Draft or scheduled menus will appear here.');

      this.bindMenuCardClicks();
      this.bindAvailabilityDates();
    },

    renderMenuGroup(selector, menus, emptyTitle, emptyText) {
      const $el = $(selector);
      if (!$el.length) return;

      if (!menus.length) {
        $el.html(Components.renderEmptyState('bi-journal', emptyTitle, emptyText));
        return;
      }

      $el.html(menus.map((m) => `
        <div class="menu-card" data-id="${m.id}" data-aos="fade-up" role="button" tabindex="0">
          <div class="menu-card-top">
            <div>
              <h3>${m.name}</h3>
              <p class="menu-desc">${m.description || ''}</p>
            </div>
            <div class="d-flex align-items-center gap-2">
              ${Components.renderStatusBadge(m.status)}
              ${Components.renderActionMenu('cm-menu', m.id, [
                { action: 'view', label: 'View menu', icon: 'bi-eye' },
                { action: 'dates', label: 'Change Availability Dates', icon: 'bi-calendar-range' }
              ])}
            </div>
          </div>
          <div class="menu-meta">
            <span><i class="bi bi-egg-fried" aria-hidden="true"></i> ${AppState.countMenuItems(m)} items</span>
            <span>${Components.renderStatusBadge(m.availability === 'available' ? 'available' : 'unavailable')}</span>
          </div>
        </div>
      `).join(''));
    },

    bindMenuCardClicks() {
      $(document).on('click keypress', '#todayMenus .menu-card, #upcomingMenus .menu-card', function (e) {
        if ($(e.target).closest('.action-menu').length) return;
        if (e.type === 'keypress' && e.which !== 13) return;
        window.location.href = 'my-menus.html?menu=' + $(this).data('id');
      });

      // If menu query param, show detail view
      const menuId = Components.getQueryParam('menu');
      if (menuId) {
        this.showMenuDetail(menuId);
      }

      $(document).on('click', '[data-entity="cm-menu"]', async function (e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        const action = $(this).data('action');
        if (action === 'view') {
          CanteenManager.showMenuDetail(id);
        } else if (action === 'dates') {
          CanteenManager.changeAvailabilityDates(id);
        }
      });
    },

    showMenuDetail(menuId) {
      const menu = AppState.getMenu(menuId);
      if (!menu) return;

      $('#menusListView').hide();
      $('#menuDetailView').show();
      $('#cmMenuName').text(menu.name);
      $('#cmMenuDesc').text(menu.description || '');
      $('#cmMenuStatus').html(Components.renderStatusBadge(menu.status));

      const $sections = $('#cmMenuSections');
      $sections.html((menu.sections || []).map((sec) => `
        <div class="section-block mb-3">
          <div class="section-block-header">
            <h4>${sec.name}</h4>
          </div>
          ${(sec.items || []).map((item) => {
            const product = AppState.getProduct(item.productId);
            if (!product) return '';
            const available = item.available !== false;
            return `
              <div class="menu-item-row flex-wrap" data-menu="${menu.id}" data-item="${item.id}">
                <img class="menu-item-img object-cover" src="${product.image}" alt="${product.name}" loading="lazy">
                <div class="menu-item-info">
                  <strong>${product.name}</strong>
                  <span>${product.description || ''}</span>
                </div>
                <div class="menu-item-price">${AppState.formatMoney(item.menuPrice)}</div>
                <label class="toggle-app ms-auto" title="Toggle availability">
                  <span class="visually-hidden">Available</span>
                  <input type="checkbox" class="item-avail-toggle" ${available ? 'checked' : ''}
                         data-menu="${menu.id}" data-item="${item.id}" data-name="${product.name}">
                  <span class="toggle-track" aria-hidden="true"></span>
                  <span class="toggle-label">${available ? 'Available' : 'Unavailable'}</span>
                </label>
                <div class="availability-panel w-100 ${available ? '' : 'show'}" id="panel-${item.id}">
                  <h5>Mark ${product.name} Unavailable?</h5>
                  <p>This item will no longer be available for ordering at this canteen.</p>
                  <div class="form-group-app">
                    <label class="form-label-app" for="reason-${item.id}">Reason</label>
                    <select class="form-select-app select2-avail-reason" id="reason-${item.id}" data-placeholder="Select reason">
                      <option value=""></option>
                      <option value="out_of_stock">Out of stock</option>
                      <option value="sold_out">Sold out</option>
                      <option value="temp">Temporarily unavailable</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div class="form-group-app">
                    <label class="form-label-app">Duration</label>
                    <div class="check-list">
                      <label class="check-item"><input type="radio" name="dur-${item.id}" value="today" checked> <span>Today only</span></label>
                      <label class="check-item"><input type="radio" name="dur-${item.id}" value="range"> <span>Date range</span></label>
                      <label class="check-item"><input type="radio" name="dur-${item.id}" value="until"> <span>Until I turn on again</span></label>
                    </div>
                  </div>
                  <div class="d-flex gap-2 justify-content-end">
                    <button type="button" class="btn-app btn-outline-app btn-sm-app btn-cancel-unavail" data-item="${item.id}">Cancel</button>
                    <button type="button" class="btn-app btn-primary-app btn-sm-app btn-confirm-unavail"
                            data-menu="${menu.id}" data-item="${item.id}" data-name="${product.name}">Mark Unavailable</button>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
      `).join(''));

      $sections.find('.select2-avail-reason').each(function () {
        Components.initializeSelect2($(this), { placeholder: 'Select reason', allowClear: true });
      });

      this.bindItemAvailability();
    },

    bindItemAvailability() {
      $(document).off('change.itemAvail').on('change.itemAvail', '.item-avail-toggle', function () {
        const $toggle = $(this);
        const itemId = $toggle.data('item');
        const $panel = $('#panel-' + itemId);
        const checked = $toggle.is(':checked');

        $toggle.closest('.toggle-app').find('.toggle-label').text(checked ? 'Available' : 'Unavailable');

        if (checked) {
          // Turning back on
          const menu = AppState.getMenu($toggle.data('menu'));
          const item = CanteenManager.findMenuItem(menu, itemId);
          if (item) {
            item.available = true;
            delete item.unavailableReason;
            AppState.persist();
            Components.showToast('Item is available again.', 'success');
          }
          $panel.removeClass('show');
        } else {
          $panel.addClass('show');
        }
      });

      $(document).off('click.cancelUnavail').on('click.cancelUnavail', '.btn-cancel-unavail', function () {
        const itemId = $(this).data('item');
        const $toggle = $(`.item-avail-toggle[data-item="${itemId}"]`);
        $toggle.prop('checked', true).trigger('change');
        $('#panel-' + itemId).removeClass('show');
      });

      $(document).off('click.confirmUnavail').on('click.confirmUnavail', '.btn-confirm-unavail', function () {
        const menuId = $(this).data('menu');
        const itemId = $(this).data('item');
        const name = $(this).data('name');
        const reason = $('#reason-' + itemId).val();

        if (!reason) {
          Components.showToast('Please select a reason.', 'error');
          return;
        }

        const menu = AppState.getMenu(menuId);
        const item = CanteenManager.findMenuItem(menu, itemId);
        if (!item) return;

        item.available = false;
        item.unavailableReason = reason;
        item.unavailableDuration = $(`input[name="dur-${itemId}"]:checked`).val();
        AppState.persist();

        $('#panel-' + itemId).removeClass('show');
        Components.showToast(`${name} marked unavailable.`, 'success');
      });
    },

    findMenuItem(menu, itemId) {
      if (!menu) return null;
      for (const sec of menu.sections || []) {
        const item = (sec.items || []).find((i) => i.id === itemId);
        if (item) return item;
      }
      return null;
    },

    async changeAvailabilityDates(menuId) {
      const menu = AppState.getMenu(menuId);
      if (!menu) return;

      const { value: formValues } = await Swal.fire({
        title: 'Change Availability Dates',
        html: `
          <div class="text-start">
            <label class="form-label-app">From</label>
            <input type="date" id="swalFrom" class="form-control-app mb-2">
            <label class="form-label-app">To</label>
            <input type="date" id="swalTo" class="form-control-app">
          </div>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Save',
        confirmButtonColor: '#0c7a6f',
        preConfirm: () => ({
          from: document.getElementById('swalFrom').value,
          to: document.getElementById('swalTo').value
        })
      });

      if (!formValues) return;
      menu.availabilityDates = formValues;
      menu.lastUpdated = new Date().toISOString();
      AppState.persist();
      Components.showToast('Availability dates updated.', 'success');
    },

    bindAvailabilityDates() {
      // handled via action menu
    },

    initSettings() {
      const canteen = AppState.getCanteen(this.getCanteenId());
      const settings = AppState.data.settings;

      if (canteen) {
        $('#setCanteenName').val(canteen.name);
        $('#setCanteenPhone').val(canteen.phone || '');
        $('#setCanteenEmail').val(canteen.email || '');
        $('#setCanteenActive').prop('checked', canteen.status === 'active');
      }

      $('#setAllowSameDay').prop('checked', settings.canteen.allowSameDay);
      $('#setLastOrderTime').val(settings.canteen.lastOrderTime);
      $('#setStopWindow').val(settings.canteen.stopWindowMinutes);
      $('#setMaxQty').val(settings.canteen.maxQtyPerItem);

      $('#notifNewOrder').prop('checked', settings.notifications.newOrder);
      $('#notifCancelled').prop('checked', settings.notifications.orderCancelled);
      $('#notifUnavailable').prop('checked', settings.notifications.itemUnavailable);
      $('#notifDaily').prop('checked', settings.notifications.dailySummary);

      $('#btnSaveSettings').on('click', () => {
        if (canteen) {
          canteen.name = $('#setCanteenName').val().trim() || canteen.name;
          canteen.phone = $('#setCanteenPhone').val().trim();
          canteen.email = $('#setCanteenEmail').val().trim();
          canteen.status = $('#setCanteenActive').is(':checked') ? 'active' : 'inactive';
        }

        settings.canteen.allowSameDay = $('#setAllowSameDay').is(':checked');
        settings.canteen.lastOrderTime = $('#setLastOrderTime').val();
        settings.canteen.stopWindowMinutes = parseInt($('#setStopWindow').val(), 10) || 30;
        settings.canteen.maxQtyPerItem = parseInt($('#setMaxQty').val(), 10) || 5;

        settings.notifications.newOrder = $('#notifNewOrder').is(':checked');
        settings.notifications.orderCancelled = $('#notifCancelled').is(':checked');
        settings.notifications.itemUnavailable = $('#notifUnavailable').is(':checked');
        settings.notifications.dailySummary = $('#notifDaily').is(':checked');

        AppState.persist();
        Components.showToast('Settings saved.', 'success');
      });
    }
  };

  global.CanteenManager = CanteenManager;
})(window, jQuery);
