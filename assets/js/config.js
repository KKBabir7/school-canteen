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
    }
  };
})(window);
