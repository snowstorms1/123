/* --------------------------------------------------
 * Minesweeper – vanilla JS implementation
 *
 * Author: me
 * -------------------------------------------------- */

const boardEl = document.getElementById('board');
const newGameBtn = document.getElementById('newGameBtn');
const difficultySelect = document.getElementById('difficulty');
const statusEl = document.getElementById('status');

// Difficulty presets
const DIFFICULTY = {
  easy:   { rows:9, cols:9, mines:10 },
  medium:{ rows:16, cols:16, mines:40 },
  hard:   { rows:24, cols:24, mines:99 }
};

let board;          // 2D array of cell objects
let rows, cols, mineCount;
let revealedCells = 0;
let gameOver = false;

/* Cell definition */
class Cell {
  constructor(r, c) {
    this.r = r;            // row index
    this.c = c;            // col index
    this.isMine = false;
    this.adjacent = 0;
    this.revealed = false;
    this.flagged = false;
  }
}

/* --------------------------------------- */
/* Game initialization                       */
function initGame(difficultyKey) {
  ({ rows, cols, mineCount } = DIFFICULTY[difficultyKey]);

  // Reset state
  boardEl.innerHTML = '';
  board = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => new Cell(r, c))
  );
  revealedCells = 0;
  gameOver = false;
  statusEl.textContent = '';

  // Set CSS grid dimensions
  boardEl.style.gridTemplateRows = `repeat(${rows},1fr)`;
  boardEl.style.gridTemplateColumns = `repeat(${cols},1fr)`;

  // Create DOM elements for cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellDiv = document.createElement('div');
      cellDiv.className = 'cell';
      cellDiv.dataset.r = r;
      cellDiv.dataset.c = c;

      // Left click – reveal
      cellDiv.addEventListener('click', () => handleCellClick(r, c));

      // Right click – flag
      cellDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(r, c);
      });

      boardEl.appendChild(cellDiv);
    }
  }

  placeMines();
  calculateAdjacents();
}

/* --------------------------------------- */
/* Place mines randomly */
function placeMines() {
  let placed = 0;
  while (placed < mineCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].isMine) {
      board[r][c].isMine = true;
      placed++;
    }
  }
}

/* --------------------------------------- */
/* Count adjacent mines for each cell */
function calculateAdjacents() {
  const dirs = [-1,0,1];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      dirs.forEach(dr => dirs.forEach(dc => {
        const nr = r + dr, nc = c + dc;
        if (nr>=0 && nr<rows && nc>=0 && nc<cols && board[nr][nc].isMine)
          count++;
      }));
      board[r][c].adjacent = count;
    }
  }
}

/* --------------------------------------- */
/* Reveal cell logic */
function handleCellClick(r, c) {
  if (gameOver) return;

  const cell = board[r][c];
  if (cell.revealed || cell.flagged) return;

  revealCell(cell);

  // Check win
  if (revealedCells === rows * cols - mineCount) {
    gameOver = true;
    statusEl.textContent = '🎉 You Win!';
  }
}

/* Reveal a cell and propagate if needed */
function revealCell(cell) {
  const { r, c } = cell;
  if (cell.revealed || cell.flagged) return;

  cell.revealed = true;
  revealedCells++;

  const div = getDiv(r, c);
  div.classList.add('revealed');

  if (cell.isMine) {
    // Reveal mine & end game
    div.classList.add('mine');
    gameOver = true;
    revealAllMines();
    statusEl.textContent = '💣 Game Over!';
    return;
  }

  // If zero adjacent, flood-fill
  if (cell.adjacent > 0) {
    div.classList.add(`adjacent-${cell.adjacent}`);
  } else {
    // Empty cell – recursively reveal neighbors
    const dirs = [-1,0,1];
    dirs.forEach(dr => dirs.forEach(dc => {
      const nr = r + dr, nc = c + dc;
      if (nr>=0 && nr<rows && nc>=0 && nc<cols)
        revealCell(board[nr][nc]);
    }));
  }
}

/* Toggle flag on a cell */
function toggleFlag(r, c) {
  const cell = board[r][c];
  if (cell.revealed || gameOver) return;

  cell.flagged = !cell.flagged;
  const div = getDiv(r, c);
  div.classList.toggle('flagged');
}

/* Reveal all mines on loss */
function revealAllMines() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (cell.isMine) {
        const div = getDiv(r, c);
        div.classList.add('mine');
      }
    }
  }
}

/* Utility – get the DOM element for a cell */
function getDiv(r, c) {
  return boardEl.children[r * cols + c];
}

/* --------------------------------------- */
/* Event listeners */
newGameBtn.addEventListener('click', () => initGame(difficultySelect.value));

/* Start default game on load */
window.onload = () => initGame(difficultySelect.value);
