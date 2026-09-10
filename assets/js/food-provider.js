/**
 * School Food Platform — Food Provider Logic
 */
(function (global, $) {
  'use strict';

  const FoodProvider = {
    initDashboard() {
      const data = AppState.data;
      const total = data.canteens.length;
      const active = data.canteens.filter((c) => c.status === 'active').length;
      const activeMenus = data.menus.filter((m) => m.status === 'active').length;
      const assigned = data.menus.filter((m) => (m.assignedCanteenIds || []).length > 0).length;

      const user = SchoolFoodMock.users.foodProvider;
      $('#welcomeTitle').text(`${AppState.greeting()}, ${user.name.split(' ')[0]} 👋`);

      Components.animateCountUp('#statTotalCanteens', total);
      Components.animateCountUp('#statActiveCanteens', active);
      Components.animateCountUp('#statActiveMenus', activeMenus);
      Components.animateCountUp('#statMenusAssigned', assigned);

      this.renderDashboardCanteens();
      this.renderActivity();
    },

    renderDashboardCanteens() {
      const list = AppState.data.canteens.slice(0, 3);
      const $el = $('#dashboardCanteens');
      if (!$el.length) return;
      $el.html(list.map((c) => Components.renderCanteen(c, { actions: false })).join(''));
      $el.find('.canteen-card').on('click keypress', function (e) {
        if (e.type === 'keypress' && e.which !== 13) return;
        window.location.href = 'canteen-details.html?id=' + $(this).data('id');
      });
    },

    renderActivity() {
      const $el = $('#activityList');
      if (!$el.length) return;
      const items = AppState.data.activity.slice(0, 5);
      $el.html(items.map((a) => `
        <li class="activity-item">
          <span class="activity-dot" aria-hidden="true"></span>
          <div class="activity-content">
            <p>${a.text}</p>
            <time datetime="${a.time}">${AppState.formatRelative(a.time)}</time>
          </div>
        </li>
      `).join(''));
    },

    initCanteensPage() {
      this.renderCanteensList();
      this.bindCanteenFilters();
      this.bindAddCanteenModal();
      this.bindCanteenActions();
    },

    renderCanteensList(filter) {
      filter = filter || {};
      let list = AppState.data.canteens.slice();

      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter((c) => {
          const school = AppState.getSchool(c.schoolId);
          return c.name.toLowerCase().includes(q) ||
            (school && school.name.toLowerCase().includes(q)) ||
            (c.email || '').toLowerCase().includes(q);
        });
      }
      if (filter.school) {
        list = list.filter((c) => c.schoolId === filter.school);
      }
      if (filter.status) {
        list = list.filter((c) => c.status === filter.status);
      }

      const $grid = $('#canteensGrid');
      const $empty = $('#canteensEmpty');

      if (!list.length) {
        $grid.hide();
        $empty.show().html(Components.renderEmptyState(
          'bi-shop',
          'No canteens found',
          filter.search || filter.school || filter.status
            ? 'Try adjusting your filters.'
            : 'Add your first canteen to start managing your food locations.',
          (!filter.search && !filter.school && !filter.status)
            ? '<button type="button" class="btn-app btn-primary-app" data-bs-toggle="modal" data-bs-target="#addCanteenModal"><i class="bi bi-plus-lg" aria-hidden="true"></i> Add Canteen</button>'
            : ''
        ));
        return;
      }

      $empty.hide();
      $grid.show().html(list.map((c) => Components.renderCanteen(c)).join(''));

      $grid.find('.canteen-card').on('click keypress', function (e) {
        if ($(e.target).closest('.action-menu').length) return;
        if (e.type === 'keypress' && e.which !== 13) return;
        window.location.href = 'canteen-details.html?id=' + $(this).data('id');
      });
    },

    bindCanteenFilters() {
      const $school = $('#filterSchool');
      const $status = $('#filterStatus');

      if ($school.length) {
        const opts = AppState.data.schools.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
        $school.append(opts);
        Components.initializeSelect2($school, { placeholder: 'All schools', allowClear: true });
        Components.initializeSelect2($status, { placeholder: 'All statuses', allowClear: true });
      }

      const apply = () => {
        this.renderCanteensList({
          search: $('#searchCanteens').val(),
          school: $school.val(),
          status: $status.val()
        });
      };

      $('#searchCanteens').on('input', apply);
      $school.on('change', apply);
      $status.on('change', apply);
    },

    bindAddCanteenModal() {
      const $modal = $('#addCanteenModal');
      if (!$modal.length) return;

      const $school = $('#canteenSchool');
      $school.html('<option value=""></option>' +
        AppState.data.schools.map((s) => `<option value="${s.id}">${s.name}</option>`).join(''));

      Forms.initSelect2InModal($modal);

      $('#btnSaveCanteen').on('click', () => {
        const $form = $('#addCanteenForm');
        if (!Forms.validateRequired($form)) return;

        const email = $('#canteenEmail').val().trim();
        if (email && !Forms.validateEmail(email)) {
          Components.showToast('Please enter a valid email.', 'error');
          return;
        }

        const canteen = {
          id: AppState.uid('can'),
          name: $('#canteenName').val().trim(),
          schoolId: $('#canteenSchool').val(),
          phone: $('#canteenPhone').val().trim(),
          email: email,
          status: $('#canteenActive').is(':checked') ? 'active' : 'inactive',
          assignedMenuIds: [],
          lastActivity: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };

        AppState.data.canteens.unshift(canteen);
        AppState.data.activity.unshift({
          id: AppState.uid('act'),
          text: `New canteen "${canteen.name}" added`,
          time: new Date().toISOString()
        });
        AppState.persist();

        bootstrap.Modal.getInstance($modal[0]).hide();
        Forms.resetForm($form);
        $('#canteenActive').prop('checked', true);

        Components.showSuccess('Canteen added', `${canteen.name} has been created.`);
        this.renderCanteensList({
          search: $('#searchCanteens').val(),
          school: $('#filterSchool').val(),
          status: $('#filterStatus').val()
        });
      });
    },

    bindCanteenActions() {
      $(document).on('click', '[data-entity="canteen"]', async function (e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        const action = $(this).data('action');
        const canteen = AppState.getCanteen(id);
        if (!canteen) return;

        if (action === 'view') {
          window.location.href = 'canteen-details.html?id=' + id;
        } else if (action === 'assign') {
          FoodProvider.openAssignModal(null, id);
        } else if (action === 'activate') {
          canteen.status = 'active';
          canteen.lastActivity = new Date().toISOString();
          AppState.persist();
          Components.showToast(`${canteen.name} is now active.`, 'success');
          FoodProvider.renderCanteensList({
            search: $('#searchCanteens').val(),
            school: $('#filterSchool').val(),
            status: $('#filterStatus').val()
          });
        } else if (action === 'deactivate') {
          const ok = await Components.showConfirm({
            title: 'Deactivate canteen?',
            text: `${canteen.name} will no longer accept menu assignments as an active location.`,
            confirmText: 'Deactivate',
            danger: true
          });
          if (!ok) return;
          canteen.status = 'inactive';
          canteen.lastActivity = new Date().toISOString();
          AppState.persist();
          Components.showToast(`${canteen.name} deactivated.`, 'info');
          FoodProvider.renderCanteensList({
            search: $('#searchCanteens').val(),
            school: $('#filterSchool').val(),
            status: $('#filterStatus').val()
          });
        }
      });
    },

    initCanteenDetails() {
      const id = Components.getQueryParam('id') || 'can-1';
      const canteen = AppState.getCanteen(id);
      if (!canteen) {
        $('#canteenDetailRoot').html(Components.renderEmptyState('bi-shop', 'Canteen not found', 'This canteen does not exist.',
          '<a href="canteens.html" class="btn-app btn-primary-app">Back to Canteens</a>'));
        return;
      }

      const school = AppState.getSchool(canteen.schoolId);
      $('#detailName').text(canteen.name);
      $('#detailSchool').text(school ? school.name : '—');
      $('#detailStatus').html(Components.renderStatusBadge(canteen.status));
      $('#infoName').text(canteen.name);
      $('#infoSchool').text(school ? school.name : '—');
      $('#infoPhone').text(canteen.phone || '—');
      $('#infoEmail').text(canteen.email || '—');
      $('#infoStatus').html(Components.renderStatusBadge(canteen.status));

      $('#settingsName').val(canteen.name);
      $('#settingsPhone').val(canteen.phone || '');
      $('#settingsEmail').val(canteen.email || '');
      $('#settingsActive').prop('checked', canteen.status === 'active');

      this.renderAssignedMenus(canteen);

      $('#btnAssignFromDetail').on('click', () => this.openAssignModal(null, canteen.id));
      $('#btnSaveCanteenSettings').on('click', () => {
        canteen.name = $('#settingsName').val().trim() || canteen.name;
        canteen.phone = $('#settingsPhone').val().trim();
        canteen.email = $('#settingsEmail').val().trim();
        canteen.status = $('#settingsActive').is(':checked') ? 'active' : 'inactive';
        canteen.lastActivity = new Date().toISOString();
        AppState.persist();
        Components.showToast('Canteen settings saved.', 'success');
        $('#detailName').text(canteen.name);
        $('#detailStatus').html(Components.renderStatusBadge(canteen.status));
      });
    },

    renderAssignedMenus(canteen) {
      const menus = (canteen.assignedMenuIds || [])
        .map((id) => AppState.getMenu(id))
        .filter(Boolean);

      const $el = $('#assignedMenusList');
      const $overview = $('#overviewMenus');

      if (!menus.length) {
        const empty = Components.renderEmptyState('bi-journal', 'No menus assigned',
          'Assign a menu so this canteen can start receiving orders.',
          '<button type="button" class="btn-app btn-primary-app" id="btnAssignEmpty"><i class="bi bi-link-45deg"></i> Assign Menu</button>');
        $el.html(empty);
        $overview.html('<p class="text-muted mb-0">No menus assigned yet.</p>');
        $(document).off('click.assignEmpty').on('click.assignEmpty', '#btnAssignEmpty', () => {
          this.openAssignModal(null, canteen.id);
        });
        return;
      }

      $overview.html(menus.map((m) => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
          <div>
            <strong>${m.name}</strong>
            <div class="small text-muted">${AppState.countMenuItems(m)} items</div>
          </div>
          ${Components.renderStatusBadge(m.status)}
        </div>
      `).join(''));

      $el.html(menus.map((m) => `
        <div class="menu-card mb-3" data-id="${m.id}">
          <div class="menu-card-top">
            <div>
              <h3>${m.name}</h3>
              <p class="menu-desc">${m.description || ''}</p>
            </div>
            <div class="d-flex align-items-center gap-2">
              ${Components.renderStatusBadge(m.status)}
              ${Components.renderActionMenu('assigned-menu', m.id + '|' + canteen.id, [
                { action: 'view', label: 'View', icon: 'bi-eye' },
                { action: 'availability', label: 'Change availability', icon: 'bi-calendar-range' },
                { action: 'remove', label: 'Remove assignment', icon: 'bi-x-circle', danger: true }
              ])}
            </div>
          </div>
          <div class="menu-meta">
            <span>${AppState.countMenuItems(m)} items</span>
            <span>${Components.renderStatusBadge(m.availability === 'available' ? 'available' : 'unavailable')}</span>
          </div>
        </div>
      `).join(''));

      $el.find('.menu-card').on('click', function (e) {
        if ($(e.target).closest('.action-menu').length) return;
        window.location.href = 'menu-details.html?id=' + $(this).data('id');
      });
    },

    initMenusPage() {
      this.renderMenusList();
      this.bindMenuFilters();
      this.bindMenuActions();
      this.ensureAssignModal();
    },

    renderMenusList(filter) {
      filter = filter || {};
      let list = AppState.data.menus.slice();

      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter((m) => m.name.toLowerCase().includes(q) ||
          (m.description || '').toLowerCase().includes(q));
      }
      if (filter.status) {
        list = list.filter((m) => m.status === filter.status);
      }

      const $grid = $('#menusGrid');
      const $empty = $('#menusEmpty');

      if (!list.length) {
        $grid.hide();
        $empty.show().html(Components.renderEmptyState(
          'bi-journal-richtext',
          'No menus found',
          'Create a menu to assign to your canteens.',
          '<a href="create-menu.html" class="btn-app btn-primary-app"><i class="bi bi-plus-lg"></i> Create Menu</a>'
        ));
        return;
      }

      $empty.hide();
      $grid.show().html(list.map((m) => Components.renderMenu(m)).join(''));
      $grid.find('.menu-card').on('click keypress', function (e) {
        if ($(e.target).closest('.action-menu').length) return;
        if (e.type === 'keypress' && e.which !== 13) return;
        window.location.href = 'menu-details.html?id=' + $(this).data('id');
      });
    },

    bindMenuFilters() {
      const $status = $('#filterMenuStatus');
      if ($status.length) {
        Components.initializeSelect2($status, { placeholder: 'All statuses', allowClear: true });
      }
      const apply = () => {
        this.renderMenusList({
          search: $('#searchMenus').val(),
          status: $status.val()
        });
      };
      $('#searchMenus').on('input', apply);
      $status.on('change', apply);
    },

    bindMenuActions() {
      $(document).on('click', '[data-entity="menu"]', async function (e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        const action = $(this).data('action');
        const menu = AppState.getMenu(id);
        if (!menu) return;

        if (action === 'view' || action === 'edit') {
          window.location.href = 'menu-details.html?id=' + id;
        } else if (action === 'assign') {
          FoodProvider.openAssignModal(id);
        } else if (action === 'activate') {
          menu.status = 'active';
          menu.lastUpdated = new Date().toISOString();
          AppState.persist();
          Components.showToast(`"${menu.name}" activated.`, 'success');
          FoodProvider.renderMenusList({ search: $('#searchMenus').val(), status: $('#filterMenuStatus').val() });
        } else if (action === 'deactivate') {
          menu.status = 'inactive';
          menu.lastUpdated = new Date().toISOString();
          AppState.persist();
          Components.showToast(`"${menu.name}" deactivated.`, 'info');
          FoodProvider.renderMenusList({ search: $('#searchMenus').val(), status: $('#filterMenuStatus').val() });
        } else if (action === 'delete') {
          const ok = await Components.showConfirm({
            title: 'Delete menu?',
            text: `"${menu.name}" will be permanently removed from this demo.`,
            confirmText: 'Delete',
            danger: true
          });
          if (!ok) return;
          AppState.data.menus = AppState.data.menus.filter((m) => m.id !== id);
          AppState.data.canteens.forEach((c) => {
            c.assignedMenuIds = (c.assignedMenuIds || []).filter((mid) => mid !== id);
          });
          AppState.persist();
          Components.showToast('Menu deleted.', 'success');
          FoodProvider.renderMenusList({ search: $('#searchMenus').val(), status: $('#filterMenuStatus').val() });
        }
      });

      $(document).on('click', '[data-entity="assigned-menu"]', async function (e) {
        e.preventDefault();
        e.stopPropagation();
        const parts = String($(this).data('id')).split('|');
        const menuId = parts[0];
        const canteenId = parts[1];
        const action = $(this).data('action');
        const menu = AppState.getMenu(menuId);
        const canteen = AppState.getCanteen(canteenId);
        if (!menu || !canteen) return;

        if (action === 'view') {
          window.location.href = 'menu-details.html?id=' + menuId;
        } else if (action === 'availability') {
          menu.availability = menu.availability === 'available' ? 'unavailable' : 'available';
          menu.lastUpdated = new Date().toISOString();
          AppState.persist();
          Components.showToast('Availability updated.', 'success');
          FoodProvider.renderAssignedMenus(canteen);
        } else if (action === 'remove') {
          const ok = await Components.showConfirm({
            title: 'Remove assignment?',
            text: `"${menu.name}" will be unassigned from ${canteen.name}.`,
            confirmText: 'Remove',
            danger: true
          });
          if (!ok) return;
          canteen.assignedMenuIds = (canteen.assignedMenuIds || []).filter((id) => id !== menuId);
          menu.assignedCanteenIds = (menu.assignedCanteenIds || []).filter((id) => id !== canteenId);
          AppState.persist();
          Components.showToast('Assignment removed.', 'success');
          FoodProvider.renderAssignedMenus(canteen);
        }
      });
    },

    ensureAssignModal() {
      if ($('#assignMenuModal').length) return;
      // Modal may be in page HTML
    },

    openAssignModal(menuId, canteenId) {
      const $modal = $('#assignMenuModal');
      if (!$modal.length) {
        Components.showToast('Assign menu modal not available on this page.', 'info');
        return;
      }

      const $menu = $('#assignMenuSelect');
      const $canteens = $('#assignCanteensSelect');

      $menu.html('<option value=""></option>' +
        AppState.data.menus.map((m) => `<option value="${m.id}">${m.name}</option>`).join(''));
      $canteens.html(AppState.data.canteens
        .filter((c) => c.status === 'active')
        .map((c) => {
          const school = AppState.getSchool(c.schoolId);
          return `<option value="${c.id}">${c.name}${school ? ' — ' + school.name : ''}</option>`;
        }).join(''));

      if (menuId) $menu.val(menuId);
      if (canteenId) $canteens.val([canteenId]);

      $('#assignDateRange').prop('checked', false);
      $('#assignDateFields').hide();
      $('#assignStatus').val('active');

      const modal = bootstrap.Modal.getOrCreateInstance($modal[0]);
      modal.show();
    },

    bindAssignModal() {
      const $modal = $('#assignMenuModal');
      if (!$modal.length) return;

      Forms.initSelect2InModal($modal);

      $('#assignDateRange').on('change', function () {
        $('#assignDateFields').toggle($(this).is(':checked'));
      });

      $('#btnConfirmAssign').on('click', () => {
        const menuId = $('#assignMenuSelect').val();
        const canteenIds = $('#assignCanteensSelect').val() || [];
        const status = $('#assignStatus').val();

        if (!menuId) {
          Components.showToast('Please select a menu.', 'error');
          return;
        }
        if (!canteenIds.length) {
          Components.showToast('Please select at least one canteen.', 'error');
          return;
        }

        const menu = AppState.getMenu(menuId);
        if (!menu) return;

        const useDates = $('#assignDateRange').is(':checked');
        menu.availabilityDates = useDates ? {
          from: $('#assignFrom').val(),
          to: $('#assignTo').val()
        } : null;
        menu.status = status === 'active' ? 'active' : 'inactive';
        menu.availability = 'available';
        menu.lastUpdated = new Date().toISOString();

        canteenIds.forEach((cid) => {
          const canteen = AppState.getCanteen(cid);
          if (!canteen) return;
          if (!(canteen.assignedMenuIds || []).includes(menuId)) {
            canteen.assignedMenuIds = canteen.assignedMenuIds || [];
            canteen.assignedMenuIds.push(menuId);
          }
          if (!(menu.assignedCanteenIds || []).includes(cid)) {
            menu.assignedCanteenIds = menu.assignedCanteenIds || [];
            menu.assignedCanteenIds.push(cid);
          }
          canteen.lastActivity = new Date().toISOString();
        });

        AppState.data.activity.unshift({
          id: AppState.uid('act'),
          text: `Menu "${menu.name}" assigned to ${canteenIds.length} canteen${canteenIds.length > 1 ? 's' : ''}`,
          time: new Date().toISOString()
        });
        AppState.persist();

        bootstrap.Modal.getInstance($modal[0]).hide();
        Components.showSuccess('Menu assigned', `"${menu.name}" is now available at the selected canteens.`);

        if ($('#menusGrid').length) {
          this.renderMenusList({ search: $('#searchMenus').val(), status: $('#filterMenuStatus').val() });
        }
        if ($('#assignedMenusList').length) {
          const cid = Components.getQueryParam('id');
          const canteen = AppState.getCanteen(cid);
          if (canteen) this.renderAssignedMenus(canteen);
        }
        if ($('#menuAssignedCanteens').length) {
          this.initMenuDetails();
        }
      });
    },

    initMenuDetails() {
      const id = Components.getQueryParam('id') || 'menu-1';
      const menu = AppState.getMenu(id);
      if (!menu) {
        $('#menuDetailRoot').html(Components.renderEmptyState('bi-journal', 'Menu not found', 'This menu does not exist.',
          '<a href="menus.html" class="btn-app btn-primary-app">Back to Menus</a>'));
        return;
      }

      $('#menuDetailName').text(menu.name);
      $('#menuDetailDesc').text(menu.description || '');
      $('#menuDetailStatus').html(Components.renderStatusBadge(menu.status));
      $('#menuDetailAvailability').html(Components.renderStatusBadge(menu.availability === 'available' ? 'available' : 'unavailable'));

      const canteenNames = (menu.assignedCanteenIds || []).map((cid) => {
        const c = AppState.getCanteen(cid);
        return c ? c.name : null;
      }).filter(Boolean);
      $('#menuAssignedCanteens').text(canteenNames.length ? canteenNames.join(', ') : 'Not assigned');

      const $sections = $('#menuSectionsDetail');
      $sections.html((menu.sections || []).map((sec) => `
        <div class="section-block" data-aos="fade-up">
          <div class="section-block-header">
            <h4>${sec.name} <span class="translation-hint">i18n ready</span></h4>
            ${Components.renderStatusBadge(sec.status)}
          </div>
          <div>
            ${(sec.items || []).map((item) => {
              const product = AppState.getProduct(item.productId);
              return Components.renderMenuItem(item, product);
            }).join('') || '<div class="p-3 text-muted">No items in this section.</div>'}
          </div>
        </div>
      `).join(''));

      $('#btnAssignMenuDetail').on('click', () => this.openAssignModal(menu.id));

      $(document).off('click.menuItem').on('click.menuItem', '[data-entity="menu-item"]', async function (e) {
        e.preventDefault();
        const itemId = $(this).data('id');
        const action = $(this).data('action');
        let found = null;
        let section = null;
        (menu.sections || []).forEach((sec) => {
          const item = (sec.items || []).find((i) => i.id === itemId);
          if (item) { found = item; section = sec; }
        });
        if (!found) return;

        if (action === 'edit') {
          Components.showToast('Edit item is available in Create Menu for this MVP.', 'info');
        } else if (action === 'remove') {
          const ok = await Components.showConfirm({
            title: 'Remove item?',
            text: 'This item will be removed from the menu.',
            confirmText: 'Remove',
            danger: true
          });
          if (!ok) return;
          section.items = section.items.filter((i) => i.id !== itemId);
          menu.lastUpdated = new Date().toISOString();
          AppState.persist();
          Components.showToast('Item removed.', 'success');
          FoodProvider.initMenuDetails();
        }
      });
    }
  };

  global.FoodProvider = FoodProvider;

  $(function () {
    FoodProvider.bindAssignModal();
  });
})(window, jQuery);
