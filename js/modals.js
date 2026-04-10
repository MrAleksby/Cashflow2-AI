// ── Управление модалками ─────────────────────────────────────────────────

function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.add('open');
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('open');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
}

// Закрыть по клику на оверлей или кнопку [data-close]
document.addEventListener('click', e => {
  // Кнопки data-close
  if (e.target.dataset.close) {
    closeModal(e.target.dataset.close);
    return;
  }
  // Клик на оверлей (не на само модальное окно)
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ── PayDay ────────────────────────────────────────────────────────────────

function doPayDay() {
  const cashflow = calcCashFlow();
  const newMonth = (state.monthsCount || 0) + 1;
  const newCash = (state.cash || 0) + cashflow;

  const entry = {
    id: nextId(),
    month: newMonth,
    description: `PayDay — Cash Flow ${cashflow >= 0 ? '+' : ''}${fmtNum(cashflow)}`,
    amount: cashflow,
    date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
  };

  setState({
    cash: newCash,
    monthsCount: newMonth,
    history: [...state.history, entry],
  });
}

// ── Новая игра ────────────────────────────────────────────────────────────

let selectedTaxRate = 0.25;

function initNewGameModal() {
  const taxOptions = document.querySelectorAll('.tax-option');
  taxOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      taxOptions.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTaxRate = parseFloat(btn.dataset.rate);
    });
  });

  document.getElementById('btn-start-game').addEventListener('click', () => {
    setState({ taxRate: selectedTaxRate });
    closeModal('overlay-newgame');
  });
}

// ── Действие ─────────────────────────────────────────────────────────────

function initActionModal() {
  document.getElementById('action-job').addEventListener('click', () => {
    closeModal('overlay-action');
    // Заполнить текущими данными
    document.getElementById('job-title').value = state.job.title || '';
    document.getElementById('job-salary').value = state.job.salary || '';
    openModal('overlay-job');
  });

  document.getElementById('action-add-money').addEventListener('click', () => {
    closeModal('overlay-action');
    document.getElementById('add-money-amount').value = '';
    document.getElementById('add-money-desc').value = '';
    openModal('overlay-add-money');
  });

  document.getElementById('action-loan').addEventListener('click', () => {
    closeModal('overlay-action');
    document.getElementById('loan-name').value = '';
    document.getElementById('loan-amount').value = '';
    openModal('overlay-loan');
  });

  document.getElementById('action-child').addEventListener('click', () => {
    closeModal('overlay-action');
    document.getElementById('child-expense').value = '';
    openModal('overlay-child');
  });

  document.getElementById('action-expense').addEventListener('click', () => {
    closeModal('overlay-action');
    document.getElementById('expense-name').value = '';
    document.getElementById('expense-amount').value = '';
    openModal('overlay-expense');
  });

  document.getElementById('action-pay-loan').addEventListener('click', () => {
    closeModal('overlay-action');
    renderPayLoanList();
    openModal('overlay-pay-loan');
  });
}

// ── Работа ────────────────────────────────────────────────────────────────

function initJobModal() {
  document.getElementById('btn-save-job').addEventListener('click', () => {
    const title = document.getElementById('job-title').value.trim();
    const salary = parseInt(document.getElementById('job-salary').value) || 0;
    setState({ job: { title, salary } });
    closeModal('overlay-job');
  });
}

// ── Добавить / снять деньги ───────────────────────────────────────────────

function initAddMoneyModal() {
  document.getElementById('btn-add-money').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('add-money-amount').value) || 0;
    const desc = document.getElementById('add-money-desc').value.trim() || 'Пополнение';
    if (amount <= 0) return;
    const entry = { id: nextId(), month: state.monthsCount, description: desc, amount, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
    setState({ cash: state.cash + amount, history: [...state.history, entry] });
    closeModal('overlay-add-money');
  });

  document.getElementById('btn-remove-money').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('add-money-amount').value) || 0;
    const desc = document.getElementById('add-money-desc').value.trim() || 'Снятие';
    if (amount <= 0) return;
    const entry = { id: nextId(), month: state.monthsCount, description: desc, amount: -amount, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
    setState({ cash: state.cash - amount, history: [...state.history, entry] });
    closeModal('overlay-add-money');
  });
}

// ── Займ ──────────────────────────────────────────────────────────────────

