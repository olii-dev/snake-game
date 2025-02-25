const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const snakeColorInput = document.getElementById('snake-color');
const gameSpeedInput = document.getElementById('game-speed');
const gridSizeInput = document.getElementById('grid-size');
const foodColorInput = document.getElementById('food-color');
const gameStyleInput = document.getElementById('game-style');
const settingsButton = document.getElementById('settings-button');
const settingsPanel = document.getElementById('settings-panel');
const applySettingsButton = document.getElementById('apply-settings-button');
const closeSettingsButton = document.getElementById('close-settings-button');
const settingsSnakeColorInput = document.getElementById('settings-snake-color');
const settingsGameSpeedInput = document.getElementById('settings-game-speed');
const settingsGridSizeInput = document.getElementById('settings-grid-size');
const settingsFoodColorInput = document.getElementById('settings-food-color');
const settingsGameStyleInput = document.getElementById('settings-game-style');

startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    initializeGame();
});

window.addEventListener('load', () => {
    startScreen.style.display = 'flex';
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const powerupMessage = document.getElementById('powerup-message');
const gameOverScreen = document.getElementById('game-over-screen');
const gameOverScore = document.getElementById('game-over-score');
const gameOverHighScore = document.getElementById('game-over-high-score');
const restartButton = document.getElementById('restart-button');
const pauseScreen = document.getElementById('pause-screen');
const continueButton = document.getElementById('continue-button');

let snake = [{ x: 5, y: 5 }];
let direction = { x: 1, y: 0 };
let food = { x: 10, y: 10 };
let powerUp = null;
let score = 0;
let highScore = 0;
let gameInterval = 120;
let gameLoopId;
let isGameOver = false;
let isInvincible = false;
let activePowerUp = null;
let powerUpTimeoutId = null;
let isPaused = false;
let snakeColor = '#00FF00';
let gridSize = 20;
let foodColor = '#FF0000';
let scoreMultiplier = 1;
let gameStyle = 'classic';
const powerupFrequency = 0.3;
let particles = [];

settingsButton.addEventListener('click', () => {
    if (isGameOver) {
        settingsPanel.style.display = 'flex';
        settingsSnakeColorInput.value = snakeColorInput.value;
        settingsGameSpeedInput.value = gameSpeedInput.value;
        settingsGridSizeInput.value = gridSizeInput.value;
        settingsFoodColorInput.value = foodColorInput.value;
        settingsGameStyleInput.value = gameStyleInput.value;
    }
});

closeSettingsButton.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
});

applySettingsButton.addEventListener('click', () => {
    snakeColorInput.value = settingsSnakeColorInput.value;
    gameSpeedInput.value = settingsGameSpeedInput.value;
    gridSizeInput.value = settingsGridSizeInput.value;
    foodColorInput.value = settingsFoodColorInput.value;
    gameStyleInput.value = settingsGameStyleInput.value;
    initializeGame();
    settingsPanel.style.display = 'none';
});

function initializeGame() {
    snakeColor = snakeColorInput.value;
    gameInterval = parseInt(gameSpeedInput.value, 10);
    gridSize = parseInt(gridSizeInput.value, 10);
    foodColor = foodColorInput.value;
    gameStyle = gameStyleInput.value;

    canvas.width = gridSize * 20;
    canvas.height = gridSize * 20;

    // Remove any existing style classes
    canvas.className = '';
    // Add the selected style class
    canvas.classList.add(gameStyle);

    // Load high score for the current grid size and speed
    const highScoreKey = `highScore_${gridSize}_${gameInterval}`;
    highScore = localStorage.getItem(highScoreKey) || 0;
    highScoreDisplay.textContent = `High Score: ${highScore}`;

    resetGame();
}

