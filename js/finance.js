// ── Финансовые расчёты ───────────────────────────────────────────────────

function calcSalary() {
  return state.job.salary || 0;
}

function calcPassiveIncome() {
  // Пассивный доход из income[]
  const fromIncome = state.income.reduce((sum, i) => sum + (i.amount || 0), 0);
  // Пассивный доход из assets (аренда, дивиденды)
  const fromAssets = state.assets.reduce((sum, a) => sum + (a.monthlyIncome || 0), 0);
  return fromIncome + fromAssets;
}

function calcTotalIncome() {
  return calcSalary() + calcPassiveIncome();
}

function calcTax() {
  const depositIncome = state.assets
    .filter(a => a.type === 'deposit')
    .reduce((sum, a) => sum + (a.monthlyIncome || 0), 0);
  const taxableIncome = Math.max(0, calcTotalIncome() - depositIncome);
  return Math.round(taxableIncome * (state.taxRate || 0));
}

function calcTotalExpenses() {
  // Расходы (включая комиссии по займам)
  const fixed = state.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  // Налог
  const tax = calcTax();
  return fixed + tax;
}

function calcCashFlow() {
  return calcTotalIncome() - calcTotalExpenses();
}

function isFinanciallyFree() {
  const passive = calcPassiveIncome();
  const expenses = calcTotalExpenses();
  return passive > 0 && passive >= expenses;
}

function calcFreedomPercent() {
  const passive = calcPassiveIncome();
  const expenses = calcTotalExpenses();
  if (expenses <= 0) return passive > 0 ? 100 : 0;
  return Math.min(100, Math.round((passive / expenses) * 100));
}

// ── Форматирование ───────────────────────────────────────────────────────

function fmt(n) {
  const num = Math.round(n || 0);
  return num.toLocaleString('ru-RU');
}

function fmtSign(n) {
  const num = Math.round(n || 0);
  const sign = num >= 0 ? '+' : '';
  return sign + num.toLocaleString('ru-RU');
}

function fmtNum(n) {
  return Math.round(n || 0).toLocaleString('ru-RU');
}
