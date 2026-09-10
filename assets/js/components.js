/**
 * School Food Platform — Reusable UI Components
 */
(function (global, $) {
  'use strict';

  const Components = {
    showToast(message, type, title) {
      type = type || 'success';
      title = title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice');

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
        title: 'Are you sure?',
        text: '',
        icon: 'warning',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        confirmColor: '#0c7a6f',
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
        customClass: {
          popup: 'rounded-app-lg'
        }
      }).then((result) => result.isConfirmed);
    },

    showSuccess(title, text) {
      if (typeof Swal !== 'undefined') {
        return Swal.fire({
          icon: 'success',
          title: title,
          text: text || '',
          confirmButtonColor: '#0c7a6f',
          timer: 2200,
          showConfirmButton: true
        });
      }
      this.showToast(text || title, 'success', title);
      return Promise.resolve();
    },

    renderStatusBadge(status) {
      const map = {
        active: { cls: 'badge-success', label: 'Active' },
        inactive: { cls: 'badge-neutral', label: 'Inactive' },
        draft: { cls: 'badge-warning', label: 'Draft' },
        available: { cls: 'badge-success', label: 'Available' },
        unavailable: { cls: 'badge-danger', label: 'Unavailable' },
        new: { cls: 'badge-info', label: 'New' },
        preparing: { cls: 'badge-warning', label: 'Preparing' },
        ready: { cls: 'badge-primary', label: 'Ready' },
        completed: { cls: 'badge-success', label: 'Completed' },
        upcoming: { cls: 'badge-neutral', label: 'Upcoming' },
        cancelled: { cls: 'badge-danger', label: 'Cancelled' }
      };
      const s = map[status] || { cls: 'badge-neutral', label: status };
      return `<span class="badge-app ${s.cls}"><span class="visually-hidden">Status: </span>${s.label}</span>`;
    },

    renderCanteen(canteen, options) {
      options = options || {};
      const school = AppState.getSchool(canteen.schoolId);
      const menuCount = (canteen.assignedMenuIds || []).length;
      const actions = options.actions !== false;

      return `
        <div class="canteen-card" data-id="${canteen.id}" data-aos="fade-up" role="button" tabindex="0"
             aria-label="View ${canteen.name}">
          <div class="canteen-card-top">
            <div>
              <h3>${canteen.name}</h3>
              <p class="school-name">${school ? school.name : '—'}</p>
            </div>
            <div class="d-flex align-items-center gap-2">
              ${this.renderStatusBadge(canteen.status)}
              ${actions ? this.renderActionMenu('canteen', canteen.id, [
                { action: 'view', label: 'View', icon: 'bi-eye' },
                { action: 'assign', label: 'Assign Menu', icon: 'bi-link-45deg' },
                { action: canteen.status === 'active' ? 'deactivate' : 'activate',
                  label: canteen.status === 'active' ? 'Deactivate' : 'Activate',
                  icon: canteen.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle',
                  danger: canteen.status === 'active' }
              ]) : ''}
            </div>
          </div>
          <div class="canteen-meta">
            <span><i class="bi bi-telephone" aria-hidden="true"></i> ${canteen.phone || '—'}</span>
            <span><i class="bi bi-envelope" aria-hidden="true"></i> ${canteen.email || '—'}</span>
            <span><i class="bi bi-journal-text" aria-hidden="true"></i> ${menuCount} menu${menuCount !== 1 ? 's' : ''}</span>
            <span><i class="bi bi-clock" aria-hidden="true"></i> ${AppState.formatRelative(canteen.lastActivity)}</span>
          </div>
        </div>
      `;
    },

    renderMenu(menu, options) {
      options = options || {};
      const itemCount = AppState.countMenuItems(menu);
      const sectionCount = AppState.countSections(menu);
      const assigned = (menu.assignedCanteenIds || []).length;

      return `
        <div class="menu-card" data-id="${menu.id}" data-aos="fade-up" role="button" tabindex="0"
             aria-label="View ${menu.name}">
          <div class="menu-card-top">
            <div>
              <h3>${menu.name}</h3>
              <p class="menu-desc">${menu.description || 'No description'}</p>
            </div>
            <div class="d-flex align-items-center gap-2">
              ${this.renderStatusBadge(menu.status)}
              ${this.renderActionMenu('menu', menu.id, [
                { action: 'view', label: 'View', icon: 'bi-eye' },
                { action: 'edit', label: 'Edit', icon: 'bi-pencil' },
                { action: 'assign', label: 'Assign', icon: 'bi-link-45deg' },
                { action: menu.status === 'active' ? 'deactivate' : 'activate',
                  label: menu.status === 'active' ? 'Deactivate' : 'Activate',
                  icon: menu.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle' },
                { divider: true },
                { action: 'delete', label: 'Delete', icon: 'bi-trash', danger: true }
              ])}
            </div>
          </div>
          <div class="menu-meta">
            <span><i class="bi bi-layers" aria-hidden="true"></i> ${sectionCount} sections</span>
            <span><i class="bi bi-egg-fried" aria-hidden="true"></i> ${itemCount} items</span>
            <span><i class="bi bi-shop" aria-hidden="true"></i> ${assigned} canteens</span>
            <span>${this.renderStatusBadge(menu.availability === 'available' ? 'available' : 'unavailable')}</span>
            <span><i class="bi bi-clock" aria-hidden="true"></i> ${AppState.formatRelative(menu.lastUpdated)}</span>
          </div>
        </div>
      `;
    },

    renderMenuItem(item, product, options) {
      options = options || {};
      if (!product) return '';
      const available = item.available !== false;

      return `
        <div class="menu-item-row" data-item-id="${item.id}" data-product-id="${product.id}">
          <img class="menu-item-img object-cover" src="${product.image}" alt="${product.name}" loading="lazy">
          <div class="menu-item-info">
            <strong>${product.name}</strong>
            <span>${product.description || ''}</span>
          </div>
          <div class="menu-item-price">${AppState.formatMoney(item.menuPrice)}</div>
          ${this.renderStatusBadge(available ? 'available' : 'unavailable')}
          ${options.actions !== false ? this.renderActionMenu('menu-item', item.id, [
            { action: 'edit', label: 'Edit', icon: 'bi-pencil' },
            { action: 'remove', label: 'Remove', icon: 'bi-trash', danger: true }
          ]) : ''}
        </div>
      `;
    },

    renderOrder(order, options) {
      options = options || {};
      const itemCount = order.items ? order.items.reduce((s, i) => s + i.qty, 0) : 0;
      let actionBtn = '';

      if (order.status === 'new') {
        actionBtn = `<button type="button" class="btn-app btn-primary-app btn-sm-app btn-order-action" data-action="start" data-id="${order.id}">Start Preparing</button>`;
      } else if (order.status === 'preparing') {
        actionBtn = `<button type="button" class="btn-app btn-primary-app btn-sm-app btn-order-action" data-action="ready" data-id="${order.id}">Mark Ready</button>`;
      } else if (order.status === 'ready') {
        actionBtn = `<button type="button" class="btn-app btn-primary-app btn-sm-app btn-order-action" data-action="complete" data-id="${order.id}">Mark Completed</button>`;
      }

      return `
        <div class="order-card" data-id="${order.id}" data-aos="fade-up" role="button" tabindex="0"
             aria-label="Order #${order.orderNumber}">
          <div class="order-card-main">
            <div class="order-number">#${order.orderNumber}</div>
            <div class="order-student">
              <strong>${order.studentName}</strong>
              <span>Grade ${order.className}</span>
            </div>
            <div class="order-meta-item">
              <strong>Time</strong>
              ${AppState.formatTime(order.orderTime)}
            </div>
            <div class="order-meta-item">
              <strong>Items</strong>
              ${itemCount} item${itemCount !== 1 ? 's' : ''}
            </div>
            <div class="order-total">${AppState.formatMoney(order.total)}</div>
            ${this.renderStatusBadge(order.status)}
          </div>
          <div class="order-actions">
            ${actionBtn}
            <button type="button" class="btn-app btn-outline-app btn-sm-app btn-view-order" data-id="${order.id}">View</button>
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
                  aria-label="Actions">
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
      const labels = { new: 'New', preparing: 'Preparing', ready: 'Ready', completed: 'Completed' };
      const currentIdx = steps.indexOf(currentStatus);

      return `
        <div class="status-stepper" role="list" aria-label="Order status progress">
          ${steps.map((step, i) => {
            let cls = '';
            if (i < currentIdx) cls = 'completed';
            else if (i === currentIdx) cls = 'active';
            const line = i < steps.length - 1
              ? `<div class="status-step-line" aria-hidden="true"></div>`
              : '';
            return `
              <div class="status-step ${cls}" role="listitem" aria-current="${i === currentIdx ? 'step' : 'false'}">
                <div class="status-step-node">
                  <div class="status-step-dot">
                    ${i < currentIdx ? '<i class="bi bi-check" aria-hidden="true"></i>' : (i + 1)}
                  </div>
                  <span class="status-step-label">${labels[step]}</span>
                </div>
                ${line}
              </div>`;
          }).join('')}
        </div>`;
    },

    initializeSelect2($el, options) {
      if (!$el || !$el.length || typeof $.fn.select2 !== 'function') return;
      options = $.extend({
        width: '100%',
        theme: 'default'
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

      document.querySelectorAll('.btn-primary-app').forEach((btn) => {
        btn.addEventListener('mouseenter', () => {
          gsap.to(btn, { scale: 1.02, duration: 0.15, ease: 'power1.out' });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, { scale: 1, duration: 0.15, ease: 'power1.out' });
        });
      });
    },

    animateCountUp(selector, endValue, options) {
      options = options || {};
      const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!el) return;

      const duration = options.duration || 1.2;
      const CountUpClass =
        (typeof countUp !== 'undefined' && countUp.CountUp) ||
        (typeof CountUp !== 'undefined' ? CountUp : null);

      if (CountUpClass) {
        try {
          const c = new CountUpClass(el, Number(endValue) || 0, {
            duration: duration,
            separator: ',',
            useEasing: true
          });
          if (!c.error) {
            c.start();
            return;
          }
        } catch (err) {
          /* fall through */
        }
      }
      el.textContent = String(endValue);
    },

    getQueryParam(name) {
      const params = new URLSearchParams(window.location.search);
      return params.get(name);
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

    // Global tab handling
    $(document).on('click', '.tabs-app .tab-btn', function () {
      const tab = $(this).data('tab');
      Components.setActiveTab(tab);
    });
  });
})(window, jQuery);