function gameLoop() {
    if (isGameOver || isPaused) return;
    update();
    draw();
    if (gameStyle === 'modern') {
        drawParticles();
    }
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
        score += 1 * scoreMultiplier;
        scoreDisplay.textContent = `Score: ${score}`;
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = `High Score: ${highScore}`;
            const highScoreKey = `highScore_${gridSize}_${gameInterval}`;
            localStorage.setItem(highScoreKey, highScore);
        }
        if (gameStyle === 'modern') {
            particles.push(...createParticles(head.x * gridSize + gridSize / 2, head.y * gridSize + gridSize / 2, foodColor));
        }
        spawnFood();
        spawnPowerUp();
    } else {
        snake.pop();
    }

    if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
        if (gameStyle === 'modern') {
            particles.push(...createParticles(head.x * gridSize + gridSize / 2, head.y * gridSize + gridSize / 2, 'blue'));
        }
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

    // Draw snake with style based on selected category
    ctx.save();
    snake.forEach((part, index) => {
        ctx.beginPath();
        if (gameStyle === 'classic') {
            ctx.rect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
        } else {
            ctx.arc(part.x * gridSize + gridSize / 2, part.y * gridSize + gridSize / 2, gridSize / 2, 0, Math.PI * 2);
        }
        ctx.closePath();
        ctx.fillStyle = snakeColor;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        if (index === 0 && gameStyle !== 'classic') {
            // Draw eyes on the snake's head for non-classic styles
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(part.x * gridSize + gridSize / 4, part.y * gridSize + gridSize / 4, gridSize / 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(part.x * gridSize + 3 * gridSize / 4, part.y * gridSize + gridSize / 4, gridSize / 8, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.restore();

    // Draw food with style based on selected category
    ctx.save();
    ctx.beginPath();
    if (gameStyle === 'classic') {
        ctx.rect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    } else {
        ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize / 2, 0, Math.PI * 2);
    }
    ctx.fillStyle = foodColor;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw power-up with style based on selected category
    if (powerUp) {
        ctx.save();
        ctx.beginPath();
        if (gameStyle === 'classic') {
            ctx.rect(powerUp.x * gridSize, powerUp.y * gridSize, gridSize, gridSize);
        } else {
            ctx.arc(powerUp.x * gridSize + gridSize / 2, powerUp.y * gridSize + gridSize / 2, gridSize / 2, 0, Math.PI * 2);
        }
        ctx.fillStyle = 'blue';
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // Draw grid lines if applicable
    if (gameStyle === 'classic' || gameStyle === 'retro') {
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
    }
}

function createParticles(x, y, color) {
    const particlesArray = [];
    for (let i = 0; i < 10; i++) { // Reduced number of particles for quicker effect
        particlesArray.push({
            x: x,
            y: y,
            size: Math.random() * 2 + 1, // Larger initial size for quicker decay
            speedX: Math.random() * 4 - 2, // Faster movement
            speedY: Math.random() * 4 - 2, // Faster movement
            color: color,
            alpha: 1 // Start with full opacity
        });
    }
    return particlesArray;
}

function drawParticles() {
    particles.forEach((particle, index) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(particle.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.size -= 0.1; // Quicker decay
        particle.alpha -= 0.05; // Gradually reduce opacity
        if (particle.size <= 0 || particle.alpha <= 0) {
            particles.splice(index, 1);
        }
    });
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
}

function spawnPowerUp() {
    if (activePowerUp) {
        return;
    }
    if (Math.random() < powerupFrequency) {
        powerUp = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)),
            y: Math.floor(Math.random() * (canvas.height / gridSize)),
            type: getRandomPowerUpType()
        };
    }
}

function getRandomPowerUpType() {
    const types = ['invincibility', 'growth', 'slow', 'scoreMultiplier'];
    return types[Math.floor(Math.random() * types.length)];
}

function activatePowerUp(type) {
    let powerUpDuration = 0;
    switch (type) {
        case 'invincibility':
            isInvincible = true;
            activePowerUp = 'invincibility';
            powerupMessage.textContent = 'Power-Up: Invincibility!';
            powerUpDuration = 5000;
            break;
        case 'growth':
            for (let i = 0; i < 3; i++) {
                snake.push({ ...snake[snake.length - 1] });
            }
            activePowerUp = 'growth';
            powerupMessage.textContent = 'Power-Up: Growth Spurt!';
            score = snake.length - 1;
            scoreDisplay.textContent = `Score: ${score}`;
            powerUpDuration = 3000;
            break;
        case 'slow':
            gameInterval *= 1.5;
            activePowerUp = 'slow';
            powerupMessage.textContent = 'Power-Up: Slow Motion!';
            powerUpDuration = 5000;
            break;
        case 'scoreMultiplier':
            scoreMultiplier = 2;
            activePowerUp = 'scoreMultiplier';
            powerupMessage.textContent = 'Power-Up: Score Multiplier!';
            powerUpDuration = 7000;
            break;
    }

    // Notify the player when the power-up is about to end
    powerUpTimeoutId = setTimeout(() => {
        powerupMessage.textContent = `Power-Up ending soon!`;
    }, powerUpDuration - 2000); // Notify 2 seconds before the power-up ends

    powerUpTimeoutId = setTimeout(() => {
        switch (type) {
            case 'invincibility':
                isInvincible = false;
                break;
            case 'slow':
                gameInterval /= 1.5;
                break;
            case 'scoreMultiplier':
                scoreMultiplier = 1;
                break;
        }
        powerupMessage.textContent = '';
        activePowerUp = null;
    }, powerUpDuration);
}

function gameOver() {
    isGameOver = true;
    clearTimeout(gameLoopId);
    clearTimeout(powerUpTimeoutId);
    gameOverScore.textContent = `Your Score: ${score}`;
    gameOverHighScore.textContent = `High Score: ${highScore}`;
    gameOverScreen.style.display = 'flex';
}

function resetGame() {
    snake = [{ x: 5, y: 5 }];
    direction = { x: 1, y: 0 };
    score = 0;
    scoreMultiplier = 1;
    scoreDisplay.textContent = `Score: ${score}`;
    gameInterval = parseInt(gameSpeedInput.value, 10);
    isGameOver = false;
    isInvincible = false;
    activePowerUp = null;
    powerupMessage.textContent = '';
    gameOverScreen.style.display = 'none';
    pauseScreen.style.display = 'none';
    spawnFood();
    gameLoop();
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        clearTimeout(gameLoopId);
        clearTimeout(powerUpTimeoutId);
        pauseScreen.style.display = 'flex';
    } else {
        pauseScreen.style.display = 'none';
        gameLoop();
        if (activePowerUp) {
            activatePowerUp(activePowerUp);
        }
    }
}

restartButton.addEventListener('click', resetGame);
continueButton.addEventListener('click', togglePause);

document.addEventListener('keydown', event => {
    if (isGameOver && event.code === 'Space') {
        resetGame();
        return;
    }
    if (event.code === 'KeyP') {
        togglePause();
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