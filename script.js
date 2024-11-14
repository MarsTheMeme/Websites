const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = 540;
const HEIGHT = 540;
const ROWS = 9;
const COLS = 9;
const SQUARE_SIZE = WIDTH / COLS;

const board = [];
let score = 0;
let selectedBlock = null;
let nextBlocks = [];

const animationQueue = [];

// Variables for drag and drop
let isDragging = false;
let dragBlock = null;
let mouseX = 0;
let mouseY = 0;

const blocks = [
    [[1]],
    [[1, 1]],
    [[1], [1]],
    [[1, 1, 1]],
    [[1], [1], [1]],
    [[1, 1], [1, 1]],
    [[1, 0], [1, 0], [1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[0,1,0],[1,1,1],[0,1,0]],
    // Add more block shapes as desired
];

function initBoard() {
    for (let i = 0; i < ROWS; i++) {
        board[i] = [];
        for (let j = 0; j < COLS; j++) {
            board[i][j] = 0;
        }
    }
}

function drawGrid() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    for (let i = 0; i <= ROWS; i++) {
        const lineWidth = (i % 3 === 0) ? 2 : 1;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(0, i * SQUARE_SIZE);
        ctx.lineTo(WIDTH, i * SQUARE_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(i * SQUARE_SIZE, 0);
        ctx.lineTo(i * SQUARE_SIZE, HEIGHT);
        ctx.stroke();
    }
}

function drawBoard() {
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            if (board[i][j]) {
                ctx.fillStyle = '#6495ED';
                ctx.fillRect(j * SQUARE_SIZE, i * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
                ctx.strokeStyle = '#121212';
                ctx.strokeRect(j * SQUARE_SIZE, i * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
            }
        }
    }
}

function getRandomBlock() {
    return blocks[Math.floor(Math.random() * blocks.length)];
}

function generateNextBlocks() {
    nextBlocks = [];
    for (let i = 0; i < 3; i++) {
        nextBlocks.push(getRandomBlock());
    }
    drawNextBlocks();
}


function canPlace(block, x, y) {
    for (let i = 0; i < block.length; i++) {
        for (let j = 0; j < block[i].length; j++) {
            if (block[i][j]) {
                const newX = x + j;
                const newY = y + i;
                if (
                    newX < 0 || newX >= COLS ||
                    newY < 0 || newY >= ROWS ||
                    board[newY][newX]
                ) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placeBlock(block, x, y) {
    for (let i = 0; i < block.length; i++) {
        for (let j = 0; j < block[i].length; j++) {
            if (block[i][j]) {
                board[y + i][x + j] = 1;
            }
        }
    }
    checkLines();
    if (nextBlocks.every(b => b === null)) {
        generateNextBlocks();
    }

    if (!anyValidMoves()) {
        setTimeout(() => {
            showGameOver();
        }, 500);
    }
}

function checkLines() {
    let clearedCells = [];
    // Check rows
    for (let i = 0; i < ROWS; i++) {
        if (board[i].every(cell => cell === 1)) {
            for (let j = 0; j < COLS; j++) {
                clearedCells.push({ x: j, y: i });
            }
            score += COLS;
        }
    }
    // Check columns
    for (let j = 0; j < COLS; j++) {
        let columnFull = true;
        for (let i = 0; i < ROWS; i++) {
            if (board[i][j] === 0) {
                columnFull = false;
                break;
            }
        }
        if (columnFull) {
            for (let i = 0; i < ROWS; i++) {
                clearedCells.push({ x: j, y: i });
            }
            score += ROWS;
        }
    }
    // Check subgrids
    for (let x = 0; x < ROWS; x += 3) {
        for (let y = 0; y < COLS; y += 3) {
            let subgridFull = true;
            for (let i = x; i < x + 3; i++) {
                for (let j = y; j < y + 3; j++) {
                    if (board[i][j] === 0) {
                        subgridFull = false;
                        break;
                    }
                }
                if (!subgridFull) break;
            }
            if (subgridFull) {
                for (let i = x; i < x + 3; i++) {
                    for (let j = y; j < y + 3; j++) {
                        clearedCells.push({ x: j, y: i });
                    }
                }
                score += 9;
            }
        }
    }

    document.getElementById('score').innerText = `Score: ${score}`;

    // Add falling animation to the queue
    if (clearedCells.length > 0) {
        animationQueue.push({ type: 'clear', cells: clearedCells, timer: 0 });
        // Clear cells after animation
        for (const cell of clearedCells) {
            board[cell.y][cell.x] = 0;
        }
    }
}

function anyValidMoves() {
    for (const block of nextBlocks.filter(b => b !== null)) {
        for (let i = 0; i <= ROWS - block.length; i++) {
            for (let j = 0; j <= COLS - block[0].length; j++) {
                if (canPlace(block, j, i)) {
                    return true;
                }
            }
        }
        // Check positions where block might fit partially within the grid
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                if (canPlace(block, j, i)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function anyValidMovesForBlock(block) {
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            if (canPlace(block, j, i)) {
                return true;
            }
        }
    }
    return false;
}
function generateNewBlock(index) {
    const newBlock = getRandomBlock();
    if (anyValidMovesForBlock(newBlock)) {
        nextBlocks[index] = newBlock;
    } else {
        nextBlocks[index] = null;
    }
    drawNextBlocks();
}
function generateNextBlocks() {
    for (let i = 0; i < 3; i++) {
        generateNewBlock(i);
    }
}
function checkGameOver() {
    if (nextBlocks.every(block => block === null)) {
        setTimeout(() => {
            showGameOver();
        }, 500);
    }
}

function drawNextBlocks() {
    const blocksContainer = document.getElementById('blocks-container');
    blocksContainer.innerHTML = '';
    nextBlocks.forEach((block, index) => {
        const blockDiv = document.createElement('div');
        blockDiv.classList.add('block-item');
        blockDiv.dataset.index = index;

        const isUsable = anyValidMovesForBlock(block);

        if (!isUsable) {
            blockDiv.classList.add('unusable');
        }

        block.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('block-row');
            row.forEach(cell => {
                const cellDiv = document.createElement('div');
                cellDiv.classList.add('block-cell');
                if (cell) {
                    cellDiv.classList.add('filled');
                    if (!isUsable) {
                        cellDiv.classList.add('grayed');
                    }
                }
                rowDiv.appendChild(cellDiv);
            });
            blockDiv.appendChild(rowDiv);
        });
        blocksContainer.appendChild(blockDiv);
    });
    addDragEvents();
    checkGameOver();
}


function addDragEvents() {
    const blockItems = document.querySelectorAll('.block-item');
    blockItems.forEach(item => {
        item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            const rect = item.getBoundingClientRect();
            const index = parseInt(item.dataset.index);
            dragBlock = {
                block: nextBlocks[index],
                index: index
            };
            selectedBlock = dragBlock.block;
            nextBlocks[index] = null;
            drawNextBlocks();
            const canvasRect = canvas.getBoundingClientRect();
            mouseX = e.clientX - canvasRect.left;
            mouseY = e.clientY - canvasRect.top;
        });
    });
}

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (isDragging) {
        const gridX = Math.floor(mouseX / SQUARE_SIZE);
        const gridY = Math.floor(mouseY / SQUARE_SIZE);
        if (selectedBlock && canPlace(selectedBlock, gridX, gridY)) {
            animationQueue.push({ type: 'place', block: selectedBlock, x: gridX, y: gridY, timer: 0 });
            // After placing, generate a new block
            generateNewBlock(dragBlock.index);
        } else {
            // Return block to next blocks if placement invalid
            nextBlocks[dragBlock.index] = selectedBlock;
            drawNextBlocks();
        }
        selectedBlock = null;
        dragBlock = null;
        isDragging = false;
        checkGameOver();
    }
});

