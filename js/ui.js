// ── Рендеринг UI ─────────────────────────────────────────────────────────

function renderAll() {
  renderHeader();
  renderCashflow();
  renderIncome();
  renderExpenses();
  renderAssets();
  renderLiabilities();
  renderHistory();
}

// ── Шапка ────────────────────────────────────────────────────────────────

function renderHeader() {
  const el = document.getElementById('header-cash');
  if (!el) return;
  const cash = state.cash || 0;
  el.textContent = fmt(cash);
  el.style.color = cash >= 0 ? 'var(--text)' : 'var(--red)';
}

// ── Cashflow дашборд ─────────────────────────────────────────────────────

function renderCashflow() {
  renderFreedom();
  renderSummaryCard();
}

function renderFreedom() {
  const block = document.getElementById('freedom-block');
  if (!block) return;

  if (isFinanciallyFree()) {
    block.innerHTML = `
      <div class="freedom-achieved">
        <div class="freedom-achieved-emoji">🎉</div>
        <div class="freedom-achieved-title">Финансовая свобода!</div>
        <div class="freedom-achieved-sub">Пассивный доход покрывает все расходы</div>
      </div>`;
    return;
  }

  const pct = calcFreedomPercent();
  const passive = calcPassiveIncome();
  const expenses = calcTotalExpenses();

  block.innerHTML = `
    <div class="freedom-card">
      <div class="freedom-header">
        <span class="freedom-label">Путь к свободе</span>
        <span class="freedom-percent">${pct}%</span>
      </div>
      <div class="freedom-bar">
        <div class="freedom-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="freedom-sub">
        <span>Пассивный: ${fmt(passive)}</span>
        <span>Расходы: ${fmt(expenses)}</span>
      </div>
    </div>`;
}

function renderSummaryCard() {
  const month = document.getElementById('summary-month');
  if (month) month.textContent = `Месяц ${state.monthsCount}`;

  const salary = calcSalary();
  const passive = calcPassiveIncome();
  const totalIncome = calcTotalIncome();
  const tax = calcTax();
  const expenses = state.expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalExp = calcTotalExpenses();
  const cashflow = calcCashFlow();

  const rows = [
    { label: `Зарплата ${state.job.title ? '(' + state.job.title + ')' : ''}`, value: salary, color: 'var(--green)' },
    { label: 'Пассивный доход', value: passive, color: 'var(--green)' },
    { label: 'Общий доход', value: totalIncome, color: 'var(--green)' },
    { label: `Налог (${Math.round((state.taxRate || 0) * 100)}%)`, value: -tax, color: 'var(--red)' },
    { label: 'Расходы', value: -expenses, color: 'var(--red)' },
  ];

  const rowsEl = document.getElementById('summary-rows');
  if (rowsEl) {
    rowsEl.innerHTML = rows.map(r => `
      <div class="summary-row">
        <span class="summary-row-label">${r.label}</span>
        <span class="summary-row-value amount" style="color:${r.color}">${fmt(r.value)}</span>
      </div>`).join('');
  }

  const cfEl = document.getElementById('summary-cashflow');
  if (cfEl) {
    cfEl.textContent = fmt(cashflow);
    cfEl.style.color = cashflow >= 0 ? 'var(--green)' : 'var(--red)';
  }
}

// ── Доходы ───────────────────────────────────────────────────────────────

