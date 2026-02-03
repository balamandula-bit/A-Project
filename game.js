const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];
const TICK_MS = 140;

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

class SnakeGame {
  constructor({ rows, cols, rng = Math.random }) {
    this.rows = rows;
    this.cols = cols;
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.snake = INITIAL_SNAKE.map((segment) => ({ ...segment }));
    this.direction = "right";
    this.pendingDirection = "right";
    this.score = 0;
    this.gameOver = false;
    this.paused = true;
    this.food = this.spawnFood();
  }

  setDirection(nextDirection) {
    if (!DIRECTIONS[nextDirection]) {
      return;
    }
    const opposite = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };
    if (opposite[this.direction] === nextDirection) {
      return;
    }
    this.pendingDirection = nextDirection;
  }

  togglePause() {
    if (this.gameOver) {
      return;
    }
    this.paused = !this.paused;
  }

  tick() {
    if (this.gameOver || this.paused) {
      return;
    }
    this.direction = this.pendingDirection;
    const vector = DIRECTIONS[this.direction];
    const head = this.snake[0];
    const next = { x: head.x + vector.x, y: head.y + vector.y };

    if (this.isOutOfBounds(next) || this.isSnake(next)) {
      this.gameOver = true;
      return;
    }

    this.snake.unshift(next);

    if (next.x === this.food.x && next.y === this.food.y) {
      this.score += 1;
      this.food = this.spawnFood();
    } else {
      this.snake.pop();
    }
  }

  isOutOfBounds(position) {
    return (
      position.x < 0 ||
      position.y < 0 ||
      position.x >= this.cols ||
      position.y >= this.rows
    );
  }

  isSnake(position) {
    return this.snake.some((segment) => segment.x === position.x && segment.y === position.y);
  }

  spawnFood() {
    const empty = [];
    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.cols; x += 1) {
        if (!this.isSnake({ x, y })) {
          empty.push({ x, y });
        }
      }
    }
    if (empty.length === 0) {
      return { x: -1, y: -1 };
    }
    const index = Math.floor(this.rng() * empty.length);
    return empty[index];
  }
}

const grid = document.querySelector("#grid");
const scoreEl = document.querySelector("#score");
const restartBtn = document.querySelector("#restart");
const pauseBtn = document.querySelector("#pause");
const statusEl = document.querySelector("#status");
const dpadButtons = document.querySelectorAll("[data-dir]");

const game = new SnakeGame({ rows: GRID_SIZE, cols: GRID_SIZE });
const cells = [];

function buildGrid() {
  grid.style.setProperty("grid-template-columns", `repeat(${GRID_SIZE}, 1fr)`);
  grid.style.setProperty("grid-template-rows", `repeat(${GRID_SIZE}, 1fr)`);
  grid.innerHTML = "";
  cells.length = 0;
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    grid.appendChild(cell);
    cells.push(cell);
  }
}

function cellIndex({ x, y }) {
  return y * GRID_SIZE + x;
}

function render() {
  cells.forEach((cell) => {
    cell.className = "cell";
  });

  game.snake.forEach((segment, index) => {
    const cell = cells[cellIndex(segment)];
    if (cell) {
      cell.classList.add("snake");
      if (index === 0) {
        cell.classList.add("head");
      }
    }
  });

  const foodCell = cells[cellIndex(game.food)];
  if (foodCell) {
    foodCell.classList.add("food");
  }

  scoreEl.textContent = String(game.score);
  pauseBtn.textContent = game.paused ? "Resume" : "Pause";

  if (game.gameOver) {
    statusEl.textContent = "Game over! Press restart to play again.";
  } else if (game.paused) {
    statusEl.textContent = "Paused. Press resume or restart.";
  } else {
    statusEl.textContent = "";
  }
}

function restartGame() {
  game.reset();
  game.paused = false;
  render();
}

function handleKey(event) {
  const keyMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right",
  };

  if (event.key === " " || event.key === "p" || event.key === "P") {
    game.togglePause();
    render();
    return;
  }

  const next = keyMap[event.key];
  if (next) {
    game.setDirection(next);
  }
}

buildGrid();
render();

restartBtn.addEventListener("click", restartGame);
pauseBtn.addEventListener("click", () => {
  game.togglePause();
  render();
});

dpadButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const next = button.dataset.dir;
    game.setDirection(next);
    if (game.paused && !game.gameOver) {
      game.togglePause();
    }
    render();
  });
});

document.addEventListener("keydown", handleKey);

setInterval(() => {
  game.tick();
  render();
}, TICK_MS);
