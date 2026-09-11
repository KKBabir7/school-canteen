/**
 * Canteen Manager — dashboard, my-menu, settings via services.
 */
(function (global, $) {
  'use strict';

  const CanteenManager = {
    getCanteenId() {
      return APP_CONFIG.roles.canteenManager.canteenId;
    },

    async initDashboard() {
      const canteenId = this.getCanteenId();
      const user = APP_CONFIG.roles.canteenManager;
      $('#cmWelcome').text(`${Utils.greeting()}, ${user.name.split(' ')[0]} 👋`);

      const counts = await OrderService.getCounts(canteenId);
      Components.animateCountUp('#statTodayOrders', counts.today);
      Components.animateCountUp('#statNewOrders', counts.new);
      Components.animateCountUp('#statPreparing', counts.preparing);
      Components.animateCountUp('#statReady', counts.ready);
      Components.animateCountUp('#statRevenue', counts.revenue);
      if ($('#statAvailableItems').length) {
        const avail = await this.countAvailableItems();
        Components.animateCountUp('#statAvailableItems', avail);
      }

      await this.renderTodayMenu();
      await this.renderRecentOrders();
    },

    async countAvailableItems() {
      const menus = await MenuService.getForCanteen(this.getCanteenId());
      let n = 0;
      menus.forEach((menu) => {
        if (menu.status !== 'active') return;
        (menu.sections || []).forEach((sec) => {
          (sec.items || []).forEach((item) => {
            if (item.available !== false) n++;
          });
        });
      });
      return n;
    },

    async renderTodayMenu() {
      const $el = $('#todayMenuGrid');
      if (!$el.length) return;

      const menus = await MenuService.getForCanteen(this.getCanteenId());
      const products = await ProductService.getAll();
      const productMap = {};
      products.forEach((p) => { productMap[p.id] = p; });

      const items = [];
      menus.filter((m) => m.status === 'active').forEach((menu) => {
        (menu.sections || []).forEach((sec) => {
          (sec.items || []).forEach((item) => {
            const product = productMap[item.productId];
            if (product) items.push({ item, product, menuId: menu.id });
          });
        });
      });

      const featured = items.slice(0, 4);
      if (!featured.length) {
        $el.html(Components.renderEmptyState('bi-egg-fried', I18n.t('todayMenu'), I18n.t('myMenusDesc')));
        return;
      }

      $el.html(featured.map(({ item, product }) => `
        <div class="food-card" data-aos="fade-up">
          <div class="food-card-img">
            <img src="${product.image}" alt="${Utils.localized(product.name)}" class="object-cover" loading="lazy">
          </div>
          <div class="food-card-body">
            <h4>${Utils.localized(product.name)}</h4>
            <div class="food-card-footer">
              <span class="food-card-price">${Utils.money(item.menuPrice)}</span>
              ${Components.renderStatusBadge(item.available !== false ? 'available' : 'unavailable')}
            </div>
          </div>
        </div>
      `).join(''));
    },

    async renderRecentOrders() {
      const $el = $('#todayOrdersSummary');
      if (!$el.length) return;

      const orders = await OrderService.getAll(this.getCanteenId());
      const recent = orders
        .filter((o) => o.status !== 'upcoming')
        .sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime))
        .slice(0, 4);

      if (!recent.length) {
        $el.html(`<p class="text-muted mb-0">${I18n.t('noOrders')}</p>`);
        return;
      }

      $el.html(recent.map((o) => `
        <a href="order-details.html?id=${o.id}" class="d-flex justify-content-between align-items-center py-2 border-bottom text-decoration-none text-reset">
          <div>
            <strong>#${o.orderNumber}</strong>
            <span class="text-muted ms-2">${o.studentName}</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="fw-600">${Utils.money(o.total)}</span>
            ${Components.renderStatusBadge(o.status)}
          </div>
        </a>
      `).join(''));
    },

    async initMyMenu() {
      const canteenId = this.getCanteenId();
      const menus = await MenuService.getForCanteen(canteenId);
      const today = menus.filter((m) => m.status === 'active');
      const upcoming = menus.filter((m) => m.status !== 'active' || m.availability === 'unavailable');

      const renderGrid = ($el, list) => {
        if (!list.length) {
          $el.html(Components.renderEmptyState('bi-journal-richtext', I18n.t('noMenus'), ''));
          return;
        }
        $el.html(list.map((m) => Components.renderMenu(m, { actions: false })).join(''));
        $el.find('.menu-card').on('click keypress', function (e) {
          if (e.type === 'keypress' && e.which !== 13) return;
          const id = $(this).data('id');
          window.location.href = 'my-menu.html?menu=' + id;
        });
      };

      renderGrid($('#todayMenus'), today);
      renderGrid($('#upcomingMenus'), upcoming);

      const menuParam = Components.getQueryParam('menu');
      if (menuParam) this.showMenuDetail(menuParam);
    },

    async showMenuDetail(menuId) {
      const menu = await MenuService.getById(menuId);
      if (!menu) return;

      $('#menusListView').hide();
      $('#menuDetailView').show();

      $('#cmMenuName').text(Utils.localized(menu.name));
      $('#cmMenuDesc').text(Utils.localized(menu.description));
      $('#cmMenuStatus').html(Components.renderStatusBadge(menu.status));

      const products = await ProductService.getAll();
      const productMap = {};
      products.forEach((p) => { productMap[p.id] = p; });

      const canOverride = APP_CONFIG.permissions.canOverridePrices;

      $('#cmMenuSections').html((menu.sections || []).map((sec) => `
        <div class="section-block mb-4" data-aos="fade-up">
          <div class="section-block-header d-flex justify-content-between align-items-center mb-3">
            <h4 class="mb-0">${Utils.localized(sec.name)}</h4>
            <button type="button" class="btn-app btn-outline-app btn-sm-app btn-change-availability" data-menu="${menu.id}">
              <i class="bi bi-calendar3"></i> ${I18n.t('changeAvailability')}
            </button>
          </div>
          ${(sec.items || []).map((item) => {
            const product = productMap[item.productId];
            if (!product) return '';
            const avail = item.available !== false;
            const priceUi = canOverride
              ? `<button type="button" class="btn-app btn-ghost-app btn-sm-app btn-edit-price" data-menu="${menu.id}" data-item="${item.id}" data-price="${item.menuPrice}">${I18n.t('editPrice')}</button>`
              : `<span class="text-muted small">${I18n.t('priceManaged')}</span>`;
            return `
              <div class="menu-item-row cm-menu-item" data-item-id="${item.id}" data-menu-id="${menu.id}">
                <img class="menu-item-img object-cover" src="${product.image}" alt="${Utils.localized(product.name)}" loading="lazy">
                <div class="menu-item-info flex-grow-1">
                  <strong>${Utils.localized(product.name)}</strong>
                  <span>${Utils.localized(product.description)}</span>
                </div>
                <div class="menu-item-price">${Utils.money(item.menuPrice)}</div>
                ${priceUi}
                <label class="toggle-app ms-2">
                  <input type="checkbox" class="item-avail-toggle" data-menu="${menu.id}" data-item="${item.id}" ${avail ? 'checked' : ''}>
                  <span class="toggle-track"></span>
                </label>
              </div>
              <div class="unavail-panel" id="unavail-${item.id}" style="display:none"></div>`;
          }).join('')}
        </div>
      `).join(''));

      this.bindMenuDetailActions(menu);
    },

    bindMenuDetailActions(menu) {
      $('.item-avail-toggle').off('change').on('change', async function () {
        const $t = $(this);
        const menuId = $t.data('menu');
        const itemId = $t.data('item');
        const panel = $('#unavail-' + itemId);

        if ($t.is(':checked')) {
          await MenuService.updateItemAvailability(menuId, itemId, { available: true });
          panel.hide().empty();
          Components.showToast(I18n.t('available'), 'success');
        } else {
          panel.show().html(CanteenManager.renderUnavailPanel(menuId, itemId));
          CanteenManager.initUnavailPanel(menuId, itemId);
        }
      });

      $('.btn-edit-price').off('click').on('click', async function () {
        if (!APP_CONFIG.permissions.canOverridePrices) return;
        const menuId = $(this).data('menu');
        const itemId = $(this).data('item');
        const current = $(this).data('price');
        const { value: price } = await Swal.fire({
          title: I18n.t('editPrice'),
          input: 'number',
          inputValue: current,
          showCancelButton: true,
          confirmButtonColor: '#1a365d',
          confirmButtonText: I18n.t('save')
        });
        if (price != null) {
          await MenuService.updateItemPrice(menuId, itemId, price);
          Components.showSuccess(I18n.t('success'), I18n.t('saveChanges'));
          CanteenManager.showMenuDetail(menuId);
        }
      });

      $('.btn-change-availability').off('click').on('click', () => {
        this.openAvailabilityModal(menu);
      });
    },

    renderUnavailPanel(menuId, itemId) {
      return `
        <div class="card-app p-3 mb-2">
          <p class="small text-muted mb-2">${I18n.t('markUnavailable')}</p>
          <div class="row g-2">
            <div class="col-md-4 form-group-app">
              <label class="form-label-app">${I18n.t('reason')}</label>
              <select class="form-select-app unavail-reason select2-field" data-placeholder="${I18n.t('reason')}">
                <option value="out_of_stock">${I18n.t('outOfStock')}</option>
                <option value="sold_out">${I18n.t('soldOut')}</option>
                <option value="temp">${I18n.t('tempUnavailable')}</option>
                <option value="other">${I18n.t('other')}</option>
              </select>
            </div>
            <div class="col-md-4 form-group-app">
              <label class="form-label-app">${I18n.t('dateRange')}</label>
              <select class="form-select-app unavail-duration">
                <option value="today">${I18n.t('onlyToday')}</option>
                <option value="range">${I18n.t('dateRange')}</option>
                <option value="until">${I18n.t('untilOn')}</option>
              </select>
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <button type="button" class="btn-app btn-primary-app btn-sm-app btn-confirm-unavail" data-menu="${menuId}" data-item="${itemId}">${I18n.t('save')}</button>
            </div>
          </div>
        </div>`;
    },

    initUnavailPanel(menuId, itemId) {
      const $panel = $('#unavail-' + itemId);
      Components.initializeSelect2($panel.find('.unavail-reason'), { minimumResultsForSearch: Infinity });

      $panel.find('.btn-confirm-unavail').on('click', async () => {
        await MenuService.updateItemAvailability(menuId, itemId, {
          available: false,
          unavailableReason: $panel.find('.unavail-reason').val(),
          unavailableDuration: $panel.find('.unavail-duration').val()
        });
        Components.showSuccess(I18n.t('success'), I18n.t('markUnavailable'));
        $panel.hide();
      });
    },

    openAvailabilityModal(menu) {
      const $modal = $('#availabilityModal');
      if (!$modal.length) return;

      const weekdays = menu.weekdays || ['mon', 'tue', 'wed', 'thu', 'fri'];
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      $('#weekdayChecks').html(days.map((d) => `
        <label class="form-check-app">
          <input type="checkbox" class="weekday-check" value="${d}" ${weekdays.includes(d) ? 'checked' : ''}>
          <span>${I18n.t(d)}</span>
        </label>
      `).join(''));

      bootstrap.Modal.getOrCreateInstance($modal[0]).show();

      if (typeof flatpickr !== 'undefined') {
        Forms.initFlatpickr('#availFrom', { defaultDate: menu.availabilityDates?.from });
        Forms.initFlatpickr('#availTo', { defaultDate: menu.availabilityDates?.to });
      }

      $('#btnSaveAvailability').off('click').on('click', async () => {
        const selected = [];
        $('.weekday-check:checked').each(function () { selected.push($(this).val()); });
        await MenuService.updateAvailability(menu.id, {
          weekdays: selected,
          availabilityDates: {
            from: $('#availFrom').val() || null,
            to: $('#availTo').val() || null
          }
        });
        bootstrap.Modal.getInstance($modal[0]).hide();
        Components.showSuccess(I18n.t('success'), I18n.t('changeAvailability'));
      });
    },

    async initSettings() {
      const canteenId = this.getCanteenId();
      const canteen = await CanteenService.getById(canteenId);
      const settings = Storage.get('settings') || Utils.clone(SchoolFoodSeed.settings);
      const cm = settings.canteenManager || SchoolFoodSeed.settings.canteenManager;

      if (canteen) {
        $('#setCanteenName').val(canteen.name);
        $('#setCanteenPhone').val(canteen.phone);
        $('#setCanteenEmail').val(canteen.email);
        $('#setCanteenActive').prop('checked', canteen.status === 'active');
      }

      const ord = cm.ordering || {};
      $('#setAllowSameDay').prop('checked', ord.allowSameDay !== false);
      $('#setLastOrderTime').val(ord.lastOrderTime || '11:30');
      $('#setStopWindow').val(ord.stopWindowMinutes || 30);
      $('#setMaxQty').val(ord.maxQtyPerItem || 5);

      const notif = cm.notifications || {};
      $('#setNotifNew').prop('checked', notif.newOrder !== false);
      $('#setNotifCancelled').prop('checked', notif.orderCancelled !== false);
      $('#setNotifUnavailable').prop('checked', notif.itemUnavailable !== false);
      $('#setNotifSummary').prop('checked', !!notif.dailySummary);

      $('#cmAccountHint').text(APP_CONFIG.roles.canteenManager.name + ' · ' + APP_CONFIG.roles.canteenManager.email);

      if (location.hash === '#canteen') Components.setActiveTab('canteen');
      else if (location.hash === '#ordering') Components.setActiveTab('ordering');
      else if (location.hash === '#notifications') Components.setActiveTab('notifications');
      else if (location.hash === '#account') Components.setActiveTab('account');

      $('#btnSaveSettings').off('click').on('click', async () => {
        if (canteen) {
          await CanteenService.update(canteenId, {
            name: $('#setCanteenName').val(),
            phone: $('#setCanteenPhone').val(),
            email: $('#setCanteenEmail').val(),
            status: $('#setCanteenActive').is(':checked') ? 'active' : 'inactive'
          });
        }

        const s = Storage.get('settings') || Utils.clone(SchoolFoodSeed.settings);
        s.canteenManager = s.canteenManager || {};
        s.canteenManager.ordering = {
          allowSameDay: $('#setAllowSameDay').is(':checked'),
          lastOrderTime: $('#setLastOrderTime').val(),
          stopWindowMinutes: Number($('#setStopWindow').val()) || 30,
          maxQtyPerItem: Number($('#setMaxQty').val()) || 5
        };
        s.canteenManager.notifications = {
          newOrder: $('#setNotifNew').is(':checked'),
          orderCancelled: $('#setNotifCancelled').is(':checked'),
          itemUnavailable: $('#setNotifUnavailable').is(':checked'),
          dailySummary: $('#setNotifSummary').is(':checked')
        };
        Storage.set('settings', s);
        Components.showSuccess(I18n.t('success'), I18n.t('saveChanges'));
      });

      $('#btnChangePassword').on('click', () => {
        Components.showSuccess(I18n.t('success'), 'Password updated (demo)');
      });
    }
  };

  global.CanteenManager = CanteenManager;
})(window, jQuery);
