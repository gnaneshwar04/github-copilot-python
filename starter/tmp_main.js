const SIZE = 9;
const LEADERBOARD_STORAGE_KEY = 'sudoku-fastest-times';
const THEME_STORAGE_KEY = 'sudoku-theme';
const MAX_LEADERBOARD_ENTRIES = 10;
let puzzle = [];
let timerInterval = null;
let secondsElapsed = 0;
let hintsUsed = 0;
let gameCompleted = false;

function getBoardElement() {
  return document.getElementById('sudoku-board');
}

function getLeaderboardElement() {
  return document.getElementById('leaderboard');
}

function getPlayerName() {
  const playerInput = document.getElementById('player-name');
  const enteredName = playerInput?.value?.trim() || '';
  return enteredName || 'Anonymous';
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function getLeaderboardEntries() {
  try {
    const storedValue = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    console.warn('Unable to read leaderboard data:', error);
    return [];
  }
}

function saveLeaderboardEntries(entries) {
  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn('Unable to save leaderboard data:', error);
  }
}

function renderLeaderboard() {
  const leaderboardElement = getLeaderboardElement();
  if (!leaderboardElement) return;

  const entries = getLeaderboardEntries()
    .slice()
    .sort((a, b) => a.seconds - b.seconds)
    .slice(0, MAX_LEADERBOARD_ENTRIES);

  if (!entries.length) {
    leaderboardElement.innerHTML = '<p class="leaderboard-empty">No completed runs yet. Finish a puzzle to get on the board.</p>';
    return;
  }

  leaderboardElement.innerHTML = `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Player Name</th>
          <th>Time</th>
          <th>Hints</th>
          <th>Difficulty</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((entry, index) => `
          <tr>
            <td data-label="#">${index + 1}</td>
            <td data-label="Player Name">${entry.playerName}</td>
            <td data-label="Time">${entry.time}</td>
            <td data-label="Hints">${entry.hintsUsed || 0}</td>
            <td data-label="Difficulty">${entry.difficulty}</td>
            <td data-label="Date">${new Date(entry.completedAt).toLocaleDateString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function recordLeaderboardEntry(difficulty, totalSeconds) {
  if (gameCompleted) {
    return;
  }

  const entry = {
    playerName: getPlayerName(),
    difficulty,
    seconds: totalSeconds,
    time: formatTime(totalSeconds),
    hintsUsed,
    completedAt: new Date().toISOString()
  };

  const entries = getLeaderboardEntries();
  entries.push(entry);
  const sortedEntries = entries
    .sort((a, b) => a.seconds - b.seconds)
    .slice(0, MAX_LEADERBOARD_ENTRIES);

  saveLeaderboardEntries(sortedEntries);
  renderLeaderboard();
  gameCompleted = true;
}

function applyCellState(input, isPrefilled, isIncorrect = false) {
  input.classList.remove('prefilled', 'incorrect');
  if (isPrefilled) input.classList.add('prefilled');
  if (isIncorrect) input.classList.add('incorrect');
}

function validateCellConflict(cellInput) {
  const row = parseInt(cellInput.dataset.row, 10);
  const col = parseInt(cellInput.dataset.col, 10);
  const value = cellInput.value.trim();

  if (!value || value === '') {
    cellInput.classList.remove('invalid');
    return;
  }

  const cellNum = parseInt(value, 10);
  if (cellNum < 1 || cellNum > 9) {
    cellInput.classList.remove('invalid');
    return;
  }

  const inputs = document.querySelectorAll('.sudoku-cell');
  let hasConflict = false;

  inputs.forEach((inp) => {
    const inputRow = parseInt(inp.dataset.row, 10);
    const inputCol = parseInt(inp.dataset.col, 10);
    const inputValue = inp.value.trim();

    if (!inputValue || inp === cellInput) return;

    const inputNum = parseInt(inputValue, 10);
    if (isNaN(inputNum)) return;

    // Check row conflict
    if (inputRow === row && inputNum === cellNum) {
      hasConflict = true;
      return;
    }

    // Check column conflict
    if (inputCol === col && inputNum === cellNum) {
      hasConflict = true;
      return;
    }

    // Check 3x3 box conflict
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);
    const inputBoxRow = Math.floor(inputRow / 3);
    const inputBoxCol = Math.floor(inputCol / 3);

    if (boxRow === inputBoxRow && boxCol === inputBoxCol && inputNum === cellNum) {
      hasConflict = true;
    }
  });

  if (hasConflict) {
    cellInput.classList.add('invalid');
  } else {
    cellInput.classList.remove('invalid');
  }
}

function createBoardElement() {
  const boardDiv = getBoardElement();
  boardDiv.innerHTML = '';

  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';

    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;

      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        validateCellConflict(e.target);
      });

      rowDiv.appendChild(input);
    }

    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  gameCompleted = false;
  hintsUsed = 0;
  createBoardElement();

  const inputs = document.querySelectorAll('.sudoku-cell');

  inputs.forEach((inp, idx) => {
    const row = Math.floor(idx / SIZE);
    const col = idx % SIZE;
    const val = puzzle[row][col];

    inp.value = val !== 0 ? String(val) : '';
    inp.disabled = val !== 0;
    inp.classList.remove('invalid');

    applyCellState(inp, val !== 0, false);
  });
}

