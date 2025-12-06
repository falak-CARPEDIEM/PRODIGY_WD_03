// board state & elements
const boardElement = document.getElementById("board");
const cells = Array.from(document.querySelectorAll(".cell"));
const statusText = document.getElementById("status");

const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreDrawsEl = document.getElementById("score-draws");

const newRoundBtn = document.getElementById("new-round");
const resetScoresBtn = document.getElementById("reset-scores");

const winLine = document.getElementById("win-line");

// game variables
let board = Array(9).fill(null);
let currentPlayer = "X";
let gameActive = true;

let scoreX = 0;
let scoreO = 0;
let scoreDraws = 0;

const winningCombos = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left col
  [1, 4, 7], // mid col
  [2, 5, 8], // right col
  [0, 4, 8], // main diag
  [2, 4, 6], // anti diag
];

// map combination -> line class
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

function handleCellClick(e) {
  const cell = e.target;
  const index = parseInt(cell.dataset.index, 10);

  if (!gameActive || board[index]) return;

  board[index] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer.toLowerCase());

  const winnerInfo = checkWinner();

  if (winnerInfo) {
    gameActive = false;
    const { winner, combo, lineClass } = winnerInfo;

    if (winner === "X") {
      scoreX++;
      scoreXEl.textContent = scoreX;
    } else if (winner === "O") {
      scoreO++;
      scoreOEl.textContent = scoreO;
    }

    combo.forEach((i) => cells[i].classList.add("winning"));

    // show winning line
    winLine.className = "win-line show " + lineClass;

    statusText.textContent = `Player ${winner} wins this round! 🎉`;
    return;
  }

  if (!board.includes(null)) {
    gameActive = false;
    scoreDraws++;
    scoreDrawsEl.textContent = scoreDraws;
    statusText.textContent = "It’s a draw this round.";
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  statusText.textContent = `Player ${currentPlayer}, it’s your turn.`;
}

function checkWinner() {
  for (const combo of winningCombos) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      const key = combo.toString(); // e.g. "0,1,2"
      const lineClass = comboToLineClass[key];
      return {
        winner: board[a],
        combo,
        lineClass,
      };
    }
  }
  return null;
}

function startNewRound() {
  board = Array(9).fill(null);
  gameActive = true;
  currentPlayer = "X";
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("x", "o", "winning");
  });
  // hide winning line
  winLine.className = "win-line";
  statusText.textContent = "Player X, it’s your turn.";
}

function resetScores() {
  scoreX = 0;
  scoreO = 0;
  scoreDraws = 0;
  scoreXEl.textContent = "0";
  scoreOEl.textContent = "0";
  scoreDrawsEl.textContent = "0";
  startNewRound();
  statusText.textContent = "Scores reset. New game started with Player X.";
}

// events
cells.forEach((cell) => {
  cell.addEventListener("click", handleCellClick);
});

newRoundBtn.addEventListener("click", startNewRound);
resetScoresBtn.addEventListener("click", resetScores);