function initLoanModal() {
  document.getElementById('btn-save-loan').addEventListener('click', () => {
    const name = document.getElementById('loan-name').value.trim();
    const amount = parseInt(document.getElementById('loan-amount').value) || 0;
    if (!name || amount <= 0) return;
    if (amount % 1000 !== 0) {
      alert('Сумма займа должна быть кратна 1000');
      return;
    }
    const loanId = nextId();
    const commission = Math.round(amount * 0.10);
    const newLiability = { id: loanId, name, amount, payment: 0 };
    const commissionExpense = { id: nextId(), name: `Комиссия: ${name}`, amount: commission, type: 'loan-commission', linkedLiabilityId: loanId };
    const entry = { id: nextId(), month: state.monthsCount, description: `Займ: ${name} ${fmt(amount)}`, amount, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
    setState({
      cash: state.cash + amount,
      liabilities: [...state.liabilities, newLiability],
      expenses: [...state.expenses, commissionExpense],
      history: [...state.history, entry],
    });
    document.getElementById('loan-name').value = '';
    document.getElementById('loan-amount').value = '';
    closeModal('overlay-loan');
  });
}

// ── Ребёнок ───────────────────────────────────────────────────────────────

function initChildModal() {
  document.getElementById('btn-save-child').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('child-expense').value) || 0;
    if (amount <= 0) return;
    const nameInput = document.getElementById('child-name').value.trim();
    const childNum = state.expenses.filter(e => e.type === 'child').length + 1;
    const name = nameInput || `Ребёнок ${childNum}`;
    const newExpense = { id: nextId(), name, amount, type: 'child' };
    setState({ expenses: [...state.expenses, newExpense] });
    document.getElementById('child-name').value = '';
    document.getElementById('child-expense').value = '';
    closeModal('overlay-child');
  });
}

// ── Расход ────────────────────────────────────────────────────────────────

function initExpenseModal() {
  document.getElementById('btn-save-expense').addEventListener('click', () => {
    const name = document.getElementById('expense-name').value.trim();
    const amount = parseInt(document.getElementById('expense-amount').value) || 0;
    if (!name || amount <= 0) return;
    const newExpense = { id: nextId(), name, amount, type: 'fixed' };
    setState({ expenses: [...state.expenses, newExpense] });
    closeModal('overlay-expense');
  });
}

// ── Погасить долг ─────────────────────────────────────────────────────────

function renderPayLoanList() {
  const el = document.getElementById('pay-loan-list');
  if (!el) return;

  if (state.liabilities.length === 0) {
    el.innerHTML = '<div class="empty-state"><p>Нет долгов</p></div>';
    return;
  }

  el.innerHTML = state.liabilities.map(l => `
    <div class="sell-item" style="flex-direction:column;align-items:stretch;gap:10px">
      <div class="sell-item-info">
        <div class="sell-item-name">${l.name}</div>
        <div class="sell-item-detail">Остаток: ${fmt(l.amount)} · Комиссия: ${fmt(Math.round(l.amount * 0.10))}/мес</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <input class="form-input" id="repay-${l.id}" type="number" inputmode="numeric" step="1000" placeholder="Сумма (кратно 1000)" style="flex:1" />
        <button class="sell-item-btn" onclick="payOffLoan('${l.id}')">Погасить</button>
      </div>
    </div>`).join('');
}

function payOffLoan(id) {
  const loan = state.liabilities.find(l => l.id === id);
  if (!loan) return;
  const repayAmount = parseInt(document.getElementById(`repay-${id}`)?.value) || 0;
  if (repayAmount <= 0) { alert('Введите сумму погашения'); return; }
  if (repayAmount % 1000 !== 0) { alert('Сумма должна быть кратна 1000'); return; }
  if (repayAmount > loan.amount) { alert(`Нельзя погасить больше долга (${fmt(loan.amount)})`); return; }
  if (repayAmount > state.cash) { alert(`Недостаточно средств. На счёте: ${fmt(state.cash)}`); return; }

  const remaining = loan.amount - repayAmount;
  const entry = { id: nextId(), month: state.monthsCount, description: `Погашен долг: ${loan.name} — ${fmt(repayAmount)}`, amount: -repayAmount, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };

  if (remaining === 0) {
    // Полное погашение: удалить пассив и связанную комиссию
    setState({
      cash: state.cash - repayAmount,
      liabilities: state.liabilities.filter(l => l.id !== id),
      expenses: state.expenses.filter(e => e.linkedLiabilityId !== id),
      history: [...state.history, entry],
    });
  } else {
    // Частичное: уменьшить долг и пересчитать комиссию
    const newCommission = Math.round(remaining * 0.10);
    setState({
      cash: state.cash - repayAmount,
      liabilities: state.liabilities.map(l => l.id === id ? { ...l, amount: remaining } : l),
      expenses: state.expenses.map(e => e.linkedLiabilityId === id ? { ...e, amount: newCommission } : e),
      history: [...state.history, entry],
    });
  }
  renderPayLoanList();
}

// ── Купить актив ─────────────────────────────────────────────────────────