document.addEventListener('mouseup', (e) => {
    if (isDragging) {
        // Handle mouseup outside the canvas
        if (e.target !== canvas) {
            nextBlocks[dragBlock.index] = selectedBlock;
            drawNextBlocks();
            selectedBlock = null;
            dragBlock = null;
            isDragging = false;
        }
    }
});

function drawSelectedBlock() {
    if (selectedBlock && isDragging) {
        const gridX = Math.floor(mouseX / SQUARE_SIZE);
        const gridY = Math.floor(mouseY / SQUARE_SIZE);

        ctx.globalAlpha = 0.5;

        for (let i = 0; i < selectedBlock.length; i++) {
            for (let j = 0; j < selectedBlock[i].length; j++) {
                if (selectedBlock[i][j]) {
                    const x = (gridX + j) * SQUARE_SIZE;
                    const y = (gridY + i) * SQUARE_SIZE;
                    ctx.fillStyle = canPlace(selectedBlock, gridX, gridY) ? '#6495ED' : 'red';
                    ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
                    ctx.strokeStyle = '#121212';
                    ctx.strokeRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
                }
            }
        }
        ctx.globalAlpha = 1.0;
    }
}

function processAnimations() {
    if (animationQueue.length > 0) {
        const animation = animationQueue[0];
        if (animation.type === 'place') {
            animatePlacement(animation);
        } else if (animation.type === 'clear') {
            animateFalling(animation);
        }
    }
}

