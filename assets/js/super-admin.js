/**
 * Super Admin — schools CRUD (utilitarian).
 */
(function (global, $) {
  'use strict';

  const SuperAdminApp = {
    async initDashboard() {
      const schools = await SchoolService.getSchools();
      $('#suTotal').text(schools.length);
      $('#suActive').text(schools.filter((s) => s.status === 'active').length);
      $('#suInactive').text(schools.filter((s) => s.status !== 'active').length);
    },

    async initSchools() {
      const schools = await SchoolService.getSchools();
      $('#schoolsTable').html(schools.map((s) => `
        <tr>
          <td><strong>${Utils.localized(s.name)}</strong><div class="small text-muted">${s.city || ''}</div></td>
          <td>${s.email || '—'}</td>
          <td>${Components.renderStatusBadge(s.status)}</td>
          <td class="text-end">
            <a class="btn-app btn-outline-app btn-sm-app" href="school-details.html?id=${s.id}">${I18n.t('view')}</a>
            <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-toggle-school" data-id="${s.id}">
              ${s.status === 'active' ? I18n.t('deactivate') : I18n.t('activate')}
            </button>
          </td>
        </tr>`).join(''));

      $('#btnAddSchool').off('click').on('click', () => this.openAddSchool());
      $(document).off('click.toggleSch').on('click.toggleSch', '.btn-toggle-school', async (e) => {
        await SchoolService.toggleSchoolStatus($(e.currentTarget).data('id'));
        this.initSchools();
      });
    },

    async openAddSchool() {
      const { value: form } = await Swal.fire({
        title: I18n.t('addSchool'),
        width: 560,
        html: `
          <div class="text-start">
            <input id="sNameEn" class="form-control-app mb-2" placeholder="School Name (EN) *">
            <input id="sNameAr" class="form-control-app mb-2" placeholder="اسم المدرسة *" dir="rtl">
            <input id="sPhone" class="form-control-app mb-2" placeholder="Phone">
            <input id="sEmail" class="form-control-app mb-2" placeholder="Email">
            <input id="sCountry" class="form-control-app mb-2" value="IL" placeholder="Country *">
            <input id="sCity" class="form-control-app mb-2" placeholder="City *">
            <input id="sTz" class="form-control-app mb-2" value="Asia/Jerusalem" placeholder="Timezone *">
            <input id="sCur" class="form-control-app mb-2" value="ILS" placeholder="Currency *">
            <div class="small text-muted mb-1">${I18n.t('weekdays')}</div>
            ${['sun','mon','tue','wed','thu','fri','sat'].map((d) =>
              `<label class="check-item d-inline-flex me-2"><input type="checkbox" class="s-day" value="${d}" ${['sun','mon','tue','wed','thu'].includes(d)?'checked':''}> ${I18n.t(d)}</label>`
            ).join('')}
          </div>`,
        showCancelButton: true,
        confirmButtonText: I18n.t('save'),
        confirmButtonColor: '#1a365d',
        preConfirm: () => {
          const days = [];
          $('.s-day:checked').each(function () { days.push($(this).val()); });
          const nameEn = $('#sNameEn').val().trim();
          if (!nameEn) { Swal.showValidationMessage('Name required'); return false; }
          return {
            name: { en: nameEn, ar: $('#sNameAr').val().trim() || nameEn },
            phone: $('#sPhone').val(),
            email: $('#sEmail').val(),
            country: $('#sCountry').val(),
            city: $('#sCity').val(),
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
      this.initSchools();
    },

    async initSchoolDetails() {
      const id = Components.getQueryParam('id') || 'sch-1';
      const school = await SchoolService.getSchoolById(id);
      if (!school) return;
      $('#sdName').text(Utils.localized(school.name));
      $('#sdStatus').html(Components.renderStatusBadge(school.status));
      $('#sdMeta').text(`${school.city || ''} · ${school.timezone || ''} · ${school.currency || ''}`);

      const grades = await SchoolService.getGrades(id);
      const classes = await SchoolService.getClasses(id);
      const canteens = (await CanteenService.getAll()).filter((c) => c.schoolId === id);
      const children = (await ChildService.getAll()).filter((c) => c.schoolId === id);

      $('#tabGrades').html(grades.map((g) => {
        const cls = classes.filter((c) => c.gradeId === g.id);
        return `<div class="mb-2"><strong>${Utils.localized(g.name)}</strong>: ${cls.map((c) => c.name).join(', ') || '—'}</div>`;
      }).join('') || '<p class="text-muted">—</p>');

      $('#tabCanteens').html(canteens.map((c) => `<div class="mb-2">${c.name} ${Components.renderStatusBadge(c.status)}</div>`).join('') || '<p class="text-muted">—</p>');
      $('#tabUsers').html(`
        <div class="mb-2">School Admin: ${APP_CONFIG.roles.schoolAdmin.name}</div>
        <div class="mb-2">Students/Children: ${children.length}</div>
        <div class="mb-2">Canteen Manager: ${APP_CONFIG.roles.canteenManager.name}</div>
      `);

      $('#btnToggleSchool').on('click', async () => {
        await SchoolService.toggleSchoolStatus(id);
        this.initSchoolDetails();
      });
    }
  };

  global.SuperAdminApp = SuperAdminApp;
})(window, jQuery);
