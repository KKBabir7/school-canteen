/**
 * Form helpers — validation, Select2 in modals, Flatpickr.
 */
(function (global, $) {
  'use strict';

  const Forms = {
    validateRequired($form) {
      let valid = true;
      $form.find('[required]').each(function () {
        const $field = $(this);
        const val = ($field.val() || '').toString().trim();
        const $group = $field.closest('.form-group-app');
        $group.find('.form-error').hide();
        $field.removeClass('is-invalid');

        if (!val) {
          valid = false;
          $field.addClass('is-invalid');
          let $err = $group.find('.form-error');
          if (!$err.length) {
            $err = $('<div class="form-error"></div>').appendTo($group);
          }
          $err.text(I18n.t('required')).show();
        }
      });
      return valid;
    },

    validateEmail(email) {
      return Utils.emailOk(email);
    },

    resetForm($form) {
      if (!$form || !$form.length) return;
      $form[0].reset();
      $form.find('.is-invalid').removeClass('is-invalid');
      $form.find('.form-error').hide();
      $form.find('select').each(function () {
        if ($(this).hasClass('select2-hidden-accessible')) {
          $(this).val(null).trigger('change');
        }
      });
      $form.find('.image-upload-preview').removeClass('show').attr('src', '');
      $form.find('.image-upload-placeholder').show();
    },

    bindImagePreview($input, $preview, $placeholder) {
      $input.on('change', function () {
        const file = this.files && this.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          Components.showToast('Please select an image file.', 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
          $preview.attr('src', e.target.result).addClass('show');
          $placeholder.hide();
        };
        reader.readAsDataURL(file);
      });
    },

    /**
     * Pick a dropdownParent that will not clip the menu.
     * Overlays (modal/swal/chip) keep their own parent; page selects use body
     * and get fixed positioning via pinSelect2Dropdown().
     */
    resolveSelect2Parent($el) {
      const $target = $el.first();
      const $overlay = $target.closest('.modal, .swal2-container .swal2-popup, .swal2-popup, .order-child-chip');
      if ($overlay.length) return $overlay;
      return $(document.body);
    },

    /** Keep body-attached Select2 menus aligned to the trigger (nested scroll + sticky topbar). */
    pinSelect2Dropdown($el) {
      const $target = $el.first();
      const inst = $target.data('select2');
      if (!inst || !inst.$container) return;

      const $container = inst.$container;
      const $dropdown = inst.dropdown && inst.dropdown.$dropdown
        ? inst.dropdown.$dropdown
        : $container.find('.select2-dropdown').add($('body > .select2-container--open .select2-dropdown')).first();
      if (!$dropdown || !$dropdown.length) return;

      // Only pin when the menu is under body (page selects), not modal/chip
      if (!$dropdown.closest('body').length || $dropdown.closest('.modal, .swal2-popup, .order-child-chip').length) {
        return;
      }
      if ($dropdown.parent()[0] !== document.body && !$dropdown.closest('body > .select2-container').length) {
        // still OK — Select2 nests dropdown inside container which is under body
      }

      const rect = $container[0].getBoundingClientRect();
      const topbarEl = document.querySelector('.app-topbar');
      const topbarH = topbarEl ? topbarEl.getBoundingClientRect().bottom : 0;
      const ddH = $dropdown.outerHeight() || 200;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - topbarH - 8;
      const openBelow = spaceBelow >= Math.min(ddH, 140) || spaceBelow >= spaceAbove;

      let top;
      if (openBelow) {
        top = rect.bottom + 4;
        $dropdown.removeClass('select2-dropdown--above').addClass('select2-dropdown--below');
        $container.removeClass('select2-container--above').addClass('select2-container--below');
      } else {
        top = Math.max(topbarH + 4, rect.top - ddH - 4);
        $dropdown.removeClass('select2-dropdown--below').addClass('select2-dropdown--above');
        $container.removeClass('select2-container--below').addClass('select2-container--above');
      }

      $dropdown.css({
        position: 'fixed',
        top: top + 'px',
        left: rect.left + 'px',
        width: Math.max(rect.width, 120) + 'px',
        right: 'auto',
        zIndex: 10060
      });
    },

    initSelect2($el, options) {
      if (!$el || !$el.length || typeof $.fn.select2 !== 'function') return;
      const $target = $el.first();
      if ($target.hasClass('select2-hidden-accessible')) {
        $target.select2('destroy');
      }

      const opts = options || {};
      let dropdownParent = opts.dropdownParent;
      if (!dropdownParent || !dropdownParent.length) {
        dropdownParent = this.resolveSelect2Parent($target);
      } else if (!dropdownParent.closest('.modal, .swal2-popup, .order-child-chip').length) {
        // Page-level parents with overflow:hidden clip menus — prefer body + pin
        dropdownParent = $(document.body);
      }

      const cssClass = opts.dropdownCssClass
        || (dropdownParent.closest('.order-child-chip').length ? 'order-child-select2-dropdown' : 'app-select2-dropdown');

      Components.initializeSelect2($target, $.extend({
        placeholder: $target.data('placeholder') || I18n.t('search'),
        allowClear: $target.data('allow-clear') === true || $target.data('allow-clear') === 'true',
        multiple: $target.prop('multiple'),
        minimumResultsForSearch: $target.find('option').length > 8 ? 0 : Infinity,
        dropdownParent: dropdownParent,
        dropdownCssClass: cssClass
      }, opts, {
        dropdownParent: dropdownParent,
        dropdownCssClass: cssClass
      }));

      // Re-pin on open / scroll / resize so sticky topbar never covers the menu
      const pin = () => Forms.pinSelect2Dropdown($target);
      let pinBurst = null;
      $target.off('select2:open.appPin select2:closing.appPin');
      $target.on('select2:open.appPin', () => {
        const node = ($target.data('select2') && $target.data('select2').$container
          && $target.data('select2').$container[0]) || $target[0];
        if (node && typeof node.scrollIntoView === 'function') {
          const r = node.getBoundingClientRect();
          if (r.top < 72 || r.bottom > window.innerHeight - 24) {
            node.scrollIntoView({ block: 'center', inline: 'nearest' });
          }
        }
        pin();
        requestAnimationFrame(pin);
        // Select2 repositions after open — burst-pin briefly to win the race
        clearInterval(pinBurst);
        let n = 0;
        pinBurst = setInterval(() => {
          pin();
          if (++n > 12) clearInterval(pinBurst);
        }, 16);
        $(window).off('scroll.appPin resize.appPin').on('scroll.appPin resize.appPin', pin);
        $('.app-content, .app-main').off('scroll.appPin').on('scroll.appPin', pin);
      });
      $target.on('select2:closing.appPin', () => {
        clearInterval(pinBurst);
        $(window).off('scroll.appPin resize.appPin');
        $('.app-content, .app-main').off('scroll.appPin');
      });
    },

    initPageSelect2(selector) {
      const $fields = $(selector || 'select.select2-field').filter(function () {
        return !$(this).closest('.modal').length;
      });
      $fields.each((_, el) => {
        this.initSelect2($(el));
      });
    },

    initSelect2InModal($modal) {
      $modal.on('shown.bs.modal', function () {
        const $m = $(this);
        $m.find('select.select2-field, select.form-select-app').each(function () {
          Forms.initSelect2($(this), { dropdownParent: $m });
        });
      });

      $modal.on('hidden.bs.modal', function () {
        $(this).find('select.select2-field, select.form-select-app').each(function () {
          if ($(this).hasClass('select2-hidden-accessible')) {
            $(this).select2('destroy');
          }
        });
      });
    },

    initFlatpickr(selector, options) {
      if (typeof flatpickr === 'undefined') return null;
      const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!el) return null;
      return flatpickr(el, $.extend({
        dateFormat: 'Y-m-d',
        allowInput: true
      }, options || {}));
    }
  };

  global.Forms = Forms;
})(window, jQuery);
