/**
 * Student role — order within wallet + parent limits.
 */
(function (global, $) {
  'use strict';

  const StudentApp = {
    childId() {
      if (typeof Session !== 'undefined' && Session.profile() && Session.profile().childId) {
        return Session.profile().childId;
      }
      return APP_CONFIG.roles.student.childId;
    },

    money(n) { return (APP_CONFIG.currency || '₪') + Number(n || 0).toFixed(0); },

    async initHome() {
      const child = await ChildService.getById(this.childId());
      const balHtml = Utils.moneyHtml(child.walletBalance);
      const limitHtml = child.dailyLimitEnabled
        ? Utils.moneyHtml(ChildService.remainingDaily(child))
        : '—';
      $('#stuWelcome').text((I18n.lang === 'ar' ? 'مرحباً' : 'Hi') + ', ' + child.firstName);
      $('#stuBalance').html(balHtml);
      $('#stuBalanceSide').html(balHtml);
      $('#stuLimit').html(limitHtml);
      $('#stuLimitSide').html(limitHtml);
      try {
        const orders = await OrderService.getByChild(this.childId());
        const active = (orders || []).filter((o) =>
          ['upcoming', 'new', 'preparing', 'ready'].includes(o.status)
        ).length;
        $('#stuOrderCount').text(active);
      } catch (e) {
        $('#stuOrderCount').text('0');
      }
      if ($('.topbar-context').length) {
        $('.topbar-context h1').text(child.firstName + ' ' + (child.lastName || ''));
        $('.topbar-context p').text(CanteenService.getSchoolName(child.schoolId) || 'Student');
      }
    },

    async initWallet() {
      const child = await ChildService.getById(this.childId());
      $('#stuWalletBal').html(Utils.moneyHtml(child.walletBalance));
      $('#stuSpentToday').html(Utils.moneyHtml(child.spentToday || 0));
      $('#stuDailyLimit').html(child.dailyLimitEnabled ? Utils.moneyHtml(child.dailyLimit) : '—');
      $('#stuRemaining').html(child.dailyLimitEnabled
        ? Utils.moneyHtml(ChildService.remainingDaily(child))
        : '—');
    },

    async initOrder() {
      ParentApp.selectedChildId = this.childId();
      ParentApp.parentId = () => APP_CONFIG.roles.parent.id;
      ParentApp.tray = [];
      ParentApp.orderDate = new Date().toISOString().slice(0, 10);
      ParentApp.activeCategory = 'all';
      ParentApp.orderSearch = '';
      ParentApp._menuCache = null;

      const child = await ChildService.getById(this.childId());
      const $childSelect = $('#orderChildSelect');
      $childSelect.html(`<option value="${child.id}">${child.firstName} ${child.lastName || ''}</option>`).prop('disabled', true);
      if (typeof Forms !== 'undefined') {
        Forms.initSelect2($childSelect, {
          width: '100%',
          minimumResultsForSearch: Infinity,
          dropdownParent: $childSelect.closest('.order-child-chip'),
          dropdownCssClass: 'order-child-select2-dropdown'
        });
      }
      $('#orderFamilyBal').html(Utils.moneyHtml(child.walletBalance));
      ParentApp.renderDateStrip();
      await ParentApp.syncChildAvatar();
      ParentApp.bindOrderUI();
      ParentApp.bindSlideConfirm();
      await ParentApp.renderOrderMenu();
      ParentApp.renderTray();
    },

    async initOrders() {
      const orders = await OrderService.getByChild(this.childId());
      let activeTab = 'upcoming';
      let search = '';
      let sort = 'newest';

      if (typeof Forms !== 'undefined' && $('#studentOrderSort').length) {
        Forms.initSelect2($('#studentOrderSort'), {
          width: '100%',
          minimumResultsForSearch: Infinity
        });
      }

      const sortList = (list) => {
        const arr = list.slice();
        if (sort === 'oldest') {
          arr.sort((a, b) => String(a.orderDate || a.orderTime || '').localeCompare(String(b.orderDate || b.orderTime || '')));
        } else if (sort === 'highest') {
          arr.sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
        } else if (sort === 'lowest') {
          arr.sort((a, b) => Number(a.total || 0) - Number(b.total || 0));
        } else {
          arr.sort((a, b) => String(b.orderDate || b.orderTime || '').localeCompare(String(a.orderDate || a.orderTime || '')));
        }
        return arr;
      };

      const filter = (tab) => {
        let list = orders;
        if (tab === 'upcoming') list = orders.filter((o) => ['upcoming', 'new', 'preparing', 'ready'].includes(o.status));
        if (tab === 'past') list = orders.filter((o) => o.status === 'completed');
        if (tab === 'cancelled') list = orders.filter((o) => o.status === 'cancelled');
        if (search) {
          list = list.filter((o) =>
            String(o.orderNumber || '').toLowerCase().includes(search) ||
            String(o.orderDate || '').toLowerCase().includes(search)
          );
        }
        return sortList(list);
      };

      const render = () => {
        const list = filter(activeTab);
        $('#studentOrders').html(list.map((o) => {
          const dateLabel = o.orderDate || (o.orderTime || '').slice(0, 10) || '—';
          const itemCount = (o.items || []).length;
          const itemPreview = (o.items || []).slice(0, 2).map((it) => Utils.localized(it.name || it.productName || {}) || it.name || 'Item').join(', ');
          return `
            <article class="order-card order-card--student">
              <div class="order-card-main order-card-main--student">
                <div class="order-number">#${o.orderNumber}</div>
                <div class="order-student">
                  <strong>${dateLabel}</strong>
                  <span>${itemCount} item${itemCount === 1 ? '' : 's'}${itemPreview ? ' · ' + itemPreview : ''}</span>
                </div>
                <div class="order-meta-item"><strong>${I18n.t('total')}</strong>${Utils.moneyHtml(o.total)}</div>
                <div class="order-card-status">${Components.renderStatusBadge(o.status)}</div>
              </div>
            </article>`;
        }).join('') || Components.renderEmptyState('bi-bag', I18n.t('noOrders'), ''));
      };

      render();
      $('.order-tabs .tab-btn').off('click.stuOrders').on('click.stuOrders', function () {
        $('.order-tabs .tab-btn').removeClass('active');
        $(this).addClass('active');
        activeTab = $(this).data('tab');
        render();
      });
      $('#searchStudentOrders').off('input.stuOrders').on('input.stuOrders', Utils.debounce(function () {
        search = String($(this).val() || '').toLowerCase().trim();
        render();
      }, 200));
      $('#studentOrderSort').off('change.stuOrders').on('change.stuOrders', function () {
        sort = $(this).val() || 'newest';
        render();
      });
    },

    async initProfile() {
      const child = await ChildService.getById(this.childId());
      const av = (SchoolFoodSeed.avatars || {})[child.avatarKey] || (SchoolFoodSeed.avatars || {}).sarah;
      const grades = Storage.get('grades') || SchoolFoodSeed.grades || [];
      const classes = Storage.get('classes') || SchoolFoodSeed.classes || [];
      const g = grades.find((x) => x.id === child.gradeId);
      const c = classes.find((x) => x.id === child.classId);

      $('#profName').text(child.firstName + ' ' + (child.lastName || ''));
      $('#profSchool').text(CanteenService.getSchoolName(child.schoolId));
      $('#profGrade').text(g ? Utils.localized(g.name) : '—');
      $('#profClass').text(c ? c.name : (child.className || '—'));
      $('#profCode').text(child.studentCode || child.studentId || '—');
      $('#profEmail').text(APP_CONFIG.roles.student.email);
      $('#profAvatar').attr('src', av || '');

      if ($('#stuLang').length) {
        $('#stuLang').val(I18n.lang || 'en');
        if (typeof Forms !== 'undefined') {
          Forms.initSelect2($('#stuLang'), {
            width: '100%',
            minimumResultsForSearch: Infinity
          });
        }
      }

      $('#btnSaveStuProfile').off('click').on('click', () => {
        if ($('#stuLang').length && typeof I18n !== 'undefined' && I18n.setLang) {
          I18n.setLang($('#stuLang').val());
        }
        Components.showToast(I18n.t('success'), 'success');
      });
    }
  };

  global.StudentApp = StudentApp;
})(window, jQuery);
