const diceCount = document.querySelector("#diceCount");
const modifierInput = document.querySelector("#modifier");
const zeroRule = document.querySelector("#zeroRule");
const diceArea = document.querySelector("#diceArea");
const totalResult = document.querySelector("#totalResult");
const resultMessage = document.querySelector("#resultMessage");
const rollButton = document.querySelector("#rollButton");
const historyList = document.querySelector("#historyList");
const clearHistoryButton = document.querySelector("#clearHistory");
const rollCounter = document.querySelector("#rollCounter");

const HISTORY_KEY = "tobet-d10-history";
let history = readHistory();

function readHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(saved) ? saved.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function secureRandomInt(max) {
  if (window.crypto?.getRandomValues) {
    const limit = Math.floor(0xffffffff / max) * max;
    const buffer = new Uint32Array(1);
    let value;

    do {
      window.crypto.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= limit);

    return value % max;
  }

  return Math.floor(Math.random() * max);
}

function getMessage(rawRolls, total) {
  const allMax = rawRolls.every((value) => value === 10);
  const allMin = rawRolls.every((value) => value === 1);

  if (allMax) return "A noite abriu todas as portas.";
  if (allMin) return "Até a casa evita comentar essa rolagem.";
  if (rawRolls.includes(10)) return "Um sinal raro atravessa a mesa.";
  if (rawRolls.includes(1)) return "A sorte mostrou os dentes.";
  if (total >= rawRolls.length * 8) return "Frio, preciso e elegante.";
  if (total <= rawRolls.length * 3) return "O escuro pede cautela.";
  return "A casa registra o resultado.";
}

function buildDie(value) {
  const die = document.createElement("div");
  die.className = "die is-rolling";
  die.dataset.value = value;
  die.innerHTML = `
    <span class="die-value">${value}</span>
    <small>D10</small>
  `;
  return die;
}

function renderHistory() {
  rollCounter.textContent = `${history.length} ${history.length === 1 ? "rolagem" : "rolagens"}`;

  if (!history.length) {
    historyList.innerHTML = `
      <li class="history-empty">
        Nenhuma rolagem registrada. A sorte ainda está intacta.
      </li>
    `;
    return;
  }

  historyList.innerHTML = history
    .map((entry, index) => {
      const modifierLabel =
        entry.modifier === 0
          ? "sem modificador"
          : `${entry.modifier > 0 ? "+" : ""}${entry.modifier} de modificador`;

      return `
        <li class="history-item">
          <span class="history-index">${history.length - index}</span>
          <div class="history-details">
            <strong>${entry.rolls.join(" + ")}</strong>
            <span>${entry.count}d10 • ${modifierLabel}</span>
          </div>
          <strong class="history-total">${entry.total}</strong>
        </li>
      `;
    })
    .join("");
}

async function rollDice() {
  const count = Number(diceCount.value);
  const modifier = Math.max(-99, Math.min(99, Number(modifierInput.value) || 0));
  const zeroAs = Number(zeroRule.value);

  rollButton.disabled = true;
  rollButton.firstChild.textContent = "";

  const rolls = Array.from({ length: count }, () => {
    const digit = secureRandomInt(10);
    return digit === 0 ? zeroAs : digit;
  });

  diceArea.innerHTML = "";
  rolls.forEach((roll) => diceArea.appendChild(buildDie(roll)));

  await new Promise((resolve) => setTimeout(resolve, 540));

  document
    .querySelectorAll(".die")
    .forEach((die) => die.classList.remove("is-rolling"));

  const total = rolls.reduce((sum, value) => sum + value, 0) + modifier;

  totalResult.textContent = total;
  resultMessage.textContent = getMessage(rolls, total);

  history.unshift({
    rolls,
    count,
    modifier,
    total,
    createdAt: new Date().toISOString()
  });

  history = history.slice(0, 12);
  saveHistory();
  renderHistory();

  rollButton.disabled = false;
}

function clearHistory() {
  history = [];
  saveHistory();
  renderHistory();
}

rollButton.addEventListener("click", rollDice);
clearHistoryButton.addEventListener("click", clearHistory);

document.addEventListener("keydown", (event) => {
  const activeTag = document.activeElement?.tagName;

  if (
    event.code === "Space" &&
    activeTag !== "INPUT" &&
    activeTag !== "SELECT" &&
    !rollButton.disabled
  ) {
    event.preventDefault();
    rollDice();
  }
});

renderHistory();
