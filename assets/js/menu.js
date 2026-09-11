/**
 * MenuBuilder — menu-editor.html with bilingual fields.
 */
(function (global, $) {
  'use strict';

  const MenuBuilder = {
    draft: null,
    editId: null,
    activeSectionId: null,
    productMap: {},

    async init() {
      const products = await ProductService.getAll();
      products.forEach((p) => { this.productMap[p.id] = p; });
      this.editId = Components.getQueryParam('id');
      if (this.editId) {
        const menu = await MenuService.getById(this.editId);
        if (!menu) {
          window.location.href = 'menus.html';
          return;
        }
        this.draft = Utils.clone(menu);
        $('#pageMenuTitle').text(Utils.localized(menu.name));
        $('#menuNameEn').val(menu.name?.en || '');
        $('#menuNameAr').val(menu.name?.ar || '');
        $('#menuDescEn').val(menu.description?.en || '');
        $('#menuDescAr').val(menu.description?.ar || '');
        $('#menuStatus').val(menu.status || 'draft');
      } else {
        this.draft = {
          name: { en: '', ar: '' },
          description: { en: '', ar: '' },
          status: 'draft',
          sections: []
        };
      }

      this.renderSections();
      this.bindForm();
      this.bindAddSectionModal();
      this.bindAddItemModal();
      this.bindNewProductModal();
    },

    renderSections() {
      const $el = $('#menuSectionsBuilder');
      if (!$el.length || !this.draft) return;

      if (!this.draft.sections.length) {
        $el.html(`<p class="text-muted">${I18n.t('addSection')}</p>`);
        return;
      }

      $el.html(this.draft.sections.map((sec) => `
        <div class="section-block" data-section-id="${sec.id}" data-aos="fade-up">
          <div class="section-block-header">
            <h4>
              <span>${Utils.localized(sec.name)}</span>
              <span class="translation-hint small text-muted">EN / AR</span>
            </h4>
            <div class="d-flex align-items-center gap-2">
              ${Components.renderStatusBadge(sec.status || 'active')}
              <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-edit-section" data-id="${sec.id}">
                <i class="bi bi-pencil"></i>
              </button>
              <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-delete-section" data-id="${sec.id}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          <div class="section-items">
            ${(sec.items || []).map((item) => this.renderBuilderItemSync(sec.id, item)).join('') ||
              `<div class="p-3 text-muted small">${I18n.t('addItem')}</div>`}
          </div>
          <div class="p-3 border-top">
            <button type="button" class="btn-app btn-outline-app btn-sm-app btn-add-item" data-section="${sec.id}">
              <i class="bi bi-plus-lg"></i> ${I18n.t('addItem')}
            </button>
          </div>
        </div>
      `).join(''));

      $('.btn-add-item').on('click', (e) => {
        this.activeSectionId = $(e.currentTarget).data('section');
        bootstrap.Modal.getOrCreateInstance($('#addItemModal')[0]).show();
      });

      $('.btn-delete-section').on('click', async (e) => {
        const id = $(e.currentTarget).data('id');
        const ok = await Components.showConfirm({ title: I18n.t('delete'), danger: true });
        if (ok) {
          this.draft.sections = this.draft.sections.filter((s) => s.id !== id);
          this.renderSections();
        }
      });

      $('.btn-edit-section').on('click', (e) => {
        const sec = this.draft.sections.find((s) => s.id === $(e.currentTarget).data('id'));
        if (!sec) return;
        $('#sectionNameEn').val(sec.name?.en || '');
        $('#sectionNameAr').val(sec.name?.ar || '');
        $('#addSectionModal').data('edit-id', sec.id);
        bootstrap.Modal.getOrCreateInstance($('#addSectionModal')[0]).show();
      });

      $('.btn-remove-item').on('click', (e) => {
        const secId = $(e.currentTarget).data('section');
        const itemId = $(e.currentTarget).data('item');
        const sec = this.draft.sections.find((s) => s.id === secId);
        if (sec) sec.items = (sec.items || []).filter((i) => i.id !== itemId);
        this.renderSections();
      });
    },

    renderBuilderItemSync(secId, item) {
      const product = this.productMap[item.productId];
      if (!product) return '';
      return `
        <div class="menu-item-row" data-item-id="${item.id}">
          <img class="menu-item-img object-cover" src="${product.image}" alt="${Utils.localized(product.name)}" loading="lazy">
          <div class="menu-item-info">
            <strong>${Utils.localized(product.name)}</strong>
            <span>${Utils.localized(product.description)}</span>
          </div>
          <div class="menu-item-price">${Utils.money(item.menuPrice)}</div>
          <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-remove-item" data-section="${secId}" data-item="${item.id}">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>`;
    },

    bindForm() {
      $('#btnSaveMenu').on('click', () => this.save('draft'));
      $('#btnPublishMenu').on('click', () => this.save('active'));
    },

    validateMenu() {
      const nameEn = $('#menuNameEn').val().trim();
      const nameAr = $('#menuNameAr').val().trim();
      if (!nameEn || !nameAr) {
        Components.showToast(I18n.t('required'), 'error');
        return false;
      }
      if (!this.draft.sections.length) {
        Components.showToast(I18n.t('addSection'), 'error');
        return false;
      }
      for (const sec of this.draft.sections) {
        if (!sec.name?.en || !sec.name?.ar) {
          Components.showToast(I18n.t('sectionNameEn') + ' / ' + I18n.t('sectionNameAr'), 'error');
          return false;
        }
      }
      return true;
    },

    async save(status) {
      if (!this.validateMenu()) return;

      const payload = {
        nameEn: $('#menuNameEn').val().trim(),
        nameAr: $('#menuNameAr').val().trim(),
        descEn: $('#menuDescEn').val().trim(),
        descAr: $('#menuDescAr').val().trim(),
        status: status,
        sections: this.draft.sections
      };

      if (this.editId) {
        await MenuService.update(this.editId, {
          name: { en: payload.nameEn, ar: payload.nameAr },
          description: { en: payload.descEn, ar: payload.descAr },
          status: status,
          availability: status === 'active' ? 'available' : 'unavailable',
          sections: payload.sections
        });
      } else {
        const created = await MenuService.create(payload);
        this.editId = created.id;
      }

      Components.showSuccess(I18n.t('success'), status === 'active' ? I18n.t('activate') : I18n.t('draft'));
      setTimeout(() => {
        window.location.href = 'menus.html';
      }, 800);
    },

    bindAddSectionModal() {
      const $modal = $('#addSectionModal');
      Forms.initSelect2InModal($modal);

      $('#btnAddSection').on('click', () => {
        $('#sectionNameEn, #sectionNameAr').val('');
        $modal.removeData('edit-id');
        bootstrap.Modal.getOrCreateInstance($modal[0]).show();
      });

      $('#btnConfirmSection').on('click', () => {
        const en = $('#sectionNameEn').val().trim();
        const ar = $('#sectionNameAr').val().trim();
        if (!en || !ar) {
          Components.showToast(I18n.t('required'), 'error');
          return;
        }
        const editId = $modal.data('edit-id');
        if (editId) {
          const sec = this.draft.sections.find((s) => s.id === editId);
          if (sec) sec.name = { en, ar };
        } else {
          this.draft.sections.push({
            id: Utils.uid('sec'),
            name: { en, ar },
            status: 'active',
            items: []
          });
        }
        bootstrap.Modal.getInstance($modal[0]).hide();
        this.renderSections();
      });
    },

    bindAddItemModal() {
      const $modal = $('#addItemModal');
      Forms.initSelect2InModal($modal);

      $modal.on('shown.bs.modal', async () => {
        const products = await ProductService.getAll();
        const $sel = $('#itemProductSelect');
        if ($sel.hasClass('select2-hidden-accessible')) $sel.select2('destroy');
        $sel.empty().append('<option value=""></option>');
        products.forEach((p) => {
          $sel.append(`<option value="${p.id}" data-price="${p.price}">${Utils.localized(p.name)}</option>`);
        });
        Components.initializeSelect2($sel, {
          dropdownParent: $modal,
          placeholder: I18n.t('searchProducts'),
          allowClear: true
        });

        $sel.off('change').on('change', function () {
          const price = $(this).find(':selected').data('price');
          if (price) $('#itemMenuPrice').val(price);
        });
      });

      $('#btnConfirmItem').on('click', () => {
        const productId = $('#itemProductSelect').val();
        const price = Number($('#itemMenuPrice').val());
        if (!productId || !this.activeSectionId) {
          Components.showToast(I18n.t('required'), 'error');
          return;
        }
        const sec = this.draft.sections.find((s) => s.id === this.activeSectionId);
        if (!sec) return;
        sec.items = sec.items || [];
        sec.items.push({
          id: Utils.uid('mi'),
          productId: productId,
          menuPrice: price || 0,
          available: true
        });
        bootstrap.Modal.getInstance($modal[0]).hide();
        this.renderSections();
      });

      $('#btnShowCreateProduct').on('click', () => {
        bootstrap.Modal.getOrCreateInstance($('#newProductModal')[0]).show();
      });
    },

    bindNewProductModal() {
      const $modal = $('#newProductModal');
      Forms.initSelect2InModal($modal);

      $('#btnSaveProduct').on('click', async () => {
        const en = $('#productNameEn').val().trim();
        const ar = $('#productNameAr').val().trim();
        if (!en || !ar) {
          Components.showToast(I18n.t('required'), 'error');
          return;
        }
        const product = await ProductService.create({
          nameEn: en,
          nameAr: ar,
          descEn: $('#productDescEn').val().trim(),
          descAr: $('#productDescAr').val().trim(),
          price: Number($('#productPrice').val()) || 0
        });
        bootstrap.Modal.getInstance($modal[0]).hide();
        $('#itemProductSelect').append(`<option value="${product.id}" data-price="${product.price}">${Utils.localized(product.name)}</option>`).val(product.id).trigger('change');
        Components.showToast(I18n.t('success'), 'success');
      });
    }
  };

  global.MenuBuilder = MenuBuilder;
})(window, jQuery);
