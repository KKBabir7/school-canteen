/**
 * Seed mock data — bilingual (en/ar) content for menus, sections, products.
 * Initialized into LocalStorage on first run via services.
 */
(function (global) {
  'use strict';

  const IMG = {
    chickenWrap: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop&q=80',
    pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop&q=80',
    pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop&q=80',
    burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',
    fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop&q=80',
    juice: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop&q=80',
    water: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop&q=80',
    salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&q=80',
    sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop&q=80',
    yogurt: 'https://images.unsplash.com/photo-1488477181948-652affb8f4a0?w=400&h=300&fit=crop&q=80',
    cola: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop&q=80',
    cookie: 'https://images.unsplash.com/photo-1499636133433-04f6d2a4b5a8?w=400&h=300&fit=crop&q=80'
  };

  const AV = {
    david: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80',
    layla: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80',
    nora: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=80',
    sarah: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80',
    omar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80',
    miriam: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&q=80',
    admin: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&q=80'
  };

  global.SchoolFoodSeed = {
    version: 3,
    images: IMG,
    avatars: AV,

    schools: [
      {
        id: 'sch-1',
        name: { en: 'Rosary School', ar: 'مدرسة الوردية' },
        phone: '+972 2 555 1000',
        email: 'info@rosary.edu',
        country: 'IL',
        city: 'Jerusalem',
        timezone: 'Asia/Jerusalem',
        currency: 'ILS',
        status: 'active',
        schoolDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
        canParentsOrder: true,
        canStudentsOrder: true,
        advanceOrderDays: 7,
        cancelDeadlineHours: 2,
        logo: ''
      },
      {
        id: 'sch-2',
        name: { en: 'North Campus Academy', ar: 'أكاديمية الحرم الشمالي' },
        phone: '+972 4 555 2000',
        email: 'info@northcampus.edu',
        country: 'IL',
        city: 'Haifa',
        timezone: 'Asia/Jerusalem',
        currency: 'ILS',
        status: 'active',
        schoolDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
        canParentsOrder: true,
        canStudentsOrder: true,
        advanceOrderDays: 5,
        cancelDeadlineHours: 2,
        logo: ''
      },
      {
        id: 'sch-3',
        name: { en: 'St. Joseph College', ar: 'كلية القديس يوسف' },
        phone: '+972 4 555 3000',
        email: 'info@stjoseph.edu',
        country: 'IL',
        city: 'Nazareth',
        timezone: 'Asia/Jerusalem',
        currency: 'ILS',
        status: 'active',
        schoolDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        canParentsOrder: true,
        canStudentsOrder: false,
        advanceOrderDays: 7,
        cancelDeadlineHours: 3,
        logo: ''
      },
      {
        id: 'sch-4',
        name: { en: 'Green Valley School', ar: 'مدرسة الوادي الأخضر' },
        phone: '+972 3 555 4000',
        email: 'info@greenvalley.edu',
        country: 'IL',
        city: 'Tel Aviv',
        timezone: 'Asia/Jerusalem',
        currency: 'ILS',
        status: 'inactive',
        schoolDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
        canParentsOrder: false,
        canStudentsOrder: false,
        advanceOrderDays: 7,
        cancelDeadlineHours: 2,
        logo: ''
      }
    ],

    grades: [
      { id: 'gr-1', schoolId: 'sch-1', name: { en: 'Grade 2', ar: 'الصف ٢' } },
      { id: 'gr-2', schoolId: 'sch-1', name: { en: 'Grade 3', ar: 'الصف ٣' } },
      { id: 'gr-3', schoolId: 'sch-1', name: { en: 'Grade 4', ar: 'الصف ٤' } },
      { id: 'gr-4', schoolId: 'sch-1', name: { en: 'Grade 5', ar: 'الصف ٥' } }
    ],

    classes: [
      { id: 'cl-1', schoolId: 'sch-1', gradeId: 'gr-2', name: '3A' },
      { id: 'cl-2', schoolId: 'sch-1', gradeId: 'gr-2', name: '3B' },
      { id: 'cl-3', schoolId: 'sch-1', gradeId: 'gr-3', name: '4A' },
      { id: 'cl-4', schoolId: 'sch-1', gradeId: 'gr-4', name: '5B' }
    ],

    breaks: [
      { id: 'br-1', schoolId: 'sch-1', name: { en: 'Lunch', ar: 'الغداء' }, days: ['sun', 'mon', 'tue', 'wed', 'thu'], start: '12:00', end: '12:45', gradeIds: ['gr-1', 'gr-2', 'gr-3', 'gr-4'] },
      { id: 'br-2', schoolId: 'sch-1', name: { en: 'Morning Snack', ar: 'وجبة الصباح' }, days: ['sun', 'mon', 'tue', 'wed', 'thu'], start: '10:00', end: '10:20', gradeIds: ['gr-1', 'gr-2'] }
    ],

    children: [
      {
        id: 'child-1',
        parentId: 'usr-par-1',
        firstName: 'Sarah',
        lastName: 'Ahmed',
        dob: '2017-04-12',
        gender: 'female',
        schoolId: 'sch-1',
        gradeId: 'gr-2',
        classId: 'cl-1',
        studentCode: 'RS-3A-041',
        canteenId: 'can-1',
        walletBalance: 45,
        dailyLimitEnabled: true,
        dailyLimit: 40,
        spentToday: 0,
        canOrderApp: true,
        canOrderCanteen: true,
        foodControlMode: 'block',
        blockedProductIds: ['prd-4', 'prd-11'],
        allowedProductIds: [],
        avatarKey: 'sarah'
      },
      {
        id: 'child-2',
        parentId: 'usr-par-1',
        firstName: 'Omar',
        lastName: 'Ahmed',
        dob: '2015-09-03',
        gender: 'male',
        schoolId: 'sch-1',
        gradeId: 'gr-4',
        classId: 'cl-4',
        studentCode: 'RS-5B-018',
        canteenId: 'can-1',
        walletBalance: 72,
        dailyLimitEnabled: true,
        dailyLimit: 50,
        spentToday: 12,
        canOrderApp: true,
        canOrderCanteen: true,
        foodControlMode: 'all',
        blockedProductIds: [],
        allowedProductIds: [],
        avatarKey: 'omar'
      }
    ],

    wallets: {
      family: { ownerId: 'usr-par-1', balance: 245 },
      activity: [
        { id: 'wa-1', type: 'topup', amount: 100, label: { en: 'Wallet Top Up', ar: 'شحن المحفظة' }, date: '2026-09-10T09:00:00', balanceAfter: 245 },
        { id: 'wa-2', type: 'transfer', amount: -50, label: { en: 'Transferred to Sarah', ar: 'تحويل إلى سارة' }, childId: 'child-1', date: '2026-09-09T14:20:00', balanceAfter: 145 },
        { id: 'wa-3', type: 'topup', amount: 100, label: { en: 'Wallet Top Up', ar: 'شحن المحفظة' }, date: '2026-09-08T11:00:00', balanceAfter: 195 }
      ]
    },

    paymentMethods: [
      { id: 'pm-1', parentId: 'usr-par-1', brand: 'Visa', last4: '1234', exp: '09/28' }
    ],

    products: [
      { id: 'prd-1', name: { en: 'Chicken Wrap', ar: 'راب الدجاج' }, description: { en: 'Grilled chicken, lettuce, tomato & light mayo', ar: 'دجاج مشوي مع خس وطماطم ومايونيز خفيف' }, price: 18, image: IMG.chickenWrap, available: true, type: 'provider' },
      { id: 'prd-2', name: { en: 'Pizza Slice', ar: 'شريحة بيتزا' }, description: { en: 'Cheese pizza with tomato sauce', ar: 'بيتزا جبن بصلصة الطماطم' }, price: 15, image: IMG.pizza, available: true, type: 'provider' },
      { id: 'prd-3', name: { en: 'Pasta Bowl', ar: 'طبق معكرونة' }, description: { en: 'Penne with marinara sauce', ar: 'معكرونة بصلصة مارينارا' }, price: 16, image: IMG.pasta, available: true, type: 'provider' },
      { id: 'prd-4', name: { en: 'Classic Burger', ar: 'برجر كلاسيك' }, description: { en: 'Beef patty, cheese & house sauce', ar: 'برجر لحم مع جبن وصلصة المنزل' }, price: 20, image: IMG.burger, available: true, type: 'provider' },
      { id: 'prd-5', name: { en: 'French Fries', ar: 'بطاطس مقلية' }, description: { en: 'Crispy golden fries', ar: 'بطاطس ذهبية مقرمشة' }, price: 8, image: IMG.fries, available: true, type: 'provider' },
      { id: 'prd-6', name: { en: 'Fresh Juice', ar: 'عصير طازج' }, description: { en: 'Fresh orange juice, 300ml', ar: 'عصير برتقال طازج ٣٠٠ مل' }, price: 7, image: IMG.juice, available: true, type: 'common' },
      { id: 'prd-7', name: { en: 'Bottled Water', ar: 'ماء معدني' }, description: { en: 'Still mineral water, 500ml', ar: 'ماء معدني ٥٠٠ مل' }, price: 4, image: IMG.water, available: true, type: 'common' },
      { id: 'prd-8', name: { en: 'Garden Salad', ar: 'سلطة حدائق' }, description: { en: 'Mixed greens with vinaigrette', ar: 'خضار مشكلة مع صلصة' }, price: 12, image: IMG.salad, available: true, type: 'provider' },
      { id: 'prd-9', name: { en: 'Turkey Sandwich', ar: 'ساندويتش ديك رومي' }, description: { en: 'Turkey on whole wheat', ar: 'ديك رومي على خبز قمح كامل' }, price: 14, image: IMG.sandwich, available: true, type: 'provider' },
      { id: 'prd-10', name: { en: 'Fruit Yogurt', ar: 'زبادي بالفاكهة' }, description: { en: 'Low-fat yogurt with berries', ar: 'زبادي قليل الدسم مع توت' }, price: 6, image: IMG.yogurt, available: true, type: 'common' },
      { id: 'prd-11', name: { en: 'Coca Cola', ar: 'كوكا كولا' }, description: { en: 'Classic cola soft drink, 330ml', ar: 'مشروب غازي ٣٣٠ مل' }, price: 5, image: IMG.cola, available: true, type: 'common' },
      { id: 'prd-12', name: { en: 'Oatmeal Cookie', ar: 'كعكة الشوفان' }, description: { en: 'Homemade oatmeal cookie', ar: 'كعكة شوفان منزلية' }, price: 5, image: IMG.cookie, available: true, type: 'provider' }
    ],

    canteens: [
      { id: 'can-1', name: 'Rosary Main Canteen', schoolId: 'sch-1', phone: '+972 50 123 4567', email: 'canteen@rosary-school.com', status: 'active', assignedMenuIds: ['menu-1'], lastUpdated: '2026-09-10T14:30:00', createdAt: '2026-08-01T09:00:00' },
      { id: 'can-2', name: 'Rosary Secondary Canteen', schoolId: 'sch-1', phone: '+972 50 123 4568', email: 'canteen2@rosary-school.com', status: 'active', assignedMenuIds: ['menu-1'], lastUpdated: '2026-09-09T11:00:00', createdAt: '2026-08-05T10:00:00' },
      { id: 'can-3', name: 'North Campus Canteen', schoolId: 'sch-2', phone: '+972 54 987 6543', email: 'food@northcampus.edu', status: 'active', assignedMenuIds: ['menu-2'], lastUpdated: '2026-09-08T16:20:00', createdAt: '2026-08-12T08:30:00' },
      { id: 'can-4', name: 'St. Joseph Café', schoolId: 'sch-3', phone: '+972 4 555 0301', email: 'cafe@stjoseph.edu', status: 'inactive', assignedMenuIds: [], lastUpdated: '2026-09-01T09:00:00', createdAt: '2026-07-20T12:00:00' }
    ],

    menus: [
      {
        id: 'menu-1',
        name: { en: 'Main Lunch Menu', ar: 'قائمة الغداء الرئيسية' },
        description: { en: 'Daily school lunch menu', ar: 'قائمة الغداء اليومية للمدرسة' },
        status: 'active',
        availability: 'available',
        availabilityDates: { from: '2026-09-01', to: '2027-03-31' },
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        assignedCanteenIds: ['can-1', 'can-2'],
        lastUpdated: '2026-09-10T10:00:00',
        sections: [
          {
            id: 'sec-1',
            name: { en: 'Main Meals', ar: 'الوجبات الرئيسية' },
            status: 'active',
            items: [
              { id: 'mi-1', productId: 'prd-1', menuPrice: 18, available: true },
              { id: 'mi-2', productId: 'prd-2', menuPrice: 15, available: true },
              { id: 'mi-3', productId: 'prd-3', menuPrice: 16, available: true },
              { id: 'mi-4', productId: 'prd-4', menuPrice: 20, available: false, unavailableReason: 'sold_out', unavailableDuration: 'until' }
            ]
          },
          {
            id: 'sec-2',
            name: { en: 'Drinks', ar: 'المشروبات' },
            status: 'active',
            items: [
              { id: 'mi-5', productId: 'prd-6', menuPrice: 7, available: true },
              { id: 'mi-6', productId: 'prd-7', menuPrice: 4, available: true },
              { id: 'mi-7', productId: 'prd-11', menuPrice: 5, available: true }
            ]
          },
          {
            id: 'sec-3',
            name: { en: 'Snacks', ar: 'الوجبات الخفيفة' },
            status: 'active',
            items: [
              { id: 'mi-8', productId: 'prd-5', menuPrice: 8, available: true },
              { id: 'mi-9', productId: 'prd-10', menuPrice: 6, available: true }
            ]
          }
        ]
      },
      {
        id: 'menu-2',
        name: { en: 'Healthy Choices Menu', ar: 'قائمة الخيارات الصحية' },
        description: { en: 'Balanced meals with fresh ingredients', ar: 'وجبات متوازنة بمكونات طازجة' },
        status: 'active',
        availability: 'available',
        availabilityDates: null,
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        assignedCanteenIds: ['can-3'],
        lastUpdated: '2026-09-07T14:00:00',
        sections: [
          {
            id: 'sec-4',
            name: { en: 'Main Meals', ar: 'الوجبات الرئيسية' },
            status: 'active',
            items: [
              { id: 'mi-10', productId: 'prd-8', menuPrice: 12, available: true },
              { id: 'mi-11', productId: 'prd-9', menuPrice: 14, available: true },
              { id: 'mi-12', productId: 'prd-1', menuPrice: 18, available: true }
            ]
          },
          {
            id: 'sec-5',
            name: { en: 'Drinks', ar: 'المشروبات' },
            status: 'active',
            items: [
              { id: 'mi-13', productId: 'prd-6', menuPrice: 7, available: true },
              { id: 'mi-14', productId: 'prd-7', menuPrice: 4, available: true }
            ]
          }
        ]
      },
      {
        id: 'menu-3',
        name: { en: 'Afternoon Snack Menu', ar: 'قائمة وجبة بعد الظهر' },
        description: { en: 'Light snacks after school', ar: 'وجبات خفيفة بعد المدرسة' },
        status: 'draft',
        availability: 'unavailable',
        availabilityDates: null,
        weekdays: ['mon', 'wed', 'fri'],
        assignedCanteenIds: [],
        lastUpdated: '2026-09-05T09:00:00',
        sections: [
          {
            id: 'sec-6',
            name: { en: 'Snacks', ar: 'الوجبات الخفيفة' },
            status: 'active',
            items: [
              { id: 'mi-15', productId: 'prd-5', menuPrice: 8, available: true },
              { id: 'mi-16', productId: 'prd-12', menuPrice: 5, available: true }
            ]
          }
        ]
      }
    ],

    orders: [
      { id: 'SC-10245', orderNumber: 'SC-10245', studentName: 'Sarah Ahmed', childId: 'child-1', parentId: 'usr-par-1', classroom: 'Grade 3A', canteenId: 'can-1', orderDate: '2026-09-12', orderTime: '2026-09-12T10:35:00', status: 'new', total: 40, items: [
        { productId: 'prd-1', name: { en: 'Chicken Wrap', ar: 'راب الدجاج' }, qty: 1, price: 18, image: IMG.chickenWrap },
        { productId: 'prd-3', name: { en: 'Pasta Bowl', ar: 'طبق معكرونة' }, qty: 1, price: 16, image: IMG.pasta },
        { productId: 'prd-6', name: { en: 'Fresh Juice', ar: 'عصير طازج' }, qty: 1, price: 7, image: IMG.juice }
      ]},
      { id: 'SC-10246', orderNumber: 'SC-10246', studentName: 'Omar Ahmed', childId: 'child-2', parentId: 'usr-par-1', classroom: 'Grade 5B', canteenId: 'can-1', orderDate: '2026-09-12', orderTime: '2026-09-12T10:42:00', status: 'new', total: 28, items: [
        { productId: 'prd-4', name: { en: 'Classic Burger', ar: 'برجر كلاسيك' }, qty: 1, price: 20, image: IMG.burger },
        { productId: 'prd-5', name: { en: 'French Fries', ar: 'بطاطس مقلية' }, qty: 1, price: 8, image: IMG.fries }
      ]},
      { id: 'SC-10240', orderNumber: 'SC-10240', studentName: 'Maya Levi', classroom: 'Grade 4A', canteenId: 'can-1', orderTime: '2026-09-11T10:20:00', status: 'preparing', total: 22, items: [
        { productId: 'prd-2', name: { en: 'Pizza Slice', ar: 'شريحة بيتزا' }, qty: 1, price: 15, image: IMG.pizza },
        { productId: 'prd-6', name: { en: 'Fresh Juice', ar: 'عصير طازج' }, qty: 1, price: 7, image: IMG.juice }
      ]},
      { id: 'SC-10241', orderNumber: 'SC-10241', studentName: 'Youssef Nasser', classroom: 'Grade 6C', canteenId: 'can-1', orderTime: '2026-09-11T10:25:00', status: 'preparing', total: 30, items: [
        { productId: 'prd-1', name: { en: 'Chicken Wrap', ar: 'راب الدجاج' }, qty: 1, price: 18, image: IMG.chickenWrap },
        { productId: 'prd-5', name: { en: 'French Fries', ar: 'بطاطس مقلية' }, qty: 1, price: 8, image: IMG.fries },
        { productId: 'prd-7', name: { en: 'Bottled Water', ar: 'ماء معدني' }, qty: 1, price: 4, image: IMG.water }
      ]},
      { id: 'SC-10238', orderNumber: 'SC-10238', studentName: 'Noa Berg', classroom: 'Grade 2B', canteenId: 'can-1', orderTime: '2026-09-11T10:10:00', status: 'ready', total: 19, items: [
        { productId: 'prd-8', name: { en: 'Garden Salad', ar: 'سلطة حدائق' }, qty: 1, price: 12, image: IMG.salad },
        { productId: 'prd-6', name: { en: 'Fresh Juice', ar: 'عصير طازج' }, qty: 1, price: 7, image: IMG.juice }
      ]},
      { id: 'SC-10239', orderNumber: 'SC-10239', studentName: 'Adam Weiss', classroom: 'Grade 7A', canteenId: 'can-1', orderTime: '2026-09-11T10:15:00', status: 'ready', total: 24, items: [
        { productId: 'prd-3', name: { en: 'Pasta Bowl', ar: 'طبق معكرونة' }, qty: 1, price: 16, image: IMG.pasta },
        { productId: 'prd-5', name: { en: 'French Fries', ar: 'بطاطس مقلية' }, qty: 1, price: 8, image: IMG.fries }
      ]},
      { id: 'SC-10250', orderNumber: 'SC-10250', studentName: 'Lina Haddad', classroom: 'Grade 3B', canteenId: 'can-1', orderTime: '2026-09-11T12:00:00', status: 'upcoming', total: 25, items: [
        { productId: 'prd-9', name: { en: 'Turkey Sandwich', ar: 'ساندويتش ديك رومي' }, qty: 1, price: 14, image: IMG.sandwich },
        { productId: 'prd-10', name: { en: 'Fruit Yogurt', ar: 'زبادي بالفاكهة' }, qty: 1, price: 6, image: IMG.yogurt },
        { productId: 'prd-7', name: { en: 'Bottled Water', ar: 'ماء معدني' }, qty: 1, price: 4, image: IMG.water }
      ]},
      { id: 'SC-10230', orderNumber: 'SC-10230', studentName: 'Daniel Cohen', classroom: 'Grade 5A', canteenId: 'can-1', orderTime: '2026-09-11T09:50:00', status: 'completed', total: 25, items: [
        { productId: 'prd-4', name: { en: 'Classic Burger', ar: 'برجر كلاسيك' }, qty: 1, price: 20, image: IMG.burger },
        { productId: 'prd-11', name: { en: 'Coca Cola', ar: 'كوكا كولا' }, qty: 1, price: 5, image: IMG.cola }
      ]},
      { id: 'SC-10231', orderNumber: 'SC-10231', studentName: 'Rana Mansour', classroom: 'Grade 4C', canteenId: 'can-1', orderTime: '2026-09-11T09:55:00', status: 'completed', total: 18, items: [
        { productId: 'prd-1', name: { en: 'Chicken Wrap', ar: 'راب الدجاج' }, qty: 1, price: 18, image: IMG.chickenWrap }
      ]}
    ],

    settings: {
      foodProvider: {
        account: { name: 'David Cohen', email: 'david@freshbites.co' }
      },
      canteenManager: {
        ordering: {
          allowSameDay: true,
          lastOrderTime: '11:30',
          stopWindowMinutes: 30,
          maxQtyPerItem: 5
        },
        notifications: {
          newOrder: true,
          orderCancelled: true,
          itemUnavailable: true,
          dailySummary: false
        }
      },
      parent: {
        profile: { firstName: 'Nora', lastName: 'Ahmed', email: 'nora@example.com', phone: '+972 50 555 0100' },
        notifications: {
          orderConfirmation: true,
          orderStatus: true,
          cancellation: true,
          deadlineReminder: true,
          lowBalance: true,
          dailyLimitReached: true
        }
      }
    }
  };
})(window);
