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

    initSelect2InModal($modal) {
      $modal.on('shown.bs.modal', function () {
        const $m = $(this);
        $m.find('.select2-field').each(function () {
          const $el = $(this);
          if ($el.hasClass('select2-hidden-accessible')) {
            $el.select2('destroy');
          }
          Components.initializeSelect2($el, {
            dropdownParent: $m,
            placeholder: $el.data('placeholder') || I18n.t('search'),
            allowClear: !!$el.data('allow-clear'),
            multiple: $el.prop('multiple')
          });
        });
      });

      $modal.on('hidden.bs.modal', function () {
        $(this).find('.select2-field').each(function () {
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
