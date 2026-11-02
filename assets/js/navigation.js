/**
 * Multi-role sidebar + topbar (EN/AR).
 * Session.roles drives which menus appear — no in-app role switcher.
 */
(function (global, $) {
  'use strict';

  const ROLE_FOLDERS = [
    'food-provider', 'canteen-manager', 'parent', 'student', 'school-admin', 'super-admin'
  ];

  const ROLE_FOLDER_MAP = {
    'food-provider': 'food-provider',
    'canteen-manager': 'canteen-manager',
    parent: 'parent',
    student: 'student',
    'school-admin': 'school-admin',
    'super-admin': 'super-admin'
  };

  const Navigation = {
    getBasePath() {
      const path = window.location.pathname.replace(/\\/g, '/');
      if (ROLE_FOLDERS.some((f) => path.includes('/' + f + '/'))) return '../';
      return '';
    },

    /** Folder of the current HTML page (not session). */
    getPageRole() {
      const path = window.location.pathname.replace(/\\/g, '/');
      for (let i = 0; i < ROLE_FOLDERS.length; i++) {
        if (path.includes('/' + ROLE_FOLDERS[i] + '/')) return ROLE_FOLDERS[i];
      }
      return 'public';
    },

    /** @deprecated alias — prefer getPageRole / getSessionRoles */
    getRole() {
      return this.getPageRole();
    },

    getSessionRoles() {
      if (typeof Session !== 'undefined') {
        Session.ensureFromPageRole(this.getPageRole());
        const roles = Session.roles();
        if (roles.length) return roles;
      }
      const page = this.getPageRole();
      return page === 'public' ? [] : [page];
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

    primaryHome() {
      if (typeof Session !== 'undefined') {
        const s = Session.get();
        if (s && s.home) return s.home;
        const roles = this.getSessionRoles();
        if (roles.length) return this.roleHome(roles[0]);
      }
      return this.roleHome(this.getPageRole());
    },

    /**
     * Resolve href for a menu item belonging to a role folder,
     * relative to the current page folder.
     */
    hrefFor(role, fileHref) {
      const base = this.getBasePath();
      const pageRole = this.getPageRole();
      const folder = ROLE_FOLDER_MAP[role];
      const file = (fileHref || '').split('#')[0];
      const hash = (fileHref || '').includes('#') ? '#' + fileHref.split('#')[1] : '';
      if (!folder) return fileHref;
      if (pageRole === role) return file + hash;
      if (pageRole === 'public') return folder + '/' + file + hash;
      return base + folder + '/' + file + hash;
    },

    fpLinks: [
      { href: 'dashboard.html', icon: 'bi-speedometer2', labelKey: 'dashboard', id: 'fp-dashboard' },
      { href: 'canteens.html', icon: 'bi-shop-window', labelKey: 'canteens', id: 'fp-canteens' },
      { href: 'menus.html', icon: 'bi-journal-text', labelKey: 'menus', id: 'fp-menus' },
      { href: 'products.html', icon: 'bi-box-seam', labelKey: 'products', id: 'fp-products' },
      { href: 'orders.html', icon: 'bi-bag-check', labelKey: 'orders', id: 'fp-orders' },
      { href: 'calendar.html', icon: 'bi-calendar3', labelKey: 'calendar', id: 'fp-calendar' },
      { href: 'reports.html', icon: 'bi-graph-up-arrow', labelKey: 'reports', id: 'fp-reports' },
      { href: 'settings.html', icon: 'bi-gear', labelKey: 'settings', id: 'fp-settings' }
    ],

    cmLinks: [
      { href: 'dashboard.html', icon: 'bi-speedometer2', labelKey: 'dashboard', id: 'cm-dashboard' },
      { href: 'settings.html#canteen', icon: 'bi-shop', labelKey: 'myCanteen', id: 'cm-my-canteen' },
      { href: 'my-menu.html', icon: 'bi-journal-text', labelKey: 'myMenus', id: 'cm-menus' },
      { href: 'orders.html', icon: 'bi-bag-check', labelKey: 'orders', id: 'cm-orders' },
      { href: 'schedule.html', icon: 'bi-calendar-week', labelKey: 'schedule', id: 'cm-schedule' },
      { href: 'discounts.html', icon: 'bi-percent', labelKey: 'discounts', id: 'cm-discounts' },
      { href: 'reports.html', icon: 'bi-graph-up-arrow', labelKey: 'reports', id: 'cm-reports' },
      { href: 'settings.html', icon: 'bi-gear', labelKey: 'settings', id: 'cm-settings' }
    ],

    parentLinks: [
      { href: 'home.html', icon: 'bi-house-door', labelKey: 'home', id: 'par-home' },
      { href: 'order.html', icon: 'bi-cart3', labelKey: 'orderFood', id: 'par-order' },
      { href: 'children.html', icon: 'bi-people', labelKey: 'myChildren', id: 'par-children' },
      { href: 'wallet.html', icon: 'bi-wallet2', labelKey: 'wallet', id: 'par-wallet' },
      { href: 'orders.html', icon: 'bi-receipt', labelKey: 'myOrders', id: 'par-orders' },
      { href: 'calendar.html', icon: 'bi-calendar3', labelKey: 'calendar', id: 'par-calendar' },
      { href: 'settings.html', icon: 'bi-gear', labelKey: 'settings', id: 'par-settings' }
    ],

    studentLinks: [
      { href: 'home.html', icon: 'bi-house-door', labelKey: 'home', id: 'stu-home' },
      { href: 'order.html', icon: 'bi-cart3', labelKey: 'orderFood', id: 'stu-order' },
      { href: 'orders.html', icon: 'bi-receipt', labelKey: 'myOrders', id: 'stu-orders' },
      { href: 'wallet.html', icon: 'bi-wallet2', labelKey: 'wallet', id: 'stu-wallet' },
      { href: 'calendar.html', icon: 'bi-calendar3', labelKey: 'calendar', id: 'stu-calendar' },
      { href: 'profile.html', icon: 'bi-person-circle', labelKey: 'profile', id: 'stu-profile' }
    ],

    schoolAdminLinks: [
      { href: 'dashboard.html', icon: 'bi-speedometer2', labelKey: 'dashboard', id: 'sa-dashboard' },
      { href: 'grades.html', icon: 'bi-mortarboard', labelKey: 'gradesClasses', id: 'sa-grades' },
      { href: 'breaks.html', icon: 'bi-clock-history', labelKey: 'breaks', id: 'sa-breaks' },
      { href: 'canteens.html', icon: 'bi-shop-window', labelKey: 'canteens', id: 'sa-canteens' },
      { href: 'orders.html', icon: 'bi-bag-check', labelKey: 'orders', id: 'sa-orders' },
      { href: 'settings.html', icon: 'bi-gear', labelKey: 'settings', id: 'sa-settings' }
    ],

    superAdminLinks: [
      { href: 'dashboard.html', icon: 'bi-speedometer2', labelKey: 'dashboard', id: 'su-dashboard' },
      { href: 'schools.html', icon: 'bi-building', labelKey: 'schools', id: 'su-schools' }
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

    detectActiveId() {
      const pageRole = this.getPageRole();
      const file = (window.location.pathname.split('/').pop() || '').replace('.html', '');
      const hash = (window.location.hash || '').replace('#', '');
      let key = file;
      if (file === 'menu-editor' || file === 'menu-details' || file === 'create-menu') key = 'menus';
      else if (file === 'my-menu' || file === 'my-menus') key = 'menus';
      else if (file === 'canteen-details') key = 'canteens';
      else if (file === 'order-details') key = 'orders';
      else if (file === 'child-details') key = 'children';
      else if (file === 'school-details') key = 'schools';
      else if (file === 'settings' && pageRole === 'canteen-manager' && hash === 'canteen') key = 'my-canteen';
      else if (file.includes('canteen') && file !== 'settings') key = 'canteens';
      else if (file.includes('order') && file !== 'order') key = 'orders';
      else if (file === 'order') key = 'order';
      else if (file.includes('menu')) key = 'menus';
      else if (file.includes('child')) key = 'children';
      else if (file.includes('wallet')) key = 'wallet';
      else if (file.includes('grade')) key = 'grades';
      else if (file.includes('break')) key = 'breaks';
      else if (file.includes('school') && file !== 'schools') key = 'schools';
      else if (file.includes('profile')) key = 'profile';
      else if (file.includes('product')) key = 'products';
      else if (file.includes('report')) key = 'reports';
      else if (file.includes('schedule')) key = 'schedule';
      else if (file.includes('discount')) key = 'discounts';
      else if (file.includes('calendar')) key = 'calendar';
      else if (file === 'home') key = 'home';
      else if (file === 'dashboard') key = 'dashboard';
      else if (file === 'schools') key = 'schools';

      const prefix = {
        'food-provider': 'fp',
        'canteen-manager': 'cm',
        parent: 'par',
        student: 'stu',
        'school-admin': 'sa',
        'super-admin': 'su'
      }[pageRole];
      if (!prefix) return '';
      if (key === 'my-canteen') return 'cm-my-canteen';
      return prefix + '-' + key;
    },

    getUser() {
      const pageRole = this.getPageRole();
      const cfg = APP_CONFIG.roles;
      const av = (global.SchoolFoodSeed && SchoolFoodSeed.avatars) || {};
      const map = {
        'food-provider': cfg.foodProvider,
        'canteen-manager': cfg.canteenManager,
        parent: cfg.parent,
        student: cfg.student,
        'school-admin': cfg.schoolAdmin,
        'super-admin': cfg.superAdmin
      };
      const u = map[pageRole] || cfg.foodProvider;

      // Prefer page-role persona so student pages show Sarah, not the last FP login
      if (pageRole !== 'public' && u) {
        return {
          name: u.name,
          email: u.email,
          avatar: av[u.avatarKey] || av.david,
          roles: [pageRole]
        };
      }

      if (typeof Session !== 'undefined') {
        const p = Session.profile();
        if (p) return p;
      }

      return {
        name: u.name,
        email: u.email,
        avatar: av[u.avatarKey] || av.david,
        roles: [pageRole]
      };
    },

    renderSidebar() {
      // Nav follows the folder you are in (student/parent/…) so role pages stay clear
      const pageRole = this.getPageRole();
      const sessionRoles = this.getSessionRoles();
      const roles = pageRole !== 'public' ? [pageRole] : sessionRoles;
      const user = this.getUser();
      const active = this.detectActiveId();
      const multi = roles.length > 1;
      const brandSub = multi
        ? roles.map((r) => I18n.t(this.roleLabelKey(r))).join(' · ')
        : I18n.t(this.roleLabelKey(roles[0] || pageRole));

      const renderLink = (role, link) => {
        const href = this.hrefFor(role, link.href);
        const isActive = active === link.id;
        return `
          <a href="${href}" class="nav-link-app ${isActive ? 'active' : ''}"
             ${isActive ? 'aria-current="page"' : ''}>
            <i class="bi ${link.icon}" aria-hidden="true"></i>
            <span data-i18n="${link.labelKey}">${I18n.t(link.labelKey)}</span>
          </a>`;
      };

      let navHtml = '';
      roles.forEach((role) => {
        const links = this.linksFor(role);
        if (!links.length) return;
        if (multi) {
          navHtml += `<div class="sidebar-label">${I18n.t(this.roleLabelKey(role))}</div>`;
        } else {
          navHtml += `<div class="sidebar-label">Main</div>`;
        }
        navHtml += links.map((l) => renderLink(role, l)).join('');
      });

      return `
        <aside class="app-sidebar" id="appSidebar" aria-label="Main navigation">
          <div class="sidebar-brand">
            <div class="sidebar-brand-mark" aria-hidden="true"><i class="bi bi-cup-hot-fill"></i></div>
            <div class="sidebar-brand-text">
              ${I18n.t('appName')}
              <small>${brandSub}</small>
            </div>
          </div>
          <nav class="sidebar-nav">${navHtml}</nav>
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
      const user = this.getUser();
      const base = this.getBasePath();
      const lang = I18n.lang;
      const pageRole = this.getPageRole();
      const roles = pageRole !== 'public' ? [pageRole] : this.getSessionRoles();
      const roleChips = roles.map((r) => I18n.t(this.roleLabelKey(r))).join(' · ');

      let contextTitle = options.title || '';
      let contextSub = options.subtitle || '';

      if (pageRole === 'canteen-manager' && !options.title && typeof CanteenService !== 'undefined') {
        const canteenId = (typeof Session !== 'undefined' && Session.profile() && Session.profile().canteenId)
          || APP_CONFIG.roles.canteenManager.canteenId;
        CanteenService.getById(canteenId).then((canteen) => {
          if (!canteen) return;
          if (!$('.topbar-context h1').text()) $('.topbar-context h1').text(canteen.name);
          if (!$('.topbar-context p').text()) $('.topbar-context p').text(CanteenService.getSchoolName(canteen.schoolId));
        });
      }

      const flagSrc = lang === 'ar'
        ? 'https://flagcdn.com/w40/sa.png'
        : 'https://flagcdn.com/w40/gb.png';
      const langCode = lang === 'ar' ? 'ع' : 'EN';

      return `
        <header class="app-topbar">
          <div class="topbar-left">
            <button type="button" class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar" title="Collapse sidebar" aria-controls="appSidebar" aria-expanded="true">
              <i class="bi bi-text-indent-right" aria-hidden="true"></i>
            </button>
            <div class="topbar-context">
              ${contextTitle ? `<h1>${contextTitle}</h1>` : '<h1></h1>'}
              ${contextSub ? `<p>${contextSub}</p>` : '<p></p>'}
            </div>
          </div>
          <div class="topbar-right">
            <div class="dropdown topbar-lang">
              <button class="topbar-chip-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="${I18n.t('language')}">
                <img class="topbar-flag" src="${flagSrc}" width="18" height="12" alt="">
                <span>${langCode}</span>
                <i class="bi bi-chevron-down" aria-hidden="true"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end dropdown-menu-app topbar-dropdown">
                <li>
                  <button type="button" class="dropdown-item ${lang === 'en' ? 'active' : ''}" data-lang="en">
                    <img class="topbar-flag" src="https://flagcdn.com/w40/gb.png" width="18" height="12" alt=""> English
                  </button>
                </li>
                <li>
                  <button type="button" class="dropdown-item ${lang === 'ar' ? 'active' : ''}" data-lang="ar">
                    <img class="topbar-flag" src="https://flagcdn.com/w40/sa.png" width="18" height="12" alt=""> العربية
                  </button>
                </li>
              </ul>
            </div>

            <div class="dropdown topbar-notify">
              <button class="topbar-chip-btn topbar-icon-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="${I18n.t('notifications')}">
                <i class="bi bi-bell" aria-hidden="true"></i>
                <span class="topbar-notify-dot" aria-hidden="true"></span>
              </button>
              <div class="dropdown-menu dropdown-menu-end dropdown-menu-app topbar-dropdown topbar-notify-menu">
                <div class="topbar-notify-head">
                  <strong>${I18n.t('notifications')}</strong>
                  <span class="topbar-notify-count">3 new</span>
                </div>
                <button type="button" class="dropdown-item topbar-notify-item">
                  <span class="topbar-notify-icon"><i class="bi bi-bag-plus" aria-hidden="true"></i></span>
                  <span class="topbar-notify-copy">
                    <strong>New order #SC-10245</strong>
                    <small>Sarah Ahmed · just now</small>
                  </span>
                </button>
                <button type="button" class="dropdown-item topbar-notify-item">
                  <span class="topbar-notify-icon"><i class="bi bi-exclamation-circle" aria-hidden="true"></i></span>
                  <span class="topbar-notify-copy">
                    <strong>Item marked unavailable</strong>
                    <small>Pizza Slice · 12 min ago</small>
                  </span>
                </button>
                <button type="button" class="dropdown-item topbar-notify-item">
                  <span class="topbar-notify-icon"><i class="bi bi-check2-circle" aria-hidden="true"></i></span>
                  <span class="topbar-notify-copy">
                    <strong>Order ready for pickup</strong>
                    <small>#SC-10238 · 28 min ago</small>
                  </span>
                </button>
                <div class="topbar-notify-foot">
                  <span>Demo notifications</span>
                </div>
              </div>
            </div>

            <div class="dropdown topbar-user">
              <button class="user-menu-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="User menu">
                <img src="${user.avatar}" alt="" width="32" height="32">
                <span class="user-menu-copy">
                  <strong>${user.name.split(' ')[0]}</strong>
                  <small>${roleChips}</small>
                </span>
                <i class="bi bi-chevron-down user-menu-caret" aria-hidden="true"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end dropdown-menu-app topbar-dropdown topbar-user-menu">
                <li class="topbar-user-head">
                  <img src="${user.avatar}" alt="" width="40" height="40">
                  <div>
                    <strong>${user.name}</strong>
                    <span>${user.email}</span>
                    <em>${roleChips}</em>
                  </div>
                </li>
                <li><hr class="dropdown-divider"></li>
                <li>
                  <a class="dropdown-item" href="${base}index.html">
                    <i class="bi bi-house-door" aria-hidden="true"></i>
                    <span data-i18n="landingPage">${I18n.t('landingPage')}</span>
                  </a>
                </li>
                <li>
                  <button type="button" class="dropdown-item" id="btnResetDemo">
                    <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                    <span data-i18n="resetDemo">${I18n.t('resetDemo')}</span>
                  </button>
                </li>
                <li><hr class="dropdown-divider"></li>
                <li>
                  <a class="dropdown-item text-danger" href="${base}index.html" id="btnSignOutDemo">
                    <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
                    <span>Back to landing</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </header>`;
    },

    mountLayout(options) {
      const pageRole = this.getPageRole();
      if (pageRole === 'public') return;
      if (typeof Session !== 'undefined') Session.ensureFromPageRole(pageRole);
      const $shell = $('.app-shell');
      if (!$shell.length) return;
      if (!$shell.find('.app-sidebar').length) $shell.prepend(this.renderSidebar());
      const $main = $shell.find('.app-main');
      if ($main.length && !$main.find('.app-topbar').length) $main.prepend(this.renderTopbar(options));
      this.bindSidebar();
      this.bindLangSwitcher();
    },

    bindLangSwitcher() {
      $(document).off('click.lang').on('click.lang', '.lang-switcher [data-lang], .topbar-lang [data-lang]', function () {
        I18n.setLang($(this).data('lang'));
        window.location.reload();
      });
    },

    bindSidebar() {
      const $sidebar = $('#appSidebar');
      const $overlay = $('#sidebarOverlay');
      const $toggle = $('#sidebarToggle');
      const $icon = $toggle.find('i');

      function isMobile() {
        return window.matchMedia('(max-width: 991.98px)').matches;
      }

      function syncToggleIcon() {
        if (isMobile()) {
          $icon.attr('class', $sidebar.hasClass('open') ? 'bi bi-x-lg' : 'bi bi-text-indent-left');
          $toggle.attr('aria-expanded', $sidebar.hasClass('open') ? 'true' : 'false');
          $toggle.attr('title', $sidebar.hasClass('open') ? 'Close menu' : 'Open menu');
        } else {
          const collapsed = document.body.classList.contains('sidebar-collapsed');
          $icon.attr('class', collapsed ? 'bi bi-text-indent-left' : 'bi bi-text-indent-right');
          $toggle.attr('aria-expanded', collapsed ? 'false' : 'true');
          $toggle.attr('title', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
        }
      }

      function closeMobileSidebar() {
        $sidebar.removeClass('open');
        $overlay.removeClass('show').attr('hidden', true);
        syncToggleIcon();
      }

      function openMobileSidebar() {
        $sidebar.addClass('open');
        $overlay.addClass('show').removeAttr('hidden');
        syncToggleIcon();
      }

      function setCollapsed(on) {
        document.body.classList.toggle('sidebar-collapsed', !!on);
        try { localStorage.setItem('sf_sidebar_collapsed', on ? '1' : '0'); } catch (e) { /* ignore */ }
        syncToggleIcon();
      }

      try {
        if (!isMobile() && localStorage.getItem('sf_sidebar_collapsed') === '1') {
          document.body.classList.add('sidebar-collapsed');
        }
      } catch (e) { /* ignore */ }
      syncToggleIcon();

      $toggle.off('click.nav').on('click.nav', function () {
        if (isMobile()) {
          if ($sidebar.hasClass('open')) closeMobileSidebar();
          else openMobileSidebar();
        } else {
          setCollapsed(!document.body.classList.contains('sidebar-collapsed'));
        }
      });
      $overlay.off('click.nav').on('click.nav', closeMobileSidebar);
      $(document).off('keydown.nav').on('keydown.nav', function (e) {
        if (e.key === 'Escape' && $sidebar.hasClass('open')) closeMobileSidebar();
      });
      $(window).off('resize.nav').on('resize.nav', function () {
        if (!isMobile()) {
          closeMobileSidebar();
          syncToggleIcon();
        } else {
          document.body.classList.remove('sidebar-collapsed');
          syncToggleIcon();
        }
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
    if (Navigation.getPageRole() !== 'public') Navigation.mountLayout({});
  });
})(window, jQuery);