let buyCategory = null;
let buySelectedAsset = null;

function initBuyModal() {
  // Шаг 1: выбор категории
  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      buyCategory = btn.dataset.category;
      showBuyStep('asset');
      renderBuyAssetList();
    });
  });

  // Назад: asset → category
  document.getElementById('buy-back-to-category').addEventListener('click', () => {
    showBuyStep('category');
  });

  // Назад: form → asset
  document.getElementById('buy-back-to-asset').addEventListener('click', () => {
    if (buyCategory === 'custom') {
      showBuyStep('category');
    } else {
      showBuyStep('asset');
    }
  });

  // Подтвердить покупку
  document.getElementById('btn-confirm-buy').addEventListener('click', confirmBuy);
}

function showBuyStep(step) {
  document.getElementById('buy-step-category').style.display = step === 'category' ? '' : 'none';
  document.getElementById('buy-step-asset').style.display = step === 'asset' ? '' : 'none';
  document.getElementById('buy-step-form').style.display = step === 'form' ? '' : 'none';
  document.getElementById('buy-modal-footer').style.display = step === 'form' ? '' : 'none';

  const titles = { category: 'Купить актив', asset: 'Выбрать актив', form: 'Детали покупки' };
  document.getElementById('buy-modal-title').textContent = titles[step] || 'Купить актив';
}

function renderBuyAssetList() {
  const el = document.getElementById('buy-asset-list');
  if (!el) return;

  if (buyCategory === 'custom') {
    // Сразу показать форму для ручного ввода
    buySelectedAsset = { custom: true };
    showBuyStep('form');
    renderBuyForm();
    return;
  }

  const list = ASSET_CATALOG[buyCategory] || [];
  el.innerHTML = list.map(a => {
    const priceText = a.pricePerShare !== undefined
      ? `${fmt(a.pricePerShare)}/шт`
      : a.pricePerUnit !== undefined
        ? `${fmt(a.pricePerUnit)}/шт`
        : fmt(a.price);
    const incomeText = a.monthlyIncome ? ` · ${fmt(a.monthlyIncome)}/мес` : '';
    return `
      <div class="asset-option" onclick="selectBuyAsset('${a.key}')">
        <div class="asset-option-left">
          <div class="asset-option-name">${a.icon} ${a.name}</div>
          <div class="asset-option-detail">${a.desc}${incomeText}</div>
        </div>
        <div class="asset-option-price">${priceText}</div>
      </div>`;
  }).join('');
}

function selectBuyAsset(key) {
  const list = ASSET_CATALOG[buyCategory] || [];
  buySelectedAsset = list.find(a => a.key === key);
  if (!buySelectedAsset) return;
  showBuyStep('form');
  renderBuyForm();
}

