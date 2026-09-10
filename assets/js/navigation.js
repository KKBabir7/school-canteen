/**
 * School Food Platform — Navigation & Layout
 */
(function (global, $) {
  'use strict';

  const Navigation = {
    getBasePath() {
      const path = window.location.pathname.replace(/\\/g, '/');
      if (path.includes('/food-provider/') || path.includes('/canteen-manager/')) {
        return '../';
      }
      return '';
    },

    getAssetPath(rel) {
      return this.getBasePath() + 'assets/' + rel;
    },

    getRole() {
      const path = window.location.pathname.replace(/\\/g, '/');
      if (path.includes('/canteen-manager/')) return 'canteen-manager';
      if (path.includes('/food-provider/')) return 'food-provider';
      return 'public';
    },

    fpLinks: [
      { href: 'dashboard.html', icon: 'bi-grid-1x2', label: 'Dashboard', id: 'dashboard' },
      { href: 'canteens.html', icon: 'bi-shop', label: 'Canteens', id: 'canteens' },
      { href: 'menus.html', icon: 'bi-journal-richtext', label: 'Menus', id: 'menus' },
      { href: '#', icon: 'bi-calendar3', label: 'Calendar', id: 'calendar', soon: true },
      { href: '#', icon: 'bi-bag-check', label: 'Orders', id: 'orders', soon: true },
      { href: '#', icon: 'bi-bar-chart', label: 'Reports', id: 'reports', soon: true },
      { href: 'settings.html', icon: 'bi-gear', label: 'Settings', id: 'settings', optional: true }
    ],

    cmLinks: [
      { href: 'dashboard.html', icon: 'bi-grid-1x2', label: 'Dashboard', id: 'dashboard' },
      { href: 'orders.html', icon: 'bi-bag-check', label: 'Orders', id: 'orders' },
      { href: 'my-menus.html', icon: 'bi-journal-richtext', label: 'My Menus', id: 'menus' },
      { href: '#', icon: 'bi-calendar3', label: 'Schedule', id: 'schedule', soon: true },
      { href: '#', icon: 'bi-percent', label: 'Discounts', id: 'discounts', soon: true },
      { href: '#', icon: 'bi-bar-chart', label: 'Reports', id: 'reports', soon: true },
      { href: 'settings.html', icon: 'bi-gear', label: 'Settings', id: 'settings' }
    ],

    detectActivePage() {
      const file = window.location.pathname.split('/').pop() || '';
      if (file.includes('canteen')) return 'canteens';
      if (file.includes('menu') || file.includes('create-menu')) return 'menus';
      if (file.includes('order')) return 'orders';
      if (file.includes('settings')) return 'settings';
      return 'dashboard';
    },

    renderSidebar(role) {
      const mock = global.SchoolFoodMock;
      const links = role === 'canteen-manager' ? this.cmLinks : this.fpLinks;
      const user = role === 'canteen-manager' ? mock.users.canteenManager : mock.users.foodProvider;
      const active = this.detectActivePage();
      const base = this.getBasePath();
      const brandSub = role === 'canteen-manager' ? 'Canteen Manager' : 'Food Provider';

      // Settings for food provider — create lightweight page or skip if optional missing
      const filtered = links.filter((l) => {
        if (l.optional && role === 'food-provider') return false;
        return true;
      });

      const navHtml = filtered.map((link) => {
        if (link.soon) {
          return `
            <button type="button" class="nav-link-app coming-soon" disabled aria-disabled="true">
              <i class="bi ${link.icon}" aria-hidden="true"></i>
              <span>${link.label}</span>
              <span class="coming-soon-badge">Soon</span>
            </button>`;
        }
        const isActive = active === link.id;
        return `
          <a href="${link.href}" class="nav-link-app ${isActive ? 'active' : ''}"
             ${isActive ? 'aria-current="page"' : ''}>
            <i class="bi ${link.icon}" aria-hidden="true"></i>
            <span>${link.label}</span>
          </a>`;
      }).join('');

      return `
        <aside class="app-sidebar" id="appSidebar" aria-label="Main navigation">
          <div class="sidebar-brand">
            <div class="sidebar-brand-mark" aria-hidden="true"><i class="bi bi-cup-hot-fill"></i></div>
            <div class="sidebar-brand-text">
              SchoolFood
              <small>${brandSub}</small>
            </div>
          </div>
          <nav class="sidebar-nav">
            <div class="sidebar-label">Main</div>
            ${navHtml}
          </nav>
          <div class="sidebar-footer">
            <div class="sidebar-user">
              <img class="sidebar-avatar" src="${user.avatar}" alt="" width="36" height="36">
              <div class="sidebar-user-meta">
                <strong>${user.name}</strong>
                <span>${user.email}</span>
              </div>
            </div>
          </div>
        </aside>
        <div class="sidebar-overlay" id="sidebarOverlay" hidden></div>`;
    },

    renderTopbar(options) {
      options = options || {};
      const role = this.getRole();
      const mock = global.SchoolFoodMock;
      const user = role === 'canteen-manager' ? mock.users.canteenManager : mock.users.foodProvider;
      const roleLabel = role === 'canteen-manager' ? 'Canteen Manager' : 'Food Provider';
      const base = this.getBasePath();
      const fpDash = role === 'food-provider' ? 'dashboard.html' : '../food-provider/dashboard.html';
      const cmDash = role === 'canteen-manager' ? 'dashboard.html' : '../canteen-manager/dashboard.html';

      let contextTitle = options.title || '';
      let contextSub = options.subtitle || '';

      if (role === 'canteen-manager' && !options.title) {
        const canteen = AppState.getCanteen(mock.users.canteenManager.canteenId);
        const school = canteen ? AppState.getSchool(canteen.schoolId) : null;
        contextTitle = canteen ? canteen.name : 'Canteen';
        contextSub = school ? school.name : '';
      }

      return `
        <header class="app-topbar">
          <div class="topbar-left">
            <button type="button" class="sidebar-toggle" id="sidebarToggle" aria-label="Open menu" aria-controls="appSidebar" aria-expanded="false">
              <i class="bi bi-list" aria-hidden="true"></i>
            </button>
            <div class="topbar-context">
              ${contextTitle ? `<h1>${contextTitle}</h1>` : ''}
              ${contextSub ? `<p>${contextSub}</p>` : ''}
            </div>
          </div>
          <div class="topbar-right">
            <div class="dropdown role-switcher">
              <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Switch demo role">
                <i class="bi bi-people" aria-hidden="true"></i>
                <span class="role-label">${roleLabel}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end dropdown-menu-app">
                <li><a class="dropdown-item" href="${fpDash}"><i class="bi bi-building" aria-hidden="true"></i> Food Provider</a></li>
                <li><a class="dropdown-item" href="${cmDash}"><i class="bi bi-shop-window" aria-hidden="true"></i> Canteen Manager</a></li>
              </ul>
            </div>
            <div class="dropdown">
              <button class="user-menu-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="User menu">
                <img src="${user.avatar}" alt="" width="32" height="32">
                <span>${user.name.split(' ')[0]}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end dropdown-menu-app">
                <li><span class="dropdown-item-text text-muted small px-3">${user.email}</span></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="${base}index.html"><i class="bi bi-house" aria-hidden="true"></i> Landing page</a></li>
                <li><button type="button" class="dropdown-item" id="btnResetDemo"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Reset demo data</button></li>
              </ul>
            </div>
          </div>
        </header>`;
    },

    mountLayout(options) {
      const role = this.getRole();
      if (role === 'public') return;

      const $shell = $('.app-shell');
      if (!$shell.length) return;

      if (!$shell.find('.app-sidebar').length) {
        $shell.prepend(this.renderSidebar(role));
      }

      const $main = $shell.find('.app-main');
      if ($main.length && !$main.find('.app-topbar').length) {
        $main.prepend(this.renderTopbar(options));
      }

      this.bindSidebar();
    },

    bindSidebar() {
      const $sidebar = $('#appSidebar');
      const $overlay = $('#sidebarOverlay');
      const $toggle = $('#sidebarToggle');

      function openSidebar() {
        $sidebar.addClass('open');
        $overlay.addClass('show').removeAttr('hidden');
        $toggle.attr('aria-expanded', 'true');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo($sidebar[0], { x: -20, opacity: 0.9 }, { x: 0, opacity: 1, duration: 0.25, ease: 'power2.out' });
        }
      }

      function closeSidebar() {
        $sidebar.removeClass('open');
        $overlay.removeClass('show').attr('hidden', true);
        $toggle.attr('aria-expanded', 'false');
      }

      $toggle.off('click.nav').on('click.nav', function () {
        if ($sidebar.hasClass('open')) closeSidebar();
        else openSidebar();
      });

      $overlay.off('click.nav').on('click.nav', closeSidebar);

      $(document).off('keydown.nav').on('keydown.nav', function (e) {
        if (e.key === 'Escape' && $sidebar.hasClass('open')) closeSidebar();
      });

      $(document).off('click.resetDemo').on('click.resetDemo', '#btnResetDemo', async function () {
        const ok = await Components.showConfirm({
          title: 'Reset demo data?',
          text: 'This restores the original sample canteens, menus, and orders.',
          confirmText: 'Reset',
          danger: true
        });
        if (ok) {
          AppState.reset();
          Components.showToast('Demo data has been reset.', 'success');
          setTimeout(() => window.location.reload(), 600);
        }
      });
    }
  };

  global.Navigation = Navigation;

  $(function () {
    const role = Navigation.getRole();
    if (role !== 'public') {
      const opts = {};
      if (role === 'canteen-manager') {
        // title set in renderTopbar from canteen
      }
      Navigation.mountLayout(opts);
    }
  });
})(window, jQuery);
