// ── Claude AI Integration ─────────────────────────────────────────────────

const AI_KEY_STORAGE = 'cf2_ai_key';

function getApiKey() {
  return localStorage.getItem(AI_KEY_STORAGE) || '';
}

function saveApiKey(key) {
  localStorage.setItem(AI_KEY_STORAGE, key.trim());
}

// ── Системный промпт ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Ты помощник для настольной финансовой игры Cashflow.
Игрок описывает финансовое действие на русском языке (текстом или голосом).
Твоя задача — разобрать действие и вернуть ТОЛЬКО валидный JSON без пояснений.

Возможные действия:

1. Покупка недвижимости:
{"action":"buy_realestate","name":"Дуплекс","price":55000,"downPayment":10000,"income":250,"incomeSign":1}
incomeSign: 1 = доход, -1 = расход (отрицательный денежный поток)

2. Покупка бизнеса:
{"action":"buy_business","name":"Автомойка","price":80000,"downPayment":20000,"income":5000}

3. Покупка акций:
{"action":"buy_stocks","key":"ON2U","quantity":100,"price":5}
Известные акции: MYT4U, ON2U, OK4U, GRO4US, 2BIGPOWER (цена 1200, доход 10/шт)

3a. Депозит (вклад в банк):
{"action":"buy_deposit","amount":50000}
Использовать когда: "закинь на депозит", "положить на вклад", "банковский вклад", "депозит"
Доход 1% в месяц рассчитывается автоматически.

3b. Снятие с депозита (частичное или полное):
{"action":"withdraw_deposit","amount":20000}
Использовать когда: "сними с депозита", "снять с вклада", "забрать с депозита"
Если amount не указан — снять всё.

4. Покупка металлов:
{"action":"buy_metals","key":"krugerrand","quantity":5,"price":1000}
Известные металлы: krugerrand, coin_rare

5. Продажа актива:
{"action":"sell","name":"ON2U","price":0}
name — название или ключ актива

6. Займ:
{"action":"loan","name":"Автокредит","amount":20000}

7. Погашение долга:
{"action":"pay_loan","name":"Автокредит","amount":10000}

8. Добавить деньги:
{"action":"add_money","amount":150000,"desc":"Оплата за консультацию"}

9. Снять деньги / расход:
{"action":"remove_money","amount":40000,"desc":"Продукты"}

10. Установить работу:
{"action":"set_job","title":"Менеджер","salary":50000}

11. Добавить ребёнка:
{"action":"add_child","name":"Максим","expense":500}

12. PayDay:
{"action":"payday"}

13. Удалить расход / ребёнка / расход по займу:
{"action":"remove_expense","name":"Максим"}
name — часть названия расхода или имя ребёнка

14. Удалить актив без продажи:
{"action":"remove_asset","name":"Дуплекс"}

15. Удалить пассив / долг / ипотеку:
{"action":"remove_liability","name":"Автокредит"}

Если не можешь распознать действие, верни:
{"action":"unknown","message":"Не понял. Попробуй сформулировать иначе."}

