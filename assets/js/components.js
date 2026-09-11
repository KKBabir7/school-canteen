/**
 * Reusable UI components — I18n + Utils + services.
 */
(function (global, $) {
  'use strict';

  const CONFIRM_COLOR = '#1a365d';

  const Components = {
    showToast(message, type, title) {
      type = type || 'success';
      title = title || (type === 'success' ? I18n.t('success') : type === 'error' ? 'Error' : 'Notice');

      let $container = $('.toast-container-app');
      if (!$container.length) {
        $container = $('<div class="toast-container-app" aria-live="polite"></div>');
        $('body').append($container);
      }

      const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-exclamation-circle-fill',
        info: 'bi-info-circle-fill'
      };

      const $toast = $(`
        <div class="toast-app ${type}" role="status">
          <div class="toast-icon"><i class="bi ${icons[type] || icons.info}"></i></div>
          <div class="toast-body">
            <strong>${title}</strong>
            <p>${message}</p>
          </div>
          <button type="button" class="toast-close" aria-label="Dismiss"><i class="bi bi-x"></i></button>
        </div>
      `);

      $container.append($toast);
      $toast.find('.toast-close').on('click', () => this.dismissToast($toast));
      setTimeout(() => this.dismissToast($toast), 3500);
    },

    dismissToast($toast) {
      if (!$toast || !$toast.length) return;
      $toast.addClass('hiding');
      setTimeout(() => $toast.remove(), 250);
    },

    showConfirm(options) {
      const opts = $.extend({
        title: I18n.t('confirm'),
        text: '',
        icon: 'warning',
        confirmText: I18n.t('confirm'),
        cancelText: I18n.t('cancel'),
        confirmColor: CONFIRM_COLOR,
        danger: false
      }, options);

      if (typeof Swal === 'undefined') {
        return Promise.resolve(window.confirm(opts.title + '\n' + opts.text));
      }

      return Swal.fire({
        title: opts.title,
        text: opts.text,
        icon: opts.icon,
        showCancelButton: true,
        confirmButtonText: opts.confirmText,
        cancelButtonText: opts.cancelText,
        confirmButtonColor: opts.danger ? '#dc2626' : opts.confirmColor,
        cancelButtonColor: '#6b7c8a',
        reverseButtons: true,
        customClass: { popup: 'rounded-app-lg' }
      }).then((result) => result.isConfirmed);
    },

    showSuccess(title, text) {
      if (typeof Swal !== 'undefined') {
        return Swal.fire({
          icon: 'success',
          title: title,
          text: text || '',
          confirmButtonColor: CONFIRM_COLOR,
          timer: 2200,
          showConfirmButton: true
        });
      }
      this.showToast(text || title, 'success', title);
      return Promise.resolve();
    },

    renderStatusBadge(status) {
      const clsMap = {
        active: 'badge-success',
        inactive: 'badge-neutral',
        draft: 'badge-warning',
        available: 'badge-success',
        unavailable: 'badge-danger',
        new: 'badge-info',
        preparing: 'badge-warning',
        ready: 'badge-primary',
        completed: 'badge-success',
        upcoming: 'badge-neutral',
        cancelled: 'badge-danger'
      };
      const cls = clsMap[status] || 'badge-neutral';
      const label = I18n.statusLabel(status);
      return `<span class="badge-app ${cls}"><span class="visually-hidden">${I18n.t('status')}: </span>${label}</span>`;
    },

    renderCanteen(canteen, options) {
      options = options || {};
      const name = canteen.name || '—';
      const school = CanteenService.getSchoolName(canteen.schoolId);
      const menuCount = (canteen.assignedMenuIds || []).length;
      const actions = options.actions !== false;

      return `
        <div class="canteen-card" data-id="${canteen.id}" data-aos="fade-up" role="button" tabindex="0"
             aria-label="${name}">
          <div class="canteen-card-top">
            <div>
              <h3>${name}</h3>
              <p class="school-name">${school}</p>
            </div>
            <div class="d-flex align-items-center gap-2">
              ${this.renderStatusBadge(canteen.status)}
              ${actions ? this.renderActionMenu('canteen', canteen.id, [
                { action: 'view', label: I18n.t('view'), icon: 'bi-eye' },
                { action: 'edit', label: I18n.t('edit'), icon: 'bi-pencil' },
                { action: 'assign', label: I18n.t('assignMenu'), icon: 'bi-link-45deg' },
                { action: canteen.status === 'active' ? 'deactivate' : 'activate',
                  label: canteen.status === 'active' ? I18n.t('deactivate') : I18n.t('activate'),
                  icon: canteen.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle',
                  danger: canteen.status === 'active' }
              ]) : ''}
            </div>
          </div>
          <div class="canteen-meta">
            <span><i class="bi bi-telephone" aria-hidden="true"></i> ${canteen.phone || '—'}</span>
            <span><i class="bi bi-envelope" aria-hidden="true"></i> ${canteen.email || '—'}</span>
            <span><i class="bi bi-journal-text" aria-hidden="true"></i> ${menuCount} ${I18n.t('menus').toLowerCase()}</span>
            <span><i class="bi bi-clock" aria-hidden="true"></i> ${Utils.formatRelative(canteen.lastUpdated)}</span>
          </div>
        </div>
      `;
    },

    renderMenu(menu, options) {
      options = options || {};
      const itemCount = MenuService.countItems(menu);
      const sectionCount = MenuService.countSections(menu);
      const assigned = (menu.assignedCanteenIds || []).length;
      const name = Utils.localized(menu.name);
      const desc = Utils.localized(menu.description) || '—';

      return `
        <div class="menu-card" data-id="${menu.id}" data-aos="fade-up" role="button" tabindex="0"
             aria-label="${name}">
          <div class="menu-card-top">
            <div>
              <h3>${name}</h3>
              <p class="menu-desc">${desc}</p>
            </div>
            <div class="d-flex align-items-center gap-2">
              ${this.renderStatusBadge(menu.status)}
              ${options.actions !== false ? this.renderActionMenu('menu', menu.id, [
                { action: 'view', label: I18n.t('view'), icon: 'bi-eye' },
                { action: 'edit', label: I18n.t('edit'), icon: 'bi-pencil' },
                { action: 'assign', label: I18n.t('assign'), icon: 'bi-link-45deg' },
                { action: menu.status === 'active' ? 'deactivate' : 'activate',
                  label: menu.status === 'active' ? I18n.t('deactivate') : I18n.t('activate'),
                  icon: menu.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle' },
                { divider: true },
                { action: 'delete', label: I18n.t('delete'), icon: 'bi-trash', danger: true }
              ]) : ''}
            </div>
          </div>
          <div class="menu-meta">
            <span><i class="bi bi-layers" aria-hidden="true"></i> ${sectionCount} ${I18n.t('sections').toLowerCase()}</span>
            <span><i class="bi bi-egg-fried" aria-hidden="true"></i> ${itemCount} ${I18n.t('items').toLowerCase()}</span>
            <span><i class="bi bi-shop" aria-hidden="true"></i> ${assigned}</span>
            <span>${this.renderStatusBadge(menu.availability === 'available' ? 'available' : 'unavailable')}</span>
            <span><i class="bi bi-clock" aria-hidden="true"></i> ${Utils.formatRelative(menu.lastUpdated)}</span>
          </div>
        </div>
      `;
    },

    renderMenuItem(item, product, options) {
      options = options || {};
      if (!product) return '';
      const available = item.available !== false;
      const name = Utils.localized(product.name);
      const desc = Utils.localized(product.description) || '';

      return `
        <div class="menu-item-row" data-item-id="${item.id}" data-product-id="${product.id}">
          <img class="menu-item-img object-cover" src="${product.image}" alt="${name}" loading="lazy">
          <div class="menu-item-info">
            <strong>${name}</strong>
            <span>${desc}</span>
          </div>
          <div class="menu-item-price">${Utils.money(item.menuPrice)}</div>
          ${this.renderStatusBadge(available ? 'available' : 'unavailable')}
          ${options.actions !== false ? this.renderActionMenu('menu-item', item.id, [
            { action: 'edit', label: I18n.t('edit'), icon: 'bi-pencil' },
            { action: 'remove', label: I18n.t('delete'), icon: 'bi-trash', danger: true }
          ]) : ''}
        </div>
      `;
    },

    renderOrder(order, options) {
      options = options || {};
      const itemCount = order.items ? order.items.reduce((s, i) => s + (i.qty || 1), 0) : 0;
      let actionBtn = '';

      if (order.status === 'new') {
        actionBtn = `<button type="button" class="btn-app btn-primary-app btn-sm-app btn-order-action" data-action="start" data-id="${order.id}">${I18n.t('startPreparing')}</button>`;
      } else if (order.status === 'preparing') {
        actionBtn = `<button type="button" class="btn-app btn-primary-app btn-sm-app btn-order-action" data-action="ready" data-id="${order.id}">${I18n.t('markReady')}</button>`;
      } else if (order.status === 'ready') {
        actionBtn = `<button type="button" class="btn-app btn-primary-app btn-sm-app btn-order-action" data-action="complete" data-id="${order.id}">${I18n.t('completeOrder')}</button>`;
      }

      return `
        <div class="order-card" data-id="${order.id}" data-aos="fade-up" role="button" tabindex="0"
             aria-label="#${order.orderNumber}">
          <div class="order-card-main">
            <div class="order-number">#${order.orderNumber}</div>
            <div class="order-student">
              <strong>${order.studentName}</strong>
              <span>${order.classroom || order.className || '—'}</span>
            </div>
            <div class="order-meta-item">
              <strong>${I18n.t('today')}</strong>
              ${Utils.formatTime(order.orderTime)}
            </div>
            <div class="order-meta-item">
              <strong>${I18n.t('items')}</strong>
              ${itemCount}
            </div>
            <div class="order-total">${Utils.money(order.total)}</div>
            ${this.renderStatusBadge(order.status)}
          </div>
          <div class="order-actions">
            ${actionBtn}
            <button type="button" class="btn-app btn-outline-app btn-sm-app btn-view-order" data-id="${order.id}">${I18n.t('view')}</button>
          </div>
        </div>
      `;
    },

    renderActionMenu(entity, id, items) {
      const menuItems = items.map((item) => {
        if (item.divider) return '<li><hr class="dropdown-divider"></li>';
        return `
          <li>
            <button type="button" class="dropdown-item ${item.danger ? 'text-danger' : ''}"
                    data-entity="${entity}" data-id="${id}" data-action="${item.action}">
              <i class="bi ${item.icon}" aria-hidden="true"></i> ${item.label}
            </button>
          </li>`;
      }).join('');

      return `
        <div class="dropdown action-menu" onclick="event.stopPropagation()">
          <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"
                  aria-label="${I18n.t('actions')}">
            <i class="bi bi-three-dots-vertical" aria-hidden="true"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end dropdown-menu-app">${menuItems}</ul>
        </div>`;
    },

    renderEmptyState(icon, title, text, btnHtml) {
      return `
        <div class="empty-state" data-aos="fade-up">
          <div class="empty-state-icon"><i class="bi ${icon}" aria-hidden="true"></i></div>
          <h3>${title}</h3>
          <p>${text}</p>
          ${btnHtml || ''}
        </div>`;
    },

    renderStatusStepper(currentStatus) {
      const steps = ['new', 'preparing', 'ready', 'completed'];
      const currentIdx = steps.indexOf(currentStatus);

      return `
        <div class="status-stepper" role="list" aria-label="Order status progress">
          ${steps.map((step, i) => {
            let cls = '';
            if (i < currentIdx) cls = 'completed';
            else if (i === currentIdx) cls = 'active';
            const line = i < steps.length - 1 ? `<div class="status-step-line" aria-hidden="true"></div>` : '';
            return `
              <div class="status-step ${cls}" role="listitem" aria-current="${i === currentIdx ? 'step' : 'false'}">
                <div class="status-step-node">
                  <div class="status-step-dot">
                    ${i < currentIdx ? '<i class="bi bi-check" aria-hidden="true"></i>' : (i + 1)}
                  </div>
                  <span class="status-step-label">${I18n.statusLabel(step)}</span>
                </div>
                ${line}
              </div>`;
          }).join('')}
        </div>`;
    },

    initializeSelect2($el, options) {
      if (!$el || !$el.length || typeof $.fn.select2 !== 'function') return;
      const dir = document.documentElement.getAttribute('dir') || 'ltr';
      options = $.extend({
        width: '100%',
        dir: dir
      }, options);
      $el.select2(options);
    },

    initializeAOS() {
      if (typeof AOS !== 'undefined') {
        AOS.init({
          duration: 450,
          easing: 'ease-out',
          once: true,
          offset: 40,
          disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        });
      }
    },

    initializeAnimations() {
      if (typeof gsap === 'undefined') return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const content = document.querySelector('.app-content');
      if (content) {
        gsap.from(content, { opacity: 0, y: 12, duration: 0.35, ease: 'power2.out' });
      }
    },

    animateCountUp(selector, endValue, options) {
      options = options || {};
      const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!el) return;

      const CountUpClass =
        (typeof countUp !== 'undefined' && countUp.CountUp) ||
        (typeof CountUp !== 'undefined' ? CountUp : null);

      if (CountUpClass) {
        try {
          const c = new CountUpClass(el, Number(endValue) || 0, {
            duration: options.duration || 1.2,
            separator: ',',
            useEasing: true
          });
          if (!c.error) {
            c.start();
            return;
          }
        } catch (err) { /* fall through */ }
      }
      el.textContent = String(endValue);
    },

    getQueryParam(name) {
      return Utils.query(name);
    },

    setActiveTab(tabId) {
      $('.tabs-app .tab-btn').removeClass('active').attr('aria-selected', 'false');
      $('.tab-panel').removeClass('active');
      $(`.tabs-app .tab-btn[data-tab="${tabId}"]`).addClass('active').attr('aria-selected', 'true');
      $(`#panel-${tabId}`).addClass('active');
    }
  };

  global.Components = Components;

  $(function () {
    Components.initializeAOS();
    Components.initializeAnimations();

    $(document).on('click', '.tabs-app .tab-btn', function () {
      Components.setActiveTab($(this).data('tab'));
    });

    document.addEventListener('langchange', () => {
      I18n.applyDom();
    });
  });
})(window, jQuery);
