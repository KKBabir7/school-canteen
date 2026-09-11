/**
 * Role-aware sidebar + topbar with EN/AR switcher.
 * Supports: food-provider, canteen-manager, parent, student, school-admin, super-admin
 */
(function (global, $) {
  'use strict';

  const ROLE_FOLDERS = [
    'food-provider', 'canteen-manager', 'parent', 'student', 'school-admin', 'super-admin'
  ];

  const Navigation = {
    getBasePath() {
      const path = window.location.pathname.replace(/\\/g, '/');
      if (ROLE_FOLDERS.some((f) => path.includes('/' + f + '/'))) return '../';
      return '';
    },

    getRole() {
      const path = window.location.pathname.replace(/\\/g, '/');
      for (let i = 0; i < ROLE_FOLDERS.length; i++) {
        if (path.includes('/' + ROLE_FOLDERS[i] + '/')) return ROLE_FOLDERS[i];
      }
      return 'public';
    },

    roleHome(role) {
      const map = {
        'food-provider': 'food-provider/dashboard.html',
        'canteen-manager': 'canteen-manager/dashboard.html',
        parent: 'parent/home.html',
        student: 'student/home.html',
        'school-admin': 'school-admin/dashboard.html',
        'super-admin': 'super-admin/schools.html'
      };
      return map[role] || 'index.html';
    },

    roleHref(targetRole) {
      const base = this.getBasePath();
      const current = this.getRole();
      const home = this.roleHome(targetRole);
      if (current === 'public') return home;
      if (current === targetRole) {
        return home.split('/').pop();
      }
      return base + home;
    },

    fpLinks: [
      { href: 'dashboard.html', icon: 'bi-grid-1x2', labelKey: 'dashboard', id: 'dashboard' },
      { href: 'canteens.html', icon: 'bi-shop', labelKey: 'canteens', id: 'canteens' },
      { href: 'menus.html', icon: 'bi-journal-richtext', labelKey: 'menus', id: 'menus' },
      { href: 'products.html', icon: 'bi-box-seam', labelKey: 'products', id: 'products' },
      { href: 'orders.html', icon: 'bi-bag-check', labelKey: 'orders', id: 'orders' },
      { href: 'calendar.html', icon: 'bi-calendar3', labelKey: 'calendar', id: 'calendar' },
      { href: 'reports.html', icon: 'bi-bar-chart', labelKey: 'reports', id: 'reports' },
      { href: 'settings.html', icon: 'bi-gear', labelKey: 'settings', id: 'settings' }
    ],

    cmLinks: [
      { href: 'dashboard.html', icon: 'bi-grid-1x2', labelKey: 'dashboard', id: 'dashboard' },
      { href: 'settings.html#canteen', icon: 'bi-shop-window', labelKey: 'myCanteen', id: 'my-canteen' },
      { href: 'my-menu.html', icon: 'bi-journal-richtext', labelKey: 'myMenus', id: 'menus' },
      { href: 'orders.html', icon: 'bi-bag-check', labelKey: 'orders', id: 'orders' },
      { href: 'schedule.html', icon: 'bi-calendar3', labelKey: 'schedule', id: 'schedule' },
      { href: 'discounts.html', icon: 'bi-percent', labelKey: 'discounts', id: 'discounts' },
      { href: 'reports.html', icon: 'bi-bar-chart', labelKey: 'reports', id: 'reports' },
      { href: 'settings.html', icon: 'bi-gear', labelKey: 'settings', id: 'settings' }
    ],

    parentLinks: [
      { href: 'home.html', icon: 'bi-house-heart', labelKey: 'home', id: 'home' },
      { href: 'order.html', icon: 'bi-bag-plus', labelKey: 'orderFood', id: 'order' },
      { href: 'children.html', icon: 'bi-people', labelKey: 'myChildren', id: 'children' },
      { href: 'wallet.html', icon: 'bi-wallet2', labelKey: 'wallet', id: 'wallet' },
      { href: 'orders.html', icon: 'bi-receipt', labelKey: 'myOrders', id: 'orders' },
      { href: 'calendar.html', icon: 'bi-calendar3', labelKey: 'calendar', id: 'calendar' },
      { href: 'settings.html', icon: 'bi-gear', labelKey: 'settings', id: 'settings' }
    ],

    studentLinks: [
      { href: 'home.html', icon: 'bi-house', labelKey: 'home', id: 'home' },
      { href: 'order.html', icon: 'bi-bag-plus', labelKey: 'orderFood', id: 'order' },
      { href: 'orders.html', icon: 'bi-receipt', labelKey: 'myOrders', id: 'orders' },
      { href: 'wallet.html', icon: 'bi-wallet2', labelKey: 'wallet', id: 'wallet' },
      { href: 'calendar.html', icon: 'bi-calendar3', labelKey: 'calendar', id: 'calendar' },
      { href: 'profile.html', icon: 'bi-person', labelKey: 'profile', id: 'profile' }
    ],

    schoolAdminLinks: [
      { href: 'dashboard.html', icon: 'bi-grid-1x2', labelKey: 'dashboard', id: 'dashboard' },
      { href: 'grades.html', icon: 'bi-mortarboard', labelKey: 'gradesClasses', id: 'grades' },
      { href: 'breaks.html', icon: 'bi-clock', labelKey: 'breaks', id: 'breaks' },
      { href: 'canteens.html', icon: 'bi-shop', labelKey: 'canteens', id: 'canteens' },
      { href: 'orders.html', icon: 'bi-bag-check', labelKey: 'orders', id: 'orders' },
      { href: 'settings.html', icon: 'bi-gear', labelKey: 'settings', id: 'settings' }
    ],

    superAdminLinks: [
      { href: 'schools.html', icon: 'bi-building', labelKey: 'schools', id: 'schools' },
      { href: 'dashboard.html', icon: 'bi-speedometer2', labelKey: 'dashboard', id: 'dashboard' }
    ],

    linksFor(role) {
      const map = {
        'food-provider': this.fpLinks,
        'canteen-manager': this.cmLinks,
        parent: this.parentLinks,
        student: this.studentLinks,
        'school-admin': this.schoolAdminLinks,
        'super-admin': this.superAdminLinks
      };
      return map[role] || [];
    },

    roleLabelKey(role) {
      const map = {
        'food-provider': 'foodProvider',
        'canteen-manager': 'canteenManager',
        parent: 'parent',
        student: 'student',
        'school-admin': 'schoolAdmin',
        'super-admin': 'superAdmin'
      };
      return map[role] || role;
    },

    detectActivePage() {
      const file = (window.location.pathname.split('/').pop() || '').replace('.html', '');
      const hash = (window.location.hash || '').replace('#', '');
      if (file === 'home') return 'home';
      if (file === 'menu-editor' || file === 'menu-details' || file === 'create-menu') return 'menus';
      if (file === 'my-menu' || file === 'my-menus') return 'menus';
      if (file === 'canteen-details') return 'canteens';
      if (file === 'order-details') return 'orders';
      if (file === 'child-details') return 'children';
      if (file === 'school-details') return 'schools';
      if (file === 'products') return 'products';
      if (file === 'reports') return 'reports';
      if (file === 'schedule') return 'schedule';
      if (file === 'discounts') return 'discounts';
      if (file === 'calendar') return 'calendar';
      if (file === 'order') return 'order';
      if (file === 'settings') {
        if (this.getRole() === 'canteen-manager' && hash === 'canteen') return 'my-canteen';
        return 'settings';
      }
      if (file.includes('canteen')) return 'canteens';
      if (file.includes('order')) return 'orders';
      if (file.includes('menu')) return 'menus';
      if (file.includes('child')) return 'children';
      if (file.includes('wallet')) return 'wallet';
      if (file.includes('grade')) return 'grades';
      if (file.includes('break')) return 'breaks';
      if (file.includes('school')) return 'schools';
      if (file.includes('profile')) return 'profile';
      if (file.includes('calendar')) return 'calendar';
      if (file.includes('product')) return 'products';
      if (file.includes('report')) return 'reports';
      if (file.includes('schedule')) return 'schedule';
      if (file.includes('discount')) return 'discounts';
      return file === 'dashboard' ? 'dashboard' : (file || 'dashboard');
    },

    getUser(role) {
      const cfg = APP_CONFIG.roles;
      const av = SchoolFoodSeed.avatars || {};
      const map = {
        'food-provider': cfg.foodProvider,
        'canteen-manager': cfg.canteenManager,
        parent: cfg.parent,
        student: cfg.student,
        'school-admin': cfg.schoolAdmin,
        'super-admin': cfg.superAdmin
      };
      const u = map[role] || cfg.foodProvider;
      return {
        name: u.name,
        email: u.email,
        avatar: av[u.avatarKey] || av.david
      };
    },

    renderSidebar(role) {
      const links = this.linksFor(role);
      const user = this.getUser(role);
      const active = this.detectActivePage();
      const brandSub = I18n.t(this.roleLabelKey(role));
      const mainLinks = links.filter((l) => !l.soon);
      const soonLinks = links.filter((l) => l.soon);

      const renderLink = (link) => {
        if (link.soon) {
          const label = link.soonLabel || I18n.t(link.labelKey);
          return `
            <button type="button" class="nav-link-app coming-soon" disabled aria-disabled="true">
              <i class="bi ${link.icon}" aria-hidden="true"></i>
              <span>${label}</span>
              <span class="coming-soon-badge">${I18n.t('comingSoon')}</span>
            </button>`;
        }
        const isActive = active === link.id;
        return `
          <a href="${link.href}" class="nav-link-app ${isActive ? 'active' : ''}"
             ${isActive ? 'aria-current="page"' : ''}>
            <i class="bi ${link.icon}" aria-hidden="true"></i>
            <span data-i18n="${link.labelKey}">${I18n.t(link.labelKey)}</span>
          </a>`;
      };

      return `
        <aside class="app-sidebar" id="appSidebar" aria-label="Main navigation">
          <div class="sidebar-brand">
            <div class="sidebar-brand-mark" aria-hidden="true"><i class="bi bi-cup-hot-fill"></i></div>
            <div class="sidebar-brand-text">
              ${I18n.t('appName')}
              <small>${brandSub}</small>
            </div>
          </div>
          <nav class="sidebar-nav">
            <div class="sidebar-label">Main</div>
            ${mainLinks.map(renderLink).join('')}
            ${soonLinks.length ? `<div class="sidebar-label">${I18n.t('comingSoon')}</div>${soonLinks.map(renderLink).join('')}` : ''}
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
      const user = this.getUser(role);
      const roleLabel = I18n.t(this.roleLabelKey(role));
      const base = this.getBasePath();
      const lang = I18n.lang;

      let contextTitle = options.title || '';
      let contextSub = options.subtitle || '';

      if (role === 'canteen-manager' && !options.title && typeof CanteenService !== 'undefined') {
        CanteenService.getById(APP_CONFIG.roles.canteenManager.canteenId).then((canteen) => {
          if (!canteen) return;
          $('.topbar-context h1').text(canteen.name);
          $('.topbar-context p').text(CanteenService.getSchoolName(canteen.schoolId));
        });
      }

      const roles = [
        ['food-provider', 'foodProvider', 'bi-building'],
        ['canteen-manager', 'canteenManager', 'bi-shop-window'],
        ['parent', 'parent', 'bi-heart'],
        ['student', 'student', 'bi-person-badge'],
        ['school-admin', 'schoolAdmin', 'bi-mortarboard'],
        ['super-admin', 'superAdmin', 'bi-shield-lock']
      ];

      const roleItems = roles.map(([r, key, icon]) =>
        `<li><a class="dropdown-item" href="${this.roleHref(r)}"><i class="bi ${icon}" aria-hidden="true"></i> ${I18n.t(key)}</a></li>`
      ).join('');

      return `
        <header class="app-topbar">
          <div class="topbar-left">
            <button type="button" class="sidebar-toggle" id="sidebarToggle" aria-label="Open menu" aria-controls="appSidebar" aria-expanded="false">
              <i class="bi bi-list" aria-hidden="true"></i>
            </button>
            <div class="topbar-context">
              ${contextTitle ? `<h1>${contextTitle}</h1>` : '<h1></h1>'}
              ${contextSub ? `<p>${contextSub}</p>` : '<p></p>'}
            </div>
          </div>
          <div class="topbar-right">
            <div class="lang-switcher btn-group" role="group" aria-label="${I18n.t('language')}">
              <button type="button" class="btn-app btn-sm-app ${lang === 'en' ? 'btn-primary-app' : 'btn-ghost-app'}" data-lang="en">EN</button>
              <button type="button" class="btn-app btn-sm-app ${lang === 'ar' ? 'btn-primary-app' : 'btn-ghost-app'}" data-lang="ar">العربية</button>
            </div>
            <div class="dropdown role-switcher">
              <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Switch demo role">
                <i class="bi bi-people" aria-hidden="true"></i>
                <span class="role-label">${roleLabel}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end dropdown-menu-app">${roleItems}</ul>
            </div>
            <div class="dropdown">
              <button class="user-menu-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="User menu">
                <img src="${user.avatar}" alt="" width="32" height="32">
                <span>${user.name.split(' ')[0]}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end dropdown-menu-app">
                <li><span class="dropdown-item-text text-muted small px-3">${user.email}</span></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="${base}index.html"><i class="bi bi-house" aria-hidden="true"></i> <span data-i18n="landingPage">${I18n.t('landingPage')}</span></a></li>
                <li><button type="button" class="dropdown-item" id="btnResetDemo"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> <span data-i18n="resetDemo">${I18n.t('resetDemo')}</span></button></li>
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
      if (!$shell.find('.app-sidebar').length) $shell.prepend(this.renderSidebar(role));
      const $main = $shell.find('.app-main');
      if ($main.length && !$main.find('.app-topbar').length) $main.prepend(this.renderTopbar(options));
      this.bindSidebar();
      this.bindLangSwitcher();
    },

    bindLangSwitcher() {
      $(document).off('click.lang').on('click.lang', '.lang-switcher [data-lang]', function () {
        I18n.setLang($(this).data('lang'));
        window.location.reload();
      });
    },

    bindSidebar() {
      const $sidebar = $('#appSidebar');
      const $overlay = $('#sidebarOverlay');
      const $toggle = $('#sidebarToggle');

      function closeSidebar() {
        $sidebar.removeClass('open');
        $overlay.removeClass('show').attr('hidden', true);
        $toggle.attr('aria-expanded', 'false');
      }

      function openSidebar() {
        $sidebar.addClass('open');
        $overlay.addClass('show').removeAttr('hidden');
        $toggle.attr('aria-expanded', 'true');
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
          title: I18n.t('resetDemo') + '?',
          text: 'This restores the original sample data for all roles.',
          confirmText: I18n.t('resetDemo'),
          danger: true
        });
        if (ok) App.resetDemo();
      });
    }
  };

  global.Navigation = Navigation;

  $(function () {
    if (Navigation.getRole() !== 'public') Navigation.mountLayout({});
  });
})(window, jQuery);
