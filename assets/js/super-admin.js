/**
 * Super Admin — schools CRUD + platform overview.
 */
(function (global, $) {
  'use strict';

  const SuperAdminApp = {
    initSwalSelect2(selectors) {
      if (typeof Forms === 'undefined') return;
      const $parent = $('.swal2-popup');
      (selectors || []).forEach((sel) => {
        Forms.initSelect2($(sel), {
          dropdownParent: $parent,
          width: '100%',
          minimumResultsForSearch: Infinity,
          dropdownCssClass: 'swal-select2-dropdown'
        });
      });
    },

    async initDashboard() {
      const schools = await SchoolService.getSchools();
      const canteens = typeof CanteenService !== 'undefined'
        ? await CanteenService.getAll()
        : (Storage.get('canteens') || []);

      const active = schools.filter((s) => String(s.status || '').toLowerCase() === 'active');
      $('#suTotal').text(schools.length);
      $('#suActive').text(active.length);
      $('#suInactive').text(Math.max(0, schools.length - active.length));
      $('#suCanteens').text(canteens.length);

      $('#suDashSchools').html(schools.slice(0, 6).map((s) => `
        <tr>
          <td>
            <strong>${Utils.localized(s.name)}</strong>
            <div class="small text-muted">${s.email || '—'}</div>
          </td>
          <td>${s.city || '—'}</td>
          <td>${Components.renderStatusBadge(s.status)}</td>
          <td class="text-end">
            <a class="btn-app btn-outline-app btn-sm-app" href="school-details.html?id=${s.id}">
              ${I18n.t('view')}
            </a>
          </td>
        </tr>`).join('') || `<tr><td colspan="4">${Components.renderEmptyState('bi-building', I18n.t('noSchools') || 'No schools', '')}</td></tr>`);

      $('#dashAddSchool').off('click.suDash').on('click.suDash', (e) => {
        e.preventDefault();
        this.openAddSchool();
      });
    },

    async initSchools() {
      const all = await SchoolService.getSchools();
      let status = 'all';
      let city = 'all';
      let query = '';

      const activeCount = all.filter((s) => String(s.status || '').toLowerCase() === 'active').length;
      $('#suSchTotal').text(all.length);
      $('#suSchActive').text(activeCount);
      $('#suSchInactive').text(Math.max(0, all.length - activeCount));

      const cities = [...new Set(all.map((s) => s.city).filter(Boolean))].sort();
      $('#suSchoolCity').html(
        `<option value="all">All cities</option>${cities.map((c) => `<option value="${c}">${c}</option>`).join('')}`
      );

      if (typeof Forms !== 'undefined') {
        ['#suSchoolStatus', '#suSchoolCity'].forEach((sel) => {
          if ($(sel).length) {
            Forms.initSelect2($(sel), {
              width: '100%',
              minimumResultsForSearch: sel === '#suSchoolCity' ? 0 : Infinity
            });
          }
        });
      }

      const render = () => {
        let list = all.slice();
        if (status !== 'all') {
          list = list.filter((s) => String(s.status || '').toLowerCase() === status);
        }
        if (city !== 'all') {
          list = list.filter((s) => s.city === city);
        }
        if (query) {
          list = list.filter((s) =>
            Utils.localized(s.name).toLowerCase().includes(query) ||
            (s.email || '').toLowerCase().includes(query) ||
            (s.city || '').toLowerCase().includes(query));
        }

        $('#schoolsTable').html(list.map((s) => `
          <tr>
            <td>
              <strong>${Utils.localized(s.name)}</strong>
              <div class="small text-muted">${s.phone || '—'}</div>
            </td>
            <td>${s.email || '—'}</td>
            <td>${s.city || '—'}</td>
            <td>${Components.renderStatusBadge(s.status)}</td>
            <td class="text-end text-nowrap">
              <a class="btn-app btn-outline-app btn-sm-app" href="school-details.html?id=${s.id}">
                <i class="bi bi-eye" aria-hidden="true"></i> ${I18n.t('view')}
              </a>
              <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-toggle-school" data-id="${s.id}">
                ${String(s.status).toLowerCase() === 'active' ? I18n.t('deactivate') : I18n.t('activate')}
              </button>
            </td>
          </tr>`).join('') || `<tr><td colspan="5" class="text-center text-muted py-4">${I18n.t('noSchools') || 'No schools'}</td></tr>`);

        $('#schoolsCards').html(list.map((s) => `
          <div class="canteen-card mb-3">
            <div class="canteen-card-top">
              <div>
                <h3>${Utils.localized(s.name)}</h3>
                <p class="school-name">${s.email || '—'} · ${s.city || '—'}</p>
              </div>
              ${Components.renderStatusBadge(s.status)}
            </div>
            <div class="canteen-card-actions">
              <a class="btn-app btn-outline-app btn-sm-app" href="school-details.html?id=${s.id}">${I18n.t('view')}</a>
              <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-toggle-school" data-id="${s.id}">
                ${String(s.status).toLowerCase() === 'active' ? I18n.t('deactivate') : I18n.t('activate')}
              </button>
            </div>
          </div>`).join('') || Components.renderEmptyState('bi-building', I18n.t('noSchools') || 'No schools', ''));
      };

      render();

      $('#suSchoolStatus').off('change.suSch').on('change.suSch', function () {
        status = $(this).val() || 'all';
        render();
      });
      $('#suSchoolCity').off('change.suSch').on('change.suSch', function () {
        city = $(this).val() || 'all';
        render();
      });
      $('#suSchoolSearch').off('input.suSch').on('input.suSch', function () {
        query = ($(this).val() || '').toLowerCase().trim();
        render();
      });

      $('#btnAddSchool').off('click').on('click', () => this.openAddSchool());
      $(document).off('click.toggleSch').on('click.toggleSch', '.btn-toggle-school', async (e) => {
        await SchoolService.toggleSchoolStatus($(e.currentTarget).data('id'));
        this.initSchools();
      });

      if (location.hash === '#add') {
        this.openAddSchool();
      }
    },

    async openAddSchool() {
      const { value: form } = await Swal.fire({
        title: I18n.t('addSchool'),
        width: 580,
        html: `
          <div class="text-start add-child-form">
            <div class="row g-2">
              <div class="col-md-6 form-group-app mb-0">
                <label class="form-label-app" for="sNameEn">${I18n.t('nameEn') || 'Name (EN)'} *</label>
                <input id="sNameEn" class="form-control-app" placeholder="School name">
              </div>
              <div class="col-md-6 form-group-app mb-0">
                <label class="form-label-app" for="sNameAr">${I18n.t('nameAr') || 'Name (AR)'} *</label>
                <input id="sNameAr" class="form-control-app" placeholder="اسم المدرسة" dir="rtl">
              </div>
              <div class="col-md-6 form-group-app mb-0">
                <label class="form-label-app" for="sPhone">${I18n.t('phone')}</label>
                <input id="sPhone" class="form-control-app" placeholder="+972 …">
              </div>
              <div class="col-md-6 form-group-app mb-0">
                <label class="form-label-app" for="sEmail">${I18n.t('email')}</label>
                <input id="sEmail" type="email" class="form-control-app" placeholder="info@school.edu">
              </div>
              <div class="col-md-6 form-group-app mb-0">
                <label class="form-label-app" for="sCountry">${I18n.t('country') || 'Country'} *</label>
                <select id="sCountry" class="select2-field" data-placeholder="Country">
                  <option value="IL">Israel (IL)</option>
                  <option value="PS">Palestine (PS)</option>
                  <option value="JO">Jordan (JO)</option>
                  <option value="SA">Saudi Arabia (SA)</option>
                  <option value="AE">UAE (AE)</option>
                </select>
              </div>
              <div class="col-md-6 form-group-app mb-0">
                <label class="form-label-app" for="sCity">${I18n.t('city')} *</label>
                <input id="sCity" class="form-control-app" placeholder="City">
              </div>
              <div class="col-md-6 form-group-app mb-0">
                <label class="form-label-app" for="sTz">${I18n.t('timezone')} *</label>
                <select id="sTz" class="select2-field" data-placeholder="Timezone">
                  <option value="Asia/Jerusalem" selected>Asia/Jerusalem</option>
                  <option value="Asia/Riyadh">Asia/Riyadh</option>
                  <option value="Asia/Dubai">Asia/Dubai</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div class="col-md-6 form-group-app mb-0">
                <label class="form-label-app" for="sCur">${I18n.t('currency')} *</label>
                <select id="sCur" class="select2-field" data-placeholder="Currency">
                  <option value="ILS" selected>ILS (₪)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>
            </div>
            <div class="small text-muted mt-3 mb-1">${I18n.t('weekdays')}</div>
            <div class="check-list d-flex flex-wrap gap-2">
              ${['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((d) =>
                `<label class="check-item"><input type="checkbox" class="s-day" value="${d}" ${['sun', 'mon', 'tue', 'wed', 'thu'].includes(d) ? 'checked' : ''}> ${I18n.t(d)}</label>`
              ).join('')}
            </div>
          </div>`,
        showCancelButton: true,
        confirmButtonText: I18n.t('save'),
        confirmButtonColor: '#314D63',
        didOpen: () => {
          this.initSwalSelect2(['#sCountry', '#sTz', '#sCur']);
        },
        preConfirm: () => {
          const days = [];
          $('.s-day:checked').each(function () { days.push($(this).val()); });
          const nameEn = ($('#sNameEn').val() || '').trim();
          const cityVal = ($('#sCity').val() || '').trim();
          if (!nameEn) {
            Swal.showValidationMessage('Name required');
            return false;
          }
          if (!cityVal) {
            Swal.showValidationMessage('City required');
            return false;
          }
          return {
            name: { en: nameEn, ar: ($('#sNameAr').val() || '').trim() || nameEn },
            phone: $('#sPhone').val(),
            email: $('#sEmail').val(),
            country: $('#sCountry').val(),
            city: cityVal,
            timezone: $('#sTz').val(),
            currency: $('#sCur').val(),
            schoolDays: days,
            status: 'active'
          };
        }
      });
      if (!form) return;
      await SchoolService.createSchool(form);
      Components.showToast(I18n.t('success'), 'success');
      if ($('#schoolsTable').length) this.initSchools();
      else if ($('#suDashSchools').length) this.initDashboard();
    },

    async initSchoolDetails() {
      const id = Components.getQueryParam('id') || 'sch-1';
      const school = await SchoolService.getSchoolById(id);
      if (!school) return;

      const name = Utils.localized(school.name);
      $('#sdName, #sdProfileName, #sdCrumb').text(name);
      $('#sdStatus').html(Components.renderStatusBadge(school.status));
      $('#sdStatusInline').html(Components.renderStatusBadge(school.status));
      $('#sdMeta').text([school.city, school.timezone, school.currency].filter(Boolean).join(' · ') || '—');
      $('#sdProfileEmail').text(school.email || '—');
      $('#sdProfileCity').text(school.city || '—');
      $('#sdProfilePhone').text(school.phone || '—');
      $('#sdProfileTz').text(school.timezone || '—');
      $('#sdCurrency').text(school.currency || '—');
      $('#sdTimezone').text(school.timezone || '—');
      $('#sdDays').text((school.schoolDays || []).map((d) => I18n.t(d) || d).join(', ') || '—');
      $('#sdAdvance').text(school.advanceOrderDays != null ? school.advanceOrderDays : '—');
      $('#sdCancel').text(school.cancelDeadlineHours != null ? `${school.cancelDeadlineHours}h` : '—');

      const grades = await SchoolService.getGrades(id);
      const classes = await SchoolService.getClasses(id);
      const canteens = (await CanteenService.getAll()).filter((c) => c.schoolId === id);
      const children = (await ChildService.getAll()).filter((c) => c.schoolId === id);

      $('#sdStatGrades').text(grades.length);
      $('#sdStatClasses').text(classes.length);
      $('#sdStatCanteens').text(canteens.length);
      $('#sdStatStudents').text(children.length);

      let gradeQuery = '';
      const renderGrades = () => {
        let list = grades.slice();
        if (gradeQuery) {
          list = list.filter((g) => Utils.localized(g.name).toLowerCase().includes(gradeQuery));
        }
        $('#tabGrades').html(list.map((g) => {
          const cls = classes.filter((c) => c.gradeId === g.id);
          return `
            <div class="canteen-card mb-3">
              <div class="canteen-card-top">
                <div>
                  <h3>${Utils.localized(g.name)}</h3>
                  <p class="school-name">${cls.length} ${I18n.t('classes') || 'classes'}</p>
                </div>
              </div>
              <div class="canteen-meta">
                ${cls.length
                  ? cls.map((c) => `<span><i class="bi bi-grid" aria-hidden="true"></i> ${c.name}</span>`).join('')
                  : '<span class="text-muted">—</span>'}
              </div>
            </div>`;
        }).join('') || Components.renderEmptyState('bi-mortarboard', I18n.t('noGrades') || 'No grades', ''));
      };
      renderGrades();
      $('#sdGradeSearch').off('input.sd').on('input.sd', function () {
        gradeQuery = ($(this).val() || '').toLowerCase().trim();
        renderGrades();
      });

      let canteenStatus = 'all';
      const renderCanteens = () => {
        let list = canteens.slice();
        if (canteenStatus !== 'all') {
          list = list.filter((c) => String(c.status || '').toLowerCase() === canteenStatus);
        }
        $('#tabCanteens').html(list.map((c) => `
          <div class="canteen-card">
            <div class="canteen-card-top">
              <div>
                <h3>${c.name}</h3>
                <p class="school-name">${c.email || '—'}</p>
              </div>
              ${Components.renderStatusBadge(c.status)}
            </div>
            <div class="canteen-meta">
              <span><i class="bi bi-telephone" aria-hidden="true"></i> ${c.phone || '—'}</span>
              <span><i class="bi bi-journal-richtext" aria-hidden="true"></i> ${(c.assignedMenuIds || []).length} menus</span>
            </div>
          </div>`).join('') || Components.renderEmptyState('bi-shop', I18n.t('noCanteens'), ''));
      };

      if (typeof Forms !== 'undefined' && $('#sdCanteenStatus').length) {
        Forms.initSelect2($('#sdCanteenStatus'), {
          width: '100%',
          minimumResultsForSearch: Infinity
        });
      }
      renderCanteens();
      $('#sdCanteenStatus').off('change.sd').on('change.sd', function () {
        canteenStatus = $(this).val() || 'all';
        renderCanteens();
      });

      const roles = [
        {
          icon: 'bi-person-badge',
          title: I18n.t('schoolAdmin') || 'School Admin',
          value: (APP_CONFIG.roles.schoolAdmin && APP_CONFIG.roles.schoolAdmin.name) || '—'
        },
        {
          icon: 'bi-shop',
          title: I18n.t('canteenManager') || 'Canteen Manager',
          value: (APP_CONFIG.roles.canteenManager && APP_CONFIG.roles.canteenManager.name) || '—'
        },
        {
          icon: 'bi-people',
          title: I18n.t('students') || 'Students',
          value: String(children.length)
        },
        {
          icon: 'bi-person-hearts',
          title: I18n.t('parents') || 'Parents',
          value: String([...new Set(children.map((c) => c.parentId).filter(Boolean))].length)
        }
      ];
      $('#tabUsers').html(roles.map((r) => `
        <div class="col-md-6">
          <div class="settings-card h-100">
            <h3><i class="bi ${r.icon}" aria-hidden="true"></i> ${r.title}</h3>
            <p class="mb-0 fs-5 fw-semibold" style="color:var(--commonColor,#314D63)">${r.value}</p>
          </div>
        </div>`).join(''));

      $('#btnToggleSchool').off('click').on('click', async () => {
        await SchoolService.toggleSchoolStatus(id);
        Components.showToast(I18n.t('success'), 'success');
        this.initSchoolDetails();
      });
    }
  };

  global.SuperAdminApp = SuperAdminApp;
})(window, jQuery);