function animatePlacement(animation) {
    if (animation.timer === 0) {
        // Initial placement animation
        // Could add sound effects here
    }
    animation.timer++;
    if (animation.timer >= 10) {
        placeBlock(animation.block, animation.x, animation.y);
        animationQueue.shift();
    } else {
        // Optional: Add visual effects during placement
    }
}

function animateFalling(animation) {
    const { cells, timer } = animation;
    const fallSpeed = 2; // Slower fall speed
    ctx.save();
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawGrid();
    drawBoard();

    // Animate each cell individually based on its row
    for (const cell of cells) {
        const cellFallTime = (ROWS - cell.y) * 10; // Adjust timing for individual falling
        let yOffset = 0;
        if (timer > cellFallTime) {
            yOffset = (timer - cellFallTime) * fallSpeed;
        }
        if (yOffset > HEIGHT) continue;
        ctx.fillStyle = '#6495ED';
        ctx.fillRect(
            cell.x * SQUARE_SIZE,
            cell.y * SQUARE_SIZE + yOffset,
            SQUARE_SIZE,
            SQUARE_SIZE
        );
    }

    ctx.restore();
    animation.timer++;
    if (animation.timer >= ROWS * 10 + HEIGHT / fallSpeed) {
        animationQueue.shift();
    }
}

function drawNextBlocks() {
    const blocksContainer = document.getElementById('blocks-container');
    blocksContainer.innerHTML = '';
    nextBlocks.forEach((block, index) => {
        if (block) {
            const blockDiv = document.createElement('div');
            blockDiv.classList.add('block-item');
            blockDiv.dataset.index = index;
            blockDiv.style.opacity = 0; // Start with opacity 0

            block.forEach(row => {
                const rowDiv = document.createElement('div');
                rowDiv.classList.add('block-row');
                row.forEach(cell => {
                    const cellDiv = document.createElement('div');
                    cellDiv.classList.add('block-cell');
                    if (cell) {
                        cellDiv.classList.add('filled');
                    }
                    rowDiv.appendChild(cellDiv);
                });
                blockDiv.appendChild(rowDiv);
            });
            blocksContainer.appendChild(blockDiv);

            // Animate the block's opacity to fade in
            setTimeout(() => {
                blockDiv.style.transition = 'opacity 0.5s';
                blockDiv.style.opacity = 1;
            }, 50);
        }
    });
    addDragEvents();
}

function anyValidMoves() {
    for (const block of nextBlocks.filter(b => b !== null)) {
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                if (canPlace(block, j, i)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function showGameOver() {
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScore = document.getElementById('final-score');
    finalScore.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

function restartGame() {
    initBoard();
    score = 0;
    document.getElementById('score').innerText = `Score: ${score}`;
    nextBlocks = [null, null, null];
    generateNextBlocks();
    selectedBlock = null;
    dragBlock = null;
    animationQueue.length = 0;
    const gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.classList.add('hidden');
}


function gameLoop() {
    drawGrid();
    drawBoard();
    processAnimations();
    drawSelectedBlock();
    requestAnimationFrame(gameLoop);
}

// Event Listeners
document.getElementById('restart-button').addEventListener('click', restartGame);

initBoard();
generateNextBlocks();
gameLoop();