function renderBuyForm() {
  const el = document.getElementById('buy-form-content');
  if (!el) return;
  cashflowSign = 1; // сброс знака при каждом открытии формы

  if (buySelectedAsset && buySelectedAsset.custom) {
    el.innerHTML = `
      <div class="form-group">
        <label class="form-label">Название бизнеса</label>
        <input class="form-input" id="buy-custom-name" type="text" placeholder="Автомойка, пекарня..." />
      </div>
      <div class="form-group">
        <label class="form-label">Стоимость</label>
        <input class="form-input" id="buy-custom-price" type="number" inputmode="numeric" placeholder="100 000" oninput="updateBusinessCalc()" />
      </div>
      <div class="form-group">
        <label class="form-label">Первый взнос</label>
        <input class="form-input" id="buy-custom-down" type="number" inputmode="numeric" placeholder="0" oninput="updateBusinessCalc()" />
      </div>
      <div class="mortgage-calc" id="business-calc-block">
        <span class="mortgage-calc-label">Долг:</span>
        <span class="mortgage-calc-value" id="business-debt-display">—</span>
      </div>
      <div class="form-group">
        <label class="form-label">Ежемесячный доход</label>
        <input class="form-input" id="buy-custom-income" type="number" inputmode="numeric" placeholder="5 000" />
      </div>`;
    return;
  }

  const a = buySelectedAsset;

  // ── Депозит ──
  if (a.type === 'deposit') {
    el.innerHTML = `
      <div style="padding:12px 0 16px;border-bottom:1px solid var(--border);margin-bottom:16px">
        <div style="font-size:16px;font-weight:700">${a.icon} ${a.name}</div>
        <div style="font-size:13px;color:var(--text-2);margin-top:4px">${a.desc}</div>
      </div>
      <div class="form-group">
        <label class="form-label">Сумма вклада</label>
        <input class="form-input" id="buy-deposit-amount" type="number" inputmode="numeric" placeholder="10 000" oninput="updateDepositCalc()" />
      </div>
      <div class="mortgage-calc" id="deposit-calc-block">
        <span class="mortgage-calc-label">Доход в месяц:</span>
        <span class="mortgage-calc-value" id="deposit-income-display">—</span>
      </div>`;
    return;
  }

  const isQty = a.pricePerShare !== undefined || a.pricePerUnit !== undefined;
  const unitPrice = a.pricePerShare || a.pricePerUnit || a.price || 0;

  if (isQty) {
    const is2big = a.key === '2BIGPOWER';
    el.innerHTML = `
      <div style="padding:12px 0 16px;border-bottom:1px solid var(--border);margin-bottom:16px">
        <div style="font-size:16px;font-weight:700">${a.icon} ${a.name}</div>
        <div style="font-size:13px;color:var(--text-2);margin-top:4px">${a.desc}</div>
      </div>
      <div class="form-group">
        <label class="form-label">Цена за штуку</label>
        <input class="form-input" id="buy-unit-price" type="number" inputmode="numeric" placeholder="0" value="${is2big ? unitPrice : ''}" ${is2big ? 'readonly style="opacity:0.6"' : ''} />
      </div>
      <div class="form-group">
        <label class="form-label">Количество</label>
        <input class="form-input" id="buy-quantity" type="number" inputmode="numeric" placeholder="100" />
      </div>
      ${a.monthlyIncome ? `<div class="form-group">
        <label class="form-label">Доход в месяц (за 1 шт)</label>
        <input class="form-input" id="buy-income-per" type="number" inputmode="numeric" value="${a.monthlyIncome}" />
      </div>` : ''}`;
  } else if (buyCategory === 'realestate') {
    // ── Недвижимость: с ипотекой ──
    el.innerHTML = `
      <div style="padding:12px 0 16px;border-bottom:1px solid var(--border);margin-bottom:16px">
        <div style="font-size:16px;font-weight:700">${a.icon} ${a.name}</div>
        <div style="font-size:13px;color:var(--text-2);margin-top:4px">${a.desc}</div>
      </div>
      <div class="form-group">
        <label class="form-label">Цена</label>
        <input class="form-input" id="buy-price" type="number" inputmode="numeric" placeholder="${a.price}" value="${a.price || ''}" oninput="updateMortgageCalc()" />
      </div>
      <div class="form-group">
        <label class="form-label">Первый взнос</label>
        <input class="form-input" id="buy-down" type="number" inputmode="numeric" placeholder="0" oninput="updateMortgageCalc()" />
      </div>
      <div class="mortgage-calc" id="mortgage-calc-block">
        <span class="mortgage-calc-label">Ипотека:</span>
        <span class="mortgage-calc-value" id="mortgage-display">—</span>
      </div>
      <div class="form-group">
        <label class="form-label">Денежный поток</label>
        <div class="cashflow-toggle">
          <button type="button" class="cashflow-toggle-btn cashflow-toggle-btn--active" id="btn-income-positive" onclick="setCashflowSign(1)">Доход</button>
          <button type="button" class="cashflow-toggle-btn" id="btn-income-negative" onclick="setCashflowSign(-1)">Расход</button>
        </div>
        <input class="form-input" id="buy-income" type="number" inputmode="numeric" value="${a.monthlyIncome ? Math.abs(a.monthlyIncome) : ''}" placeholder="0" />
      </div>`;
  } else {
    el.innerHTML = `
      <div style="padding:12px 0 16px;border-bottom:1px solid var(--border);margin-bottom:16px">
        <div style="font-size:16px;font-weight:700">${a.icon} ${a.name}</div>
        <div style="font-size:13px;color:var(--text-2);margin-top:4px">${a.desc}</div>
      </div>
      <div class="form-group">
        <label class="form-label">Стоимость покупки</label>
        <input class="form-input" id="buy-price" type="number" inputmode="numeric" placeholder="${a.price}" value="${a.price || ''}" />
      </div>
      ${a.monthlyIncome ? `<div class="form-group">
        <label class="form-label">Доход в месяц</label>
        <input class="form-input" id="buy-income" type="number" inputmode="numeric" value="${a.monthlyIncome}" />
      </div>` : `<div class="form-group">
        <label class="form-label">Доход в месяц (необязательно)</label>
        <input class="form-input" id="buy-income" type="number" inputmode="numeric" placeholder="0" />
      </div>`}`;
  }
}

function updateSellProceeds(id, mortgage) {
  const price = parseInt(document.getElementById(`sell-price-${id}`)?.value) || 0;
  const proceeds = price - mortgage;
  const el = document.getElementById(`sell-proceeds-${id}`);
  if (el) {
    el.textContent = fmt(Math.max(0, proceeds));
    el.style.color = proceeds >= 0 ? 'var(--green)' : 'var(--red)';
  }
}

