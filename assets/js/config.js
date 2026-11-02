/**
 * App configuration — switch mode to "api" when Java/Spring Boot is ready.
 * Do NOT hardcode API URLs throughout the UI.
 */
(function (global) {
  'use strict';

  global.APP_CONFIG = {
    mode: 'mock', // 'mock' | 'api'
    apiBaseUrl: '', // e.g. 'https://api.example.com'
    appName: 'SchoolFood',
    currency: '₪',
    defaultLang: 'en',
    supportedLangs: ['en', 'ar'],
    storagePrefix: 'schoolFood_v3_',
    permissions: {
      canOverridePrices: true,
      canManageDiscounts: false
    },
    roles: {
      foodProvider: {
        id: 'usr-fp-1',
        name: 'David Cohen',
        email: 'david@freshbites.co',
        org: 'FreshBites Catering',
        avatarKey: 'david'
      },
      canteenManager: {
        id: 'usr-cm-1',
        name: 'Layla Hassan',
        email: 'layla@rosary.edu',
        canteenId: 'can-1',
        avatarKey: 'layla'
      },
      parent: {
        id: 'usr-par-1',
        name: 'Nora Ahmed',
        email: 'nora@example.com',
        phone: '+972 50 555 0100',
        avatarKey: 'nora'
      },
      student: {
        id: 'usr-stu-1',
        childId: 'child-1',
        name: 'Sarah Ahmed',
        email: 'sarah.student@rosary.edu',
        avatarKey: 'sarah'
      },
      schoolAdmin: {
        id: 'usr-sa-1',
        name: 'Principal Miriam',
        email: 'admin@rosary.edu',
        schoolId: 'sch-1',
        avatarKey: 'miriam'
      },
      superAdmin: {
        id: 'usr-su-1',
        name: 'Platform Admin',
        email: 'super@schoolfood.app',
        avatarKey: 'admin'
      }
    },
    /**
     * Demo personas (landing only). One person can hold multiple roles —
     * in-app sidebar menus turn on/off from session.roles (no role switcher).
     */
    personas: {
      'david-fp-cm': {
        id: 'usr-fp-1',
        name: 'David Cohen',
        email: 'david@freshbites.co',
        avatarKey: 'david',
        roles: ['food-provider', 'canteen-manager'],
        home: 'food-provider/dashboard.html',
        canteenId: 'can-1'
      },
      'nora-parent-cm': {
        id: 'usr-par-1',
        name: 'Nora Ahmed',
        email: 'nora@example.com',
        avatarKey: 'nora',
        roles: ['parent', 'canteen-manager'],
        home: 'parent/home.html',
        canteenId: 'can-1',
        parentId: 'usr-par-1'
      },
      'layla-cm': {
        id: 'usr-cm-1',
        name: 'Layla Hassan',
        email: 'layla@rosary.edu',
        avatarKey: 'layla',
        roles: ['canteen-manager'],
        home: 'canteen-manager/dashboard.html',
        canteenId: 'can-1'
      },
      'sarah-student': {
        id: 'usr-stu-1',
        name: 'Sarah Ahmed',
        email: 'sarah.student@rosary.edu',
        avatarKey: 'sarah',
        roles: ['student'],
        home: 'student/home.html',
        childId: 'child-1'
      },
      'miriam-sa': {
        id: 'usr-sa-1',
        name: 'Principal Miriam',
        email: 'admin@rosary.edu',
        avatarKey: 'miriam',
        roles: ['school-admin'],
        home: 'school-admin/dashboard.html',
        schoolId: 'sch-1'
      },
      'platform-su': {
        id: 'usr-su-1',
        name: 'Platform Admin',
        email: 'super@schoolfood.app',
        avatarKey: 'admin',
        roles: ['super-admin'],
        home: 'super-admin/schools.html'
      }
    }
  };
})(window);
