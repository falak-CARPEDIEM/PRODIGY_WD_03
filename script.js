// ====== ELEMENTS ======
const cells = Array.from(document.querySelectorAll(".cell"));
const statusText = document.getElementById("status");

const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreDrawsEl = document.getElementById("score-draws");

const labelXEl = document.getElementById("label-x");
const labelOEl = document.getElementById("label-o");

const newRoundBtn = document.getElementById("new-round");
const resetScoresBtn = document.getElementById("reset-scores");
const winLine = document.getElementById("win-line");

const modeOverlay = document.getElementById("mode-overlay");
const modePvpBtn = document.getElementById("mode-pvp");
const modeAiBtn = document.getElementById("mode-ai");
const changeModeBtn = document.getElementById("change-mode");


// ====== GAME CONSTANTS ======
const HUMAN = "X";
const AI = "O";

// mode: "PVP" | "AI" | null
let mode = null;

// state
let board = Array(9).fill(null);
let currentTurn = "X";
let gameActive = false;
let isAiThinking = false;

let scoreX = 0;
let scoreO = 0;
let scoreDraws = 0;

const winningCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// map combination -> CSS class for win line
const comboToLineClass = {
  "0,1,2": "h0",
  "3,4,5": "h1",
  "6,7,8": "h2",
  "0,3,6": "v0",
  "1,4,7": "v1",
  "2,5,8": "v2",
  "0,4,8": "d0",
  "2,4,6": "d1",
};

// ====== HELPERS ======

function makeMove(index, player) {
  board[index] = player;
  const cell = cells[index];
  cell.textContent = player;
  cell.classList.add(player.toLowerCase());
}

function checkWinnerState(b) {
  for (const combo of winningCombos) {
    const [a, bIdx, c] = combo;
    if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
      const key = combo.toString();
      const lineClass = comboToLineClass[key];
      return { winner: b[a], combo, lineClass };
    }
  }
  return null;
}

function updateScoresAndShowWin(winnerInfo) {
  const { winner, combo, lineClass } = winnerInfo;

  let message;

  if (mode === "AI") {
    if (winner === HUMAN) {
      scoreX++;
      message = "You win this round! 🎉";
    } else {
      scoreO++;
      message = "Computer wins this round. 🤖";
    }
  } else {
    if (winner === "X") {
      scoreX++;
      message = "Player X wins this round! 🎉";
    } else {
      scoreO++;
      message = "Player O wins this round! 🎉";
    }
  }

  scoreXEl.textContent = scoreX;
  scoreOEl.textContent = scoreO;

  combo.forEach((i) => cells[i].classList.add("winning"));
  winLine.className = "win-line show " + lineClass;

  statusText.textContent = message;
  gameActive = false;
}

function getBestMove() {
  const emptyIndices = board
    .map((val, idx) => (val === null ? idx : null))
    .filter((v) => v !== null);

  // 1) AI can win?
  for (const idx of emptyIndices) {
    const temp = board.slice();
    temp[idx] = AI;
    if (checkWinnerState(temp)?.winner === AI) return idx;
  }

  // 2) Block human win
  for (const idx of emptyIndices) {
    const temp = board.slice();
    temp[idx] = HUMAN;
    if (checkWinnerState(temp)?.winner === HUMAN) return idx;
  }

  // 3) Center
  if (emptyIndices.includes(4)) return 4;

  // 4) Corners
  const corners = emptyIndices.filter((i) => [0, 2, 6, 8].includes(i));
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // 5) Any remaining
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

// ====== MODE HANDLING ======

function setMode(newMode) {
  mode = newMode;
  // update labels
  if (mode === "AI") {
    labelXEl.textContent = "You (X)";
    labelOEl.textContent = "Computer (O)";
  } else {
    labelXEl.textContent = "Player X";
    labelOEl.textContent = "Player O";
  }

  resetScores(false); // reset scores & board but custom message below

  if (mode === "AI") {
    statusText.textContent = "Your turn (Player X).";
  } else {
    statusText.textContent = "Player X, it’s your turn.";
  }

  modeOverlay.classList.add("hidden");
}

modePvpBtn.addEventListener("click", () => setMode("PVP"));
modeAiBtn.addEventListener("click", () => setMode("AI"));

// ====== ROUND / SCORE CONTROL ======

function startNewRound(showMessage = true) {
  board = Array(9).fill(null);
  currentTurn = "X";
  gameActive = Boolean(mode);
  isAiThinking = false;

  cells.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("x", "o", "winning");
  });
  winLine.className = "win-line";

  if (!mode) {
    statusText.textContent = "Choose a mode to start playing.";
    gameActive = false;
    return;
  }

  if (!showMessage) return;

  if (mode === "AI") {
    statusText.textContent = "Your turn (Player X).";
  } else {
    statusText.textContent = "Player X, it’s your turn.";
  }
}

