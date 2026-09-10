/**
 * School Food Platform — Centralized Mock Data
 * Replace with real API responses later.
 */
(function (global) {
  'use strict';

  const FOOD_IMAGES = {
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
    apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop&q=80',
    cookie: 'https://images.unsplash.com/photo-1499636133433-04f6d2a4b5a8?w=400&h=300&fit=crop&q=80'
  };

  const AVATARS = {
    david: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80',
    layla: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80',
    sarah: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80'
  };

  const MockData = {
    version: 1,
    currency: '₪',

    schools: [
      { id: 'sch-1', name: 'Rosary School', city: 'Jerusalem' },
      { id: 'sch-2', name: 'North Campus Academy', city: 'Haifa' },
      { id: 'sch-3', name: 'St. Joseph College', city: 'Nazareth' },
      { id: 'sch-4', name: 'Green Valley School', city: 'Tel Aviv' }
    ],

    users: {
      foodProvider: {
        id: 'usr-fp-1',
        name: 'David Cohen',
        email: 'david@freshbites.co',
        role: 'food-provider',
        org: 'FreshBites Catering',
        avatar: AVATARS.david
      },
      canteenManager: {
        id: 'usr-cm-1',
        name: 'Layla Hassan',
        email: 'layla@rosary.edu',
        role: 'canteen-manager',
        canteenId: 'can-1',
        avatar: AVATARS.layla
      }
    },

    products: [
      {
        id: 'prd-1',
        name: 'Chicken Wrap',
        description: 'Grilled chicken, lettuce, tomato & light mayo in a soft tortilla',
        price: 18,
        image: FOOD_IMAGES.chickenWrap,
        available: true,
        category: 'Main Meals'
      },
      {
        id: 'prd-2',
        name: 'Pizza Slice',
        description: 'Cheese pizza with tomato sauce on thin crust',
        price: 15,
        image: FOOD_IMAGES.pizza,
        available: true,
        category: 'Main Meals'
      },
      {
        id: 'prd-3',
        name: 'Pasta Bowl',
        description: 'Penne pasta with homemade marinara sauce',
        price: 16,
        image: FOOD_IMAGES.pasta,
        available: true,
        category: 'Main Meals'
      },
      {
        id: 'prd-4',
        name: 'Classic Burger',
        description: 'Beef patty, cheese, pickles & house sauce',
        price: 20,
        image: FOOD_IMAGES.burger,
        available: true,
        category: 'Main Meals'
      },
      {
        id: 'prd-5',
        name: 'French Fries',
        description: 'Crispy golden fries lightly salted',
        price: 8,
        image: FOOD_IMAGES.fries,
        available: true,
        category: 'Snacks'
      },
      {
        id: 'prd-6',
        name: 'Fresh Juice',
        description: 'Freshly squeezed orange juice, 300ml',
        price: 7,
        image: FOOD_IMAGES.juice,
        available: true,
        category: 'Drinks'
      },
      {
        id: 'prd-7',
        name: 'Bottled Water',
        description: 'Still mineral water, 500ml',
        price: 4,
        image: FOOD_IMAGES.water,
        available: true,
        category: 'Drinks'
      },
      {
        id: 'prd-8',
        name: 'Garden Salad',
        description: 'Mixed greens, cucumber, tomato & vinaigrette',
        price: 12,
        image: FOOD_IMAGES.salad,
        available: true,
        category: 'Main Meals'
      },
      {
        id: 'prd-9',
        name: 'Turkey Sandwich',
        description: 'Sliced turkey breast on whole wheat bread',
        price: 14,
        image: FOOD_IMAGES.sandwich,
        available: true,
        category: 'Main Meals'
      },
      {
        id: 'prd-10',
        name: 'Fruit Yogurt',
        description: 'Low-fat yogurt with mixed berries',
        price: 6,
        image: FOOD_IMAGES.yogurt,
        available: true,
        category: 'Snacks'
      },
      {
        id: 'prd-11',
        name: 'Fresh Apple',
        description: 'Seasonal crisp apple',
        price: 3,
        image: FOOD_IMAGES.apple,
        available: true,
        category: 'Snacks'
      },
      {
        id: 'prd-12',
        name: 'Oatmeal Cookie',
        description: 'Homemade oatmeal raisin cookie',
        price: 5,
        image: FOOD_IMAGES.cookie,
        available: true,
        category: 'Snacks'
      }
    ],

    canteens: [
      {
        id: 'can-1',
        name: 'Rosary Main Canteen',
        schoolId: 'sch-1',
        phone: '+972-2-555-0101',
        email: 'canteen@rosary.edu',
        status: 'active',
        assignedMenuIds: ['menu-1'],
        lastActivity: '2026-09-10T14:30:00',
        createdAt: '2026-08-01T09:00:00'
      },
      {
        id: 'can-2',
        name: 'Rosary Secondary Canteen',
        schoolId: 'sch-1',
        phone: '+972-2-555-0102',
        email: 'canteen2@rosary.edu',
        status: 'active',
        assignedMenuIds: ['menu-1'],
        lastActivity: '2026-09-09T11:00:00',
        createdAt: '2026-08-05T10:00:00'
      },
      {
        id: 'can-3',
        name: 'North Campus Canteen',
        schoolId: 'sch-2',
        phone: '+972-4-555-0201',
        email: 'food@northcampus.edu',
        status: 'active',
        assignedMenuIds: ['menu-2'],
        lastActivity: '2026-09-08T16:20:00',
        createdAt: '2026-08-12T08:30:00'
      },
      {
        id: 'can-4',
        name: 'St. Joseph Café',
        schoolId: 'sch-3',
        phone: '+972-4-555-0301',
        email: 'cafe@stjoseph.edu',
        status: 'inactive',
        assignedMenuIds: [],
        lastActivity: '2026-09-01T09:00:00',
        createdAt: '2026-07-20T12:00:00'
      }
    ],

    menus: [
      {
        id: 'menu-1',
        name: 'Main Lunch Menu',
        description: 'Daily lunch options for primary and secondary students',
        status: 'active',
        availability: 'available',
        lastUpdated: '2026-09-10T10:00:00',
        assignedCanteenIds: ['can-1', 'can-2'],
        availabilityDates: null,
        sections: [
          {
            id: 'sec-1',
            name: 'Main Meals',
            status: 'active',
            items: [
              { id: 'mi-1', productId: 'prd-1', menuPrice: 18, available: true },
              { id: 'mi-2', productId: 'prd-2', menuPrice: 15, available: true },
              { id: 'mi-3', productId: 'prd-3', menuPrice: 16, available: true },
              { id: 'mi-4', productId: 'prd-4', menuPrice: 20, available: false, unavailableReason: 'sold_out' }
            ]
          },
          {
            id: 'sec-2',
            name: 'Drinks',
            status: 'active',
            items: [
              { id: 'mi-5', productId: 'prd-6', menuPrice: 7, available: true },
              { id: 'mi-6', productId: 'prd-7', menuPrice: 4, available: true }
            ]
          },
          {
            id: 'sec-3',
            name: 'Snacks',
            status: 'active',
            items: [
              { id: 'mi-7', productId: 'prd-5', menuPrice: 8, available: true },
              { id: 'mi-8', productId: 'prd-10', menuPrice: 6, available: true }
            ]
          }
        ]
      },
      {
        id: 'menu-2',
        name: 'Healthy Choices Menu',
        description: 'Balanced meals focused on fresh ingredients',
        status: 'active',
        availability: 'available',
        lastUpdated: '2026-09-07T14:00:00',
        assignedCanteenIds: ['can-3'],
        availabilityDates: null,
        sections: [
          {
            id: 'sec-4',
            name: 'Main Meals',
            status: 'active',
            items: [
              { id: 'mi-9', productId: 'prd-8', menuPrice: 12, available: true },
              { id: 'mi-10', productId: 'prd-9', menuPrice: 14, available: true },
              { id: 'mi-11', productId: 'prd-1', menuPrice: 18, available: true }
            ]
          },
          {
            id: 'sec-5',
            name: 'Drinks',
            status: 'active',
            items: [
              { id: 'mi-12', productId: 'prd-6', menuPrice: 7, available: true },
              { id: 'mi-13', productId: 'prd-7', menuPrice: 4, available: true }
            ]
          },
          {
            id: 'sec-6',
            name: 'Snacks',
            status: 'active',
            items: [
              { id: 'mi-14', productId: 'prd-11', menuPrice: 3, available: true },
              { id: 'mi-15', productId: 'prd-10', menuPrice: 6, available: true }
            ]
          }
        ]
      },
      {
        id: 'menu-3',
        name: 'Afternoon Snack Menu',
        description: 'Light snacks available after school hours',
        status: 'draft',
        availability: 'unavailable',
        lastUpdated: '2026-09-05T09:00:00',
        assignedCanteenIds: [],
        availabilityDates: null,
        sections: [
          {
            id: 'sec-7',
            name: 'Snacks',
            status: 'active',
            items: [
              { id: 'mi-16', productId: 'prd-5', menuPrice: 8, available: true },
              { id: 'mi-17', productId: 'prd-12', menuPrice: 5, available: true },
              { id: 'mi-18', productId: 'prd-11', menuPrice: 3, available: true }
            ]
          },
          {
            id: 'sec-8',
            name: 'Drinks',
            status: 'active',
            items: [
              { id: 'mi-19', productId: 'prd-6', menuPrice: 7, available: true }
            ]
          }
        ]
      }
    ],

    orders: [
      {
        id: 'ord-1',
        orderNumber: '10482',
        studentName: 'Sarah Ahmed',
        className: '3A',
        canteenId: 'can-1',
        orderTime: '2026-09-11T10:42:00',
        status: 'new',
        total: 41,
        items: [
          { productId: 'prd-1', name: 'Chicken Wrap', qty: 1, price: 18 },
          { productId: 'prd-3', name: 'Pasta Bowl', qty: 1, price: 16 },
          { productId: 'prd-6', name: 'Fresh Juice', qty: 1, price: 7 }
        ]
      },
      {
        id: 'ord-2',
        orderNumber: '10483',
        studentName: 'Omar Khalil',
        className: '5B',
        canteenId: 'can-1',
        orderTime: '2026-09-11T10:45:00',
        status: 'new',
        total: 28,
        items: [
          { productId: 'prd-4', name: 'Classic Burger', qty: 1, price: 20 },
          { productId: 'prd-5', name: 'French Fries', qty: 1, price: 8 }
        ]
      },
      {
        id: 'ord-3',
        orderNumber: '10480',
        studentName: 'Maya Levi',
        className: '4A',
        canteenId: 'can-1',
        orderTime: '2026-09-11T10:30:00',
        status: 'preparing',
        total: 22,
        items: [
          { productId: 'prd-2', name: 'Pizza Slice', qty: 1, price: 15 },
          { productId: 'prd-6', name: 'Fresh Juice', qty: 1, price: 7 }
        ]
      },
      {
        id: 'ord-4',
        orderNumber: '10481',
        studentName: 'Youssef Nasser',
        className: '6C',
        canteenId: 'can-1',
        orderTime: '2026-09-11T10:35:00',
        status: 'preparing',
        total: 31,
        items: [
          { productId: 'prd-1', name: 'Chicken Wrap', qty: 1, price: 18 },
          { productId: 'prd-5', name: 'French Fries', qty: 1, price: 8 },
          { productId: 'prd-7', name: 'Bottled Water', qty: 1, price: 4 }
        ]
      },
      {
        id: 'ord-5',
        orderNumber: '10478',
        studentName: 'Noa Berg',
        className: '2B',
        canteenId: 'can-1',
        orderTime: '2026-09-11T10:15:00',
        status: 'ready',
        total: 19,
        items: [
          { productId: 'prd-8', name: 'Garden Salad', qty: 1, price: 12 },
          { productId: 'prd-6', name: 'Fresh Juice', qty: 1, price: 7 }
        ]
      },
      {
        id: 'ord-6',
        orderNumber: '10479',
        studentName: 'Adam Weiss',
        className: '7A',
        canteenId: 'can-1',
        orderTime: '2026-09-11T10:20:00',
        status: 'ready',
        total: 24,
        items: [
          { productId: 'prd-3', name: 'Pasta Bowl', qty: 1, price: 16 },
          { productId: 'prd-5', name: 'French Fries', qty: 1, price: 8 }
        ]
      },
      {
        id: 'ord-7',
        orderNumber: '10490',
        studentName: 'Lina Haddad',
        className: '3B',
        canteenId: 'can-1',
        orderTime: '2026-09-11T12:00:00',
        status: 'upcoming',
        total: 25,
        items: [
          { productId: 'prd-9', name: 'Turkey Sandwich', qty: 1, price: 14 },
          { productId: 'prd-10', name: 'Fruit Yogurt', qty: 1, price: 6 },
          { productId: 'prd-7', name: 'Bottled Water', qty: 1, price: 4 }
        ]
      },
      {
        id: 'ord-8',
        orderNumber: '10470',
        studentName: 'Daniel Cohen',
        className: '5A',
        canteenId: 'can-1',
        orderTime: '2026-09-11T09:50:00',
        status: 'completed',
        total: 27,
        items: [
          { productId: 'prd-4', name: 'Classic Burger', qty: 1, price: 20 },
          { productId: 'prd-6', name: 'Fresh Juice', qty: 1, price: 7 }
        ]
      },
      {
        id: 'ord-9',
        orderNumber: '10471',
        studentName: 'Rana Mansour',
        className: '4C',
        canteenId: 'can-1',
        orderTime: '2026-09-11T09:55:00',
        status: 'completed',
        total: 18,
        items: [
          { productId: 'prd-1', name: 'Chicken Wrap', qty: 1, price: 18 }
        ]
      }
    ],

    activity: [
      {
        id: 'act-1',
        text: 'Menu "Main Lunch Menu" assigned to Rosary Main Canteen',
        time: '2026-09-10T14:30:00'
      },
      {
        id: 'act-2',
        text: 'New canteen "North Campus Canteen" added',
        time: '2026-09-08T16:20:00'
      },
      {
        id: 'act-3',
        text: 'Menu "Healthy Choices Menu" activated',
        time: '2026-09-07T14:00:00'
      },
      {
        id: 'act-4',
        text: 'Chicken Wrap marked unavailable at Rosary Main',
        time: '2026-09-11T09:15:00'
      },
      {
        id: 'act-5',
        text: 'Menu "Afternoon Snack Menu" saved as draft',
        time: '2026-09-05T09:00:00'
      }
    ],

    settings: {
      canteen: {
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

    images: FOOD_IMAGES,
    avatars: AVATARS
  };

  global.SchoolFoodMock = MockData;
})(window);