function startTimer() {
  clearInterval(timerInterval);
  secondsElapsed = 0;
  const timerDisplay = document.getElementById('timer');
  
  timerInterval = setInterval(() => {
    secondsElapsed++;
    const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const secs = String(secondsElapsed % 60).padStart(2, '0');
    if (timerDisplay) timerDisplay.innerText = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

async function newGame() {
  const difficulty = document.getElementById('difficulty-select')?.value || 'Medium';
  const res = await fetch(`/new?difficulty=${difficulty}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
  document.getElementById('message').innerText = '';
  startTimer();
}

async function checkSolution() {
  const inputs = document.querySelectorAll('.sudoku-cell');
  const board = [];

  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }

  const res = await fetch('/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board })
  });

  const data = await res.json();
  const msg = document.getElementById('message');

  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }

  // Highlight incorrect cells
  inputs.forEach((inp, idx) => {
    const row = Math.floor(idx / SIZE);
    const col = idx % SIZE;
    const isIncorrect = data.incorrect.some(([r, c]) => r === row && c === col);
    applyCellState(inp, inp.disabled, isIncorrect);
  });

  if (data.incorrect.length === 0) {
    const difficulty = document.getElementById('difficulty-select')?.value || 'Medium';
    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! Puzzle solved!';
    recordLeaderboardEntry(difficulty, secondsElapsed);
    stopTimer();
  } else {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
  }
}

async function getHint() {
  const inputs = document.querySelectorAll('.sudoku-cell');
  const emptyCells = [];

  inputs.forEach((inp, idx) => {
    if (!inp.disabled && inp.value === '') {
      emptyCells.push({ inp, idx });
    }
  });

  if (emptyCells.length === 0) return;

  const target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const row = Math.floor(target.idx / SIZE);
  const col = target.idx % SIZE;

  const res = await fetch('/hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ row, col })
  });
  
  const data = await res.json();
  if (data.value) {
    target.inp.value = data.value;
    target.inp.disabled = true;
    hintsUsed++;
    applyCellState(target.inp, true, false);
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
  applyTheme(isDark);
}

function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const isDark = currentTheme === 'dark';
  applyTheme(!isDark);
}

window.addEventListener('load', () => {
  initTheme();
  renderLeaderboard();
  document.getElementById('new-game')?.addEventListener('click', newGame);
  document.getElementById('check-solution')?.addEventListener('click', checkSolution);
  document.getElementById('hint-btn')?.addEventListener('click', getHint);
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
});
