/**
 * School Food Platform — Menu Builder
 */
(function (global, $) {
  'use strict';

  const MenuBuilder = {
    draft: null,

    initCreate() {
      this.draft = {
        id: AppState.uid('menu'),
        name: '',
        description: '',
        status: 'draft',
        availability: 'unavailable',
        lastUpdated: new Date().toISOString(),
        assignedCanteenIds: [],
        availabilityDates: null,
        sections: [
          { id: AppState.uid('sec'), name: 'Main Meals', status: 'active', items: [] },
          { id: AppState.uid('sec'), name: 'Drinks', status: 'active', items: [] },
          { id: AppState.uid('sec'), name: 'Snacks', status: 'active', items: [] }
        ]
      };

      this.renderSections();
      this.bindCreateForm();
      this.bindAddItemModal();
      this.bindNewProductModal();
    },

    renderSections() {
      const $el = $('#menuSectionsBuilder');
      if (!$el.length || !this.draft) return;

      $el.html(this.draft.sections.map((sec) => `
        <div class="section-block" data-section-id="${sec.id}" data-aos="fade-up">
          <div class="section-block-header">
            <h4>
              <span class="section-name-display">${sec.name}</span>
              <span class="translation-hint" title="Translation fields will be added in a later release">EN · +translations</span>
            </h4>
            <div class="d-flex align-items-center gap-2">
              ${Components.renderStatusBadge(sec.status)}
              <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-edit-section" data-id="${sec.id}" aria-label="Edit section">
                <i class="bi bi-pencil" aria-hidden="true"></i>
              </button>
              <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-delete-section" data-id="${sec.id}" aria-label="Delete section">
                <i class="bi bi-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div class="section-items">
            ${(sec.items || []).map((item) => {
              const product = AppState.getProduct(item.productId) || item._product;
              if (!product) return '';
              return `
                <div class="menu-item-row" data-item-id="${item.id}">
                  <img class="menu-item-img object-cover" src="${product.image}" alt="${product.name}" loading="lazy">
                  <div class="menu-item-info">
                    <strong>${product.name}</strong>
                    <span>${product.description || ''}</span>
                  </div>
                  <div class="menu-item-price">${AppState.formatMoney(item.menuPrice)}</div>
                  ${Components.renderStatusBadge(item.available !== false ? 'available' : 'unavailable')}
                  <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-remove-item" data-section="${sec.id}" data-item="${item.id}" aria-label="Remove item">
                    <i class="bi bi-x-lg" aria-hidden="true"></i>
                  </button>
                </div>`;
            }).join('') || '<div class="p-3 text-muted small">No items yet. Add products to this section.</div>'}
          </div>
          <div class="p-3 border-top">
            <button type="button" class="btn-app btn-outline-app btn-sm-app btn-add-item" data-section="${sec.id}">
              <i class="bi bi-plus-lg" aria-hidden="true"></i> Add Item
            </button>
          </div>
        </div>
      `).join(''));
    },

    bindCreateForm() {
      $('#btnAddSection').on('click', async () => {
        const { value: name } = await Swal.fire({
          title: 'Add section',
          input: 'text',
          inputPlaceholder: 'Section name (e.g. Desserts)',
          inputAttributes: { maxlength: 40 },
          showCancelButton: true,
          confirmButtonText: 'Add',
          confirmButtonColor: '#0c7a6f',
          inputValidator: (v) => !v && 'Please enter a section name'
        });
        if (!name) return;
        this.draft.sections.push({
          id: AppState.uid('sec'),
          name: name.trim(),
          status: 'active',
          items: []
        });
        this.renderSections();
      });

      $(document).on('click', '.btn-edit-section', async (e) => {
        const id = $(e.currentTarget).data('id');
        const sec = this.draft.sections.find((s) => s.id === id);
        if (!sec) return;
        const { value: name } = await Swal.fire({
          title: 'Edit section',
          input: 'text',
          inputValue: sec.name,
          showCancelButton: true,
          confirmButtonColor: '#0c7a6f'
        });
        if (!name) return;
        sec.name = name.trim();
        this.renderSections();
      });

      $(document).on('click', '.btn-delete-section', async (e) => {
        const id = $(e.currentTarget).data('id');
        if (this.draft.sections.length <= 1) {
          Components.showToast('Keep at least one section.', 'error');
          return;
        }
        const ok = await Components.showConfirm({
          title: 'Delete section?',
          text: 'Items in this section will also be removed.',
          confirmText: 'Delete',
          danger: true
        });
        if (!ok) return;
        this.draft.sections = this.draft.sections.filter((s) => s.id !== id);
        this.renderSections();
      });

      $(document).on('click', '.btn-remove-item', (e) => {
        const sectionId = $(e.currentTarget).data('section');
        const itemId = $(e.currentTarget).data('item');
        const sec = this.draft.sections.find((s) => s.id === sectionId);
        if (!sec) return;
        sec.items = sec.items.filter((i) => i.id !== itemId);
        this.renderSections();
      });

      $(document).on('click', '.btn-add-item', (e) => {
        this.currentSectionId = $(e.currentTarget).data('section');
        this.openAddItemModal();
      });

      $('#btnSaveMenu').on('click', () => this.saveMenu(false));
      $('#btnPublishMenu').on('click', () => this.saveMenu(true));
    },

    openAddItemModal() {
      const $modal = $('#addItemModal');
      const $product = $('#selectProduct');
      $product.html('<option value=""></option>' +
        AppState.data.products.map((p) => `<option value="${p.id}">${p.name} — ${AppState.formatMoney(p.price)}</option>`).join(''));

      $('#selectedProductPreview').hide();
      $('#addItemPrice').val('');
      $('#addItemAvailable').prop('checked', true);

      const modal = bootstrap.Modal.getOrCreateInstance($modal[0]);
      modal.show();
    },

    bindAddItemModal() {
      const $modal = $('#addItemModal');
      if (!$modal.length) return;
      Forms.initSelect2InModal($modal);

      $('#selectProduct').on('change', function () {
        const id = $(this).val();
        const product = AppState.getProduct(id);
        const $preview = $('#selectedProductPreview');
        if (!product) {
          $preview.hide();
          return;
        }
        $('#previewImg').attr('src', product.image).attr('alt', product.name);
        $('#previewName').text(product.name);
        $('#previewDesc').text(product.description || '');
        $('#previewPrice').text(AppState.formatMoney(product.price));
        $('#previewAvail').html(Components.renderStatusBadge(product.available ? 'available' : 'unavailable'));
        $('#addItemPrice').val(product.price);
        $preview.show();
      });

      $('#btnAddToMenu').on('click', () => {
        const productId = $('#selectProduct').val();
        const price = parseFloat($('#addItemPrice').val());
        if (!productId) {
          Components.showToast('Please select a product.', 'error');
          return;
        }
        if (isNaN(price) || price < 0) {
          Components.showToast('Please enter a valid menu price.', 'error');
          return;
        }

        const sec = this.draft.sections.find((s) => s.id === this.currentSectionId);
        if (!sec) return;

        sec.items.push({
          id: AppState.uid('mi'),
          productId: productId,
          menuPrice: price,
          available: $('#addItemAvailable').is(':checked')
        });

        bootstrap.Modal.getInstance($modal[0]).hide();
        Components.showToast('Item added to menu.', 'success');
        this.renderSections();
      });

      $('#btnOpenNewProduct').on('click', () => {
        bootstrap.Modal.getInstance($modal[0]).hide();
        setTimeout(() => {
          bootstrap.Modal.getOrCreateInstance($('#newProductModal')[0]).show();
        }, 300);
      });
    },

    bindNewProductModal() {
      const $modal = $('#newProductModal');
      if (!$modal.length) return;

      Forms.bindImagePreview(
        $('#productImage'),
        $('#productImagePreview'),
        $('#productImagePlaceholder')
      );

      $('#btnSaveProduct').on('click', () => {
        const $form = $('#newProductForm');
        if (!Forms.validateRequired($form)) return;

        const price = parseFloat($('#productPrice').val());
        if (isNaN(price) || price < 0) {
          Components.showToast('Enter a valid price.', 'error');
          return;
        }

        const imageSrc = $('#productImagePreview').hasClass('show')
          ? $('#productImagePreview').attr('src')
          : SchoolFoodMock.images.burger;

        const product = {
          id: AppState.uid('prd'),
          name: $('#productName').val().trim(),
          description: $('#productDesc').val().trim(),
          price: price,
          image: imageSrc,
          available: $('#productAvailable').is(':checked'),
          category: 'Main Meals'
        };

        AppState.data.products.push(product);

        const sec = this.draft.sections.find((s) => s.id === this.currentSectionId) || this.draft.sections[0];
        sec.items.push({
          id: AppState.uid('mi'),
          productId: product.id,
          menuPrice: price,
          available: product.available,
          _product: product
        });

        AppState.persist();
        bootstrap.Modal.getInstance($modal[0]).hide();
        Forms.resetForm($form);
        $('#productAvailable').prop('checked', true);
        Components.showToast(`"${product.name}" created and added to menu.`, 'success');
        this.renderSections();
      });
    },

    saveMenu(publish) {
      const name = $('#menuName').val().trim();
      if (!name) {
        Components.showToast('Menu name is required.', 'error');
        $('#menuName').addClass('is-invalid').focus();
        return;
      }

      const totalItems = this.draft.sections.reduce((s, sec) => s + sec.items.length, 0);
      if (totalItems === 0) {
        Components.showToast('Add at least one item before saving.', 'error');
        return;
      }

      this.draft.name = name;
      this.draft.description = $('#menuDescription').val().trim();
      this.draft.status = publish ? 'active' : ($('#menuStatus').val() || 'draft');
      if (publish) {
        this.draft.status = 'active';
        this.draft.availability = 'available';
      }
      this.draft.lastUpdated = new Date().toISOString();

      // Clean temp _product
      this.draft.sections.forEach((sec) => {
        sec.items.forEach((item) => { delete item._product; });
      });

      AppState.data.menus.unshift(deepClone(this.draft));
      AppState.data.activity.unshift({
        id: AppState.uid('act'),
        text: publish
          ? `Menu "${this.draft.name}" created and activated`
          : `Menu "${this.draft.name}" saved as ${this.draft.status}`,
        time: new Date().toISOString()
      });
      AppState.persist();

      Components.showSuccess(
        publish ? 'Menu published' : 'Menu saved',
        `"${this.draft.name}" is ready. You can assign it to canteens next.`
      ).then(() => {
        window.location.href = 'menu-details.html?id=' + this.draft.id;
      });
    }
  };

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  global.MenuBuilder = MenuBuilder;
})(window, jQuery);
