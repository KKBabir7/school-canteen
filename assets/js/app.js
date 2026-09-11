/**
 * App bootstrap — init i18n, seed data, PWA install UI.
 */
(function (global, $) {
  'use strict';

  const App = {
    init() {
      // Migrate away from v1 storage key if needed
      if (!Storage.get('canteens') && localStorage.getItem('schoolFoodMVP')) {
        try {
          Storage.clearAll();
        } catch (e) { /* ignore */ }
      }

      // Ensure seed collections exist (when services are loaded)
      if (typeof SchoolFoodSeed !== 'undefined') {
        const keys = [
          ['canteens', 'canteens'],
          ['menus', 'menus'],
          ['products', 'products'],
          ['orders', 'orders'],
          ['settings', 'settings'],
          ['schools', 'schools'],
          ['grades', 'grades'],
          ['classes', 'classes'],
          ['breaks', 'breaks'],
          ['children', 'children'],
          ['wallets', 'wallets'],
          ['paymentMethods', 'paymentMethods'],
          ['discounts', 'discounts']
        ];
        keys.forEach(([storageKey, seedKey]) => {
          if (!Storage.get(storageKey) && SchoolFoodSeed[seedKey] !== undefined) {
            Storage.set(storageKey, Utils.clone(SchoolFoodSeed[seedKey]));
          }
        });
        // discounts seed lives in DiscountService if not on SchoolFoodSeed
        if (!Storage.get('discounts') && typeof DiscountService !== 'undefined') {
          DiscountService.getAll();
        }
      }

      if (typeof I18n !== 'undefined') I18n.init();
      this.bindLandingLang();
      this.initPwa();
    },

    bindLandingLang() {
      $('.lang-switcher button').on('click', function () {
        const lang = $(this).data('lang');
        I18n.setLang(lang);
        $('.lang-switcher button').removeClass('active');
        $(this).addClass('active');
      });
      // sync active button
      $('.lang-switcher button').removeClass('active');
      $(`.lang-switcher button[data-lang="${I18n.lang}"]`).addClass('active');
    },

    resetDemo() {
      Storage.clearAll();
      localStorage.removeItem('schoolFoodMVP');
      window.location.reload();
    },

    initPwa() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(this.swPath()).catch(() => {});
      }

      let deferred;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferred = e;
        this.showInstallBanner(deferred);
      });

      // iOS / already-installed: soft tip once
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
      if (isIos && !standalone && !Storage.get('pwaDismissed')) {
        setTimeout(() => this.showInstallBanner(null, true), 1800);
      }
    },

    swPath() {
      const path = location.pathname.replace(/\\/g, '/');
      const nested = ['food-provider', 'canteen-manager', 'parent', 'student', 'school-admin', 'super-admin'];
      if (nested.some((f) => path.includes('/' + f + '/'))) return '../sw.js';
      return 'sw.js';
    },

    showInstallBanner(deferred, iosTip) {
      if ($('#pwaInstallBanner').length) return;
      const $banner = $(`
        <div class="pwa-install-banner show" id="pwaInstallBanner" role="dialog" aria-label="Install">
          <div class="pwa-icon" aria-hidden="true"><i class="bi bi-phone"></i></div>
          <div class="pwa-text">
            <strong data-i18n="installApp">${t('installApp')}</strong>
            <p data-i18n="installAppText">${iosTip ? 'Share → Add to Home Screen' : t('installAppText')}</p>
          </div>
          <div class="d-flex gap-1 flex-shrink-0">
            <button type="button" class="btn-app btn-ghost-app btn-sm-app" id="pwaDismiss">${t('dismiss')}</button>
            ${deferred ? `<button type="button" class="btn-app btn-primary-app btn-sm-app" id="pwaInstall">${t('install')}</button>` : ''}
          </div>
        </div>`);
      $('body').append($banner);
      $('#pwaDismiss').on('click', () => {
        Storage.set('pwaDismissed', true);
        $banner.remove();
      });
      $('#pwaInstall').on('click', async () => {
        if (!deferred) return;
        deferred.prompt();
        await deferred.userChoice;
        $banner.remove();
      });
    }
  };

  global.App = App;

  $(function () {
    App.init();
  });
})(window, jQuery);
