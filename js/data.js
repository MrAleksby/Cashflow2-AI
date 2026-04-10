// ── Каталог активов ───────────────────────────────────────────────────────
// Данные взяты из оригинального buy-modal.js

const ASSET_CATALOG = {
  stocks: [
    { key: 'MYT4U',    name: 'MYT4U',    icon: '📈', type: 'stocks', pricePerShare: 1,    monthlyIncome: 0,   desc: 'Спекулятивные акции' },
    { key: 'ON2U',     name: 'ON2U',     icon: '📈', type: 'stocks', pricePerShare: 1,    monthlyIncome: 0,   desc: 'Спекулятивные акции' },
    { key: 'OK4U',     name: 'OK4U',     icon: '📈', type: 'stocks', pricePerShare: 1,    monthlyIncome: 0,   desc: 'Спекулятивные акции' },
    { key: 'GRO4US',   name: 'GRO4US',   icon: '📈', type: 'stocks', pricePerShare: 1,    monthlyIncome: 0,   desc: 'Спекулятивные акции' },
    { key: '2BIGPOWER', name: '2BIGPOWER', icon: '💡', type: 'stocks', pricePerShare: 1200, monthlyIncome: 10, desc: 'Дивидендные акции, 10/акцию в месяц' },
    { key: 'deposit',  name: 'Депозит',  icon: '🏦', type: 'deposit', desc: 'Банковский вклад, 1% дохода в месяц' },
  ],

  realestate: [
    { key: 're_2_1',   name: '2/1 дом',         icon: '🏠', type: 'realestate', price: 45000,  monthlyIncome: 140,  desc: '2 спальни / 1 ванная' },
    { key: 're_3_2',   name: '3/2 дом',         icon: '🏡', type: 'realestate', price: 65000,  monthlyIncome: 200,  desc: '3 спальни / 2 ванные' },
    { key: 're_dup',   name: 'Дуплекс',         icon: '🏘', type: 'realestate', price: 55000,  monthlyIncome: 250,  desc: '2-квартирный дом' },
    { key: 're_4plex', name: '4-плекс',         icon: '🏢', type: 'realestate', price: 90000,  monthlyIncome: 600,  desc: 'Доходный дом 4 кв.' },
    { key: 're_8plex', name: '8-плекс',         icon: '🏢', type: 'realestate', price: 160000, monthlyIncome: 1200, desc: 'Доходный дом 8 кв.' },
    { key: 're_16plex', name: '16-плекс',       icon: '🏗', type: 'realestate', price: 280000, monthlyIncome: 2400, desc: 'Доходный дом 16 кв.' },
    { key: 're_land',  name: 'Земельный участок', icon: '🌿', type: 'realestate', price: 20000, monthlyIncome: 0,   desc: 'Спекулятивный актив' },
    { key: 're_apt',   name: 'Многоквартирный дом', icon: '🏬', type: 'realestate', price: 500000, monthlyIncome: 7500, desc: 'Крупная недвижимость' },
  ],

  metals: [
    { key: 'krugerrand', name: 'Крюгерранд',    icon: '🥇', type: 'metals', pricePerUnit: 1000, monthlyIncome: 0, desc: 'Золотая монета (1 oz)' },
    { key: 'coin_rare',  name: 'Редкая монета',  icon: '🪙', type: 'metals', pricePerUnit: 500,  monthlyIncome: 0, desc: 'Коллекционная монета' },
  ],
};

// Иконки категорий
const CATEGORY_ICONS = {
  stocks:      '📈',
  realestate:  '🏠',
  metals:      '🥇',
  custom:      '💼',
};

const CATEGORY_NAMES = {
  stocks:      'Акции',
  realestate:  'Недвижимость',
  metals:      'Металлы',
  custom:      'Бизнес',
};