function updateDepositCalc() {
  const amount = parseInt(document.getElementById('buy-deposit-amount')?.value) || 0;
  const income = Math.round(amount * 0.01);
  const display = document.getElementById('deposit-income-display');
  const block   = document.getElementById('deposit-calc-block');
  if (display) display.textContent = amount > 0 ? fmt(income) : '—';
  if (block)   block.classList.toggle('mortgage-calc--active', amount > 0);
}

function updateBusinessCalc() {
  const price = parseInt(document.getElementById('buy-custom-price')?.value) || 0;
  const down  = parseInt(document.getElementById('buy-custom-down')?.value)  || 0;
  const debt  = Math.max(0, price - down);
  const display = document.getElementById('business-debt-display');
  const block   = document.getElementById('business-calc-block');
  if (display) display.textContent = debt > 0 ? fmt(debt) : '—';
  if (block)   block.classList.toggle('mortgage-calc--active', debt > 0);
}

let cashflowSign = 1;

function setCashflowSign(sign) {
  cashflowSign = sign;
  const btnPos = document.getElementById('btn-income-positive');
  const btnNeg = document.getElementById('btn-income-negative');
  if (btnPos) btnPos.classList.toggle('cashflow-toggle-btn--active', sign === 1);
  if (btnNeg) btnNeg.classList.toggle('cashflow-toggle-btn--active', sign === -1);
}

function updateMortgageCalc() {
  const price = parseInt(document.getElementById('buy-price')?.value) || 0;
  const down  = parseInt(document.getElementById('buy-down')?.value)  || 0;
  const mortgage = Math.max(0, price - down);
  const display = document.getElementById('mortgage-display');
  const block   = document.getElementById('mortgage-calc-block');
  if (display) display.textContent = mortgage > 0 ? fmt(mortgage) : '—';
  if (block)   block.classList.toggle('mortgage-calc--active', mortgage > 0);
}

