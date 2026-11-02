/**
 * School Admin — grades, classes, breaks, canteens view, school settings.
 */
(function (global, $) {
  'use strict';

  const SchoolAdminApp = {
    schoolId() {
      if (typeof Session !== 'undefined' && Session.profile() && Session.profile().schoolId) {
        return Session.profile().schoolId;
      }
      return APP_CONFIG.roles.schoolAdmin.schoolId;
    },

    initSwalSelect2(selectors, multi) {
      if (typeof Forms === 'undefined') return;
      const $parent = $('.swal2-popup');
      (selectors || []).forEach((sel) => {
        Forms.initSelect2($(sel), {
          dropdownParent: $parent,
          width: '100%',
          minimumResultsForSearch: Infinity,
          multiple: !!multi,
          dropdownCssClass: 'swal-select2-dropdown'
        });
      });
    },

    async initDashboard() {
      const school = await SchoolService.getSchoolById(this.schoolId());
      const grades = await SchoolService.getGrades(this.schoolId());
      const classes = await SchoolService.getClasses(this.schoolId());
      const breaks = await SchoolService.getBreaks(this.schoolId());
      const canteens = (await CanteenService.getAll()).filter((c) => c.schoolId === this.schoolId());

      $('#saSchoolName').text(Utils.localized(school.name));
      $('#statGrades').text(grades.length);
      $('#statClasses').text(classes.length);
      $('#statBreaks').text(breaks.length);
      $('#statCanteens').text(canteens.length);

      if ($('.topbar-context').length) {
        $('.topbar-context h1').text(Utils.localized(school.name));
        $('.topbar-context p').text(I18n.t('schoolAdmin') || 'School Admin');
      }

      $('#dashCanteens').html(canteens.slice(0, 4).map((c) => `
        <div class="parent-activity-row">
          <div>
            <strong>${c.name}</strong>
            <div class="small text-muted">${c.phone || c.email || '—'}</div>
          </div>
          ${Components.renderStatusBadge(c.status)}
        </div>`).join('') || `<p class="text-muted mb-0">${I18n.t('noCanteens')}</p>`);

      $('#dashBreaks').html(breaks.slice(0, 5).map((b) => `
        <div class="parent-activity-row">
          <div>
            <strong>${Utils.localized(b.name)}</strong>
            <div class="small text-muted">${b.start} – ${b.end}</div>
          </div>
          <span class="small text-muted">${(b.days || []).length} days</span>
        </div>`).join('') || `<p class="text-muted mb-0">${I18n.t('breaks')}</p>`);
    },

    async initGrades() {
      const grades = await SchoolService.getGrades(this.schoolId());
      const classes = await SchoolService.getClasses(this.schoolId());
      $('#gradesList').html(grades.map((g) => {
        const cls = classes.filter((c) => c.gradeId === g.id);
        return `
          <div class="card-app mb-3" data-aos="fade-up">
            <div class="card-app-header">
              <h3><i class="bi bi-mortarboard" aria-hidden="true"></i> ${Utils.localized(g.name)}</h3>
              <button type="button" class="btn-app btn-outline-app btn-sm-app btn-add-class" data-grade="${g.id}">
                <i class="bi bi-plus-lg" aria-hidden="true"></i>
                ${I18n.t('addClass')}
              </button>
            </div>
            <div class="card-app-body">
              <div class="d-flex flex-wrap gap-2">
                ${cls.map((c) => `<span class="badge-app badge-primary">${c.name}</span>`).join('') || '<span class="text-muted">No classes</span>'}
              </div>
            </div>
          </div>`;
      }).join('') || Components.renderEmptyState('bi-mortarboard', I18n.t('grades'), I18n.t('addGrade')));

      $('#btnAddGrade').off('click').on('click', async () => {
        const { value: name } = await Swal.fire({
          title: I18n.t('addGrade'),
          input: 'text',
          inputPlaceholder: 'Grade 1',
          showCancelButton: true,
          confirmButtonColor: '#314D63',
          confirmButtonText: I18n.t('save')
        });
        if (!name) return;
        await SchoolService.createGrade({
          schoolId: this.schoolId(),
          name: { en: name, ar: name }
        });
        Components.showToast(I18n.t('success'), 'success');
        this.initGrades();
      });

      $(document).off('click.addClass').on('click.addClass', '.btn-add-class', async (e) => {
        const gradeId = $(e.currentTarget).data('grade');
        const { value: name } = await Swal.fire({
          title: I18n.t('addClass'),
          input: 'text',
          inputPlaceholder: '3A',
          showCancelButton: true,
          confirmButtonColor: '#314D63',
          confirmButtonText: I18n.t('save')
        });
        if (!name) return;
        await SchoolService.createClass({ schoolId: this.schoolId(), gradeId, name });
        Components.showToast(I18n.t('success'), 'success');
        this.initGrades();
      });
    },

    async initBreaks() {
      const breaks = await SchoolService.getBreaks(this.schoolId());
      const grades = await SchoolService.getGrades(this.schoolId());

      $('#breaksList').html(breaks.map((b) => `
        <article class="child-home-card" data-aos="fade-up">
          <div class="child-home-card-top">
            <div class="child-home-card-meta">
              <strong>${Utils.localized(b.name)}</strong>
              <span>${b.start} – ${b.end}</span>
            </div>
            <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-del-break" data-id="${b.id}" aria-label="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
          <div class="small text-muted mb-2">${(b.days || []).map((d) => I18n.t(d) || d).join(', ')}</div>
          <div class="d-flex flex-wrap gap-1">
            ${(b.gradeIds || []).map((gid) => {
              const g = grades.find((x) => x.id === gid);
              return g ? `<span class="badge-app badge-primary">${Utils.localized(g.name)}</span>` : '';
            }).join('') || '<span class="text-muted small">All grades</span>'}
          </div>
        </article>`).join('') || Components.renderEmptyState('bi-clock', 'No breaks', I18n.t('addBreak')));

      $('#btnAddBreak').off('click').on('click', async () => {
        const daysHtml = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((d) =>
          `<label class="check-item me-2 mb-1"><input type="checkbox" class="br-day" value="${d}" ${['sun', 'mon', 'tue', 'wed', 'thu'].includes(d) ? 'checked' : ''}> ${I18n.t(d)}</label>`
        ).join('');
        const gradeOpts = grades.map((g) =>
          `<option value="${g.id}" selected>${Utils.localized(g.name)}</option>`
        ).join('');

        const { value: ok } = await Swal.fire({
          title: I18n.t('addBreak'),
          width: 560,
          html: `
            <div class="text-start add-child-form">
              <label class="form-label-app">Name</label>
              <input id="brName" class="form-control-app mb-2" placeholder="Lunch">
              <label class="form-label-app">Days</label>
              <div class="mb-2 d-flex flex-wrap">${daysHtml}</div>
              <div class="row g-2 mb-2">
                <div class="col-6"><label class="form-label-app">Start</label><input id="brStart" type="time" class="form-control-app" value="12:00"></div>
                <div class="col-6"><label class="form-label-app">End</label><input id="brEnd" type="time" class="form-control-app" value="12:45"></div>
              </div>
              <label class="form-label-app">${I18n.t('grades')}</label>
              <select id="brGrades" class="select2-field" multiple>${gradeOpts}</select>
            </div>`,
          showCancelButton: true,
          confirmButtonColor: '#314D63',
          confirmButtonText: I18n.t('save'),
          didOpen: () => this.initSwalSelect2(['#brGrades'], true),
          preConfirm: () => true
        });
        if (!ok) return;
        const days = [];
        $('.br-day:checked').each(function () { days.push($(this).val()); });
        const gradeIds = ($('#brGrades').val() || []).slice();
        await SchoolService.createBreak({
          schoolId: this.schoolId(),
          name: { en: $('#brName').val() || 'Break', ar: $('#brName').val() || 'استراحة' },
          days,
          start: $('#brStart').val(),
          end: $('#brEnd').val(),
          gradeIds: gradeIds.length ? gradeIds : grades.map((g) => g.id)
        });
        Components.showToast(I18n.t('success'), 'success');
        this.initBreaks();
      });

      $(document).off('click.delBr').on('click.delBr', '.btn-del-break', async (e) => {
        await SchoolService.deleteBreak($(e.currentTarget).data('id'));
        Components.showToast(I18n.t('success'), 'success');
        this.initBreaks();
      });
    },

    async initCanteens() {
      const all = (await CanteenService.getAll()).filter((c) => c.schoolId === this.schoolId());
      let status = 'all';
      let query = '';

      const activeCount = all.filter((c) => String(c.status || '').toLowerCase() === 'active').length;
      const menuCount = all.reduce((n, c) => n + ((c.assignedMenuIds || []).length), 0);
      $('#saCanteenTotal').text(all.length);
      $('#saCanteenActive').text(activeCount);
      $('#saCanteenMenus').text(menuCount);
      $('#saCanteenInactive').text(Math.max(0, all.length - activeCount));

      if (typeof Forms !== 'undefined' && $('#saCanteenStatus').length) {
        Forms.initSelect2($('#saCanteenStatus'), {
          width: '100%',
          minimumResultsForSearch: Infinity
        });
      }

      const render = () => {
        let list = all.slice();
        if (status !== 'all') {
          list = list.filter((c) => String(c.status || '').toLowerCase() === status);
        }
        if (query) {
          list = list.filter((c) =>
            (c.name || '').toLowerCase().includes(query) ||
            (c.email || '').toLowerCase().includes(query) ||
            (c.phone || '').toLowerCase().includes(query));
        }

        $('#saCanteens').html(list.map((c) => {
          const menus = (c.assignedMenuIds || []).length;
          const st = String(c.status || 'active').toLowerCase();
          return `
          <div class="canteen-card" data-aos="fade-up">
            <div class="canteen-card-top">
              <div>
                <h3>${c.name}</h3>
                <p class="school-name">${c.email || '—'}</p>
              </div>
              ${Components.renderStatusBadge(st)}
            </div>
            <div class="canteen-meta">
              <span><i class="bi bi-telephone" aria-hidden="true"></i> ${c.phone || '—'}</span>
              <span><i class="bi bi-journal-richtext" aria-hidden="true"></i> ${menus} menus</span>
            </div>
            <div class="canteen-card-actions">
              <a href="orders.html" class="btn-app btn-outline-app btn-sm-app">
                <i class="bi bi-bag-check" aria-hidden="true"></i>
                <span data-i18n="orders">Orders</span>
              </a>
            </div>
          </div>`;
        }).join('') || Components.renderEmptyState('bi-shop', I18n.t('noCanteens'), ''));
      };

      render();
      $('#saCanteenStatus').off('change.saCanteen').on('change.saCanteen', function () {
        status = $(this).val() || 'all';
        render();
      });
      $('#saCanteenSearch').off('input.saCanteen').on('input.saCanteen', function () {
        query = ($(this).val() || '').toLowerCase().trim();
        render();
      });
    },

    async initSettings() {
      const school = await SchoolService.getSchoolById(this.schoolId());
      $('#schNameEn').val(school.name.en || '');
      $('#schNameAr').val(school.name.ar || '');
      $('#schPhone').val(school.phone || '');
      $('#schEmail').val(school.email || '');
      $('#schCity').val(school.city || '');
      $('#saSettingsSchoolName').text(Utils.localized(school.name));
      $('#saSettingsEmail').text(school.email || '—');

      const tz = school.timezone || 'Asia/Jerusalem';
      if ($('#schTimezone option[value="' + tz + '"]').length) {
        $('#schTimezone').val(tz);
      } else {
        $('#schTimezone').append(`<option value="${tz}" selected>${tz}</option>`);
      }
      $('#schCurrency').val(school.currency || 'ILS');
      $('#schAdvance').val(school.advanceOrderDays || 7);
      $('#schCancel').val(school.cancelDeadlineHours || 2);
      $('#schParentsOrder').prop('checked', !!school.canParentsOrder);
      $('#schStudentsOrder').prop('checked', !!school.canStudentsOrder);
      (school.schoolDays || []).forEach((d) => $(`#day-${d}`).prop('checked', true));

      const prefLang = (typeof I18n !== 'undefined' && I18n.lang) ? I18n.lang : 'en';
      if ($('#schLang').length) {
        $('#schLang').val(prefLang === 'ar' ? 'ar' : 'en');
      }

      if (typeof Forms !== 'undefined') {
        ['#schTimezone', '#schCurrency', '#schLang'].forEach((sel) => {
          if ($(sel).length) {
            Forms.initSelect2($(sel), {
              width: '100%',
              minimumResultsForSearch: Infinity
            });
          }
        });
      }

      $('#schLang').off('change.saLang').on('change.saLang', function () {
        const lang = $(this).val() || 'en';
        if (typeof I18n !== 'undefined' && typeof I18n.setLang === 'function') {
          I18n.setLang(lang);
        } else if (typeof Storage !== 'undefined') {
          Storage.set('lang', lang);
          document.documentElement.lang = lang;
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        }
      });

      $('#btnSaveSchoolSettings').off('click').on('click', async () => {
        const days = [];
        $('.sch-day:checked').each(function () { days.push($(this).val()); });
        await SchoolService.updateSchool(this.schoolId(), {
          name: { en: $('#schNameEn').val(), ar: $('#schNameAr').val() },
          phone: $('#schPhone').val(),
          email: $('#schEmail').val(),
          city: $('#schCity').val(),
          timezone: $('#schTimezone').val(),
          currency: $('#schCurrency').val(),
          advanceOrderDays: Number($('#schAdvance').val()),
          cancelDeadlineHours: Number($('#schCancel').val()),
          canParentsOrder: $('#schParentsOrder').is(':checked'),
          canStudentsOrder: $('#schStudentsOrder').is(':checked'),
          schoolDays: days
        });
        $('#saSettingsSchoolName').text($('#schNameEn').val() || Utils.localized(school.name));
        $('#saSettingsEmail').text($('#schEmail').val() || '—');
        Components.showToast(I18n.t('success'), 'success');
      });
    }
  };

  global.SchoolAdminApp = SchoolAdminApp;
})(window, jQuery);
