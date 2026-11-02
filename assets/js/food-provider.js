/**
 * Food Provider pages — all data via services.
 */
(function (global, $) {
  'use strict';

  const FoodProvider = {
    filterState: { search: '', status: '' },

    async initDashboard() {
      const [canteens, menus] = await Promise.all([
        CanteenService.getAll(),
        MenuService.getAll()
      ]);

      const user = APP_CONFIG.roles.foodProvider;
      $('#welcomeTitle').text(`${Utils.greeting()}, ${user.name.split(' ')[0]}`);

      Components.animateCountUp('#statTotalCanteens', canteens.length);
      Components.animateCountUp('#statActiveCanteens', canteens.filter((c) => c.status === 'active').length);
      Components.animateCountUp('#statActiveMenus', menus.filter((m) => m.status === 'active').length);
      Components.animateCountUp('#statDraftMenus', menus.filter((m) => m.status === 'draft').length);

      this.renderDashboardCanteens(canteens.slice(0, 3));
      this.renderRecentMenus(menus.slice(0, 3));
      this.bindAssignModal();
    },

    renderDashboardCanteens(list) {
      const $el = $('#dashboardCanteens');
      if (!$el.length) return;
      if (!list.length) {
        $el.html(Components.renderEmptyState('bi-shop', I18n.t('noCanteens'), ''));
        return;
      }
      $el.html(list.map((c) => Components.renderCanteen(c, { actions: false })).join(''));
      $el.find('.canteen-card').on('click keypress', function (e) {
        if (e.type === 'keypress' && e.which !== 13) return;
        window.location.href = 'canteen-details.html?id=' + $(this).data('id');
      });
    },

    renderRecentMenus(list) {
      const $el = $('#recentMenusGrid');
      if (!$el.length) return;
      $el.html(list.map((m) => Components.renderMenu(m, { actions: false })).join(''));
      $el.find('.menu-card').on('click keypress', function (e) {
        if (e.type === 'keypress' && e.which !== 13) return;
        window.location.href = 'menu-editor.html?id=' + $(this).data('id');
      });
    },

    async initCanteensPage() {
      await this.renderCanteensList();
      this.bindCanteenFilters();
      this.bindAddCanteenModal();
      this.bindEditCanteenModal();
      this.bindCanteenActions();
      this.bindAssignModal();
    },

    async renderCanteensList() {
      let list = await CanteenService.getAll();
      const f = this.filterState;

      if (f.search) {
        const q = f.search.toLowerCase();
        list = list.filter((c) => {
          const school = CanteenService.getSchoolName(c.schoolId);
          return c.name.toLowerCase().includes(q) ||
            school.toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q);
        });
      }
      if (f.status) list = list.filter((c) => c.status === f.status);

      const $grid = $('#canteensGrid');
      const $empty = $('#canteensEmpty');

      if (!list.length) {
        $grid.hide();
        $empty.show().html(Components.renderEmptyState(
          'bi-shop',
          I18n.t('noCanteens'),
          f.search || f.status ? '' : '',
          !f.search && !f.status
            ? `<button type="button" class="btn-app btn-primary-app" data-bs-toggle="modal" data-bs-target="#addCanteenModal"><i class="bi bi-plus-lg"></i> ${I18n.t('addCanteen')}</button>`
            : ''
        ));
        return;
      }

      $empty.hide();
      $grid.show().html(list.map((c) => Components.renderCanteen(c)).join(''));

      $grid.find('.canteen-card').on('click keypress', function (e) {
        if ($(e.target).closest('.action-menu, .dropdown').length) return;
        if (e.type === 'keypress' && e.which !== 13) return;
        window.location.href = 'canteen-details.html?id=' + $(this).data('id');
      });
    },

    bindCanteenFilters() {
      const debounced = Utils.debounce(() => this.renderCanteensList(), 250);
      $('#searchCanteens').on('input', () => {
        this.filterState.search = ($('#searchCanteens').val() || '').trim();
        debounced();
      });

      $('.filter-tabs .filter-tab').on('click', (e) => {
        $('.filter-tabs .filter-tab').removeClass('active');
        $(e.currentTarget).addClass('active');
        this.filterState.status = $(e.currentTarget).data('status') || '';
        this.renderCanteensList();
      });

      $('#filterStatus').on('change', () => {
        this.filterState.status = $('#filterStatus').val() || '';
        this.renderCanteensList();
      });
    },

    bindAddCanteenModal() {
      const $modal = $('#addCanteenModal');
      if (!$modal.length) return;

      Forms.initSelect2InModal($modal);

      $modal.on('shown.bs.modal', () => {
        const schools = CanteenService.getSchools();
        const $sel = $('#canteenSchool');
        $sel.empty();
        schools.forEach((s) => {
          $sel.append(`<option value="${s.id}">${Utils.localized(s.name)}</option>`);
        });
      });

      $('#btnSaveCanteen').off('click').on('click', async () => {
        const $form = $('#addCanteenForm');
        if (!Forms.validateRequired($form)) return;
        const email = $('#canteenEmail').val();
        if (email && !Forms.validateEmail(email)) {
          Components.showToast('Invalid email', 'error');
          return;
        }
        await CanteenService.create({
          name: $('#canteenName').val().trim(),
          schoolId: $('#canteenSchool').val(),
          phone: $('#canteenPhone').val(),
          email: email,
          status: $('#canteenActive').is(':checked') ? 'active' : 'inactive'
        });
        bootstrap.Modal.getInstance($modal[0]).hide();
        Forms.resetForm($form);
        Components.showSuccess(I18n.t('success'), I18n.t('addCanteen'));
        this.renderCanteensList();
      });
    },

    bindEditCanteenModal() {
      const $modal = $('#editCanteenModal');
      if (!$modal.length) return;

      Forms.initSelect2InModal($modal);

      $(document).on('click', '[data-entity="canteen"][data-action="edit"]', async (e) => {
        e.stopPropagation();
        const id = $(e.currentTarget).data('id');
        const c = await CanteenService.getById(id);
        if (!c) return;
        $('#editCanteenId').val(c.id);
        $('#editCanteenName').val(c.name);
        $('#editCanteenPhone').val(c.phone);
        $('#editCanteenEmail').val(c.email);
        $('#editCanteenActive').prop('checked', c.status === 'active');

        const schools = CanteenService.getSchools();
        const $sel = $('#editCanteenSchool');
        $sel.empty();
        schools.forEach((s) => {
          $sel.append(`<option value="${s.id}" ${s.id === c.schoolId ? 'selected' : ''}>${Utils.localized(s.name)}</option>`);
        });

        bootstrap.Modal.getOrCreateInstance($modal[0]).show();
      });

      $('#btnUpdateCanteen').off('click').on('click', async () => {
        const $form = $('#editCanteenForm');
        if (!Forms.validateRequired($form)) return;
        const id = $('#editCanteenId').val();
        await CanteenService.update(id, {
          name: $('#editCanteenName').val().trim(),
          schoolId: $('#editCanteenSchool').val(),
          phone: $('#editCanteenPhone').val(),
          email: $('#editCanteenEmail').val(),
          status: $('#editCanteenActive').is(':checked') ? 'active' : 'inactive'
        });
        bootstrap.Modal.getInstance($modal[0]).hide();
        Components.showSuccess(I18n.t('success'), I18n.t('saveChanges'));
        this.renderCanteensList();
      });
    },

    bindCanteenActions() {
      $(document).on('click', '[data-entity="canteen"]', async (e) => {
        const $btn = $(e.currentTarget);
        const action = $btn.data('action');
        const id = $btn.data('id');
        if (!action || !id) return;
        e.stopPropagation();

        if (action === 'view') {
          window.location.href = 'canteen-details.html?id=' + id;
        } else if (action === 'assign') {
          this.openAssignModal(null, [id]);
        } else if (action === 'activate' || action === 'deactivate') {
          const ok = await Components.showConfirm({
            title: action === 'deactivate' ? I18n.t('deactivate') : I18n.t('activate'),
            text: '',
            confirmText: I18n.t('confirm')
          });
          if (ok) {
            await CanteenService.toggleStatus(id);
            Components.showToast(I18n.t('success'), 'success');
            this.renderCanteensList();
          }
        }
      });
    },

    async initCanteenDetails() {
      const id = Components.getQueryParam('id');
      if (!id) {
        window.location.href = 'canteens.html';
        return;
      }

      const canteen = await CanteenService.getById(id);
      if (!canteen) {
        window.location.href = 'canteens.html';
        return;
      }

      const school = CanteenService.getSchoolName(canteen.schoolId);
      $('#detailName, #infoName').text(canteen.name);
      $('#detailSchool, #infoSchool').text(school);
      $('#infoPhone').text(canteen.phone || '—');
      $('#infoEmail').text(canteen.email || '—');
      $('#infoStatus, #detailStatus').html(Components.renderStatusBadge(canteen.status));

      await this.renderCanteenMenus(canteen);
      this.bindCanteenDetailSettings(canteen);
      this.bindAssignModal();

      $('#btnAssignFromDetail').off('click.assignDetail').on('click.assignDetail', () => {
        this.openAssignModal(null, [canteen.id]);
      });

      if (location.hash === '#settings') Components.setActiveTab('settings');
    },

    async renderCanteenMenus(canteen) {
      const menus = await MenuService.getAll();
      const assigned = menus.filter((m) => (m.assignedCanteenIds || []).includes(canteen.id));

      const renderList = (list, $el) => {
        if (!$el.length) return;
        if (!list.length) {
          $el.html(`<p class="text-muted mb-0">${I18n.t('noMenus')}</p>`);
          return;
        }
        $el.html(`<div class="assigned-menu-list">${list.map((m) => `
          <div class="assigned-menu-row">
            <div class="assigned-menu-info">
              <span class="assigned-menu-icon" aria-hidden="true"><i class="bi bi-journal-text"></i></span>
              <div>
                <strong>${Utils.localized(m.name)}</strong>
                <div class="assigned-menu-meta">${Components.renderStatusBadge(m.status)}</div>
              </div>
            </div>
            <div class="assigned-menu-actions">
              <a href="menu-editor.html?id=${m.id}" class="btn-app btn-outline-app btn-sm-app">
                <i class="bi bi-pencil" aria-hidden="true"></i> ${I18n.t('edit')}
              </a>
              <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-unassign-menu" data-menu="${m.id}">
                <i class="bi bi-x-lg" aria-hidden="true"></i> ${I18n.t('delete')}
              </button>
            </div>
          </div>
        `).join('')}</div>`);
      };

      renderList(assigned, $('#overviewMenus'));
      renderList(assigned, $('#assignedMenusList'));

      $('.btn-unassign-menu').on('click', async function () {
        const menuId = $(this).data('menu');
        await CanteenService.unassignMenu(canteen.id, menuId);
        Components.showToast(I18n.t('success'), 'success');
        FoodProvider.initCanteenDetails();
      });
    },

    bindCanteenDetailSettings(canteen) {
      $('#settingsName').val(canteen.name);
      $('#settingsPhone').val(canteen.phone);
      $('#settingsEmail').val(canteen.email);
      $('#settingsActive').prop('checked', canteen.status === 'active');

      $('#btnSaveCanteenSettings').off('click').on('click', async () => {
        await CanteenService.update(canteen.id, {
          name: $('#settingsName').val(),
          phone: $('#settingsPhone').val(),
          email: $('#settingsEmail').val(),
          status: $('#settingsActive').is(':checked') ? 'active' : 'inactive'
        });
        Components.showSuccess(I18n.t('success'), I18n.t('saveChanges'));
      });
    },

    menuFilter: { search: '', status: '' },

    async initMenusPage() {
      await this.renderMenusList();
      this.bindMenuFilters();
      this.bindMenuActions();
      this.bindAssignModal();
    },

    async renderMenusList() {
      let list = await MenuService.getAll();
      const f = this.menuFilter;

      if (f.search) {
        const q = f.search.toLowerCase();
        list = list.filter((m) => {
          const en = (m.name && m.name.en) || '';
          const ar = (m.name && m.name.ar) || '';
          return en.toLowerCase().includes(q) || ar.includes(q);
        });
      }
      if (f.status) list = list.filter((m) => m.status === f.status);

      const $grid = $('#menusGrid');
      const $empty = $('#menusEmpty');

      if (!list.length) {
        $grid.hide();
        $empty.show().html(Components.renderEmptyState(
          'bi-journal-richtext',
          I18n.t('noMenus'),
          '',
          `<a href="menu-editor.html" class="btn-app btn-primary-app"><i class="bi bi-plus-lg"></i> ${I18n.t('createMenu')}</a>`
        ));
        return;
      }

      $empty.hide();
      $grid.show().html(list.map((m) => Components.renderMenu(m)).join(''));

      $grid.find('.menu-card').on('click keypress', function (e) {
        if ($(e.target).closest('.action-menu, .dropdown').length) return;
        if (e.type === 'keypress' && e.which !== 13) return;
        window.location.href = 'menu-editor.html?id=' + $(this).data('id');
      });
    },

    bindMenuFilters() {
      const debounced = Utils.debounce(() => this.renderMenusList(), 250);
      $('#searchMenus').on('input', () => {
        this.menuFilter.search = ($('#searchMenus').val() || '').trim();
        debounced();
      });

      $('.filter-tabs .filter-tab').on('click', (e) => {
        $('.filter-tabs .filter-tab').removeClass('active');
        $(e.currentTarget).addClass('active');
        this.menuFilter.status = $(e.currentTarget).data('status') || '';
        this.renderMenusList();
      });

      $('#filterMenuStatus').on('change', () => {
        this.menuFilter.status = $('#filterMenuStatus').val() || '';
        this.renderMenusList();
      });
    },

    bindMenuActions() {
      $(document).on('click', '[data-entity="menu"]', async (e) => {
        const $btn = $(e.currentTarget);
        const action = $btn.data('action');
        const id = $btn.data('id');
        if (!action || !id) return;
        e.stopPropagation();

        if (action === 'view' || action === 'edit') {
          window.location.href = 'menu-editor.html?id=' + id;
        } else if (action === 'assign') {
          this.openAssignModal(id);
        } else if (action === 'activate' || action === 'deactivate') {
          const newStatus = action === 'activate' ? 'active' : 'draft';
          await MenuService.setStatus(id, newStatus);
          Components.showToast(I18n.t('success'), 'success');
          this.renderMenusList();
        } else if (action === 'delete') {
          const ok = await Components.showConfirm({
            title: I18n.t('delete'),
            text: '',
            danger: true,
            confirmText: I18n.t('delete')
          });
          if (ok) {
            await MenuService.delete(id);
            Components.showToast(I18n.t('success'), 'success');
            this.renderMenusList();
          }
        }
      });
    },

    async openAssignModal(menuId, canteenIds) {
      const $modal = $('#assignMenuModal');
      if (!$modal.length) return;

      const [menus, canteens] = await Promise.all([
        MenuService.getAll(),
        CanteenService.getAll()
      ]);

      const $menuSel = $('#assignMenuSelect');
      const $canSel = $('#assignCanteensSelect');
      const $status = $('#assignStatus');

      [$menuSel, $canSel, $status].forEach(($el) => {
        if ($el.hasClass('select2-hidden-accessible')) $el.select2('destroy');
      });

      $menuSel.empty().append('<option value=""></option>');
      menus.forEach((m) => {
        $menuSel.append(`<option value="${m.id}">${Utils.localized(m.name)}</option>`);
      });

      $canSel.empty();
      canteens.forEach((c) => {
        $canSel.append(`<option value="${c.id}">${c.name}</option>`);
      });

      if (menuId) $menuSel.val(String(menuId));
      if (canteenIds && canteenIds.length) $canSel.val(canteenIds.map(String));
      $status.val('active');
      $('#assignDateRange').prop('checked', false);
      $('#assignDateFields').prop('hidden', true);

      $modal.data('prefill', { menuId: menuId || null, canteenIds: canteenIds || [] });
      bootstrap.Modal.getOrCreateInstance($modal[0]).show();
    },

    bindAssignModal() {
      const $modal = $('#assignMenuModal');
      if (!$modal.length || $modal.data('bound')) return;
      $modal.data('bound', true);

      Forms.initSelect2InModal($modal);

      $('#assignDateRange').on('change', function () {
        $('#assignDateFields').prop('hidden', !this.checked);
      });

      $modal.on('shown.bs.modal.assignPrefill', function () {
        const prefill = $modal.data('prefill') || {};
        const $menuSel = $('#assignMenuSelect');
        const $canSel = $('#assignCanteensSelect');
        if (prefill.menuId) $menuSel.val(String(prefill.menuId)).trigger('change');
        if (prefill.canteenIds && prefill.canteenIds.length) {
          $canSel.val(prefill.canteenIds.map(String)).trigger('change');
        }
        $('#assignStatus').val('active').trigger('change');
        Forms.initFlatpickr('#assignFrom');
        Forms.initFlatpickr('#assignTo');
      });

      $('#btnConfirmAssign').off('click').on('click', async () => {
        const menuId = $('#assignMenuSelect').val();
        const canteenIds = $('#assignCanteensSelect').val();
        if (!menuId || !canteenIds || !canteenIds.length) {
          Components.showToast(I18n.t('required'), 'error');
          return;
        }

        const useDates = $('#assignDateRange').is(':checked');
        const status = $('#assignStatus').val() || 'active';

        await MenuService.assignMenuToCanteens(menuId, canteenIds, {
          useDates: useDates,
          from: $('#assignFrom').val(),
          to: $('#assignTo').val(),
          status: status
        });

        bootstrap.Modal.getInstance($modal[0]).hide();
        Components.showSuccess(I18n.t('success'), I18n.t('assignMenu'));

        if ($('#menusGrid').length) this.renderMenusList();
        if ($('#canteensGrid').length) this.renderCanteensList();
        if ($('#canteenDetailRoot').length) this.initCanteenDetails();
      });
    },

    async initMenuDetails() {
      const id = Components.getQueryParam('id');
      if (!id) {
        window.location.href = 'menus.html';
        return;
      }
      window.location.replace('menu-editor.html?id=' + id);
    },

    initSettingsPage() {
      const acc = (Storage.get('settings') || {}).foodProvider?.account || APP_CONFIG.roles.foodProvider;
      const name = acc.name || APP_CONFIG.roles.foodProvider.name;
      const email = acc.email || APP_CONFIG.roles.foodProvider.email;
      $('#fpAccountName').val(name);
      $('#fpAccountEmail').val(email);
      $('#fpProfileName').text(name);
      $('#fpProfileEmail').text(email);

      const syncPreview = () => {
        $('#fpProfileName').text(($('#fpAccountName').val() || '').trim() || name);
        $('#fpProfileEmail').text(($('#fpAccountEmail').val() || '').trim() || email);
      };
      $('#fpAccountName, #fpAccountEmail').on('input', syncPreview);

      $('#btnChangePassword').on('click', () => {
        Components.showSuccess(I18n.t('success'), 'Password updated (demo)');
      });

      $('#btnSaveAccount').on('click', () => {
        const settings = Storage.get('settings') || Utils.clone(SchoolFoodSeed.settings);
        settings.foodProvider = settings.foodProvider || {};
        settings.foodProvider.account = {
          name: $('#fpAccountName').val(),
          email: $('#fpAccountEmail').val()
        };
        Storage.set('settings', settings);
        syncPreview();
        Components.showSuccess(I18n.t('success'), I18n.t('saveChanges'));
      });
    }
  };

  global.FoodProvider = FoodProvider;
})(window, jQuery);
