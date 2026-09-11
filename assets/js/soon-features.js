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
            `<button type="button" class="btn-app btn-primary-app" id="btnEmptyAddProduct">${I18n.t('createProduct')}</button>`
          ));
          return;
        }
        $('#productsEmpty').hide();
        $grid.show().html(list.map((p) => `
          <div class="food-card" data-id="${p.id}" data-aos="fade-up">
            <div class="food-card-img"><img src="${p.image}" alt="${Utils.localized(p.name)}" class="object-cover" loading="lazy"></div>
            <div class="food-card-body">
              <div class="d-flex justify-content-between gap-2">
                <h4>${Utils.localized(p.name)}</h4>
                ${Components.renderStatusBadge(p.available ? 'available' : 'unavailable')}
              </div>
              <p class="small text-muted mb-2">${Utils.localized(p.description)}</p>
              <div class="food-card-footer">
                <span class="food-card-price">${money(p.price)}</span>
                <span class="badge-app badge-neutral">${p.type === 'common' ? I18n.t('commonProduct') : I18n.t('providerProduct')}</span>
              </div>
              <div class="d-flex gap-2 mt-2">
                <button type="button" class="btn-app btn-outline-app btn-sm-app btn-edit-product" data-id="${p.id}">${I18n.t('edit')}</button>
                <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-toggle-product" data-id="${p.id}">
                  ${p.available ? I18n.t('deactivate') : I18n.t('activate')}
                </button>
              </div>
            </div>
          </div>`).join(''));
      };

      await render();
      $('#searchProducts, #filterProductType').on('input change', render);
      $(document).off('click.addPr').on('click.addPr', '#btnAddProduct, #btnEmptyAddProduct', () => this.openProductModal());
      $(document).off('click.editPr').on('click.editPr', '.btn-edit-product', async (e) => {
        const p = await ProductService.getById($(e.currentTarget).data('id'));
        this.openProductModal(p);
      });
      $(document).off('click.togglePr').on('click.togglePr', '.btn-toggle-product', async (e) => {
        await ProductService.toggleAvailable($(e.currentTarget).data('id'));
        Components.showToast(I18n.t('success'), 'success');
        render();
      });
      this._renderProducts = render;
    },

    async openProductModal(existing) {
      const isEdit = !!existing;
      const { value: form } = await Swal.fire({
        title: isEdit ? I18n.t('edit') : I18n.t('createProduct'),
        width: 520,
        html: `
          <div class="text-start">
            <input id="pNameEn" class="form-control-app mb-2" placeholder="${I18n.t('productNameEn')}" value="${existing ? (existing.name.en || '') : ''}">
            <input id="pNameAr" class="form-control-app mb-2" placeholder="${I18n.t('productNameAr')}" dir="rtl" value="${existing ? (existing.name.ar || '') : ''}">
            <textarea id="pDescEn" class="form-control-app mb-2" rows="2" placeholder="${I18n.t('descEn')}">${existing && existing.description ? (existing.description.en || '') : ''}</textarea>
            <textarea id="pDescAr" class="form-control-app mb-2" rows="2" placeholder="${I18n.t('descAr')}" dir="rtl">${existing && existing.description ? (existing.description.ar || '') : ''}</textarea>
            <input id="pPrice" type="number" class="form-control-app mb-2" placeholder="${I18n.t('price')}" value="${existing ? existing.price : ''}">
            <select id="pType" class="form-select-app mb-2">
              <option value="provider" ${!existing || existing.type === 'provider' ? 'selected' : ''}>${I18n.t('providerProduct')}</option>
              <option value="common" ${existing && existing.type === 'common' ? 'selected' : ''}>${I18n.t('commonProduct')}</option>
            </select>
            <label class="toggle-app"><input type="checkbox" id="pAvail" ${!existing || existing.available ? 'checked' : ''}><span class="toggle-track"></span><span>${I18n.t('available')}</span></label>
          </div>`,
        showCancelButton: true,
        confirmButtonColor: '#1a365d',
        confirmButtonText: I18n.t('save'),
        preConfirm: () => {
          const nameEn = $('#pNameEn').val().trim();
          if (!nameEn) { Swal.showValidationMessage(I18n.t('required')); return false; }
          return {
            nameEn,
            nameAr: $('#pNameAr').val().trim(),
            descEn: $('#pDescEn').val().trim(),
            descAr: $('#pDescAr').val().trim(),
            price: Number($('#pPrice').val()) || 0,
            type: $('#pType').val(),
            available: $('#pAvail').is(':checked')
          };
        }
      });
      if (!form) return;
      if (isEdit) await ProductService.update(existing.id, form);
      else await ProductService.create(form);
      Components.showToast(I18n.t('success'), 'success');
      if (this._renderProducts) this._renderProducts();
    },

    /* ---------- Food Provider / School Admin: Orders overview ---------- */
    async initProviderOrders(scope) {
      // scope: 'provider' | 'school'
      let orders = await OrderService.getAll();
      if (scope === 'school') {
        const schoolId = APP_CONFIG.roles.schoolAdmin.schoolId;
        const canteenIds = (await CanteenService.getAll())
          .filter((c) => c.schoolId === schoolId)
          .map((c) => c.id);
        orders = orders.filter((o) => canteenIds.includes(o.canteenId));
      }

      const render = () => {
        let list = orders.slice();
        const q = ($('#searchFpOrders').val() || '').toLowerCase();
        const status = $('#filterFpOrderStatus').val();
        if (q) {
          list = list.filter((o) =>
            (o.orderNumber || '').toLowerCase().includes(q) ||
            (o.studentName || '').toLowerCase().includes(q) ||
            (o.classroom || '').toLowerCase().includes(q));
        }
        if (status) list = list.filter((o) => o.status === status);

        $('#fpOrdersList').html(list.map((o) => {
          const canteen = (Storage.get('canteens') || []).find((c) => c.id === o.canteenId);
          return `
            <a href="../canteen-manager/order-details.html?id=${o.id}" class="order-card text-decoration-none text-reset" data-aos="fade-up">
              <div class="order-card-main">
                <div class="order-number">#${o.orderNumber}</div>
                <div class="order-student"><strong>${o.studentName}</strong><span>${o.classroom}</span></div>
                <div class="order-meta-item"><strong>${I18n.t('canteens')}</strong>${canteen ? canteen.name : o.canteenId}</div>
                <div class="order-meta-item"><strong>${I18n.t('total')}</strong>${money(o.total)}</div>
                ${Components.renderStatusBadge(o.status)}
              </div>
            </a>`;
        }).join('') || Components.renderEmptyState('bi-bag', I18n.t('noOrders'), ''));
      };

      render();
      $('#searchFpOrders, #filterFpOrderStatus').on('input change', render);
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

      let html = '';
      for (let i = 0; i < startPad; i++) html += '<div></div>';
      for (let d = 1; d <= daysInMonth; d++) {
        const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const list = byDate[iso] || [];
        const dow = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(iso).getDay()];
        const menuToday = menus.filter((m) => m.status === 'active' && (m.weekdays || []).includes(dow));
        html += `<div class="calendar-day ${list.length ? 'has-order' : ''}" data-date="${iso}">
          <strong>${d}</strong>
          ${list.length ? `<div class="small text-success">✓ ${list.length}</div>` : ''}
          ${!list.length && menuToday.length ? `<div class="small text-muted">${menuToday.length} ${I18n.t('menus')}</div>` : ''}
        </div>`;
      }
      $('#featureCalendarGrid').html(html);

      const activeMenus = menus.filter((m) => m.status === 'active');
      $('#calendarMenuLegend').html(activeMenus.map((m) => `
        <div class="d-flex justify-content-between py-2 border-bottom">
          <span>${Utils.localized(m.name)}</span>
          <span class="small text-muted">${(m.weekdays || []).map((w) => I18n.t(w)).join(', ')}</span>
        </div>`).join('') || `<p class="text-muted">${I18n.t('noMenus')}</p>`);

      if (role === 'student') {
        $('#featureCalendarGrid').on('click', '.calendar-day', function () {
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
      let orders = await OrderService.getAll(canteenId || null);
      if (!canteenId) {
        // provider: all
      }
      const counts = { new: 0, preparing: 0, ready: 0, completed: 0, upcoming: 0 };
      let revenue = 0;
      const byDay = {};
      orders.forEach((o) => {
        if (counts[o.status] !== undefined) counts[o.status]++;
        if (o.status === 'completed') revenue += Number(o.total) || 0;
        const d = (o.orderDate || (o.orderTime || '').slice(0, 10) || '').slice(5);
        if (d) byDay[d] = (byDay[d] || 0) + 1;
      });

      $('#repTotalOrders').text(orders.length);
      $('#repRevenue').text(money(revenue));
      $('#repCompleted').text(counts.completed);
      $('#repActive').text(counts.new + counts.preparing + counts.ready);

      const statusCtx = document.getElementById('chartStatus');
      const trendCtx = document.getElementById('chartTrend');
      if (typeof Chart !== 'undefined' && statusCtx) {
        if (statusCtx._chart) statusCtx._chart.destroy();
        statusCtx._chart = new Chart(statusCtx, {
          type: 'doughnut',
          data: {
            labels: [I18n.t('newOrders'), I18n.t('preparing'), I18n.t('ready'), I18n.t('completed'), I18n.t('upcoming')],
            datasets: [{
              data: [counts.new, counts.preparing, counts.ready, counts.completed, counts.upcoming],
              backgroundColor: ['#0284c7', '#d97706', '#1a365d', '#059669', '#94a3b8']
            }]
          },
          options: { plugins: { legend: { position: 'bottom' } } }
        });
      }
      if (typeof Chart !== 'undefined' && trendCtx) {
        const labels = Object.keys(byDay).sort();
        if (trendCtx._chart) trendCtx._chart.destroy();
        trendCtx._chart = new Chart(trendCtx, {
          type: 'bar',
          data: {
            labels: labels.length ? labels : ['—'],
            datasets: [{
              label: I18n.t('orders'),
              data: labels.length ? labels.map((l) => byDay[l]) : [0],
              backgroundColor: '#5f8f75'
            }]
          },
          options: {
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
          }
        });
      }
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
      const render = async () => {
        const list = await DiscountService.getAll(canteenId);
        $('#discountsList').html(list.map((d) => `
          <div class="card-app mb-3" data-aos="fade-up">
            <div class="card-app-header">
              <h3>${Utils.localized(d.name)}</h3>
              <div class="d-flex gap-2 align-items-center">
                ${Components.renderStatusBadge(d.active ? 'active' : 'inactive')}
                <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-toggle-disc" data-id="${d.id}">
                  ${d.active ? I18n.t('deactivate') : I18n.t('activate')}
                </button>
                <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-del-disc" data-id="${d.id}"><i class="bi bi-trash"></i></button>
              </div>
            </div>
            <div class="card-app-body">
              <div class="mb-1"><strong>${d.type === 'percent' ? d.value + '%' : money(d.value)}</strong> ${I18n.t('discount')}</div>
              <div class="small text-muted">${(d.weekdays || []).map((w) => I18n.t(w)).join(', ')}</div>
            </div>
          </div>`).join('') || Components.renderEmptyState('bi-percent', I18n.t('noDiscounts'), '',
          `<button type="button" class="btn-app btn-primary-app" id="btnEmptyDisc">${I18n.t('addDiscount')}</button>`));
      };

      await render();
      const openAdd = async () => {
        const { value: form } = await Swal.fire({
          title: I18n.t('addDiscount'),
          html: `
            <input id="dNameEn" class="form-control-app mb-2" placeholder="Name (EN)">
            <input id="dNameAr" class="form-control-app mb-2" placeholder="الاسم" dir="rtl">
            <select id="dType" class="form-select-app mb-2"><option value="percent">%</option><option value="fixed">${APP_CONFIG.currency}</option></select>
            <input id="dVal" type="number" class="form-control-app" placeholder="Value" value="10">`,
          showCancelButton: true,
          confirmButtonColor: '#1a365d',
          preConfirm: () => ({
            name: { en: $('#dNameEn').val().trim() || 'Discount', ar: $('#dNameAr').val().trim() || 'خصم' },
            type: $('#dType').val(),
            value: Number($('#dVal').val()) || 0,
            canteenId
          })
        });
        if (!form) return;
        await DiscountService.create(form);
        Components.showToast(I18n.t('success'), 'success');
        render();
      };

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