function renderIncome() {
  const el = document.getElementById('income-list');
  if (!el) return;

  const salary = state.job.salary || 0;
  const passive = calcPassiveIncome();
  const total = salary + passive;

  // Зарплата + пассивный доход из income[] + доход из assets
  const items = [];

  if (salary > 0) {
    items.push({ icon: '💼', name: state.job.title || 'Зарплата', sub: 'Активный доход', amount: salary, color: 'var(--blue-bg)' });
  }

  state.income.forEach(i => {
    items.push({ icon: '💰', name: i.name, sub: 'Пассивный доход', amount: i.amount, color: 'var(--green-bg)', id: i.id });
  });

  state.assets.filter(a => a.monthlyIncome > 0).forEach(a => {
    items.push({ icon: CATEGORY_ICONS[a.category] || '📦', name: a.name, sub: CATEGORY_NAMES[a.category] || a.category, amount: a.monthlyIncome, color: 'var(--green-bg)' });
  });

  if (items.length === 0) {
    el.innerHTML = emptyState('Нет источников дохода');
    return;
  }

  el.innerHTML = `
    <div class="list-card">
      ${items.map(item => `
        <div class="list-item">
          <div class="list-item-left">
            <div class="list-item-icon" style="background:${item.color}">${item.icon}</div>
            <div>
              <div class="list-item-name">${item.name}</div>
              <div class="list-item-sub">${item.sub}</div>
            </div>
          </div>
          <div class="list-item-right">
            <div class="list-item-amount amount" style="color:var(--green)">${fmt(item.amount)}</div>
          </div>
        </div>`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;padding:12px 4px 0;font-size:13px;color:var(--text-2)">
      <span>Итого доходы</span>
      <span class="amount" style="font-weight:700;color:var(--green)">${fmt(total)}</span>
    </div>`;
}

// ── Расходы ──────────────────────────────────────────────────────────────

function renderExpenses() {
  const el = document.getElementById('expense-list');
  if (!el) return;

  const tax = calcTax();
  const loans = state.liabilities.reduce((s, l) => s + (l.payment || 0), 0);
  const total = calcTotalExpenses();

  const items = [];

  if (tax > 0) {
    items.push({ icon: '🏛', name: `Налог ${Math.round((state.taxRate || 0) * 100)}%`, sub: 'Удерживается автоматически', amount: tax, color: 'var(--yellow-bg)', removable: false });
  }

  state.expenses.forEach(e => {
    const isCommission = e.type === 'loan-commission';
    const icon = e.type === 'child' ? '👶' : isCommission ? '🔒' : '💳';
    const sub = e.type === 'child' ? 'Расходы на ребёнка' : isCommission ? 'Комиссия по займу (удаляется при погашении)' : 'Ежемесячный расход';
    items.push({ icon, name: e.name, sub, amount: e.amount, color: 'var(--red-bg)', removable: !isCommission, id: e.id });
  });

  state.liabilities.forEach(l => {
    if (l.payment > 0) {
      items.push({ icon: '🏦', name: l.name, sub: `Долг: ${fmt(l.amount)}`, amount: l.payment, color: 'var(--surface-2)', removable: false });
    }
  });

  if (items.length === 0) {
    el.innerHTML = emptyState('Нет расходов');
    return;
  }

  el.innerHTML = `
    <div class="list-card">
      ${items.map(item => `
        <div class="list-item">
          <div class="list-item-left">
            <div class="list-item-icon" style="background:${item.color}">${item.icon}</div>
            <div>
              <div class="list-item-name">${item.name}</div>
              <div class="list-item-sub">${item.sub}</div>
            </div>
          </div>
          <div class="list-item-right">
            <div class="list-item-amount amount" style="color:var(--red)">${fmt(item.amount)}</div>
            ${item.removable ? `<div class="list-item-sub-amount" style="cursor:pointer;color:var(--red);margin-top:2px" onclick="removeExpense('${item.id}')">удалить</div>` : ''}
          </div>
        </div>`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;padding:12px 4px 0;font-size:13px;color:var(--text-2)">
      <span>Итого расходы</span>
      <span class="amount" style="font-weight:700;color:var(--red)">${fmt(total)}</span>
    </div>`;
}

// ── Активы ────────────────────────────────────────────────────────────────

