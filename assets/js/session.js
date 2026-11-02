/**
 * Demo session — one user can hold multiple roles.
 * Sidebar menus are merged from session.roles (client requirement).
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'session';

  const Session = {
    get() {
      const s = global.Storage ? Storage.get(STORAGE_KEY, null) : null;
      if (s && Array.isArray(s.roles) && s.roles.length) return s;
      return null;
    },

    set(session) {
      if (!global.Storage) return false;
      return Storage.set(STORAGE_KEY, session);
    },

    clear() {
      if (global.Storage) Storage.remove(STORAGE_KEY);
    },

    personas() {
      return (global.APP_CONFIG && APP_CONFIG.personas) || {};
    },

    loginPersona(personaId) {
      const p = this.personas()[personaId];
      if (!p) return null;
      const session = {
        personaId: personaId,
        id: p.id,
        name: p.name,
        email: p.email,
        avatarKey: p.avatarKey,
        roles: p.roles.slice(),
        home: p.home,
        canteenId: p.canteenId || null,
        schoolId: p.schoolId || null,
        childId: p.childId || null,
        parentId: p.parentId || null
      };
      this.set(session);
      return session;
    },

    /**
     * Ensure a session exists when browsing a role folder without landing first.
     * Uses URL folder as a single-role fallback (does not invent extra roles).
     */
    ensureFromPageRole(pageRole) {
      const existing = this.get();
      if (existing) return existing;
      if (!pageRole || pageRole === 'public') return null;
      const personas = this.personas();
      const match = Object.keys(personas).find((id) => {
        const roles = personas[id].roles || [];
        return roles.length === 1 && roles[0] === pageRole;
      }) || Object.keys(personas).find((id) => (personas[id].roles || []).indexOf(pageRole) >= 0);
      if (match) return this.loginPersona(match);
      return null;
    },

    roles() {
      const s = this.get();
      return s && s.roles ? s.roles.slice() : [];
    },

    hasRole(role) {
      return this.roles().indexOf(role) >= 0;
    },

    /** Prefer session profile; fall back to APP_CONFIG.roles.* */
    profile() {
      const s = this.get();
      if (s) {
        const av = (global.SchoolFoodSeed && SchoolFoodSeed.avatars) || {};
        return {
          name: s.name,
          email: s.email,
          avatar: av[s.avatarKey] || (av.david || ''),
          roles: s.roles.slice(),
          canteenId: s.canteenId || (APP_CONFIG.roles.canteenManager && APP_CONFIG.roles.canteenManager.canteenId),
          schoolId: s.schoolId || (APP_CONFIG.roles.schoolAdmin && APP_CONFIG.roles.schoolAdmin.schoolId),
          childId: s.childId || (APP_CONFIG.roles.student && APP_CONFIG.roles.student.childId),
          parentId: s.parentId || (APP_CONFIG.roles.parent && APP_CONFIG.roles.parent.id)
        };
      }
      return null;
    }
  };

  global.Session = Session;
})(window);