function resetScores(showMessage = true) {
  scoreX = 0;
  scoreO = 0;
  scoreDraws = 0;
  scoreXEl.textContent = "0";
  scoreOEl.textContent = "0";
  scoreDrawsEl.textContent = "0";
  startNewRound(showMessage);

  if (showMessage && mode) {
    if (mode === "AI") {
      statusText.textContent = "Scores reset. New game vs Computer — your turn (X).";
    } else {
      statusText.textContent = "Scores reset. Player X starts the new game.";
    }
  }
}

// ====== CLICK HANDLERS ======

function handleCellClick(e) {
  const cell = e.target;
  const index = parseInt(cell.dataset.index, 10);

  if (!mode) {
    statusText.textContent = "Choose a mode first to start playing.";
    return;
  }

  if (!gameActive) return;
  if (isAiThinking) return;
  if (board[index] !== null) return;

  if (mode === "AI") {
    // HUMAN = X only
    if (currentTurn !== HUMAN) return;

    // human move
    makeMove(index, HUMAN);

    const winnerInfo = checkWinnerState(board);
    if (winnerInfo) {
      updateScoresAndShowWin(winnerInfo);
      return;
    }

    if (!board.includes(null)) {
      gameActive = false;
      scoreDraws++;
      scoreDrawsEl.textContent = scoreDraws;
      statusText.textContent = "It’s a draw this round.";
      return;
    }

    // AI turn
    currentTurn = AI;
    statusText.textContent = "Computer is thinking...";
    isAiThinking = true;

    setTimeout(() => {
      aiMove();
    }, 450);
  } else {
    // PVP mode
    makeMove(index, currentTurn);

    const winnerInfo = checkWinnerState(board);
    if (winnerInfo) {
      updateScoresAndShowWin(winnerInfo);
      return;
    }

    if (!board.includes(null)) {
      gameActive = false;
      scoreDraws++;
      scoreDrawsEl.textContent = scoreDraws;
      statusText.textContent = "It’s a draw this round.";
      return;
    }

    currentTurn = currentTurn === "X" ? "O" : "X";
    statusText.textContent = `Player ${currentTurn}, it’s your turn.`;
  }
}

function aiMove() {
  if (!gameActive || mode !== "AI") {
    isAiThinking = false;
    return;
  }

  const index = getBestMove();
  makeMove(index, AI);

  const winnerInfo = checkWinnerState(board);
  if (winnerInfo) {
    updateScoresAndShowWin(winnerInfo);
    isAiThinking = false;
    return;
  }

  if (!board.includes(null)) {
    gameActive = false;
    scoreDraws++;
    scoreDrawsEl.textContent = scoreDraws;
    statusText.textContent = "It’s a draw this round.";
    isAiThinking = false;
    return;
  }

  currentTurn = HUMAN;
  isAiThinking = false;
  statusText.textContent = "Your turn (Player X).";
}

// ====== EVENT BINDINGS ======

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
newRoundBtn.addEventListener("click", () => startNewRound(true));
resetScoresBtn.addEventListener("click", () => resetScores(true));
changeModeBtn.addEventListener("click", () => {
  // Mode reset
  mode = null;

  // Scores + board reset (but no message spam)
  resetScores(false);

  // Mode overlay dobara show
  modeOverlay.classList.remove("hidden");

  // Status text
  statusText.textContent = "Choose a mode to start playing.";
});


// initial state
startNewRound(false);
statusText.textContent = "Choose a mode to start playing.";
