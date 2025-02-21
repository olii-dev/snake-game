const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const powerupMessage = document.getElementById('powerup-message');
const gameOverScreen = document.getElementById('game-over-screen');
const gameOverScore = document.getElementById('game-over-score');
const gameOverHighScore = document.getElementById('game-over-high-score');
const restartButton = document.getElementById('restart-button');

const gridSize = 20;
let snake = [{ x: 5, y: 5 }];
let direction = { x: 1, y: 0 };
let food = { x: 10, y: 10 };
let powerUp = null;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameInterval = 110;
let gameLoopId;
let isGameOver = false;
let isInvincible = false;
let activePowerUp = null;

function gameLoop() {
    if (isGameOver) return;
    update();
    draw();
    gameLoopId = setTimeout(gameLoop, gameInterval);
}

function update() {
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;

    if (isInvincible) {
        if (head.x < 0) head.x = canvas.width / gridSize - 1;
        if (head.x >= canvas.width / gridSize) head.x = 0;
        if (head.y < 0) head.y = canvas.height / gridSize - 1;
        if (head.y >= canvas.height / gridSize) head.y = 0;
    } else {
        if (head.x < 0 || head.x >= canvas.width / gridSize || head.y < 0 || head.y >= canvas.height / gridSize || snake.some((part, index) => index !== 0 && part.x === head.x && part.y === head.y)) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreDisplay.textContent = `Score: ${score}`;
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = `High Score: ${highScore}`;
            localStorage.setItem('highScore', highScore);
        }
        spawnFood();
        spawnPowerUp();
    } else {
        snake.pop();
    }

    if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
        activatePowerUp(powerUp.type);
        powerUp = null;
    }

    if (isInvincible) {
        snake = snake.filter(part =>
            part.x >= 0 && part.x < canvas.width / gridSize &&
            part.y >= 0 && part.y < canvas.height / gridSize
        );
        score = snake.length - 1;
        scoreDisplay.textContent = `Score: ${score}`;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'green';
    snake.forEach((part, index) => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
        if (index === 0) {
            ctx.fillStyle = 'black';
            ctx.fillRect(part.x * gridSize + 5, part.y * gridSize + 5, 2, 2);
            ctx.fillRect(part.x * gridSize + 13, part.y * gridSize + 5, 2, 2);
        }
    });
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    if (powerUp) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(powerUp.x * gridSize, powerUp.y * gridSize, gridSize, gridSize);
    }
    if (isInvincible) {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
}

function spawnPowerUp() {
    if (Math.random() < 0.3) {
        powerUp = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)),
            y: Math.floor(Math.random() * (canvas.height / gridSize)),
            type: getRandomPowerUpType()
        };
    }
}

function getRandomPowerUpType() {
    const types = ['speed', 'invincibility', 'growth', 'slow'];
    return types[Math.floor(Math.random() * types.length)];
}

function activatePowerUp(type) {
    switch (type) {
        case 'speed':
            gameInterval *= 0.8;
            activePowerUp = 'speed';
            powerupMessage.textContent = 'Power-Up: Speed Boost!';
            setTimeout(() => {
                gameInterval /= 0.8;
                powerupMessage.textContent = '';
                activePowerUp = null;
            }, 5000);
            break;
        case 'invincibility':
            isInvincible = true;
            activePowerUp = 'invincibility';
            powerupMessage.textContent = 'Power-Up: Invincibility!';
            setTimeout(() => {
                isInvincible = false;
                powerupMessage.textContent = '';
                activePowerUp = null;
            }, 5000);
            break;
        case 'growth':
            for (let i = 0; i < 3; i++) {
                snake.push({ ...snake[snake.length - 1] });
            }
            activePowerUp = 'growth';
            powerupMessage.textContent = 'Power-Up: Growth Spurt!';
            score = snake.length - 1;
            scoreDisplay.textContent = `Score: ${score}`;
            setTimeout(() => {
                powerupMessage.textContent = '';
                activePowerUp = null;
            }, 3000);
            break;
        case 'slow':
            gameInterval *= 1.5;
            activePowerUp = 'slow';
            powerupMessage.textContent = 'Power-Up: Slow Motion!';
            setTimeout(() => {
                gameInterval /= 1.5;
                powerupMessage.textContent = '';
                activePowerUp = null;
            }, 5000);
            break;
    }
}

function gameOver() {
    isGameOver = true;
    clearTimeout(gameLoopId);
    gameOverScore.textContent = `Your Score: ${score}`;
    gameOverHighScore.textContent = `High Score: ${highScore}`;
    gameOverScreen.style.display = 'flex';
}

function resetGame() {
    snake = [{ x: 5, y: 5 }];
    direction = { x: 1, y: 0 };
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    gameInterval = 110;
    isGameOver = false;
    isInvincible = false;
    activePowerUp = null;
    powerupMessage.textContent = '';
    gameOverScreen.style.display = 'none';
    spawnFood();
    gameLoop();
}

restartButton.addEventListener('click', resetGame);

document.addEventListener('keydown', event => {
    if (isGameOver && event.code === 'Space') {
        resetGame();
        return;
    }
    switch (event.key) {
        case 'ArrowUp':
            if (direction.y === 0) direction = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
            if (direction.y === 0) direction = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
            if (direction.x === 0) direction = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
            if (direction.x === 0) direction = { x: 1, y: 0 };
            break;
    }
});

highScoreDisplay.textContent = `High Score: ${highScore}`;
spawnFood();
gameLoop();