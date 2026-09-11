/**
 * School Admin — grades, classes, breaks, canteens view, school settings.
 */
(function (global, $) {
  'use strict';

  const SchoolAdminApp = {
    schoolId() { return APP_CONFIG.roles.schoolAdmin.schoolId; },

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
    },

    async initGrades() {
      const grades = await SchoolService.getGrades(this.schoolId());
      const classes = await SchoolService.getClasses(this.schoolId());
      $('#gradesList').html(grades.map((g) => {
        const cls = classes.filter((c) => c.gradeId === g.id);
        return `
          <div class="card-app mb-3">
            <div class="card-app-header">
              <h3>${Utils.localized(g.name)}</h3>
              <button type="button" class="btn-app btn-outline-app btn-sm-app btn-add-class" data-grade="${g.id}">${I18n.t('addClass')}</button>
            </div>
            <div class="card-app-body">
              ${cls.map((c) => `<span class="badge-app badge-primary me-1 mb-1">${c.name}</span>`).join('') || '<span class="text-muted">No classes</span>'}
            </div>
          </div>`;
      }).join(''));

      $('#btnAddGrade').on('click', async () => {
        const { value: name } = await Swal.fire({
          title: I18n.t('addGrade'),
          input: 'text',
          showCancelButton: true,
          confirmButtonColor: '#1a365d'
        });
        if (!name) return;
        await SchoolService.createGrade({
          schoolId: this.schoolId(),
          name: { en: name, ar: name }
        });
        this.initGrades();
      });

      $(document).off('click.addClass').on('click.addClass', '.btn-add-class', async (e) => {
        const gradeId = $(e.currentTarget).data('grade');
        const { value: name } = await Swal.fire({
          title: I18n.t('addClass'),
          input: 'text',
          inputPlaceholder: '3A',
          showCancelButton: true,
          confirmButtonColor: '#1a365d'
        });
        if (!name) return;
        await SchoolService.createClass({ schoolId: this.schoolId(), gradeId, name });
        this.initGrades();
      });
    },

    async initBreaks() {
      const breaks = await SchoolService.getBreaks(this.schoolId());
      const grades = await SchoolService.getGrades(this.schoolId());
      $('#breaksList').html(breaks.map((b) => `
        <div class="card-app mb-3">
          <div class="card-app-header">
            <h3>${Utils.localized(b.name)}</h3>
            <button type="button" class="btn-app btn-ghost-app btn-sm-app btn-del-break" data-id="${b.id}"><i class="bi bi-trash"></i></button>
          </div>
          <div class="card-app-body small">
            <div>${(b.days || []).map((d) => I18n.t(d) || d).join(', ')}</div>
            <div>${b.start} – ${b.end}</div>
            <div class="text-muted">${(b.gradeIds || []).map((gid) => {
              const g = grades.find((x) => x.id === gid);
              return g ? Utils.localized(g.name) : '';
            }).filter(Boolean).join(', ')}</div>
          </div>
        </div>`).join('') || Components.renderEmptyState('bi-clock', 'No breaks', ''));

      $('#btnAddBreak').on('click', async () => {
        const daysHtml = ['sun','mon','tue','wed','thu','fri','sat'].map((d) =>
          `<label class="check-item me-2"><input type="checkbox" class="br-day" value="${d}" ${['sun','mon','tue','wed','thu'].includes(d)?'checked':''}> ${I18n.t(d)}</label>`
        ).join('');
        const { value: ok } = await Swal.fire({
          title: I18n.t('addBreak'),
          html: `<input id="brName" class="form-control-app mb-2" placeholder="Lunch">
            <div class="mb-2">${daysHtml}</div>
            <div class="d-flex gap-2"><input id="brStart" type="time" class="form-control-app" value="12:00"><input id="brEnd" type="time" class="form-control-app" value="12:45"></div>`,
          showCancelButton: true,
          confirmButtonColor: '#1a365d',
          preConfirm: () => true
        });
        if (!ok) return;
        const days = [];
        $('.br-day:checked').each(function () { days.push($(this).val()); });
        await SchoolService.createBreak({
          schoolId: this.schoolId(),
          name: { en: $('#brName').val() || 'Break', ar: $('#brName').val() || 'استراحة' },
          days,
          start: $('#brStart').val(),
          end: $('#brEnd').val(),
          gradeIds: grades.map((g) => g.id)
        });
        this.initBreaks();
      });

      $(document).off('click.delBr').on('click.delBr', '.btn-del-break', async (e) => {
        await SchoolService.deleteBreak($(e.currentTarget).data('id'));
        this.initBreaks();
      });
    },

    async initCanteens() {
      const canteens = (await CanteenService.getAll()).filter((c) => c.schoolId === this.schoolId());
      $('#saCanteens').html(canteens.map((c) => `
        <div class="canteen-card">
          <div class="canteen-card-top">
            <div><h3>${c.name}</h3><p class="school-name">${c.email || ''}</p></div>
            ${Components.renderStatusBadge(c.status)}
          </div>
          <div class="canteen-meta">
            <span>${c.phone || '—'}</span>
            <span>${(c.assignedMenuIds || []).length} menus</span>
          </div>
        </div>`).join('') || Components.renderEmptyState('bi-shop', I18n.t('noCanteens'), ''));
    },

    async initSettings() {
      const school = await SchoolService.getSchoolById(this.schoolId());
      $('#schNameEn').val(school.name.en || '');
      $('#schNameAr').val(school.name.ar || '');
      $('#schPhone').val(school.phone || '');
      $('#schEmail').val(school.email || '');
      $('#schCity').val(school.city || '');
      $('#schTimezone').val(school.timezone || '');
      $('#schCurrency').val(school.currency || 'ILS');
      $('#schAdvance').val(school.advanceOrderDays || 7);
      $('#schCancel').val(school.cancelDeadlineHours || 2);
      $('#schParentsOrder').prop('checked', !!school.canParentsOrder);
      $('#schStudentsOrder').prop('checked', !!school.canStudentsOrder);
      (school.schoolDays || []).forEach((d) => $(`#day-${d}`).prop('checked', true));

      $('#btnSaveSchoolSettings').on('click', async () => {
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
        Components.showToast(I18n.t('success'), 'success');
      });
    }
  };

  global.SchoolAdminApp = SchoolAdminApp;
})(window, jQuery);
