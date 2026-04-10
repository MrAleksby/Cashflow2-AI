// ── LocalStorage ──────────────────────────────────────────────────────────
const STORAGE_KEY = 'cashflow_state_v2';

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Ошибка сохранения:', e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state = { ...DEFAULT_STATE, ...saved };
      return true;
    }
  } catch (e) {
    console.warn('Ошибка загрузки:', e);
  }
  return false;
}

function resetGame() {
  if (!confirm('Сбросить игру? Весь прогресс будет удалён.')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = { ...DEFAULT_STATE };
  openModal('overlay-newgame');
}