function renderAssets() {
  const el = document.getElementById('assets-list');
  if (!el) return;

  if (state.assets.length === 0) {
    el.innerHTML = emptyState('Нет активов');
    return;
  }

  const totalValue = state.assets.reduce((s, a) => s + ((a.price || 0) * (a.quantity || 1)), 0);
  const totalIncome = state.assets.reduce((s, a) => s + (a.monthlyIncome || 0), 0);

  el.innerHTML = `
    <div class="list-card">
      ${state.assets.map(a => {
        const qty = a.quantity > 1 ? `${fmtNum(a.quantity)} шт × ${fmt(a.price)}` : fmt(a.price);
        const income = a.monthlyIncome ? `<div class="list-item-sub-amount" style="color:var(--green)">${fmt(a.monthlyIncome)}/мес</div>` : '';
        return `
          <div class="list-item">
            <div class="list-item-left">
              <div class="list-item-icon" style="background:var(--${a.category === 'stocks' ? 'blue' : a.category === 'metals' ? 'yellow' : 'green'}-bg)">${CATEGORY_ICONS[a.category] || '📦'}</div>
              <div>
                <div class="list-item-name">${a.name}</div>
                <div class="list-item-sub">${qty}</div>
              </div>
            </div>
            <div class="list-item-right">
              <div class="list-item-amount amount">${fmt((a.price || 0) * (a.quantity || 1))}</div>
              ${income}
            </div>
          </div>`;
      }).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;padding:12px 4px 0;font-size:13px;color:var(--text-2)">
      <span>Стоимость активов</span>
      <span class="amount" style="font-weight:700">${fmt(totalValue)}</span>
    </div>
    ${totalIncome > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 4px 0;font-size:13px;color:var(--text-2)">
      <span>Доход от активов</span>
      <span class="amount" style="font-weight:700;color:var(--green)">${fmt(totalIncome)}/мес</span>
    </div>` : ''}`;
}

// ── Пассивы ───────────────────────────────────────────────────────────────

function renderLiabilities() {
  const el = document.getElementById('liabilities-list');
  if (!el) return;

  if (state.liabilities.length === 0) {
    el.innerHTML = emptyState('Нет долгов');
    return;
  }

  const totalDebt = state.liabilities.reduce((s, l) => s + (l.amount || 0), 0);
  const totalPayment = state.liabilities.reduce((s, l) => s + (l.payment || 0), 0);

  el.innerHTML = `
    <div class="list-card">
      ${state.liabilities.map(l => `
        <div class="list-item">
          <div class="list-item-left">
            <div class="list-item-icon" style="background:var(--red-bg)">🏦</div>
            <div>
              <div class="list-item-name">${l.name}</div>
              <div class="list-item-sub">${fmt(l.payment)}/мес</div>
            </div>
          </div>
          <div class="list-item-right">
            <div class="list-item-amount amount" style="color:var(--red)">${fmt(l.amount)}</div>
          </div>
        </div>`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;padding:12px 4px 0;font-size:13px;color:var(--text-2)">
      <span>Общий долг</span>
      <span class="amount" style="font-weight:700;color:var(--red)">${fmt(totalDebt)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:4px 4px 0;font-size:13px;color:var(--text-2)">
      <span>Платежи в месяц</span>
      <span class="amount" style="font-weight:700;color:var(--red)">${fmt(totalPayment)}</span>
    </div>`;
}

// ── История ───────────────────────────────────────────────────────────────

function renderHistory() {
  const el = document.getElementById('history-list');
  if (!el) return;

  if (state.history.length === 0) {
    el.innerHTML = emptyState('История пуста');
    return;
  }

  // Группируем по месяцу
  const grouped = {};
  [...state.history].reverse().forEach(h => {
    const key = `Месяц ${h.month}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(h);
  });

  el.innerHTML = Object.entries(grouped).map(([month, entries]) => `
    <div class="history-month">${month}</div>
    <div class="list-card">
      ${entries.map(h => `
        <div class="list-item">
          <div class="list-item-left">
            <div>
              <div class="list-item-name">${h.description}</div>
              <div class="list-item-sub">${h.date}</div>
            </div>
          </div>
          <div class="list-item-right">
            <div class="list-item-amount amount" style="color:${h.amount >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtSign(h.amount)}</div>
          </div>
        </div>`).join('')}
    </div>`).join('');
}

// ── Helpers ───────────────────────────────────────────────────────────────

function emptyState(text) {
  return `<div class="empty-state"><p>${text}</p></div>`;
}

function removeExpense(id) {
  setState({ expenses: state.expenses.filter(e => e.id !== id) });
}
