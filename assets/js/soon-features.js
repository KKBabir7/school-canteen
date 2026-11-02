/**
 * Shared pages for former "Soon" nav items: products, reports, calendars, FP/SA orders, discounts, schedule.
 */
(function (global, $) {
  'use strict';

  function money(n) {
    return (APP_CONFIG.currency || '₪') + Number(n || 0).toFixed(0);
  }

  const SoonFeatures = {
    /* ---------- Food Provider: Products ---------- */
    async initProducts() {
      const render = async () => {
        let list = await ProductService.getAll();
        const q = ($('#searchProducts').val() || '').toLowerCase();
        const type = $('#filterProductType').val();
        if (q) {
          list = list.filter((p) =>
            (p.name.en || '').toLowerCase().includes(q) ||
            (p.name.ar || '').includes(q));
        }
        if (type) list = list.filter((p) => p.type === type);

        const $grid = $('#productsGrid');
        if (!list.length) {
          $grid.hide();
          $('#productsEmpty').show().html(Components.renderEmptyState(
            'bi-box-seam', I18n.t('noProducts'), '',
            `<button type="button" class="btn-app btn-primary-app" id="btnEmptyAddProduct"><i class="bi bi-plus-lg"></i> ${I18n.t('createProduct')}</button>`
          ));
          return;
        }
        $('#productsEmpty').hide();
        $grid.show().html(list.map((p) => {
          const name = Utils.localized(p.name);
          const desc = Utils.localized(p.description) || '—';
          const typeLabel = p.type === 'common' ? I18n.t('commonProduct') : I18n.t('providerProduct');
          return `
          <article class="food-card" data-id="${p.id}" data-aos="fade-up">
            <div class="food-card-img">
              <img src="${p.image}" alt="${name}" class="object-cover" loading="lazy">
              <div class="food-card-badges">
                ${Components.renderStatusBadge(p.available ? 'available' : 'unavailable')}
              </div>
            </div>
            <div class="food-card-body">
              <div class="food-card-title-row">
                <h4>${name}</h4>
                <span class="badge-app badge-neutral">${typeLabel}</span>
              </div>
              <p class="food-card-desc">${desc}</p>
              <div class="food-card-footer">
                <span class="food-card-price">${money(p.price)}</span>
                <div class="food-card-actions">
                  <button type="button" class="btn-app btn-outline-app btn-sm-app btn-edit-product" data-id="${p.id}">
                    <i class="bi bi-pencil" aria-hidden="true"></i> ${I18n.t('edit')}
                  </button>
                  <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-toggle-product" data-id="${p.id}">
                    <i class="bi ${p.available ? 'bi-pause-circle' : 'bi-play-circle'}" aria-hidden="true"></i>
                    ${p.available ? I18n.t('deactivate') : I18n.t('activate')}
                  </button>
                </div>
              </div>
            </div>
          </article>`;
        }).join(''));
      };

      this._renderProducts = render;
      this.bindProductModal();
      await render();
      Forms.initPageSelect2('#filterProductType');
      $('#searchProducts').on('input', render);
      $('#filterProductType').on('change', render);
      $(document).off('click.addPr').on('click.addPr', '#btnAddProduct, #btnEmptyAddProduct', () => this.openProductModal());
      $(document).off('click.editPr').on('click.editPr', '.btn-edit-product', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const p = await ProductService.getById($(e.currentTarget).data('id'));
        this.openProductModal(p);
      });
      $(document).off('click.togglePr').on('click.togglePr', '.btn-toggle-product', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await ProductService.toggleAvailable($(e.currentTarget).data('id'));
        Components.showToast(I18n.t('success'), 'success');
        render();
      });
    },

    bindProductModal() {
      const $modal = $('#productModal');
      if (!$modal.length || $modal.data('bound')) return;
      $modal.data('bound', true);
      Forms.initSelect2InModal($modal);

      $('#btnSaveProduct').off('click').on('click', async () => {
        const nameEn = ($('#pNameEn').val() || '').trim();
        const nameAr = ($('#pNameAr').val() || '').trim();
        if (!nameEn || !nameAr) {
          Components.showToast(I18n.t('required'), 'error');
          return;
        }
        const payload = {
          nameEn,
          nameAr,
          descEn: ($('#pDescEn').val() || '').trim(),
          descAr: ($('#pDescAr').val() || '').trim(),
          price: Number($('#pPrice').val()) || 0,
          type: $('#pType').val() || 'provider',
          available: $('#pAvail').is(':checked')
        };
        const editId = $('#productEditId').val();
        if (editId) await ProductService.update(editId, payload);
        else await ProductService.create(payload);

        bootstrap.Modal.getInstance($modal[0]).hide();
        Components.showSuccess(I18n.t('success'), editId ? I18n.t('saveChanges') : I18n.t('createProduct'));
        if (this._renderProducts) this._renderProducts();
      });
    },

    openProductModal(existing) {
      const $modal = $('#productModal');
      if (!$modal.length) return;
      const isEdit = !!existing;

      $('#productEditId').val(isEdit ? existing.id : '');
      $('#productModalLabel').text(isEdit ? I18n.t('edit') : I18n.t('createProduct'));
      $('#productModalSubtitle').text(
        isEdit ? 'Update bilingual details, price, and availability' : 'Add a bilingual item to your catalog'
      );
      $('#pNameEn').val(isEdit ? (existing.name?.en || '') : '');
      $('#pNameAr').val(isEdit ? (existing.name?.ar || '') : '');
      $('#pDescEn').val(isEdit ? (existing.description?.en || '') : '');
      $('#pDescAr').val(isEdit ? (existing.description?.ar || '') : '');
      $('#pPrice').val(isEdit ? existing.price : '');
      $('#pType').val(isEdit ? (existing.type || 'provider') : 'provider');
      $('#pAvail').prop('checked', isEdit ? !!existing.available : true);

      bootstrap.Modal.getOrCreateInstance($modal[0]).show();
      $modal.one('shown.bs.modal.productPrefill', () => {
        $('#pType').val(isEdit ? (existing.type || 'provider') : 'provider').trigger('change');
      });
    },

    /* ---------- Food Provider / School Admin: Orders overview ---------- */
    async initProviderOrders(scope) {
      // scope: 'provider' | 'school'
      let orders = await OrderService.getAll();
      let schoolCanteens = [];
      if (scope === 'school') {
        const schoolId = (typeof Session !== 'undefined' && Session.profile() && Session.profile().schoolId)
          || APP_CONFIG.roles.schoolAdmin.schoolId;
        schoolCanteens = (await CanteenService.getAll()).filter((c) => c.schoolId === schoolId);
        const canteenIds = schoolCanteens.map((c) => c.id);
        orders = orders.filter((o) => canteenIds.includes(o.canteenId));
      }

      let activeTab = 'all';
      let canteenFilter = 'all';

      const updateCounts = () => {
        const base = canteenFilter === 'all'
          ? orders
          : orders.filter((o) => o.canteenId === canteenFilter);
        ['new', 'preparing', 'ready', 'upcoming', 'completed'].forEach((s) => {
          const n = base.filter((o) => o.status === s).length;
          $('#count-' + s).text(n);
        });
      };

      let sortBy = 'newest';
      const applySort = (list) => {
        list.sort((a, b) => {
          if (sortBy === 'highest') return (b.total || 0) - (a.total || 0);
          if (sortBy === 'lowest') return (a.total || 0) - (b.total || 0);
          const ta = new Date(a.orderTime || a.orderDate || 0).getTime();
          const tb = new Date(b.orderTime || b.orderDate || 0).getTime();
          return sortBy === 'oldest' ? ta - tb : tb - ta;
        });
        return list;
      };

      const render = () => {
        let list = orders.slice();
        if (canteenFilter !== 'all') {
          list = list.filter((o) => o.canteenId === canteenFilter);
        }
        const q = ($('#searchFpOrders').val() || '').toLowerCase();
        if (q) {
          list = list.filter((o) =>
            (o.orderNumber || '').toLowerCase().includes(q) ||
            (o.studentName || '').toLowerCase().includes(q) ||
            (o.classroom || '').toLowerCase().includes(q));
        }
        if (activeTab && activeTab !== 'all') {
          list = list.filter((o) => o.status === activeTab);
        }
        applySort(list);

        $('#fpOrdersList').html(list.map((o) => {
          const canteen = (Storage.get('canteens') || []).find((c) => c.id === o.canteenId);
          const itemCount = (o.items || []).reduce((s, i) => s + (i.qty || 1), 0);
          const totalHtml = (typeof Utils !== 'undefined' && Utils.moneyHtml)
            ? Utils.moneyHtml(o.total)
            : money(o.total);
          return `
            <a href="../canteen-manager/order-details.html?id=${o.id}" class="order-card text-decoration-none text-reset" data-aos="fade-up">
              <div class="order-card-main">
                <div class="order-number">#${o.orderNumber}</div>
                <div class="order-student">
                  <strong>${o.studentName}</strong>
                  <span>${o.classroom || '—'}</span>
                </div>
                <div class="order-meta-item">
                  <strong>${I18n.t('canteens')}</strong>
                  <span class="meta-value">${canteen ? canteen.name : o.canteenId}</span>
                </div>
                <div class="order-meta-item">
                  <strong>${I18n.t('items') || 'Items'}</strong>
                  <span class="meta-value">${itemCount}</span>
                </div>
                <div class="order-meta-item">
                  <strong>${I18n.t('total')}</strong>
                  <span class="meta-value order-total">${totalHtml}</span>
                </div>
                <div class="order-card-status">${Components.renderStatusBadge(o.status)}</div>
              </div>
              <i class="bi bi-chevron-right order-card-chevron" aria-hidden="true"></i>
            </a>`;
        }).join('') || Components.renderEmptyState('bi-bag', I18n.t('noOrders'), ''));
      };

      if (scope === 'school' && $('#saOrderCanteen').length) {
        const opts = schoolCanteens.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
        $('#saOrderCanteen').html(`<option value="all">All canteens</option>${opts}`);
      }

      if (typeof Forms !== 'undefined') {
        ['#fpOrderSort', '#saOrderCanteen'].forEach((sel) => {
          if ($(sel).length) {
            Forms.initSelect2($(sel), {
              width: '100%',
              minimumResultsForSearch: Infinity
            });
          }
        });
      }

      updateCounts();
      render();
      $('#searchFpOrders').off('input.fpOrders').on('input.fpOrders', render);
      $('#fpOrderSort').off('change.fpOrders').on('change.fpOrders', function () {
        sortBy = $(this).val() || 'newest';
        render();
      });
      $('#saOrderCanteen').off('change.fpOrders').on('change.fpOrders', function () {
        canteenFilter = $(this).val() || 'all';
        updateCounts();
        render();
      });
      $('#fpOrderTabs').off('click.fpOrders').on('click.fpOrders', '.tab-btn', function () {
        $('#fpOrderTabs .tab-btn').removeClass('active');
        $(this).addClass('active');
        activeTab = $(this).data('tab');
        render();
      });
    },

    /* ---------- Calendar (FP / Student) ---------- */
    async initCalendar(role) {
      const menus = await MenuService.getAll();
      const orders = role === 'student'
        ? await OrderService.getByChild(APP_CONFIG.roles.student.childId)
        : await OrderService.getAll();

      const byDate = {};
      orders.forEach((o) => {
        const d = o.orderDate || (o.orderTime || '').slice(0, 10);
        if (!d) return;
        byDate[d] = byDate[d] || [];
        byDate[d].push(o);
      });

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const first = new Date(year, month, 1);
      const startPad = first.getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const todayIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const monthLabel = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });
      $('#calendarMonthTitle').text(monthLabel);

      let html = '';
      for (let i = 0; i < startPad; i++) {
        html += '<div class="calendar-day is-empty" aria-hidden="true"></div>';
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const list = byDate[iso] || [];
        const dow = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(iso + 'T12:00:00').getDay()];
        const menuToday = menus.filter((m) => m.status === 'active' && (m.weekdays || []).includes(dow));
        const classes = [
          'calendar-day',
          list.length ? 'has-order' : '',
          menuToday.length ? 'has-menus' : '',
          iso === todayIso ? 'is-today' : '',
          role === 'student' ? 'is-clickable' : ''
        ].filter(Boolean).join(' ');

        let meta = '';
        if (list.length) {
          meta = `<span class="calendar-day-meta calendar-day-meta--orders"><i class="bi bi-bag-check" aria-hidden="true"></i> ${list.length}</span>`;
        } else if (menuToday.length) {
          meta = `<span class="calendar-day-meta calendar-day-meta--menus">${menuToday.length} ${I18n.t('menus')}</span>`;
        }

        html += `<div class="${classes}" data-date="${iso}">
          <span class="calendar-day-num">${d}</span>
          ${meta}
        </div>`;
      }
      $('#featureCalendarGrid').html(html);

      const shortDay = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
      const activeMenus = menus.filter((m) => m.status === 'active');
      $('#calendarMenuLegend').html(activeMenus.map((m) => `
        <article class="calendar-menu-item">
          <strong class="calendar-menu-item-title">${Utils.localized(m.name)}</strong>
          <div class="calendar-day-chips">
            ${(m.weekdays || []).map((w) =>
              `<span class="calendar-day-chip">${shortDay[w] || I18n.t(w)}</span>`
            ).join('') || `<span class="text-muted small">—</span>`}
          </div>
        </article>`).join('') || `<p class="text-muted mb-0">${I18n.t('noMenus')}</p>`);

      if (role === 'student') {
        $('#featureCalendarGrid').on('click', '.calendar-day.is-clickable', function () {
          const date = $(this).data('date');
          if (byDate[date] && byDate[date].length) {
            window.location.href = 'orders.html';
          } else {
            window.location.href = 'order.html';
          }
        });
      }
    },

    /* ---------- Reports (Chart.js) ---------- */
    async initReports(canteenId) {
      Forms.initPageSelect2('#reportRange');

      const paint = async () => {
        let orders = await OrderService.getAll(canteenId || null);
        const rangeVal = $('#reportRange').val();
        const days = Number(rangeVal);
        if (days > 0) {
          const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
          orders = orders.filter((o) => {
            const t = new Date(o.orderTime || o.orderDate || 0).getTime();
            return Number.isFinite(t) && t >= cutoff;
          });
        }

        const counts = { new: 0, preparing: 0, ready: 0, completed: 0, upcoming: 0 };
        let revenue = 0;
        const byDay = {};
        orders.forEach((o) => {
          if (counts[o.status] !== undefined) counts[o.status]++;
          if (o.status === 'completed') revenue += Number(o.total) || 0;
          const d = (o.orderDate || (o.orderTime || '').slice(0, 10) || '');
          if (d) byDay[d] = (byDay[d] || 0) + 1;
        });

        $('#repTotalOrders').text(orders.length);
        $('#repRevenue').html(Utils.moneyHtml(revenue));
        $('#repCompleted').text(counts.completed);
        $('#repActive').text(counts.new + counts.preparing + counts.ready);

        const statusData = [counts.new, counts.preparing, counts.ready, counts.completed, counts.upcoming];
        const hasStatus = statusData.some((n) => n > 0);
        const dayLabels = Object.keys(byDay).sort();

        const statusCtx = document.getElementById('chartStatus');
        const trendCtx = document.getElementById('chartTrend');
        if (typeof Chart !== 'undefined' && statusCtx) {
          if (statusCtx._chart) statusCtx._chart.destroy();
          statusCtx._chart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
              labels: hasStatus
                ? [I18n.t('newOrders'), I18n.t('preparing'), I18n.t('ready'), I18n.t('completed'), I18n.t('upcoming')]
                : ['No data'],
              datasets: [{
                data: hasStatus ? statusData : [1],
                backgroundColor: hasStatus
                  ? ['#ADCED8', '#F08976', '#314D63', '#8FB9AB', '#94a3b8']
                  : ['#e8eef2']
              }]
            },
            options: {
              plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Josefin Sans' } } },
                tooltip: { enabled: hasStatus }
              }
            }
          });
        }
        if (typeof Chart !== 'undefined' && trendCtx) {
          if (trendCtx._chart) trendCtx._chart.destroy();
          trendCtx._chart = new Chart(trendCtx, {
            type: 'bar',
            data: {
              labels: dayLabels.length ? dayLabels.map((d) => d.slice(5)) : ['—'],
              datasets: [{
                label: I18n.t('orders'),
                data: dayLabels.length ? dayLabels.map((l) => byDay[l]) : [0],
                backgroundColor: '#8FB9AB',
                borderRadius: 6
              }]
            },
            options: {
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
              plugins: { legend: { display: false } }
            }
          });
        }
      };

      await paint();
      $('#reportRange').on('change', paint);
    },

    /* ---------- CM Schedule ---------- */
    async initSchedule() {
      const canteenId = APP_CONFIG.roles.canteenManager.canteenId;
      const canteen = await CanteenService.getById(canteenId);
      const school = await SchoolService.getSchoolById(canteen.schoolId);
      const breaks = await SchoolService.getBreaks(canteen.schoolId);
      const settings = Storage.get('settings') || SchoolFoodSeed.settings;
      const ordering = (settings.canteenManager && settings.canteenManager.ordering) || {};

      $('#schedCanteen').text(canteen.name);
      $('#schedSchoolDays').text((school.schoolDays || []).map((d) => I18n.t(d)).join(', '));
      $('#schedLastOrder').text(ordering.lastOrderTime || '11:30');
      $('#schedWindow').text((ordering.stopWindowMinutes || 30) + ' min');
      $('#schedSameDay').text(ordering.allowSameDay ? I18n.t('active') : I18n.t('inactive'));

      $('#schedBreaks').html(breaks.map((b) => `
        <div class="d-flex justify-content-between py-2 border-bottom">
          <div>
            <strong>${Utils.localized(b.name)}</strong>
            <div class="small text-muted">${(b.days || []).map((d) => I18n.t(d)).join(', ')}</div>
          </div>
          <span>${b.start} – ${b.end}</span>
        </div>`).join('') || `<p class="text-muted">${I18n.t('noBreaks')}</p>`);

      const menus = await MenuService.getForCanteen(canteenId);
      $('#schedMenus').html(menus.map((m) => `
        <div class="d-flex justify-content-between py-2 border-bottom">
          <span>${Utils.localized(m.name)}</span>
          <span class="small text-muted">${(m.weekdays || []).map((w) => I18n.t(w)).join(', ')}</span>
        </div>`).join('') || `<p class="text-muted">${I18n.t('noMenus')}</p>`);
    },

    /* ---------- CM Discounts ---------- */
    async initDiscounts() {
      const canteenId = APP_CONFIG.roles.canteenManager.canteenId;
      const $modal = $('#discountModal');
      const render = async () => {
        const list = await DiscountService.getAll(canteenId);
        $('#discountsList').html(list.map((d) => `
          <div class="card-app mb-3" data-aos="fade-up">
            <div class="card-app-header">
              <h3>${Utils.localized(d.name)}</h3>
              <div class="d-flex gap-2 align-items-center">
                ${Components.renderStatusBadge(d.active ? 'active' : 'inactive')}
                <button type="button" class="btn-app btn-outline-app btn-sm-app btn-toggle-disc" data-id="${d.id}">
                  <i class="bi ${d.active ? 'bi-pause-circle' : 'bi-play-circle'}" aria-hidden="true"></i>
                  ${d.active ? I18n.t('deactivate') : I18n.t('activate')}
                </button>
                <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-del-disc" data-id="${d.id}" aria-label="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            <div class="card-app-body">
              <div class="mb-1"><strong>${d.type === 'percent' ? d.value + '%' : money(d.value)}</strong> ${I18n.t('discount')}</div>
              <div class="small text-muted">${(d.weekdays || []).map((w) => I18n.t(w)).join(', ') || '—'}</div>
            </div>
          </div>`).join('') || Components.renderEmptyState('bi-percent', I18n.t('noDiscounts'), '',
          `<button type="button" class="btn-app btn-primary-app" id="btnEmptyDisc"><i class="bi bi-plus-lg"></i> ${I18n.t('addDiscount')}</button>`));
      };

      if ($modal.length && !$modal.data('bound')) {
        $modal.data('bound', true);
        Forms.initSelect2InModal($modal);
        $('#btnSaveDiscount').on('click', async () => {
          const nameEn = ($('#dNameEn').val() || '').trim() || 'Discount';
          const nameAr = ($('#dNameAr').val() || '').trim() || 'خصم';
          await DiscountService.create({
            name: { en: nameEn, ar: nameAr },
            type: $('#dType').val() || 'percent',
            value: Number($('#dVal').val()) || 0,
            canteenId
          });
          bootstrap.Modal.getInstance($modal[0]).hide();
          Components.showSuccess(I18n.t('success'), I18n.t('addDiscount'));
          render();
        });
      }

      const openAdd = () => {
        if (!$modal.length) return;
        $('#dNameEn').val('');
        $('#dNameAr').val('');
        $('#dVal').val(10);
        $('#dType').val('percent');
        bootstrap.Modal.getOrCreateInstance($modal[0]).show();
        $modal.one('shown.bs.modal.discPrefill', () => {
          $('#dType').val('percent').trigger('change');
        });
      };

      await render();
      $('#btnAddDiscount').on('click', openAdd);
      $(document).on('click', '#btnEmptyDisc', openAdd);
      $(document).off('click.td').on('click.td', '.btn-toggle-disc', async (e) => {
        await DiscountService.toggle($(e.currentTarget).data('id'));
        render();
      });
      $(document).off('click.dd').on('click.dd', '.btn-del-disc', async (e) => {
        const ok = await Components.showConfirm({
          title: I18n.t('delete') + '?',
          confirmText: I18n.t('delete'),
          danger: true
        });
        if (!ok) return;
        await DiscountService.remove($(e.currentTarget).data('id'));
        render();
      });
    }
  };

  global.SoonFeatures = SoonFeatures;
})(window, jQuery);