Отвечай ТОЛЬКО JSON, без текста вокруг.`;

// ── Вызов Claude API ──────────────────────────────────────────────────────

async function callClaude(userText) {
  const apiKey = getApiKey();
  if (!apiKey) {
    showAiError('Введи API ключ в настройках');
    return null;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userText }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Ошибка ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text || '';
  const text = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

// ── Применение действия к состоянию ──────────────────────────────────────

function applyAiAction(cmd) {
  if (!cmd || cmd.action === 'unknown') {
    showAiError(cmd?.message || 'Не понял команду');
    return;
  }

  switch (cmd.action) {

    case 'buy_realestate': {
      const price = cmd.price || 0;
      const down = cmd.downPayment || 0;
      const mortgage = Math.max(0, price - down);
      const income = (cmd.income || 0) * (cmd.incomeSign || 1);
      let newLiabilities = [...state.liabilities];
      let linkedLiabilityId = null;
      if (mortgage > 0) {
        const liab = { id: nextId(), name: `Ипотека: ${cmd.name}`, amount: mortgage, payment: 0 };
        linkedLiabilityId = liab.id;
        newLiabilities.push(liab);
      }
      const asset = { id: nextId(), name: cmd.name, category: 'realestate', type: 'realestate', quantity: 1, price, downPayment: down, monthlyIncome: income, linkedLiabilityId };
      const entry = { id: nextId(), month: state.monthsCount, description: `🤖 Куплено: ${cmd.name}`, amount: -down, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
      setState({ assets: [...state.assets, asset], liabilities: newLiabilities, cash: state.cash - down, history: [...state.history, entry] });
      break;
    }

    case 'buy_business': {
      const price = cmd.price || 0;
      const down = cmd.downPayment || 0;
      const debt = Math.max(0, price - down);
      let newLiabilities = [...state.liabilities];
      let linkedLiabilityId = null;
      if (debt > 0) {
        const liab = { id: nextId(), name: `Долг: ${cmd.name}`, amount: debt, payment: 0 };
        linkedLiabilityId = liab.id;
        newLiabilities.push(liab);
      }
      const asset = { id: nextId(), name: cmd.name, category: 'custom', type: 'custom', quantity: 1, price, downPayment: down, monthlyIncome: cmd.income || 0, linkedLiabilityId };
      const entry = { id: nextId(), month: state.monthsCount, description: `🤖 Бизнес: ${cmd.name}`, amount: -down, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
      setState({ assets: [...state.assets, asset], liabilities: newLiabilities, cash: state.cash - down, history: [...state.history, entry] });
      break;
    }

    case 'buy_stocks': {
      const key = cmd.key || 'ON2U';
      const qty = cmd.quantity || 1;
      const price = cmd.price || 0;
      const catalogAsset = (ASSET_CATALOG.stocks || []).find(a => a.key === key);
      const incomePer = catalogAsset?.monthlyIncome || 0;
      const existing = state.assets.find(a => a.key === key);
      if (existing) {
        const updated = state.assets.map(a => a.key === key
          ? { ...a, quantity: a.quantity + qty, monthlyIncome: (a.monthlyIncome || 0) + incomePer * qty }
          : a);
        const entry = { id: nextId(), month: state.monthsCount, description: `🤖 Куплено: ${key} × ${qty}`, amount: -(price * qty), date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
        setState({ assets: updated, cash: state.cash - price * qty, history: [...state.history, entry] });
      } else {
        const asset = { id: nextId(), key, name: catalogAsset?.name || key, category: 'stocks', type: catalogAsset?.type || 'stocks', quantity: qty, price, monthlyIncome: incomePer * qty };
        const entry = { id: nextId(), month: state.monthsCount, description: `🤖 Куплено: ${key} × ${qty}`, amount: -(price * qty), date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
        setState({ assets: [...state.assets, asset], cash: state.cash - price * qty, history: [...state.history, entry] });
      }
      break;
    }

    case 'buy_deposit': {
      const amount = cmd.amount || 0;
      if (amount <= 0) { showAiError('Укажи сумму депозита'); break; }
      const income = Math.round(amount * 0.01);
      const existing = state.assets.find(a => a.type === 'deposit');
      let updatedAssets;
      if (existing) {
        updatedAssets = state.assets.map(a => a.type === 'deposit'
          ? { ...a, price: (a.price || 0) + amount, monthlyIncome: (a.monthlyIncome || 0) + income }
          : a);
      } else {
        const asset = { id: nextId(), key: 'deposit', name: 'Депозит', category: 'stocks', type: 'deposit', quantity: 1, price: amount, monthlyIncome: income };
        updatedAssets = [...state.assets, asset];
      }
      const entry = { id: nextId(), month: state.monthsCount, description: `🤖 Депозит: +${amount}`, amount: -amount, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
      setState({ assets: updatedAssets, cash: state.cash - amount, history: [...state.history, entry] });
      break;
    }

    case 'buy_metals': {
      const key = cmd.key || 'krugerrand';
      const qty = cmd.quantity || 1;
      const price = cmd.price || 0;
      const catalogAsset = (ASSET_CATALOG.metals || []).find(a => a.key === key);
      const asset = { id: nextId(), key, name: catalogAsset?.name || key, category: 'metals', type: 'metals', quantity: qty, price, monthlyIncome: 0 };
      const entry = { id: nextId(), month: state.monthsCount, description: `🤖 Куплено: ${asset.name} × ${qty}`, amount: -(price * qty), date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
      setState({ assets: [...state.assets, asset], cash: state.cash - price * qty, history: [...state.history, entry] });
      break;
    }

    case 'withdraw_deposit': {
      const dep = state.assets.find(a => a.type === 'deposit');
      if (!dep) { showAiError('Депозит не найден'); break; }
      const totalValue = dep.price || 0;
      const withdrawAmount = cmd.amount ? Math.min(cmd.amount, totalValue) : totalValue;
      const remaining = totalValue - withdrawAmount;
      const incomeRatio = remaining > 0 ? remaining / totalValue : 0;
      const updatedAssets = remaining > 0
        ? state.assets.map(a => a.type === 'deposit' ? { ...a, price: remaining, monthlyIncome: Math.round((dep.monthlyIncome || 0) * incomeRatio) } : a)
        : state.assets.filter(a => a.type !== 'deposit');
      const entry = { id: nextId(), month: state.monthsCount, description: `🤖 Снято с депозита: ${withdrawAmount}`, amount: withdrawAmount, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
      setState({ assets: updatedAssets, cash: state.cash + withdrawAmount, history: [...state.history, entry] });
      break;
    }

    case 'sell': {
      const name = (cmd.name || '').toLowerCase();
      const found = state.assets.find(a => a.name.toLowerCase().includes(name) || (a.key || '').toLowerCase().includes(name));
      if (!found) { showAiError(`Актив «${cmd.name}» не найден`); return; }
      const sellPrice = cmd.price !== undefined ? cmd.price : (found.price * found.quantity);
      const liab = found.linkedLiabilityId ? state.liabilities.find(l => l.id === found.linkedLiabilityId) : null;
      const proceeds = sellPrice - (liab ? liab.amount : 0);
      const entry = { id: nextId(), month: state.monthsCount, description: `🤖 Продано: ${found.name}`, amount: proceeds, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
      setState({
        assets: state.assets.filter(a => a.id !== found.id),
        liabilities: liab ? state.liabilities.filter(l => l.id !== liab.id) : state.liabilities,
        cash: state.cash + proceeds,
        history: [...state.history, entry],
      });
      break;
    }

    case 'loan': {
      const amount = cmd.amount || 0;
      const commission = Math.round(amount * 0.1);
      const liab = { id: nextId(), name: cmd.name || 'Займ', amount, payment: 0 };
      const commissionExpense = { id: nextId(), name: `Комиссия: ${cmd.name || 'Займ'}`, amount: commission, type: 'loan-commission', linkedLiabilityId: liab.id };
      const entry = { id: nextId(), month: state.monthsCount, description: `🤖 Займ: ${cmd.name}`, amount, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
      setState({ cash: state.cash + amount, liabilities: [...state.liabilities, liab], expenses: [...state.expenses, commissionExpense], history: [...state.history, entry] });
      break;
    }

    case 'add_money': {
      const entry = { id: nextId(), month: state.monthsCount, description: `🤖 ${cmd.desc || 'Пополнение'}`, amount: cmd.amount, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
      setState({ cash: state.cash + cmd.amount, history: [...state.history, entry] });
      break;
    }

    case 'remove_money': {
      const entry = { id: nextId(), month: state.monthsCount, description: `🤖 ${cmd.desc || 'Расход'}`, amount: -cmd.amount, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) };
      setState({ cash: state.cash - cmd.amount, history: [...state.history, entry] });
      break;
    }

    case 'set_job': {
      setState({ job: { title: cmd.title, salary: cmd.salary || 0 } });
      break;
    }

    case 'add_child': {
      const childNum = state.expenses.filter(e => e.type === 'child').length + 1;
      const expense = { id: nextId(), name: cmd.name || `Ребёнок ${childNum}`, amount: cmd.expense || 0, type: 'child' };
      setState({ expenses: [...state.expenses, expense] });
      break;
    }

    case 'payday': {
      doPayDay();
      break;
    }

    case 'remove_expense': {
      const name = (cmd.name || '').toLowerCase();
      const found = state.expenses.find(e => e.name.toLowerCase().includes(name));
      if (!found) { showAiError(`Расход «${cmd.name}» не найден`); return; }
      setState({ expenses: state.expenses.filter(e => e.id !== found.id) });
      break;
    }

    case 'remove_asset': {
      const name = (cmd.name || '').toLowerCase();
      const found = state.assets.find(a => a.name.toLowerCase().includes(name));
      if (!found) { showAiError(`Актив «${cmd.name}» не найден`); return; }
      const liab = found.linkedLiabilityId ? state.liabilities.find(l => l.id === found.linkedLiabilityId) : null;
      setState({
        assets: state.assets.filter(a => a.id !== found.id),
        liabilities: liab ? state.liabilities.filter(l => l.id !== liab.id) : state.liabilities,
      });
      break;
    }

    case 'remove_liability': {
      const name = (cmd.name || '').toLowerCase();
      const found = state.liabilities.find(l => l.name.toLowerCase().includes(name));
      if (!found) { showAiError(`Пассив «${cmd.name}» не найден`); return; }
      // Удалить связанную комиссию если есть
      const linkedExpense = state.expenses.find(e => e.linkedLiabilityId === found.id);
      setState({
        liabilities: state.liabilities.filter(l => l.id !== found.id),
        expenses: linkedExpense ? state.expenses.filter(e => e.id !== linkedExpense.id) : state.expenses,
      });
      break;
    }

    default:
      showAiError('Неизвестное действие');
  }

  showAiSuccess();
}

// ── UI хелперы ────────────────────────────────────────────────────────────

function showAiError(msg) {
  const el = document.getElementById('ai-status');
  if (el) { el.textContent = '❌ ' + msg; el.className = 'ai-status ai-status--error'; el.style.display = ''; }
  setTimeout(() => { if (el) el.style.display = 'none'; }, 3000);
}

function showAiSuccess() {
  const el = document.getElementById('ai-status');
  if (el) { el.textContent = '✅ Готово'; el.className = 'ai-status ai-status--success'; el.style.display = ''; }
  setTimeout(() => { if (el) el.style.display = 'none'; }, 2000);
}

function showAiLoading(on) {
  const btn = document.getElementById('ai-send-btn');
  if (btn) btn.textContent = on ? '⏳' : '→';
  const input = document.getElementById('ai-input');
  if (input) input.disabled = on;
}

// ── Голосовой ввод ────────────────────────────────────────────────────────

let recognition = null;

function initVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  recognition = new SpeechRecognition();
  recognition.lang = 'ru-RU';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    const input = document.getElementById('ai-input');
    if (input) { input.value = text; sendAiInput(); }
    document.getElementById('ai-mic-btn')?.classList.remove('ai-mic--active');
  };

  recognition.onend = () => {
    document.getElementById('ai-mic-btn')?.classList.remove('ai-mic--active');
  };
}

function toggleVoice() {
  if (!recognition) { showAiError('Голосовой ввод не поддерживается'); return; }
  const btn = document.getElementById('ai-mic-btn');
  if (btn?.classList.contains('ai-mic--active')) {
    recognition.stop();
    btn.classList.remove('ai-mic--active');
  } else {
    recognition.start();
    btn?.classList.add('ai-mic--active');
  }
}

// ── Отправка ──────────────────────────────────────────────────────────────

async function sendAiInput() {
  const input = document.getElementById('ai-input');
  const text = input?.value.trim();
  if (!text) return;

  showAiLoading(true);
  try {
    const cmd = await callClaude(text);
    if (cmd) applyAiAction(cmd);
    if (input) input.value = '';
  } catch (e) {
    showAiError(e.message || 'Ошибка запроса');
  } finally {
    showAiLoading(false);
  }
}

// ── API ключ модалка ──────────────────────────────────────────────────────

function openApiKeyModal() {
  const current = getApiKey();
  document.getElementById('api-key-input').value = current;
  openModal('overlay-apikey');
}

function initAiKeyModal() {
  document.getElementById('btn-save-apikey').addEventListener('click', () => {
    const val = document.getElementById('api-key-input').value.trim();
    if (!val) return;
    saveApiKey(val);
    closeModal('overlay-apikey');
  });
}

// ── Инициализация ─────────────────────────────────────────────────────────

function initAI() {
  initVoice();
  initAiKeyModal();

  document.getElementById('ai-send-btn').addEventListener('click', sendAiInput);
  document.getElementById('ai-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') sendAiInput();
  });
  document.getElementById('btn-ai-settings').addEventListener('click', openApiKeyModal);

  // Если ключа нет — сразу открываем
  if (!getApiKey()) openApiKeyModal();
}
