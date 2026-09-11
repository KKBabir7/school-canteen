/**
 * SchoolService — schools, grades, classes, breaks (School Admin + Super Admin).
 * Future Java: /api/schools /api/grades /api/classes /api/breaks
 */
(function (global) {
  'use strict';

  function ensureKey(key, seedKey) {
    let data = Storage.get(key);
    if (!data || (Array.isArray(data) && !data.length)) {
      data = Utils.clone(SchoolFoodSeed[seedKey] || (Array.isArray(SchoolFoodSeed[seedKey]) ? [] : SchoolFoodSeed[seedKey]));
      Storage.set(key, data);
    }
    return data;
  }

  const SchoolService = {
    async getSchools() {
      await Utils.simulateDelay(50);
      return Utils.clone(ensureKey('schools', 'schools'));
    },

    async getSchoolById(id) {
      const list = await this.getSchools();
      return list.find((s) => s.id === id) || null;
    },

    async createSchool(payload) {
      await Utils.simulateDelay(120);
      const list = ensureKey('schools', 'schools');
      const school = Object.assign({
        id: Utils.uid('sch'),
        status: 'active',
        schoolDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
        canParentsOrder: true,
        canStudentsOrder: true,
        advanceOrderDays: 7,
        cancelDeadlineHours: 2,
        logo: '',
        name: { en: '', ar: '' }
      }, payload);
      list.unshift(school);
      Storage.set('schools', list);
      return Utils.clone(school);
    },

    async updateSchool(id, payload) {
      await Utils.simulateDelay(100);
      const list = ensureKey('schools', 'schools');
      const idx = list.findIndex((s) => s.id === id);
      if (idx < 0) throw new Error('School not found');
      list[idx] = Object.assign({}, list[idx], payload);
      Storage.set('schools', list);
      // keep canteen-service schools in sync
      return Utils.clone(list[idx]);
    },

    async toggleSchoolStatus(id) {
      const s = await this.getSchoolById(id);
      if (!s) throw new Error('School not found');
      return this.updateSchool(id, { status: s.status === 'active' ? 'inactive' : 'active' });
    },

    async getGrades(schoolId) {
      await Utils.simulateDelay(40);
      let list = ensureKey('grades', 'grades');
      if (schoolId) list = list.filter((g) => g.schoolId === schoolId);
      return Utils.clone(list);
    },

    async createGrade(payload) {
      const list = ensureKey('grades', 'grades');
      const g = Object.assign({ id: Utils.uid('gr') }, payload);
      list.push(g);
      Storage.set('grades', list);
      return Utils.clone(g);
    },

    async getClasses(schoolId) {
      await Utils.simulateDelay(40);
      let list = ensureKey('classes', 'classes');
      if (schoolId) list = list.filter((c) => c.schoolId === schoolId);
      return Utils.clone(list);
    },

    async createClass(payload) {
      const list = ensureKey('classes', 'classes');
      const c = Object.assign({ id: Utils.uid('cl') }, payload);
      list.push(c);
      Storage.set('classes', list);
      return Utils.clone(c);
    },

    async getBreaks(schoolId) {
      await Utils.simulateDelay(40);
      let list = ensureKey('breaks', 'breaks');
      if (schoolId) list = list.filter((b) => b.schoolId === schoolId);
      return Utils.clone(list);
    },

    async createBreak(payload) {
      const list = ensureKey('breaks', 'breaks');
      const b = Object.assign({ id: Utils.uid('br') }, payload);
      list.push(b);
      Storage.set('breaks', list);
      return Utils.clone(b);
    },

    async deleteBreak(id) {
      let list = ensureKey('breaks', 'breaks');
      list = list.filter((b) => b.id !== id);
      Storage.set('breaks', list);
      return true;
    }
  };

  global.SchoolService = SchoolService;
})(window);