function confirmBuy() {
  if (!buySelectedAsset) return;

  // ── Депозит ──
  if (buySelectedAsset.type === 'deposit') {
    const amount = parseInt(document.getElementById('buy-deposit-amount').value) || 0;
    if (amount <= 0) return;
    const income = Math.round(amount * 0.01);
    const existing = state.assets.find(x => x.key === 'deposit');
    if (existing) {
      const updated = state.assets.map(x => x.key === 'deposit'
        ? { ...x, price: x.price + amount, monthlyIncome: x.monthlyIncome + income }
        : x);
      const entry = { id: nextId(), month: state.monthsCount, description: `Депозит: +${fmt(amount)}`, amount: -amount, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
      setState({ assets: updated, cash: state.cash - amount, history: [...state.history, entry] });
    } else {
      const newAsset = { id: nextId(), key: 'deposit', name: 'Депозит', icon: '🏦', category: 'stocks', type: 'deposit', quantity: 1, price: amount, monthlyIncome: income };
      const entry = { id: nextId(), month: state.monthsCount, description: `Депозит: ${fmt(amount)}`, amount: -amount, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
      setState({ assets: [...state.assets, newAsset], cash: state.cash - amount, history: [...state.history, entry] });
    }
    closeModal('overlay-buy');
    return;
  }

  let newAsset;

  if (buySelectedAsset.custom) {
    const name = document.getElementById('buy-custom-name').value.trim();
    const price = parseInt(document.getElementById('buy-custom-price').value) || 0;
    const downPayment = parseInt(document.getElementById('buy-custom-down').value) || 0;
    const income = parseInt(document.getElementById('buy-custom-income').value) || 0;
    if (!name || price <= 0) return;
    const debt = Math.max(0, price - downPayment);
    let linkedLiabilityId = null;
    let newLiabilities = [...state.liabilities];
    if (debt > 0) {
      const debtLiab = { id: nextId(), name: `Долг: ${name}`, amount: debt, payment: 0 };
      linkedLiabilityId = debtLiab.id;
      newLiabilities = [...newLiabilities, debtLiab];
    }
    const cost = downPayment;
    const descParts = debt > 0 ? `взнос ${fmt(downPayment)}, долг ${fmt(debt)}` : `полная оплата ${fmt(price)}`;
    const entry = { id: nextId(), month: state.monthsCount, description: `Бизнес: ${name} (${descParts})`, amount: -cost, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
    setState({
      assets: [...state.assets, { id: nextId(), name, category: 'custom', type: 'custom', quantity: 1, price, downPayment, monthlyIncome: income, linkedLiabilityId }],
      liabilities: newLiabilities,
      cash: state.cash - cost,
      history: [...state.history, entry],
    });
    closeModal('overlay-buy');
    return;
  } else {
    const a = buySelectedAsset;
    const isQty = a.pricePerShare !== undefined || a.pricePerUnit !== undefined;

    if (isQty) {
      const unitPriceInput = document.getElementById('buy-unit-price');
      const unitPrice = unitPriceInput.value !== '' ? (parseInt(unitPriceInput.value) || 0) : (a.pricePerShare || a.pricePerUnit || 0);
      const qty = parseInt(document.getElementById('buy-quantity').value) || 0;
      const incomePerEl = document.getElementById('buy-income-per');
      const incomePer = incomePerEl ? (parseInt(incomePerEl.value) || 0) : 0;
      if (qty <= 0) return;

      // Проверить, есть ли уже такой актив
      const existing = state.assets.find(x => x.key === a.key);
      if (existing) {
        const updated = state.assets.map(x => x.key === a.key
          ? { ...x, quantity: x.quantity + qty, monthlyIncome: (x.monthlyIncome || 0) + incomePer * qty }
          : x);
        const cost = unitPrice * qty;
        const entry = { id: nextId(), month: state.monthsCount, description: `Куплено ${a.name} × ${qty}`, amount: -cost, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
        setState({ assets: updated, cash: state.cash - cost, history: [...state.history, entry] });
        closeModal('overlay-buy');
        return;
      }

      newAsset = { id: nextId(), key: a.key, name: a.name, category: buyCategory, type: a.type, quantity: qty, price: unitPrice, monthlyIncome: incomePer * qty };
    } else if (buyCategory === 'realestate') {
      // ── Недвижимость с ипотекой ──
      const price          = parseInt(document.getElementById('buy-price').value) || a.price || 0;
      const downPayment    = parseInt(document.getElementById('buy-down').value) || 0;
      const income         = (parseInt(document.getElementById('buy-income').value) || 0) * cashflowSign;
      const mortgage       = Math.max(0, price - downPayment);
      if (price <= 0) return;

      let linkedLiabilityId = null;
      let newLiabilities = [...state.liabilities];
      if (mortgage > 0) {
        const mortgageLiab = { id: nextId(), name: `Ипотека: ${a.name}`, amount: mortgage, payment: 0 };
        linkedLiabilityId = mortgageLiab.id;
        newLiabilities = [...newLiabilities, mortgageLiab];
      }

      const cost = downPayment;
      const descParts = mortgage > 0
        ? `взнос ${fmt(downPayment)}, ипотека ${fmt(mortgage)}`
        : `полная оплата ${fmt(price)}`;
      const entry = { id: nextId(), month: state.monthsCount, description: `Куплено: ${a.name} (${descParts})`, amount: -cost, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
      setState({
        assets: [...state.assets, { id: nextId(), key: a.key, name: a.name, category: buyCategory, type: a.type, quantity: 1, price, downPayment, monthlyIncome: income, linkedLiabilityId }],
        liabilities: newLiabilities,
        cash: state.cash - cost,
        history: [...state.history, entry],
      });
      closeModal('overlay-buy');
      return;
    } else {
      const price = parseInt(document.getElementById('buy-price').value) || a.price || 0;
      const incomeEl = document.getElementById('buy-income');
      const income = incomeEl ? (parseInt(incomeEl.value) || 0) : 0;
      if (price <= 0) return;
      newAsset = { id: nextId(), key: a.key, name: a.name, category: buyCategory, type: a.type, quantity: 1, price, monthlyIncome: income };
    }
  }

  const cost = (newAsset.price || 0) * (newAsset.quantity || 1);
  const entry = { id: nextId(), month: state.monthsCount, description: `Куплено: ${newAsset.name}`, amount: -cost, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
  setState({
    assets: [...state.assets, newAsset],
    cash: state.cash - cost,
    history: [...state.history, entry],
  });
  closeModal('overlay-buy');
}

// ── Продать актив ─────────────────────────────────────────────────────────

function initSellModal() {
  // рендер происходит при открытии
}

let sellExpandedId = null;
let sellMortgageMode = 'pay'; // 'pay' | 'transfer'

function setSellMortgageMode(id, mode, mortgageAmount) {
  sellMortgageMode = mode;
  const payBtn = document.getElementById(`sell-pay-btn-${id}`);
  const transferBtn = document.getElementById(`sell-transfer-btn-${id}`);
  const infoBlock = document.getElementById(`sell-mortgage-info-${id}`);
  if (payBtn) payBtn.classList.toggle('cashflow-toggle-btn--active', mode === 'pay');
  if (transferBtn) transferBtn.classList.toggle('cashflow-toggle-btn--active', mode === 'transfer');
  if (infoBlock) infoBlock.style.display = mode === 'pay' ? '' : 'none';
  if (mode === 'pay') updateSellProceeds(id, mortgageAmount);
}

function renderSellList() {
  const el = document.getElementById('sell-asset-list');
  if (!el) return;

  if (state.assets.length === 0) {
    el.innerHTML = '<div class="empty-state"><p>Нет активов для продажи</p></div>';
    return;
  }

  el.innerHTML = state.assets.map(a => {
    const isDeposit = a.type === 'deposit';
    const isQty = !isDeposit && (a.quantity || 1) > 1;
    const totalValue = (a.price || 0) * (a.quantity || 1);
    const detail = isDeposit
      ? `Депозит: ${fmt(totalValue)}`
      : isQty ? `${fmtNum(a.quantity)} шт · ${fmt(a.price)}/шт` : fmt(totalValue);
    const incomeText = a.monthlyIncome ? ` · доход ${fmt(a.monthlyIncome)}/мес` : '';
    const isExpanded = sellExpandedId === a.id;

    const linkedLiab = a.linkedLiabilityId
      ? state.liabilities.find(l => l.id === a.linkedLiabilityId)
      : null;
    const mortgageAmount = linkedLiab ? linkedLiab.amount : 0;

    const formHtml = isExpanded ? `
      <div class="sell-form" id="sell-form-${a.id}">
        ${isDeposit ? `
          <div class="sell-form-row">
            <label class="sell-form-label">Сумма снятия (макс. ${fmt(totalValue)})</label>
            <input class="form-input" id="sell-qty-${a.id}" type="number" inputmode="numeric" placeholder="${totalValue}" value="${totalValue}" min="1" max="${totalValue}" />
          </div>` :
        isQty ? `
          <div class="sell-form-row">
            <label class="sell-form-label">Цена продажи за шт</label>
            <input class="form-input" id="sell-price-${a.id}" type="number" inputmode="numeric" placeholder="${a.price}" value="${a.price}" />
          </div>
          <div class="sell-form-row">
            <label class="sell-form-label">Количество (макс. ${fmtNum(a.quantity)})</label>
            <input class="form-input" id="sell-qty-${a.id}" type="number" inputmode="numeric" placeholder="${a.quantity}" value="${a.quantity}" min="1" max="${a.quantity}" />
          </div>` : `
          <div class="sell-form-row">
            <label class="sell-form-label">Цена продажи</label>
            <input class="form-input" id="sell-price-${a.id}" type="number" inputmode="numeric" placeholder="${totalValue}" value="${totalValue}"
              ${mortgageAmount > 0 ? `oninput="updateSellProceeds('${a.id}', ${mortgageAmount})"` : ''} />
          </div>
          ${mortgageAmount > 0 ? `
          <div class="cashflow-toggle" style="margin:10px 0">
            <button type="button" class="cashflow-toggle-btn cashflow-toggle-btn--active" id="sell-pay-btn-${a.id}" onclick="setSellMortgageMode('${a.id}', 'pay', ${mortgageAmount})">Погасить долг</button>
            <button type="button" class="cashflow-toggle-btn" id="sell-transfer-btn-${a.id}" onclick="setSellMortgageMode('${a.id}', 'transfer', ${mortgageAmount})">Передать долг</button>
          </div>
          <div id="sell-mortgage-info-${a.id}">
            <div class="sell-mortgage-row">
              <span class="sell-mortgage-label">Погашение ипотеки:</span>
              <span class="sell-mortgage-debt">−${fmt(mortgageAmount)}</span>
            </div>
            <div class="sell-mortgage-row sell-mortgage-row--net">
              <span class="sell-mortgage-label">Вы получите:</span>
              <span class="sell-mortgage-net" id="sell-proceeds-${a.id}">—</span>
            </div>
          </div>` : ''}`}
        <div class="sell-form-actions">
          <button class="btn-secondary" onclick="cancelSell()">Отмена</button>
          <button class="btn-primary" onclick="confirmSell('${a.id}')">${isDeposit ? 'Снять' : 'Подтвердить'}</button>
        </div>
      </div>` : '';

    return `
      <div class="sell-item ${isExpanded ? 'sell-item--expanded' : ''}">
        <div class="sell-item-top">
          <div class="sell-item-info">
            <div class="sell-item-name">${CATEGORY_ICONS[a.category] || '📦'} ${a.name}</div>
            <div class="sell-item-detail">${detail}${incomeText}</div>
          </div>
          ${!isExpanded ? `<button class="sell-item-btn" onclick="openSellForm('${a.id}')">${isDeposit ? 'Снять' : 'Продать'}</button>` : ''}
        </div>
        ${formHtml}
      </div>`;
  }).join('');
}

function openSellForm(id) {
  sellExpandedId = id;
  sellMortgageMode = 'pay';
  renderSellList();
  // Фокус на первое поле
  setTimeout(() => {
    const input = document.getElementById(`sell-price-${id}`);
    if (input) input.focus();
  }, 50);
}

function cancelSell() {
  sellExpandedId = null;
  renderSellList();
}

function confirmSell(id) {
  const asset = state.assets.find(a => a.id === id);
  if (!asset) return;

  const isQty = (asset.quantity || 1) > 1;
  const priceInput = document.getElementById(`sell-price-${id}`);
  const qtyInput = document.getElementById(`sell-qty-${id}`);

  if (asset.type === 'deposit') {
    const totalValue = asset.price || 0;
    const withdrawAmount = Math.min(parseInt(qtyInput?.value) || totalValue, totalValue);
    if (withdrawAmount <= 0) return;
    const remaining = totalValue - withdrawAmount;
    const incomeRatio = remaining > 0 ? remaining / totalValue : 0;
    const entry = { id: nextId(), month: state.monthsCount, description: `Снято с депозита: ${asset.name} — ${fmt(withdrawAmount)}`, amount: withdrawAmount, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
    const updatedAssets = remaining > 0
      ? state.assets.map(a => a.id === id ? { ...a, price: remaining, monthlyIncome: Math.round((asset.monthlyIncome || 0) * incomeRatio) } : a)
      : state.assets.filter(a => a.id !== id);
    setState({ assets: updatedAssets, cash: state.cash + withdrawAmount, history: [...state.history, entry] });
  } else if (isQty) {
    const sellPrice = priceInput?.value !== '' ? (parseInt(priceInput.value) || 0) : (asset.price || 0);
    const sellQty = Math.min(parseInt(qtyInput?.value) || asset.quantity, asset.quantity);
    if (sellQty <= 0) return;

    const proceeds = sellPrice * sellQty;
    const entry = { id: nextId(), month: state.monthsCount, description: `Продано: ${asset.name} × ${sellQty} по ${fmt(sellPrice)}`, amount: proceeds, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };

    const remaining = asset.quantity - sellQty;
    const incomeRatio = remaining / asset.quantity;
    const updatedAssets = remaining > 0
      ? state.assets.map(a => a.id === id ? { ...a, quantity: remaining, monthlyIncome: Math.round((a.monthlyIncome || 0) * incomeRatio) } : a)
      : state.assets.filter(a => a.id !== id);

    setState({ assets: updatedAssets, cash: state.cash + proceeds, history: [...state.history, entry] });
  } else {
    const sellPrice = parseInt(priceInput?.value) || (asset.price || 0) * (asset.quantity || 1);
    if (sellPrice < 0) return;

    const linkedLiab = asset.linkedLiabilityId
      ? state.liabilities.find(l => l.id === asset.linkedLiabilityId)
      : null;
    const mortgage = linkedLiab ? linkedLiab.amount : 0;

    let proceeds, desc;
    if (mortgage > 0 && sellMortgageMode === 'transfer') {
      // Передача ипотеки покупателю — получаем полную сумму, ипотека уходит
      proceeds = sellPrice;
      desc = `Продано: ${asset.name} за ${fmt(sellPrice)} (долг ${fmt(mortgage)} передан покупателю)`;
    } else {
      // Погашение ипотеки из суммы продажи
      proceeds = sellPrice - mortgage;
      desc = mortgage > 0
        ? `Продано: ${asset.name} за ${fmt(sellPrice)} (погашен долг ${fmt(mortgage)})`
        : `Продано: ${asset.name} за ${fmt(sellPrice)}`;
    }

    const entry = { id: nextId(), month: state.monthsCount, description: desc, amount: proceeds, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
    setState({
      assets: state.assets.filter(a => a.id !== id),
      liabilities: linkedLiab ? state.liabilities.filter(l => l.id !== linkedLiab.id) : state.liabilities,
      cash: state.cash + proceeds,
      history: [...state.history, entry],
    });
  }

  sellExpandedId = null;
  renderSellList();
}

// ── Инициализация всех модалок ────────────────────────────────────────────

function initModals() {
  initNewGameModal();
  initActionModal();
  initJobModal();
  initAddMoneyModal();
  initLoanModal();
  initChildModal();
  initExpenseModal();
  initBuyModal();
  initSellModal();

  // Открытие sell — рендерим список
  document.getElementById('btn-sell').addEventListener('click', () => {
    renderSellList();
    openModal('overlay-sell');
  });
}
