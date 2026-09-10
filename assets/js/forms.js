/**
 * School Food Platform — Form Helpers
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
          $err.text('This field is required.').show();
        }
      });
      return valid;
    },

    validateEmail(email) {
      if (!email) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    resetForm($form) {
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
        $(this).find('.select2-field').each(function () {
          const $el = $(this);
          if ($el.hasClass('select2-hidden-accessible')) {
            $el.select2('destroy');
          }
          Components.initializeSelect2($el, {
            dropdownParent: $modal,
            placeholder: $el.data('placeholder') || 'Select...',
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
    }
  };

  global.Forms = Forms;
})(window, jQuery);
