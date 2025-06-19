document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');

    let score = 0;
    let bacchus = {
        x: 0,
        y: 0,
        radius: 20,
        direction: 'right',
        targetX: 0,
        targetY: 0,
        isMoving: false,
        stepSize: 4
    };
    let wineGlasses = [];
    let gameRunning = true;

    let bacchusImage = new Image();
    let wineGlassImage = new Image();
    let imagesLoadedCount = 0;
    const totalImagesToLoad = 2;

    const MAZE_GRID_WIDTH = 21;
    const MAZE_GRID_HEIGHT = 17;
    const MAZE_LAYOUT_DATA = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,1,1,0,0,1,0,0,1,1,1,0,1,1,0,1],
        [1,0,1,1,0,1,1,1,0,0,1,0,0,1,1,1,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1],
        [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
        [1,1,1,1,0,1,1,1,0,0,1,0,0,1,1,1,0,1,1,1,1],
        [0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0],
        [1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1],
        [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,1,1,0,0,1,0,0,1,1,1,0,1,1,0,1],
        [1,0,1,1,0,1,1,1,0,0,1,0,0,1,1,1,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    const BACCHUS_START_COL = 10;
    const BACCHUS_START_ROW = 8;

    let maze = [];

    function preloadImages() {
        return new Promise((resolve, reject) => {
            bacchusImage.src = '/public/bacchus_head.png';
            wineGlassImage.src = '/public/wine_glass_icon.png';

            const checkImagesLoaded = () => {
                imagesLoadedCount++;
                if (imagesLoadedCount === totalImagesToLoad) {
                    resolve();
                }
            };

            bacchusImage.onload = checkImagesLoaded;
            bacchusImage.onerror = () => {
                console.error("Failed to load Bacchus image.");
                alert("Error: Could not load Bacchus image. Please check 'bacchus_head.png' path.");
                reject(new Error('Failed to load Bacchus image.'));
            };

            wineGlassImage.onload = checkImagesLoaded;
            wineGlassImage.onerror = () => {
                console.error("Failed to load wine glass image.");
                alert("Error: Could not load wine glass image. Please check 'wine_glass_icon.png' path.");
                reject(new Error('Failed to load wine glass image.'));
            };
        });
    }

    // --- Game Setup Functions ---

    function resizeCanvas() {
        const container = document.querySelector('.game-container');
        const availableWidth = container.clientWidth - (2 * 20);
        const titleHeight = document.querySelector('h1').offsetHeight;
        const scoreContainerHeight = document.getElementById('score-container').offsetHeight;
        const availableHeight = container.clientHeight - (2 * 20) - titleHeight - scoreContainerHeight;

        const mazeAspectRatio = MAZE_GRID_WIDTH / MAZE_GRID_HEIGHT;

        let newCanvasWidth, newCanvasHeight;

        if (availableWidth / mazeAspectRatio <= availableHeight) {
            newCanvasWidth = availableWidth;
            newCanvasHeight = availableWidth / mazeAspectRatio;
        } else {
            newCanvasHeight = availableHeight;
            newCanvasWidth = availableHeight * mazeAspectRatio;
        }

        canvas.width = newCanvasWidth;
        canvas.height = newCanvasHeight;

        const cellWidth = canvas.width / MAZE_GRID_WIDTH;
        const cellHeight = canvas.height / MAZE_GRID_HEIGHT;
        bacchus.radius = cellWidth * 0.45;
        bacchus.stepSize = Math.max(2, Math.floor(cellWidth / 10));

        bacchus.x = BACCHUS_START_COL * cellWidth + cellWidth / 2;
        bacchus.y = BACCHUS_START_ROW * cellHeight + cellHeight / 2;
        bacchus.targetX = bacchus.x;
        bacchus.targetY = bacchus.y;
        bacchus.isMoving = false;

        generateMazeAndWineGlasses();
    }

    function generateMazeAndWineGlasses() {
        maze = [];
        wineGlasses = [];
        const cellWidth = canvas.width / MAZE_GRID_WIDTH;
        const cellHeight = canvas.height / MAZE_GRID_HEIGHT;

        for (let r = 0; r < MAZE_GRID_HEIGHT; r++) {
            maze[r] = [];
            for (let c = 0; c < MAZE_GRID_WIDTH; c++) {
                const cellType = MAZE_LAYOUT_DATA[r][c];
                if (cellType === 1) {
                    maze[r][c] = 1;
                } else {
                    maze[r][c] = 0;
                    if (!(r === BACCHUS_START_ROW && c === BACCHUS_START_COL)) {
                        wineGlasses.push({
                            x: c * cellWidth + cellWidth / 2,
                            y: r * cellHeight + cellHeight / 2,
                            radius: cellWidth * 0.2
                        });
                    }
                }
            }
        }
    }

    function drawBacchus() {
        try {
            ctx.save();

            let drawX = bacchus.x;
            let drawY = bacchus.y;

            if (bacchus.direction === 'left') {
                ctx.translate(drawX, drawY);
                ctx.scale(-1, 1);
                drawX = -bacchus.radius;
                drawY = -bacchus.radius;
            } else {
                drawX = bacchus.x - bacchus.radius;
                drawY = bacchus.y - bacchus.radius;
            }

            ctx.drawImage(bacchusImage,
                          drawX,
                          drawY,
                          bacchus.radius * 2,
                          bacchus.radius * 2);

            ctx.restore();
        } catch (e) {
            console.error("Error drawing Bacchus image:", e);
        }
    }

    function drawWineGlass(glass) {
        try {
            ctx.drawImage(wineGlassImage,
                          glass.x - glass.radius,
                          glass.y - glass.radius,
                          glass.radius * 2,
                          glass.radius * 2);
        } catch (e) {
            console.error("Error drawing wine glass image:", e);
        }
    }

    function drawMaze() {
        try {
            const cellWidth = canvas.width / MAZE_GRID_WIDTH;
            const cellHeight = canvas.height / MAZE_GRID_HEIGHT;

            ctx.fillStyle = '#696969';
            for (let r = 0; r < MAZE_GRID_HEIGHT; r++) {
                for (let c = 0; c < MAZE_GRID_WIDTH; c++) {
                    if (maze[r][c] === 1) {
                        ctx.fillRect(c * cellWidth, r * cellHeight, cellWidth, cellHeight);
                    }
                }
            }
        } catch (e) {
            console.error("Error drawing maze:", e);
        }
    }

    function checkCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.radius + obj2.radius * 0.8);
    }

    function updateGame() {
        if (!gameRunning) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawMaze();

        if (bacchus.isMoving) {
            const dx = bacchus.targetX - bacchus.x;
            const dy = bacchus.targetY - bacchus.y;

            if (dx !== 0) {
                if (Math.abs(dx) <= bacchus.stepSize) {
                    bacchus.x = bacchus.targetX;
                } else {
                    bacchus.x += Math.sign(dx) * bacchus.stepSize;
                }
            }

            if (dy !== 0) {
                if (Math.abs(dy) <= bacchus.stepSize) {
                    bacchus.y = bacchus.targetY;
                } else {
                    bacchus.y += Math.sign(dy) * bacchus.stepSize;
                }
            }

            if (bacchus.x === bacchus.targetX && bacchus.y === bacchus.targetY) {
                bacchus.isMoving = false;
            }
        }

        drawBacchus();

        for (let i = wineGlasses.length - 1; i >= 0; i--) {
            if (checkCollision(bacchus, wineGlasses[i])) {
                wineGlasses.splice(i, 1);
                score++;
                scoreDisplay.textContent = score;

                if (wineGlasses.length === 0) {
                    gameRunning = false;
                    alert('Congratulations! Bacchus is full! You drank all the wine!');
                }
            }
        }

        wineGlasses.forEach(drawWineGlass);

        requestAnimationFrame(updateGame);
    }

    function attemptMove(desiredDirection) {
        if (!gameRunning || bacchus.isMoving) return;

        const cellWidth = canvas.width / MAZE_GRID_WIDTH;
        const cellHeight = canvas.height / MAZE_GRID_HEIGHT;

        const currentGridCol = Math.round((bacchus.x - cellWidth / 2) / cellWidth);
        const currentGridRow = Math.round((bacchus.y - cellHeight / 2) / cellHeight);

        let nextGridCol = currentGridCol;
        let nextGridRow = currentGridRow;
        let finalTargetX = 0;
        let finalTargetY = 0;

        switch (desiredDirection) {
            case 'up': nextGridRow--; break;
            case 'down': nextGridRow++; break;
            case 'left': nextGridCol--; break;
            case 'right': nextGridCol++; break;
        }

        if (currentGridRow === BACCHUS_START_ROW && (nextGridCol < 0 || nextGridCol >= MAZE_GRID_WIDTH)) {
            if (nextGridCol < 0 && desiredDirection === 'left') {
                finalTargetX = (MAZE_GRID_WIDTH - 1) * cellWidth + cellWidth / 2;
                finalTargetY = currentGridRow * cellHeight + cellHeight / 2;
                bacchus.x = -cellWidth / 2;
            } else if (nextGridCol >= MAZE_GRID_WIDTH && desiredDirection === 'right') {
                finalTargetX = 0 * cellWidth + cellWidth / 2;
                finalTargetY = currentGridRow * cellHeight + cellHeight / 2;
                bacchus.x = canvas.width + cellWidth / 2;
            } else {
                return;
            }
            bacchus.targetX = finalTargetX;
            bacchus.targetY = finalTargetY;
            bacchus.direction = desiredDirection;
            bacchus.isMoving = true;
            return;
        }

        if (nextGridCol < 0 || nextGridCol >= MAZE_GRID_WIDTH ||
            nextGridRow < 0 || nextGridRow >= MAZE_GRID_HEIGHT ||
            MAZE_LAYOUT_DATA[nextGridRow][nextGridCol] === 1) {
            return;
        }

        bacchus.targetX = nextGridCol * cellWidth + cellWidth / 2;
        bacchus.targetY = nextGridRow * cellHeight + cellHeight / 2;
        bacchus.direction = desiredDirection;
        bacchus.isMoving = true;
    }

    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp': attemptMove('up'); break;
            case 'ArrowDown': attemptMove('down'); break;
            case 'ArrowLeft': attemptMove('left'); break;
            case 'ArrowRight': attemptMove('right'); break;
        }
    });

    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) { attemptMove('right'); }
            else { attemptMove('left'); }
        } else {
            if (dy > 0) { attemptMove('down'); }
            else { attemptMove('up'); }
        }
    });

    window.addEventListener('resize', resizeCanvas);

    preloadImages().then(() => {
        console.log("All images loaded successfully.");
        resizeCanvas();
        updateGame();
    }).catch(error => {
        console.error("Game failed to start due to image loading error:", error);
    });
});