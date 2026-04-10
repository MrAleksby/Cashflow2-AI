// ── Единственный источник правды ──────────────────────────────────────────
const DEFAULT_STATE = {
  cash: 0,
  job: { title: '', salary: 0 },
  taxRate: 0.25,
  monthsCount: 0,
  income: [],       // [{id, name, amount}]
  expenses: [],     // [{id, name, amount, type}]  type: 'fixed'|'child'
  assets: [],       // [{id, name, type, category, quantity, price, monthlyIncome}]
  liabilities: [],  // [{id, name, amount, payment}]
  history: [],      // [{id, month, description, amount, date}]
};

let state = { ...DEFAULT_STATE };

function getState() {
  return state;
}

function setState(patch) {
  state = { ...state, ...patch };
  saveState();
  renderAll();
}

function nextId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}
