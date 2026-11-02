/**
 * Parent role — home, wallet, children, order food, calendar, settings.
 */
(function (global, $) {
  'use strict';

  const ParentApp = {
    parentId() {
      if (typeof Session !== 'undefined' && Session.profile() && Session.profile().parentId) {
        return Session.profile().parentId;
      }
      return APP_CONFIG.roles.parent.id;
    },
    tray: [],
    selectedChildId: null,
    orderDate: null,

    money(n) { return (APP_CONFIG.currency || '₪') + Number(n || 0).toFixed(0); },

    async initHome() {
      const children = await ChildService.getAll(this.parentId());
      const family = await WalletService.getFamily(this.parentId());
      const balHtml = Utils.moneyHtml(family.balance);
      $('#familyBalance').html(balHtml);
      $('#familyBalanceSide').html(balHtml);
      $('#statChildrenCount').text(children.length);

      let activeOrders = 0;
      try {
        const orders = await OrderService.getByParent(this.parentId());
        activeOrders = (orders || []).filter((o) =>
          ['upcoming', 'new', 'preparing', 'ready'].includes(o.status)
        ).length;
      } catch (e) { /* ignore */ }
      $('#statActiveOrders').text(activeOrders);

      $('#activityList').html((family.activity || []).slice(0, 6).map((a) => `
        <div class="parent-activity-row">
          <div>
            <strong>${Utils.localized(a.label)}</strong>
            <div class="small text-muted">${AppStateFormat(a.date)}</div>
          </div>
          <span class="activity-amount ${a.amount >= 0 ? 'pos' : 'neg'}">${a.amount >= 0 ? '+' : ''}${Utils.moneyHtml(a.amount)}</span>
        </div>`).join('') || `<p class="text-muted mb-0">${I18n.t('noOrders')}</p>`);

      $('#childrenHome').html(children.map((c) => {
        const school = CanteenService.getSchoolName(c.schoolId);
        const av = (SchoolFoodSeed.avatars || {})[c.avatarKey] || (SchoolFoodSeed.avatars || {}).sarah;
        return `
          <article class="child-home-card">
            <div class="child-home-card-top">
              <img class="child-avatar" src="${av}" alt="">
              <div class="child-home-card-meta">
                <strong>${c.firstName} ${c.lastName}</strong>
                <span>${school} · ${c.classroom || gradeLabel(c)}</span>
              </div>
              <div class="child-home-card-bal">${Utils.moneyHtml(c.walletBalance)}</div>
            </div>
            <div class="child-home-card-actions">
              <a class="btn-app btn-primary-app btn-sm-app" href="order.html?child=${c.id}">${I18n.t('orderFood')}</a>
              <a class="btn-app btn-outline-app btn-sm-app" href="child-details.html?id=${c.id}">${I18n.t('view')}</a>
              <a class="btn-app btn-ghost-app btn-sm-app" href="wallet.html?child=${c.id}">${I18n.t('topUp')}</a>
            </div>
          </article>`;
      }).join('') || `<p class="text-muted mb-0">${I18n.t('myChildren')}</p>`);

      $('#btnTopUp, #btnTopUpHero, #btnTopUpSide').off('click.homeTopUp').on('click.homeTopUp', () => this.openTopUp());
    },

    async initWallet() {
      const family = await WalletService.getFamily(this.parentId());
      const children = await ChildService.getAll(this.parentId());
      $('#familyWalletBalance').html(Utils.moneyHtml(family.balance));
      $('#walletActivity').html((family.activity || []).map((a) => `
        <div class="parent-activity-row">
          <div><strong>${Utils.localized(a.label)}</strong><div class="small text-muted">${AppStateFormat(a.date)}</div></div>
          <span class="activity-amount ${a.amount >= 0 ? 'pos' : 'neg'}">${a.amount >= 0 ? '+' : ''}${Utils.moneyHtml(a.amount)}</span>
        </div>`).join('') || `<p class="text-muted mb-0">${I18n.t('noOrders')}</p>`);

      $('#childWallets').html(children.map((c) => `
        <article class="child-home-card child-wallet-tile">
          <div class="child-home-card-top">
            <div class="child-home-card-meta">
              <strong>${c.firstName}'s wallet</strong>
              <span>${CanteenService.getSchoolName(c.schoolId)} · ${gradeLabel(c)}</span>
            </div>
            <div class="child-home-card-bal">${Utils.moneyHtml(c.walletBalance)}</div>
          </div>
          <div class="child-home-card-actions">
            <button type="button" class="btn-app btn-primary-app btn-sm-app btn-transfer" data-id="${c.id}">${I18n.t('transfer')}</button>
            <button type="button" class="btn-app btn-outline-app btn-sm-app btn-withdraw" data-id="${c.id}">${I18n.t('withdraw')}</button>
            <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-limit" data-id="${c.id}">${I18n.t('dailyLimit')}</button>
            <a href="child-details.html?id=${c.id}" class="btn-app btn-ghost-app btn-sm-app">${I18n.t('view')}</a>
          </div>
        </article>`).join(''));

      this.bindWalletActions(family.balance);
    },

    bindWalletActions(familyBalance) {
      $('#btnTopUp, #btnTopUpHero, #btnTopUpSide').off('click').on('click', () => this.openTopUp());
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
      const family = await WalletService.getFamily(this.parentId());
      const pocket = children.reduce((s, c) => s + Number(c.walletBalance || 0), 0);
      $('#childrenCountStat').text(children.length);
      $('#childrenWalletStat').html(Utils.moneyHtml(family.balance));
      $('#childrenPocketStat').html(Utils.moneyHtml(pocket));

      $('#childrenList').html(children.map((c) => {
        const av = (SchoolFoodSeed.avatars || {})[c.avatarKey] || (SchoolFoodSeed.avatars || {}).sarah;
        return `
          <article class="child-home-card child-list-card">
            <div class="child-home-card-top">
              <img class="child-avatar" src="${av}" alt="">
              <div class="child-home-card-meta">
                <strong>${c.firstName} ${c.lastName}</strong>
                <span>${CanteenService.getSchoolName(c.schoolId)} · ${gradeLabel(c)}</span>
              </div>
              <div class="child-home-card-bal">${Utils.moneyHtml(c.walletBalance)}</div>
            </div>
            <div class="child-home-card-actions">
              <a class="btn-app btn-primary-app btn-sm-app" href="order.html?child=${c.id}">${I18n.t('orderFood')}</a>
              <a class="btn-app btn-outline-app btn-sm-app" href="child-details.html?id=${c.id}">${I18n.t('view')}</a>
              <a class="btn-app btn-ghost-app btn-sm-app" href="wallet.html?child=${c.id}">${I18n.t('wallet')}</a>
            </div>
          </article>`;
      }).join('') || Components.renderEmptyState('bi-people', I18n.t('myChildren'), I18n.t('addChild')));
      $('#btnAddChild').off('click').on('click', () => this.openAddChild());
    },

    initSwalSelect2(selectors) {
      if (typeof Forms === 'undefined') return;
      const $parent = $('.swal2-popup');
      (selectors || []).forEach((sel) => {
        Forms.initSelect2($(sel), {
          dropdownParent: $parent,
          width: '100%',
          minimumResultsForSearch: Infinity,
          dropdownCssClass: 'swal-select2-dropdown'
        });
      });
    },

    async openAddChild() {
      const schools = CanteenService.getSchools();
      const grades = await SchoolService.getGrades('sch-1');
      const classes = await SchoolService.getClasses('sch-1');
      const { value: form } = await Swal.fire({
        title: I18n.t('addChild'),
        width: 560,
        html: `
          <div class="text-start add-child-form">
            <div class="row g-2">
              <div class="col-6"><label class="form-label-app">${I18n.t('firstName')}</label><input id="cFirst" class="form-control-app"></div>
              <div class="col-6"><label class="form-label-app">${I18n.t('lastName')}</label><input id="cLast" class="form-control-app"></div>
              <div class="col-6"><label class="form-label-app">DOB</label><input id="cDob" type="date" class="form-control-app"></div>
              <div class="col-6"><label class="form-label-app">Gender</label><select id="cGender" class="select2-field"><option value="female">Female</option><option value="male">Male</option></select></div>
              <div class="col-12"><label class="form-label-app">${I18n.t('school')}</label><select id="cSchool" class="select2-field">${schools.map((s) => `<option value="${s.id}">${Utils.localized(s.name)}</option>`).join('')}</select></div>
              <div class="col-6"><label class="form-label-app">${I18n.t('grade')}</label><select id="cGrade" class="select2-field">${grades.map((g) => `<option value="${g.id}">${Utils.localized(g.name)}</option>`).join('')}</select></div>
              <div class="col-6"><label class="form-label-app">${I18n.t('class')}</label><select id="cClass" class="select2-field">${classes.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
              <div class="col-12"><label class="form-label-app">${I18n.t('studentId')}</label><input id="cCode" class="form-control-app"></div>
              <div class="col-12"><label class="form-label-app">${I18n.t('dailyLimit')}</label><input id="cLimit" type="number" class="form-control-app" value="40"></div>
            </div>
          </div>`,
        showCancelButton: true,
        confirmButtonText: I18n.t('save'),
        confirmButtonColor: '#314D63',
        didOpen: () => this.initSwalSelect2(['#cGender', '#cSchool', '#cGrade', '#cClass']),
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
      const av = (SchoolFoodSeed.avatars || {})[child.avatarKey] || (SchoolFoodSeed.avatars || {}).sarah;
      const fullName = child.firstName + ' ' + child.lastName;
      $('#childName').text(fullName);
      $('#childCrumb').text(fullName);
      $('#childMeta').text(`${CanteenService.getSchoolName(child.schoolId)} · ${gradeLabel(child)}`);
      $('#childAvatar').attr('src', av);
      $('#profSchool').text(CanteenService.getSchoolName(child.schoolId));
      $('#profGrade').text(gradeLabel(child));
      $('#profClass').text(child.className || child.classId || '—');
      $('#profStudentId').text(child.studentId || child.id);
      $('#childWalletBal').html(Utils.moneyHtml(child.walletBalance));
      $('#toggleAppOrder').prop('checked', !!child.canOrderApp);
      $('#toggleCanteenOrder').prop('checked', !!child.canOrderCanteen);

      const mode = child.foodControlMode || 'all';
      if ($('#foodModeSelect').length) {
        $('#foodModeSelect').val(mode);
        if (typeof Forms !== 'undefined') {
          Forms.initSelect2($('#foodModeSelect'), {
            width: '100%',
            minimumResultsForSearch: Infinity
          });
        }
      }

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

      const getMode = () => ($('#foodModeSelect').length ? $('#foodModeSelect').val() : $('input[name="foodMode"]:checked').val()) || 'all';

      const renderFoodList = () => {
        const currentMode = getMode();
        $('#foodControlList').html(products.map(({ product, section }) => {
          let checked = false;
          if (currentMode === 'block') checked = (child.blockedProductIds || []).includes(product.id);
          if (currentMode === 'allow') checked = (child.allowedProductIds || []).includes(product.id);
          return `
            <label class="check-item">
              <input type="checkbox" class="food-ctrl-item" value="${product.id}" ${checked ? 'checked' : ''} ${currentMode === 'all' ? 'disabled' : ''}>
              <span>${Utils.localized(product.name)} <small class="text-muted">(${Utils.localized(section.name)})</small></span>
            </label>`;
        }).join('') || '<p class="text-muted mb-0">No menu items</p>');
      };
      renderFoodList();
      $('#foodModeSelect').off('change.foodMode').on('change.foodMode', renderFoodList);
      $('input[name="foodMode"]').off('change.foodMode').on('change.foodMode', renderFoodList);

      const orders = await OrderService.getByChild(id);
      $('#childOrderHistory').html(orders.length
        ? orders.map((o) => `
            <div class="order-card mb-2">
              <div class="order-card-main">
                <div class="order-number">#${o.orderNumber}</div>
                <div class="order-student"><strong>${o.orderDate || (o.orderTime || '').slice(0, 10)}</strong><span>${(o.items || []).length} items</span></div>
                <div class="order-meta-item"><strong>${I18n.t('total')}</strong>${Utils.moneyHtml(o.total)}</div>
                ${Components.renderStatusBadge(o.status)}
              </div>
            </div>`).join('')
        : Components.renderEmptyState('bi-receipt', I18n.t('noOrders'), ''));

      $('#btnSaveChildControls').off('click').on('click', async () => {
        const currentMode = getMode();
        const selected = [];
        $('.food-ctrl-item:checked').each(function () { selected.push($(this).val()); });
        await ChildService.update(id, {
          canOrderApp: $('#toggleAppOrder').is(':checked'),
          canOrderCanteen: $('#toggleCanteenOrder').is(':checked'),
          foodControlMode: currentMode,
          blockedProductIds: currentMode === 'block' ? selected : [],
          allowedProductIds: currentMode === 'allow' ? selected : []
        });
        Components.showToast(I18n.t('success'), 'success');
      });

      $('#btnChildTransfer').off('click').on('click', () => {
        window.location.href = 'wallet.html?child=' + id;
      });

      $('#btnChildDailyLimit').off('click').on('click', async () => {
        const { value: amount } = await Swal.fire({
          title: I18n.t('dailyLimit') || 'Daily limit',
          input: 'number',
          inputValue: child.dailyLimit || 0,
          showCancelButton: true,
          confirmButtonColor: '#314D63',
          confirmButtonText: I18n.t('save')
        });
        if (amount === undefined) return;
        await ChildService.update(id, { dailyLimit: Number(amount) || 0, hasDailyLimit: Number(amount) > 0 });
        Components.showToast(I18n.t('success'), 'success');
      });
    },

    async initOrder() {
      const children = await ChildService.getAll(this.parentId());
      const qChild = Components.getQueryParam('child');
      this.selectedChildId = qChild || (children[0] && children[0].id);
      this.orderDate = new Date().toISOString().slice(0, 10);
      this.tray = [];
      this.activeCategory = 'all';
      this.orderSearch = '';
      this._menuCache = null;

      const family = await WalletService.getFamily(this.parentId());
      $('#orderFamilyBal').html(Utils.moneyHtml(family.balance));

      const $childSelect = $('#orderChildSelect');
      $childSelect.html(children.map((c) =>
        `<option value="${c.id}" ${c.id === this.selectedChildId ? 'selected' : ''}>${c.firstName} ${c.lastName}</option>`
      ).join(''));
      if (typeof Forms !== 'undefined') {
        Forms.initSelect2($childSelect, {
          width: '100%',
          minimumResultsForSearch: Infinity,
          dropdownParent: $childSelect.closest('.order-child-chip'),
          dropdownCssClass: 'order-child-select2-dropdown'
        });
      }

      this.renderDateStrip();
      await this.syncChildAvatar();
      this.bindOrderUI();
      this.bindSlideConfirm();
      await this.renderOrderMenu();
      this.renderTray();
    },

    async syncChildAvatar() {
      const child = await ChildService.getById(this.selectedChildId);
      if (!child) return;
      const av = (SchoolFoodSeed.avatars || {})[child.avatarKey] || (SchoolFoodSeed.avatars || {}).sarah;
      $('#orderChildAvatar').attr('src', av || '');
    },

    renderDateStrip() {
      const days = [];
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        const dow = d.toLocaleDateString(I18n.lang === 'ar' ? 'ar' : 'en', { weekday: 'short' });
        days.push({ iso, dow, dom: d.getDate() });
      }
      $('#orderDateStrip').html(days.map((d) => `
        <button type="button" class="order-date-chip ${d.iso === this.orderDate ? 'active' : ''}" data-date="${d.iso}" role="option">
          <span class="dow">${d.dow}</span>
          <span class="dom">${d.dom}</span>
        </button>`).join(''));
    },

    bindOrderUI() {
      $('#orderChildSelect').off('change.orderChild').on('change.orderChild', async () => {
        this.selectedChildId = $('#orderChildSelect').val();
        this.tray = [];
        this.activeCategory = 'all';
        this.resetSlide();
        await this.syncChildAvatar();
        await this.renderOrderMenu();
        this.renderTray();
      });

      $('#orderDateStrip').off('click.orderDate').on('click.orderDate', '.order-date-chip', (e) => {
        e.preventDefault();
        this.orderDate = String($(e.currentTarget).data('date'));
        this.renderDateStrip();
        // blur so browser/Bootstrap blue focus does not stick
        if (e.currentTarget && e.currentTarget.blur) e.currentTarget.blur();
      });

      $('#orderSearch').on('input', Utils.debounce(() => {
        this.orderSearch = ($('#orderSearch').val() || '').toLowerCase().trim();
        this.renderFoodGrid();
      }, 200));

      $('#orderCategories').on('click', '.category-pill', (e) => {
        this.activeCategory = String($(e.currentTarget).data('cat'));
        $('#orderCategories .category-pill').removeClass('active');
        $(e.currentTarget).addClass('active');
        this.renderFoodGrid();
      });

      $('#btnResetTray').on('click', () => {
        this.tray = [];
        this.renderOrderMenu();
        this.renderTray();
        this.resetSlide();
      });

      $('#btnPlaceOrder').on('click', () => this.placeOrder());

      $('#orderMenuSections').off('click.qty').on('click.qty', '.btn-qty-plus, .add-btn', (e) => {
        e.preventDefault();
        const $b = $(e.currentTarget);
        this.addToTray({
          productId: $b.data('pid'),
          price: Number($b.data('price')),
          name: { en: $b.data('name-en'), ar: $b.data('name-ar') },
          image: $b.data('img')
        });
      });
      $('#orderMenuSections').on('click.qty', '.btn-qty-minus', (e) => {
        e.preventDefault();
        this.removeFromTray($(e.currentTarget).data('pid'));
      });
    },

    bindSlideConfirm() {
      const knob = document.getElementById('slideKnob');
      const track = document.getElementById('slideConfirm');
      if (!knob || !track) return;
      let dragging = false;
      let startX = 0;
      let startLeft = 0;
      const rtl = document.documentElement.dir === 'rtl';

      const maxX = () => Math.max(0, track.clientWidth - knob.offsetWidth - 8);

      const onMove = (clientX) => {
        if (!dragging) return;
        const dx = clientX - startX;
        let left = startLeft + (rtl ? -dx : dx);
        left = Math.max(0, Math.min(maxX(), left));
        knob.style.left = rtl ? 'auto' : left + 'px';
        if (rtl) knob.style.right = left + 'px';
        if (left >= maxX() * 0.92) {
          dragging = false;
          this.resetSlide();
          this.placeOrder();
        }
      };

      const end = () => {
        if (!dragging) return;
        dragging = false;
        const left = parseFloat(rtl ? (knob.style.right || 0) : (knob.style.left || 0)) || 0;
        if (left < maxX() * 0.92) this.resetSlide();
      };

      knob.addEventListener('pointerdown', (e) => {
        if (track.classList.contains('is-disabled')) return;
        dragging = true;
        startX = e.clientX;
        startLeft = parseFloat(rtl ? (knob.style.right || 4) : (knob.style.left || 4)) || 4;
        knob.setPointerCapture(e.pointerId);
      });
      knob.addEventListener('pointermove', (e) => onMove(e.clientX));
      knob.addEventListener('pointerup', end);
      knob.addEventListener('pointercancel', end);
    },

    resetSlide() {
      const knob = document.getElementById('slideKnob');
      if (!knob) return;
      if (document.documentElement.dir === 'rtl') {
        knob.style.right = '4px';
        knob.style.left = 'auto';
      } else {
        knob.style.left = '4px';
        knob.style.right = 'auto';
      }
    },

    async renderOrderMenu() {
      const child = await ChildService.getById(this.selectedChildId);
      if (!child) return;
      $('.app-content').addClass('has-tray');
      const menus = await MenuService.getForCanteen(child.canteenId);
      const menu = (menus || []).find((m) => m.status === 'active') || menus[0];
      if (!menu) {
        $('#orderMenuSections').html(Components.renderEmptyState('bi-journal', I18n.t('noMenus'), ''));
        $('#orderCategories').empty();
        return;
      }

      const products = Storage.get('products') || SchoolFoodSeed.products;
      const flat = [];
      (menu.sections || []).forEach((sec) => {
        (sec.items || []).forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return;
          flat.push({ sectionId: sec.id, sectionName: sec.name, item, product });
        });
      });
      this._menuCache = { child, flat, sections: menu.sections || [] };

      const cats = [{ id: 'all', name: I18n.t('all') || 'All' }].concat(
        (menu.sections || []).map((s) => ({ id: s.id, name: Utils.localized(s.name) }))
      );
      $('#orderCategories').html(cats.map((c) => `
        <button type="button" class="category-pill ${this.activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${c.name}</button>
      `).join(''));

      this.renderFoodGrid();
    },

    renderFoodGrid() {
      if (!this._menuCache) return;
      const { child, flat } = this._menuCache;
      let list = flat.slice();
      if (this.activeCategory && this.activeCategory !== 'all') {
        list = list.filter((row) => row.sectionId === this.activeCategory);
      }
      if (this.orderSearch) {
        list = list.filter((row) => {
          const n = Utils.localized(row.product.name).toLowerCase();
          const d = Utils.localized(row.product.description || {}).toLowerCase();
          return n.includes(this.orderSearch) || d.includes(this.orderSearch);
        });
      }

      $('#orderMenuSections').html(list.map(({ item, product }) => {
        const allowed = ChildService.isProductAllowed(child, product.id);
        const available = item.available !== false;
        let state = '';
        let badge = '';
        if (!available) {
          state = 'is-unavailable';
          badge = `<div class="badge-mini text-muted">${I18n.t('notAvailableToday')}</div>`;
        } else if (!allowed) {
          state = 'is-blocked';
          badge = `<div class="badge-mini text-danger">${I18n.t('restricted')}</div>`;
        }
        const qty = (this.tray.find((t) => t.productId === product.id) || {}).qty || 0;
        const controls = (available && allowed)
          ? (qty
            ? `<div class="qty-pill">
                 <button type="button" class="btn-qty-minus" data-pid="${product.id}">−</button>
                 <span>${qty}</span>
                 <button type="button" class="btn-qty-plus" data-pid="${product.id}" data-price="${item.menuPrice}"
                   data-name-en="${(product.name && product.name.en) || ''}"
                   data-name-ar="${(product.name && product.name.ar) || ''}"
                   data-img="${product.image}">+</button>
               </div>`
            : `<button type="button" class="add-btn" data-pid="${product.id}" data-price="${item.menuPrice}"
                 data-name-en="${(product.name && product.name.en) || ''}"
                 data-name-ar="${(product.name && product.name.ar) || ''}"
                 data-img="${product.image}" aria-label="Add">+</button>`)
          : '';
        return `
          <article class="bento-food-card ${state}">
            ${controls}
            <img src="${product.image}" alt="${Utils.localized(product.name)}" loading="lazy">
            <h4>${Utils.localized(product.name)}</h4>
            <div class="price">${Utils.moneyHtml(item.menuPrice)}</div>
            ${badge}
          </article>`;
      }).join('') || Components.renderEmptyState('bi-search', I18n.t('noProducts') || 'No items', ''));
    },

    addToTray(item) {
      const existing = this.tray.find((t) => t.productId === item.productId);
      if (existing) existing.qty += 1;
      else this.tray.push({ ...item, qty: 1 });
      this.renderFoodGrid();
      this.renderTray();
    },

    removeFromTray(productId) {
      const existing = this.tray.find((t) => t.productId === productId);
      if (!existing) return;
      existing.qty -= 1;
      if (existing.qty <= 0) this.tray = this.tray.filter((t) => t.productId !== productId);
      this.renderFoodGrid();
      this.renderTray();
    },

    renderTray() {
      const total = this.tray.reduce((s, t) => s + t.price * t.qty, 0);
      const slots = [];
      this.tray.forEach((t) => {
        for (let i = 0; i < t.qty; i++) slots.push(t);
      });
      while (slots.length < 6) slots.push(null);
      const show = slots.slice(0, 6);
      $('#bentoSlots').html(show.map((t) => {
        if (!t) {
          return '<div class="bento-slot is-empty" aria-hidden="true"><i class="bi bi-plus-lg"></i></div>';
        }
        return `<div class="bento-slot"><img src="${t.image}" alt=""><span class="slot-qty">1</span></div>`;
      }).join(''));

      $('#trayTotal').html(Utils.moneyHtml(total));
      $('#btnPlaceOrder').prop('disabled', !this.tray.length);
      $('#slideConfirm').toggleClass('is-disabled', !this.tray.length);
      if ($('#trayItems').length) {
        $('#trayItems').html(this.tray.map((t) => `
          <div class="d-flex justify-content-between small py-1">
            <span>${Utils.localized(t.name)} × ${t.qty}</span>
            <strong>${Utils.moneyHtml(t.price * t.qty)}</strong>
          </div>`).join('') || `<p class="text-muted small mb-0">${I18n.t('tray')}</p>`);
      }
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
        this.resetSlide();
        await Components.showSuccess(I18n.t('success'), I18n.t('placeOrder'));
        window.location.href = 'orders.html';
      } catch (err) {
        this.resetSlide();
        Components.showToast(err.message === 'Daily spending limit reached' ? I18n.t('limitReached') : (err.message || 'Error'), 'error');
      }
    },

    async initOrders() {
      const orders = await OrderService.getByParent(this.parentId());
      let activeTab = 'upcoming';
      let search = '';
      let sort = 'newest';

      if (typeof Forms !== 'undefined' && $('#parentOrderSort').length) {
        Forms.initSelect2($('#parentOrderSort'), {
          width: '100%',
          minimumResultsForSearch: Infinity
        });
      }

      const sortList = (list) => {
        const arr = list.slice();
        if (sort === 'oldest') arr.sort((a, b) => String(a.orderDate || a.orderTime || '').localeCompare(String(b.orderDate || b.orderTime || '')));
        else if (sort === 'highest') arr.sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
        else if (sort === 'lowest') arr.sort((a, b) => Number(a.total || 0) - Number(b.total || 0));
        else arr.sort((a, b) => String(b.orderDate || b.orderTime || '').localeCompare(String(a.orderDate || a.orderTime || '')));
        return arr;
      };

      const filter = (tab) => {
        let list = orders;
        if (tab === 'upcoming') list = orders.filter((o) => ['upcoming', 'new', 'preparing', 'ready'].includes(o.status));
        if (tab === 'past') list = orders.filter((o) => o.status === 'completed');
        if (tab === 'cancelled') list = orders.filter((o) => o.status === 'cancelled');
        if (search) {
          list = list.filter((o) =>
            String(o.studentName || '').toLowerCase().includes(search) ||
            String(o.orderNumber || '').toLowerCase().includes(search)
          );
        }
        return sortList(list);
      };

      const render = () => {
        const list = filter(activeTab);
        $('#parentOrders').html(list.map((o) => `
          <a href="../canteen-manager/order-details.html?id=${o.id}" class="order-card text-decoration-none text-reset">
            <div class="order-card-main">
              <div class="order-number">#${o.orderNumber}</div>
              <div class="order-student"><strong>${o.studentName}</strong><span>${o.classroom || ''}</span></div>
              <div class="order-meta-item"><strong>${I18n.t('total')}</strong>${Utils.moneyHtml(o.total)}</div>
              ${Components.renderStatusBadge(o.status)}
            </div>
          </a>`).join('') || Components.renderEmptyState('bi-bag', I18n.t('noOrders'), ''));
      };

      render();
      $('.order-tabs .tab-btn').off('click.parentOrders').on('click.parentOrders', function () {
        $('.order-tabs .tab-btn').removeClass('active');
        $(this).addClass('active');
        activeTab = $(this).data('tab');
        render();
      });
      $('#searchParentOrders').off('input.parentOrders').on('input.parentOrders', Utils.debounce(function () {
        search = String($(this).val() || '').toLowerCase().trim();
        render();
      }, 200));
      $('#parentOrderSort').off('change.parentOrders').on('change.parentOrders', function () {
        sort = $(this).val() || 'newest';
        render();
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
      const showDay = (date) => {
        const list = byDate[date] || [];
        const label = new Date(date + 'T12:00:00').toLocaleDateString(
          I18n.lang === 'ar' ? 'ar' : 'en-GB',
          { weekday: 'long', day: 'numeric', month: 'long' }
        );
        if (list.length) {
          $('#calendarDayPanel').html(`
            <h3 class="h5">${label}</h3>
            ${list.map((o) => `
              <div class="mb-3">
                <strong>${o.studentName}</strong>
                <div class="text-success small">Lunch ordered ✓</div>
                <a class="btn-app btn-outline-app btn-sm-app mt-2" href="../canteen-manager/order-details.html?id=${o.id}">${I18n.t('viewOrder') || 'View Order'}</a>
              </div>`).join('')}`);
        } else {
          $('#calendarDayPanel').html(`
            <h3 class="h5">${label}</h3>
            <p class="mb-2">No order yet</p>
            <a class="btn-app btn-primary-app btn-sm-app" href="order.html">${I18n.t('orderFood')}</a>`);
        }
      };
      $('#calendarGrid').on('click', '.calendar-day', function () {
        const date = $(this).data('date');
        $('#calendarGrid .calendar-day').removeClass('selected-day');
        $(this).addClass('selected-day');
        showDay(date);
      });
    },

    async initSettings() {
      const settings = Storage.get('settings') || SchoolFoodSeed.settings;
      const p = settings.parent || SchoolFoodSeed.settings.parent;
      $('#setFirst').val(p.profile.firstName);
      $('#setLast').val(p.profile.lastName);
      $('#setEmail').val(p.profile.email);
      $('#setPhone').val(p.profile.phone);
      $('#parentProfileName').text((p.profile.firstName || '') + ' ' + (p.profile.lastName || ''));
      $('#parentProfileEmail').text(p.profile.email || '—');
      if ($('#setLang').length) {
        $('#setLang').val(I18n.lang || 'en');
        if (typeof Forms !== 'undefined') {
          Forms.initSelect2($('#setLang'), {
            width: '100%',
            minimumResultsForSearch: Infinity
          });
        }
      }
      Object.keys(p.notifications || {}).forEach((k) => {
        $(`#notif-${k}`).prop('checked', !!p.notifications[k]);
      });
      const pms = await WalletService.getPaymentMethods(this.parentId());
      $('#paymentList').html(pms.map((pm) => `
        <div class="parent-activity-row">
          <span>${pm.brand} ending in ${pm.last4}</span>
          <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-rm-pm" data-id="${pm.id}">${I18n.t('delete')}</button>
        </div>`).join('') || `<p class="text-muted mb-0">${I18n.t('paymentMethods')}</p>`);

      $('#btnSaveParentSettings').off('click').on('click', () => {
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
        if ($('#setLang').length && typeof I18n !== 'undefined' && I18n.setLang) {
          I18n.setLang($('#setLang').val());
        }
        Storage.set('settings', settings);
        $('#parentProfileName').text(($('#setFirst').val() || '') + ' ' + ($('#setLast').val() || ''));
        $('#parentProfileEmail').text($('#setEmail').val() || '—');
        Components.showToast(I18n.t('success'), 'success');
      });

      $(document).off('click.rmPm').on('click.rmPm', '.btn-rm-pm', async function () {
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
