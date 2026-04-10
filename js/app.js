// ── Инициализация приложения ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // 1. Загрузить сохранённое состояние
  const hasSave = loadState();

  // 2. Инициализировать модалки
  initModals();

  // 3. Навигация по табам
  initNavigation();

  // 4. Кнопки в шапке
  initHeaderButtons();

  // 5. AI
  initAI();

  // 6. Первый рендер
  renderAll();

  // 7. Если нет сохранения — показать новую игру
  if (!hasSave) {
    openModal('overlay-newgame');
  }
});

// ── Навигация ─────────────────────────────────────────────────────────────

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const screens = document.querySelectorAll('.screen');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.screen;

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      screens.forEach(s => {
        const id = s.id.replace('screen-', '');
        s.classList.toggle('active', id === target);
      });
    });
  });
}

// ── Кнопки шапки ─────────────────────────────────────────────────────────

function initHeaderButtons() {
  // PayDay
  document.getElementById('btn-payday').addEventListener('click', doPayDay);

  // Купить (из шапки/Cashflow экрана)
  document.getElementById('btn-buy').addEventListener('click', () => {
    // Сбросить состояние шага покупки
    buyCategory = null;
    buySelectedAsset = null;
    showBuyStep('category');
    openModal('overlay-buy');
  });

  // Действие
  document.getElementById('btn-action').addEventListener('click', () => {
    openModal('overlay-action');
  });

  // Меню (три точки)
  const menuBtn = document.getElementById('btn-menu');
  const dropdown = document.getElementById('dropdown-menu');

  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
  });

  // Новая игра из меню
  document.getElementById('menu-new-game').addEventListener('click', () => {
    dropdown.classList.remove('open');
    resetGame();
  });
}
