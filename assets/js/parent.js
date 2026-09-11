/**
 * Parent role — home, wallet, children, order food, calendar, settings.
 */
(function (global, $) {
  'use strict';

  const ParentApp = {
    parentId() { return APP_CONFIG.roles.parent.id; },
    tray: [],
    selectedChildId: null,
    orderDate: null,

    money(n) { return (APP_CONFIG.currency || '₪') + Number(n || 0).toFixed(0); },

    async initHome() {
      const children = await ChildService.getAll(this.parentId());
      const family = await WalletService.getFamily(this.parentId());
      $('#familyBalance').text(this.money(family.balance));
      $('#activityList').html((family.activity || []).slice(0, 5).map((a) => `
        <div class="d-flex justify-content-between py-2 border-bottom">
          <div>
            <strong>${Utils.localized(a.label)}</strong>
            <div class="small text-muted">${AppStateFormat(a.date)}</div>
          </div>
          <span class="activity-amount ${a.amount >= 0 ? 'pos' : 'neg'}">${a.amount >= 0 ? '+' : ''}${this.money(a.amount)}</span>
        </div>`).join('') || `<p class="text-muted">${I18n.t('noOrders')}</p>`);

      $('#childrenHome').html(children.map((c) => {
        const school = CanteenService.getSchoolName(c.schoolId);
        const av = SchoolFoodSeed.avatars[c.avatarKey] || SchoolFoodSeed.avatars.sarah;
        return `
          <div class="col-md-6" data-aos="fade-up">
            <div class="child-home-card h-100">
              <div class="d-flex gap-3 align-items-center mb-3">
                <img class="child-avatar" src="${av}" alt="">
                <div>
                  <strong>${c.firstName} ${c.lastName}</strong>
                  <div class="small text-muted">${school} · ${c.classroom || gradeLabel(c)}</div>
                </div>
                <span class="ms-auto fw-700">${this.money(c.walletBalance)}</span>
              </div>
              <div class="d-flex flex-wrap gap-2">
                <a class="btn-app btn-primary-app btn-sm-app" href="order.html?child=${c.id}">${I18n.t('orderFood')}</a>
                <a class="btn-app btn-outline-app btn-sm-app" href="child-details.html?id=${c.id}">${I18n.t('view')}</a>
                <a class="btn-app btn-ghost-app btn-sm-app" href="wallet.html?child=${c.id}">${I18n.t('topUp')}</a>
              </div>
            </div>
          </div>`;
      }).join(''));
    },

    async initWallet() {
      const family = await WalletService.getFamily(this.parentId());
      const children = await ChildService.getAll(this.parentId());
      $('#familyWalletBalance').text(this.money(family.balance));
      $('#walletActivity').html((family.activity || []).map((a) => `
        <div class="d-flex justify-content-between py-2 border-bottom">
          <div><strong>${Utils.localized(a.label)}</strong><div class="small text-muted">${AppStateFormat(a.date)}</div></div>
          <span class="activity-amount ${a.amount >= 0 ? 'pos' : 'neg'}">${a.amount >= 0 ? '+' : ''}${this.money(a.amount)}</span>
        </div>`).join(''));

      $('#childWallets').html(children.map((c) => `
        <div class="wallet-card child mb-3" data-aos="fade-up">
          <div class="d-flex justify-content-between">
            <div class="label">${c.firstName}'s wallet</div>
            <a href="child-details.html?id=${c.id}" class="text-white small">${I18n.t('history')}</a>
          </div>
          <div class="balance">${this.money(c.walletBalance)}</div>
          <div class="small mb-2 opacity-75">${CanteenService.getSchoolName(c.schoolId)} · ${gradeLabel(c)}</div>
          <div class="wallet-actions">
            <button type="button" class="btn-app btn-sm-app btn-transfer" data-id="${c.id}">${I18n.t('transfer')}</button>
            <button type="button" class="btn-app btn-sm-app btn-withdraw" data-id="${c.id}">${I18n.t('withdraw')}</button>
            <button type="button" class="btn-app btn-sm-app btn-limit" data-id="${c.id}">${I18n.t('dailyLimit')}</button>
          </div>
        </div>`).join(''));

      this.bindWalletActions(family.balance);
    },

    bindWalletActions(familyBalance) {
      $('#btnTopUp, #btnTopUpHero').off('click').on('click', () => this.openTopUp());
      $(document).off('click.tx').on('click.tx', '.btn-transfer', async (e) => {
        const id = $(e.currentTarget).data('id');
        const child = await ChildService.getById(id);
        const { value: amount } = await Swal.fire({
          title: I18n.t('transfer') + ' — ' + child.firstName,
          html: `<p class="small text-muted">${I18n.t('familyWallet')}: ${this.money(familyBalance)}</p>
            <div class="d-flex gap-2 justify-content-center mb-2">
              <button type="button" class="btn-app btn-outline-app btn-sm-app swal-q" data-v="20">₪20</button>
              <button type="button" class="btn-app btn-outline-app btn-sm-app swal-q" data-v="50">₪50</button>
              <button type="button" class="btn-app btn-outline-app btn-sm-app swal-q" data-v="100">₪100</button>
            </div>`,
          input: 'number',
          inputValue: 50,
          showCancelButton: true,
          confirmButtonText: I18n.t('transfer'),
          confirmButtonColor: '#1a365d',
          didOpen: () => {
            $('.swal-q').on('click', function () {
              Swal.getInput().value = $(this).data('v');
            });
          }
        });
        if (!amount) return;
        try {
          await WalletService.transferToChild(id, amount);
          Components.showToast(I18n.t('success'), 'success');
          this.initWallet();
        } catch (err) {
          Components.showToast(err.message || 'Error', 'error');
        }
      });

      $(document).off('click.wd').on('click.wd', '.btn-withdraw', async (e) => {
        const id = $(e.currentTarget).data('id');
        const { value: amount } = await Swal.fire({
          title: I18n.t('withdraw'),
          input: 'number',
          showCancelButton: true,
          confirmButtonColor: '#1a365d'
        });
        if (!amount) return;
        try {
          await WalletService.withdrawFromChild(id, amount);
          Components.showToast(I18n.t('success'), 'success');
          this.initWallet();
        } catch (err) {
          Components.showToast(err.message || 'Error', 'error');
        }
      });

      $(document).off('click.lim').on('click.lim', '.btn-limit', async (e) => {
        const id = $(e.currentTarget).data('id');
        const child = await ChildService.getById(id);
        const { value: limit } = await Swal.fire({
          title: I18n.t('dailyLimit'),
          input: 'number',
          inputValue: child.dailyLimit || 40,
          showCancelButton: true,
          confirmButtonColor: '#1a365d'
        });
        if (limit === undefined) return;
        await ChildService.update(id, { dailyLimitEnabled: true, dailyLimit: Number(limit) });
        Components.showToast(I18n.t('success'), 'success');
      });
    },

    async openTopUp() {
      const steps = await Swal.fire({
        title: I18n.t('topUp'),
        html: `
          <div class="text-start">
            <label class="form-label-app">${I18n.t('paymentMethods')}</label>
            <div class="check-list mb-3">
              <label class="check-item"><input type="radio" name="pm" value="saved" checked> <span>Visa •••• 1234</span></label>
              <label class="check-item"><input type="radio" name="pm" value="new"> <span>New Card</span></label>
            </div>
            <label class="form-label-app">${I18n.t('balance')}</label>
            <div class="d-flex gap-2 mb-2">
              <button type="button" class="btn-app btn-outline-app btn-sm-app tu-q" data-v="50">₪50</button>
              <button type="button" class="btn-app btn-outline-app btn-sm-app tu-q" data-v="100">₪100</button>
              <button type="button" class="btn-app btn-outline-app btn-sm-app tu-q" data-v="200">₪200</button>
            </div>
            <input type="number" id="topUpAmount" class="form-control-app" value="100" min="1">
          </div>`,
        showCancelButton: true,
        confirmButtonText: I18n.t('pay'),
        confirmButtonColor: '#1a365d',
        didOpen: () => {
          $('.tu-q').on('click', function () { $('#topUpAmount').val($(this).data('v')); });
        },
        preConfirm: () => Number($('#topUpAmount').val())
      });
      if (!steps.value) return;
      await WalletService.topUp(steps.value, this.parentId());
      await Components.showSuccess(I18n.t('success'), I18n.t('familyWallet') + ' +' + this.money(steps.value));
      if ($('#familyWalletBalance').length) this.initWallet();
      if ($('#familyBalance').length) this.initHome();
    },

    async initChildren() {
      const children = await ChildService.getAll(this.parentId());
      $('#childrenList').html(children.map((c) => {
        const av = SchoolFoodSeed.avatars[c.avatarKey] || SchoolFoodSeed.avatars.sarah;
        return `
          <div class="col-md-6 col-lg-4" data-aos="fade-up">
            <a href="child-details.html?id=${c.id}" class="child-home-card d-block text-decoration-none text-reset h-100">
              <div class="d-flex gap-3 align-items-center">
                <img class="child-avatar" src="${av}" alt="">
                <div>
                  <strong>${c.firstName} ${c.lastName}</strong>
                  <div class="small text-muted">${CanteenService.getSchoolName(c.schoolId)} · ${gradeLabel(c)}</div>
                  <div class="small">${this.money(c.walletBalance)}</div>
                </div>
              </div>
            </a>
          </div>`;
      }).join(''));
      $('#btnAddChild').off('click').on('click', () => this.openAddChild());
    },

    async openAddChild() {
      const schools = CanteenService.getSchools();
      const grades = await SchoolService.getGrades('sch-1');
      const classes = await SchoolService.getClasses('sch-1');
      const { value: form } = await Swal.fire({
        title: I18n.t('addChild'),
        width: 520,
        html: `
          <div class="text-start">
            <div class="row g-2">
              <div class="col-6"><input id="cFirst" class="form-control-app" placeholder="${I18n.t('firstName')}"></div>
              <div class="col-6"><input id="cLast" class="form-control-app" placeholder="${I18n.t('lastName')}"></div>
              <div class="col-6"><input id="cDob" type="date" class="form-control-app"></div>
              <div class="col-6"><select id="cGender" class="form-select-app"><option value="female">Female</option><option value="male">Male</option></select></div>
              <div class="col-12"><select id="cSchool" class="form-select-app">${schools.map((s) => `<option value="${s.id}">${Utils.localized(s.name)}</option>`).join('')}</select></div>
              <div class="col-6"><select id="cGrade" class="form-select-app">${grades.map((g) => `<option value="${g.id}">${Utils.localized(g.name)}</option>`).join('')}</select></div>
              <div class="col-6"><select id="cClass" class="form-select-app">${classes.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
              <div class="col-12"><input id="cCode" class="form-control-app" placeholder="${I18n.t('studentId')}"></div>
              <div class="col-12"><input id="cLimit" type="number" class="form-control-app" placeholder="${I18n.t('dailyLimit')}" value="40"></div>
            </div>
          </div>`,
        showCancelButton: true,
        confirmButtonText: I18n.t('save'),
        confirmButtonColor: '#1a365d',
        preConfirm: () => ({
          firstName: $('#cFirst').val().trim(),
          lastName: $('#cLast').val().trim(),
          dob: $('#cDob').val(),
          gender: $('#cGender').val(),
          schoolId: $('#cSchool').val(),
          gradeId: $('#cGrade').val(),
          classId: $('#cClass').val(),
          studentCode: $('#cCode').val().trim(),
          dailyLimit: Number($('#cLimit').val()) || 40,
          dailyLimitEnabled: true,
          canteenId: 'can-1',
          parentId: this.parentId()
        })
      });
      if (!form || !form.firstName) return;
      await ChildService.create(form);
      Components.showToast(I18n.t('success'), 'success');
      this.initChildren();
    },

    async initChildDetails() {
      const id = Components.getQueryParam('id') || 'child-1';
      const child = await ChildService.getById(id);
      if (!child) return;
      const av = SchoolFoodSeed.avatars[child.avatarKey] || SchoolFoodSeed.avatars.sarah;
      $('#childName').text(child.firstName + ' ' + child.lastName);
      $('#childMeta').text(`${CanteenService.getSchoolName(child.schoolId)} · ${gradeLabel(child)}`);
      $('#childAvatar').attr('src', av);
      $('#childWalletBal').text(this.money(child.walletBalance));
      $('#toggleAppOrder').prop('checked', !!child.canOrderApp);
      $('#toggleCanteenOrder').prop('checked', !!child.canOrderCanteen);
      $(`input[name="foodMode"][value="${child.foodControlMode || 'all'}"]`).prop('checked', true);

      const menus = await MenuService.getForCanteen(child.canteenId);
      const menu = menus[0];
      const products = [];
      if (menu) {
        (menu.sections || []).forEach((sec) => {
          (sec.items || []).forEach((item) => {
            const p = SchoolFoodSeed.products.find((x) => x.id === item.productId) ||
              (Storage.get('products') || []).find((x) => x.id === item.productId);
            if (p) products.push({ product: p, section: sec });
          });
        });
      }

      const renderFoodList = () => {
        const mode = $('input[name="foodMode"]:checked').val();
        $('#foodControlList').html(products.map(({ product, section }) => {
          let checked = false;
          if (mode === 'block') checked = (child.blockedProductIds || []).includes(product.id);
          if (mode === 'allow') checked = (child.allowedProductIds || []).includes(product.id);
          return `
            <label class="check-item">
              <input type="checkbox" class="food-ctrl-item" value="${product.id}" ${checked ? 'checked' : ''} ${mode === 'all' ? 'disabled' : ''}>
              <span>${Utils.localized(product.name)} <small class="text-muted">(${Utils.localized(section.name)})</small></span>
            </label>`;
        }).join('') || '<p class="text-muted">No menu items</p>');
      };
      renderFoodList();
      $('input[name="foodMode"]').on('change', renderFoodList);

      $('#btnSaveChildControls').on('click', async () => {
        const mode = $('input[name="foodMode"]:checked').val();
        const selected = [];
        $('.food-ctrl-item:checked').each(function () { selected.push($(this).val()); });
        await ChildService.update(id, {
          canOrderApp: $('#toggleAppOrder').is(':checked'),
          canOrderCanteen: $('#toggleCanteenOrder').is(':checked'),
          foodControlMode: mode,
          blockedProductIds: mode === 'block' ? selected : [],
          allowedProductIds: mode === 'allow' ? selected : []
        });
        Components.showToast(I18n.t('success'), 'success');
      });

      $('#btnChildTransfer').on('click', () => {
        window.location.href = 'wallet.html?child=' + id;
      });
    },

    async initOrder() {
      const children = await ChildService.getAll(this.parentId());
      const qChild = Components.getQueryParam('child');
      this.selectedChildId = qChild || (children[0] && children[0].id);
      this.orderDate = new Date().toISOString().slice(0, 10);
      this.tray = [];

      const family = await WalletService.getFamily(this.parentId());
      $('#orderFamilyBal').text(this.money(family.balance));

      $('#orderChildSelect').html(children.map((c) =>
        `<option value="${c.id}" ${c.id === this.selectedChildId ? 'selected' : ''}>${c.firstName} ${c.lastName} — ${gradeLabel(c)}</option>`
      ).join(''));

      $('#orderDateSelect').val('today');
      this.bindOrderUI();
      await this.renderOrderMenu();
    },

    bindOrderUI() {
      $('#orderChildSelect').on('change', async () => {
        this.selectedChildId = $('#orderChildSelect').val();
        this.tray = [];
        await this.renderOrderMenu();
        this.renderTray();
      });
      $('#orderDateSelect').on('change', () => {
        const v = $('#orderDateSelect').val();
        const d = new Date();
        if (v === 'tomorrow') d.setDate(d.getDate() + 1);
        this.orderDate = d.toISOString().slice(0, 10);
      });
      $('#btnPlaceOrder').on('click', () => this.placeOrder());
    },

    async renderOrderMenu() {
      const child = await ChildService.getById(this.selectedChildId);
      if (!child) return;
      $('.app-content').addClass('has-tray');
      const menus = await MenuService.getForCanteen(child.canteenId);
      const menu = (menus || []).find((m) => m.status === 'active') || menus[0];
      const $wrap = $('#orderMenuSections');
      if (!menu) {
        $wrap.html(Components.renderEmptyState('bi-journal', I18n.t('noMenus'), ''));
        return;
      }

      const products = Storage.get('products') || SchoolFoodSeed.products;
      $wrap.html((menu.sections || []).map((sec) => `
        <div class="card-app mb-3" data-aos="fade-up">
          <div class="card-app-header"><h3>${Utils.localized(sec.name)}</h3></div>
          <div class="card-app-body p-2">
            ${(sec.items || []).map((item) => {
              const product = products.find((p) => p.id === item.productId);
              if (!product) return '';
              const allowed = ChildService.isProductAllowed(child, product.id);
              const available = item.available !== false;
              let state = '';
              let badge = '';
              if (!available) { state = 'is-unavailable'; badge = `<span class="badge-app badge-neutral">${I18n.t('notAvailableToday')}</span>`; }
              else if (!allowed) { state = 'is-blocked'; badge = `<span class="badge-app badge-danger">🚫 ${I18n.t('restricted')}</span>`; }
              const qty = (this.tray.find((t) => t.productId === product.id) || {}).qty || 0;
              return `
                <div class="menu-order-item ${state}" data-pid="${product.id}" data-price="${item.menuPrice}">
                  <img src="${product.image}" alt="${Utils.localized(product.name)}" loading="lazy">
                  <div class="flex-grow-1">
                    <strong>${Utils.localized(product.name)}</strong>
                    <div class="small text-muted">${Utils.localized(product.description)}</div>
                    <div class="food-card-price">${this.money(item.menuPrice)}</div>
                    ${badge}
                  </div>
                  <div class="qty-control">
                    ${available && allowed ? `
                      ${qty ? `<button type="button" class="btn-qty-minus" data-pid="${product.id}">−</button><span>${qty}</span>` : ''}
                      <button type="button" class="btn-app btn-primary-app btn-sm-app btn-qty-plus"
                        data-pid="${product.id}" data-price="${item.menuPrice}"
                        data-name-en="${(product.name && product.name.en) || ''}"
                        data-name-ar="${(product.name && product.name.ar) || ''}"
                        data-img="${product.image}">+</button>` : ''}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`).join(''));

      $wrap.off('click.qty').on('click.qty', '.btn-qty-plus', (e) => {
        const $b = $(e.currentTarget);
        this.addToTray({
          productId: $b.data('pid'),
          price: Number($b.data('price')),
          name: { en: $b.data('name-en'), ar: $b.data('name-ar') },
          image: $b.data('img')
        });
      });
      $wrap.on('click.qty', '.btn-qty-minus', (e) => {
        this.removeFromTray($(e.currentTarget).data('pid'));
      });
    },

    addToTray(item) {
      const existing = this.tray.find((t) => t.productId === item.productId);
      if (existing) existing.qty += 1;
      else this.tray.push({ ...item, qty: 1 });
      this.renderOrderMenu();
      this.renderTray();
    },

    removeFromTray(productId) {
      const existing = this.tray.find((t) => t.productId === productId);
      if (!existing) return;
      existing.qty -= 1;
      if (existing.qty <= 0) this.tray = this.tray.filter((t) => t.productId !== productId);
      this.renderOrderMenu();
      this.renderTray();
    },

    renderTray() {
      const total = this.tray.reduce((s, t) => s + t.price * t.qty, 0);
      $('#trayItems').html(this.tray.map((t) => `
        <div class="d-flex justify-content-between small py-1">
          <span>${Utils.localized(t.name)} × ${t.qty}</span>
          <strong>${this.money(t.price * t.qty)}</strong>
        </div>`).join('') || `<p class="text-muted small mb-0">${I18n.t('tray')}</p>`);
      $('#trayTotal').text(this.money(total));
      $('#btnPlaceOrder').prop('disabled', !this.tray.length);
    },

    async placeOrder() {
      if (!this.tray.length) return;
      const child = await ChildService.getById(this.selectedChildId);
      const total = this.tray.reduce((s, t) => s + t.price * t.qty, 0);
      try {
        await WalletService.chargeChild(child.id, total);
        const cls = await SchoolService.getClasses(child.schoolId);
        const classObj = cls.find((c) => c.id === child.classId);
        const isFuture = this.orderDate > new Date().toISOString().slice(0, 10);
        await OrderService.create({
          studentName: child.firstName + ' ' + child.lastName,
          childId: child.id,
          parentId: this.parentId(),
          classroom: classObj ? 'Grade ' + classObj.name : gradeLabel(child),
          canteenId: child.canteenId,
          orderDate: this.orderDate,
          orderTime: new Date().toISOString(),
          status: isFuture ? 'upcoming' : 'new',
          total,
          items: this.tray.map((t) => ({
            productId: t.productId,
            name: t.name,
            qty: t.qty,
            price: t.price,
            image: t.image
          }))
        });
        this.tray = [];
        await Components.showSuccess(I18n.t('success'), I18n.t('placeOrder'));
        window.location.href = 'orders.html';
      } catch (err) {
        Components.showToast(err.message === 'Daily spending limit reached' ? I18n.t('limitReached') : (err.message || 'Error'), 'error');
      }
    },

    async initOrders() {
      const orders = await OrderService.getByParent(this.parentId());
      const render = (list) => {
        $('#parentOrders').html(list.map((o) => `
          <a href="../canteen-manager/order-details.html?id=${o.id}" class="order-card text-decoration-none text-reset">
            <div class="order-card-main">
              <div class="order-number">#${o.orderNumber}</div>
              <div class="order-student"><strong>${o.studentName}</strong><span>${o.classroom}</span></div>
              <div class="order-meta-item"><strong>${I18n.t('total')}</strong>${this.money(o.total)}</div>
              ${Components.renderStatusBadge(o.status)}
            </div>
          </a>`).join('') || Components.renderEmptyState('bi-bag', I18n.t('noOrders'), ''));
      };
      const filter = (tab) => {
        if (tab === 'upcoming') return orders.filter((o) => o.status === 'upcoming' || o.status === 'new' || o.status === 'preparing' || o.status === 'ready');
        if (tab === 'past') return orders.filter((o) => o.status === 'completed');
        if (tab === 'cancelled') return orders.filter((o) => o.status === 'cancelled');
        return orders;
      };
      render(filter('upcoming'));
      $('.order-tabs .tab-btn').on('click', function () {
        $('.order-tabs .tab-btn').removeClass('active');
        $(this).addClass('active');
        render(filter($(this).data('tab')));
      });
    },

    async initCalendar() {
      const orders = await OrderService.getByParent(this.parentId());
      const byDate = {};
      orders.forEach((o) => {
        const d = (o.orderDate || (o.orderTime || '').slice(0, 10));
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
        const cls = list.length ? 'has-order' : '';
        html += `<div class="calendar-day ${cls}" data-date="${iso}">
          <strong>${d}</strong>
          ${list.length ? `<div class="small">${list[0].studentName.split(' ')[0]} ✓</div>` : ''}
        </div>`;
      }
      $('#calendarGrid').html(html);
      $('#calendarGrid').on('click', '.calendar-day', function () {
        const date = $(this).data('date');
        const list = byDate[date] || [];
        if (list.length) {
          window.location.href = '../canteen-manager/order-details.html?id=' + list[0].id;
        } else {
          window.location.href = 'order.html';
        }
      });
    },

    async initSettings() {
      const settings = Storage.get('settings') || SchoolFoodSeed.settings;
      const p = settings.parent || SchoolFoodSeed.settings.parent;
      $('#setFirst').val(p.profile.firstName);
      $('#setLast').val(p.profile.lastName);
      $('#setEmail').val(p.profile.email);
      $('#setPhone').val(p.profile.phone);
      Object.keys(p.notifications || {}).forEach((k) => {
        $(`#notif-${k}`).prop('checked', !!p.notifications[k]);
      });
      const pms = await WalletService.getPaymentMethods(this.parentId());
      $('#paymentList').html(pms.map((pm) => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
          <span>${pm.brand} ending in ${pm.last4}</span>
          <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-rm-pm" data-id="${pm.id}">${I18n.t('delete')}</button>
        </div>`).join(''));

      $('#btnSaveParentSettings').on('click', () => {
        settings.parent = settings.parent || {};
        settings.parent.profile = {
          firstName: $('#setFirst').val(),
          lastName: $('#setLast').val(),
          email: $('#setEmail').val(),
          phone: $('#setPhone').val()
        };
        settings.parent.notifications = {
          orderConfirmation: $('#notif-orderConfirmation').is(':checked'),
          orderStatus: $('#notif-orderStatus').is(':checked'),
          cancellation: $('#notif-cancellation').is(':checked'),
          deadlineReminder: $('#notif-deadlineReminder').is(':checked'),
          lowBalance: $('#notif-lowBalance').is(':checked'),
          dailyLimitReached: $('#notif-dailyLimitReached').is(':checked')
        };
        Storage.set('settings', settings);
        Components.showToast(I18n.t('success'), 'success');
      });

      $(document).on('click', '.btn-rm-pm', async function () {
        await WalletService.removePaymentMethod($(this).data('id'));
        ParentApp.initSettings();
      });
    }
  };

  function gradeLabel(child) {
    const grades = Storage.get('grades') || SchoolFoodSeed.grades;
    const classes = Storage.get('classes') || SchoolFoodSeed.classes;
    const g = grades.find((x) => x.id === child.gradeId);
    const c = classes.find((x) => x.id === child.classId);
    return (g ? Utils.localized(g.name) : '') + (c ? ' ' + c.name : '');
  }

  function AppStateFormat(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString();
    } catch (e) { return iso; }
  }

  global.ParentApp = ParentApp;
})(window, jQuery);
