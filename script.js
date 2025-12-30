const OPERATIONS = [-3, -6, 2, 7, -9, -15, 13, 16];
const MIN = 0, MAX = 145;
const STORAGE_KEY = "forge_history";

let lastEntry = null;

function calculate() {
    const target = parseInt(document.getElementById("target").value);
    const tailInput = document.getElementById("tail").value.trim();
    const nameInput = document.getElementById("schemeName").value.trim();
    const output = document.getElementById("output");

    if (isNaN(target) || target < MIN || target > MAX) {
        output.innerHTML = `<span class='error'>Цель должна быть в диапазоне ${MIN}–${MAX}</span>`;
        return;
    }

    const fixedTail = tailInput ? tailInput.split(/\s+/).map(Number) : [];
    if (fixedTail.some(isNaN)) {
        output.innerHTML = "<span class='error'>Ошибка в последних операциях</span>";
        return;
    }

    const result = findSequence(target, fixedTail);
    if (!result) {
        output.innerHTML = "<span class='error'>Решение не найдено</span>";
        return;
    }

    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const schemeName = nameInput || `Схема ковки №${history.length + 1}`;

    lastEntry = { name: schemeName, target, result };

    output.textContent =
        `${schemeName}\n\nОперации:\n${result.join(" → ")}\n\nШагов: ${result.length}`;

    saveToHistory(lastEntry);
    renderHistory();
}

function findSequence(target, fixedTail, maxSteps = 12) {
    const needed = target - fixedTail.reduce((a, b) => a + b, 0);
    if (needed < MIN || needed > MAX) return null;

    const queue = [{ value: 0, path: [] }];
    const visited = new Set([0]);

    while (queue.length) {
        const { value, path } = queue.shift();
        if (value === needed) return [...path, ...fixedTail];
        if (path.length >= maxSteps) continue;

        for (const op of OPERATIONS) {
            const v = value + op;
            if (v < MIN || v > MAX) continue;
            if (!visited.has(v)) {
                visited.add(v);
                queue.push({ value: v, path: [...path, op] });
            }
        }
    }
    return null;
}

function copyResult() {
    if (!lastEntry) return;
    navigator.clipboard.writeText(
`${lastEntry.name}
Цель: ${lastEntry.target}
Операции: ${lastEntry.result.join(" → ")}
Шагов: ${lastEntry.result.length}`
    );
    alert("Результат скопирован 👍");
}

function copyHistory(index) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const h = history[index];
    if (!h) return;

    navigator.clipboard.writeText(
`${h.name}
Цель: ${h.target}
Операции: ${h.result.join(" → ")}
Шагов: ${h.result.length}`
    );
    alert("Схема скопирована 👍");
}

function deleteHistory(index) {
    let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    history.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    renderHistory();
}

function saveToHistory(entry) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    history.unshift({ time: new Date().toLocaleString(), ...entry });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
}

function loadFromHistory(index) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const h = history[index];
    if (!h) return;

    document.getElementById("schemeName").value = h.name;
    document.getElementById("target").value = h.target;
    document.getElementById("tail").value = h.result.slice(-3).join(" ");

    lastEntry = h;

    document.getElementById("output").textContent =
        `${h.name}\n\nОперации:\n${h.result.join(" → ")}\n\nШагов: ${h.result.length}`;
}

function renderHistory() {
    const historyList = document.getElementById("historyList");
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    historyList.innerHTML = history.length
        ? history.map((h, i) => `
            <div class="history-item">
                <small>${h.time}</small>
                <div class="scheme-name">${h.name}</div>
                ${h.result.join(" → ")}
                <div class="history-actions">
                    <button class="load-btn" onclick="loadFromHistory(${i})">Загрузить</button>
                    <button class="load-btn" onclick="copyHistory(${i})">Скопировать схему</button>
                    <button class="delete-btn" onclick="deleteHistory(${i})">Удалить</button>
                </div>
            </div>
        `).join("")
        : "<small style='color:#777'>История пуста</small>";
}

function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
}

renderHistory();
