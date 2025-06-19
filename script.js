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
    let ghost = {
        x: 0,
        y: 0,
        radius: 20,
        speed: 2,
        targetX: 0,
        targetY: 0,
        isMoving: false
    };
    let wineGlasses = [];
    let gameRunning = true;

    let bacchusImage = new Image();
    let wineGlassImage = new Image();
    let ghostImage = new Image();

    let imagesLoadedCount = 0;
    const totalImagesToLoad = 3;

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
        [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
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
            bacchusImage.src = '/bacchus_head.png';
            wineGlassImage.src = '/wine_glass_icon.png';
            ghostImage.src = '/ghost.png';

            const checkImagesLoaded = () => {
                imagesLoadedCount++;
                if (imagesLoadedCount === totalImagesToLoad) {
                    resolve();
                }
            };

            bacchusImage.onload = checkImagesLoaded;
            bacchusImage.onerror = () => {
                console.error("Failed to load Bacchus image. Please check 'bacchus_head.png' path.");
                reject(new Error('Failed to load Bacchus image.'));
            };

            wineGlassImage.onload = checkImagesLoaded;
            wineGlassImage.onerror = () => {
                console.error("Failed to load wine glass image. Please check 'wine_glass_icon.png' path.");
                reject(new Error('Failed to load wine glass image.'));
            };

            ghostImage.onload = checkImagesLoaded;
            ghostImage.onerror = () => {
                console.error("Failed to load ghost image. Please check 'ghost.png' path.");
                alert("Error: Could not load ghost image. Please make sure 'ghost.png' is in the same folder.");
                reject(new Error('Failed to load ghost image.'));
            };
        });
    }

    function getRandomValidCell() {
        const cellWidth = canvas.width / MAZE_GRID_WIDTH;
        const cellHeight = canvas.height / MAZE_GRID_HEIGHT;
        let randCol, randRow;
        do {
            randCol = Math.floor(Math.random() * MAZE_GRID_WIDTH);
            randRow = Math.floor(Math.random() * MAZE_GRID_HEIGHT);
        } while (MAZE_LAYOUT_DATA[randRow][randCol] === 1 ||
                 (randRow === BACCHUS_START_ROW && randCol === BACCHUS_START_COL));
        return {
            x: randCol * cellWidth + cellWidth / 2,
            y: randRow * cellHeight + cellHeight / 2,
            gridCol: randCol,
            gridRow: randRow
        };
    }

    function resizeCanvas() {
        const container = document.querySelector('.game-container');
        const headerHeight = document.querySelector('h1').offsetHeight;
        const scoreHeight = document.getElementById('score-container').offsetHeight;
        const containerPadding = 2 * 20;

        const availableWidth = container.clientWidth - containerPadding;
        const availableHeight = container.clientHeight - containerPadding - headerHeight - scoreHeight;

        const mazeAspectRatio = MAZE_GRID_WIDTH / MAZE_GRID_HEIGHT;

        let newCanvasWidth;
        let newCanvasHeight;

        newCanvasWidth = availableWidth;
        newCanvasHeight = newCanvasWidth / mazeAspectRatio;

        if (newCanvasHeight > availableHeight) {
            newCanvasHeight = availableHeight;
            newCanvasWidth = newCanvasHeight * mazeAspectRatio;
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
        bacchus.direction = 'right';

        ghost.radius = cellWidth * 0.45;
        if (!gameRunning || !ghost.isMoving) {
            const initialGhostCell = getRandomValidCell();
            ghost.x = initialGhostCell.x;
            ghost.y = initialGhostCell.y;
            ghost.targetX = ghost.x;
            ghost.targetY = ghost.y;
            ghost.isMoving = false;
        } else {
            const currentGhostGridCol = Math.round((ghost.x - cellWidth / 2) / cellWidth);
            const currentGhostGridRow = Math.round((ghost.y - cellHeight / 2) / cellHeight);
            ghost.x = currentGhostGridCol * cellWidth + cellWidth / 2;
            ghost.y = currentGhostGridRow * cellHeight + cellHeight / 2;
            ghost.targetX = ghost.x;
            ghost.targetY = ghost.y;
            ghost.isMoving = false;
        }

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
                    const ghostGridCol = Math.round((ghost.x - cellWidth / 2) / cellWidth);
                    const ghostGridRow = Math.round((ghost.y - cellHeight / 2) / cellHeight);
                    if (!(r === BACCHUS_START_ROW && c === BACCHUS_START_COL) &&
                        !(r === ghostGridRow && c === ghostGridCol)
                       ) {
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

    function drawGhost() {
        try {
            ctx.drawImage(ghostImage,
                          ghost.x - ghost.radius,
                          ghost.y - ghost.radius,
                          ghost.radius * 2,
                          ghost.radius * 2);
        } catch (e) {
            console.error("Error drawing ghost image:", e);
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

    function moveGhost() {
        if (ghost.isMoving) {
            const dx = ghost.targetX - ghost.x;
            const dy = ghost.targetY - ghost.y;

            if (dx !== 0) {
                if (Math.abs(dx) <= ghost.speed) {
                    ghost.x = ghost.targetX;
                } else {
                    ghost.x += Math.sign(dx) * ghost.speed;
                }
            }

            if (dy !== 0) {
                if (Math.abs(dy) <= ghost.speed) {
                    ghost.y = ghost.targetY;
                } else {
                    ghost.y += Math.sign(dy) * ghost.speed;
                }
            }

            if (ghost.x === ghost.targetX && ghost.y === ghost.targetY) {
                ghost.isMoving = false;
            }
        } else {
            const cellWidth = canvas.width / MAZE_GRID_WIDTH;
            const cellHeight = canvas.height / MAZE_GRID_HEIGHT;

            const currentGridCol = Math.round((ghost.x - cellWidth / 2) / cellWidth);
            const currentGridRow = Math.round((ghost.y - cellHeight / 2) / cellHeight);

            const possibleMoves = ['up', 'down', 'left', 'right'];
            let validMoveFound = false;
            let attempts = 0;
            const maxAttempts = 10;

            while (!validMoveFound && attempts < maxAttempts) {
                const randomDirection = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

                let nextGridCol = currentGridCol;
                let nextGridRow = currentGridRow;

                switch (randomDirection) {
                    case 'up': nextGridRow--; break;
                    case 'down': nextGridRow++; break;
                    case 'left': nextGridCol--; break;
                    case 'right': nextGridCol++; break;
                }

                if (nextGridCol >= 0 && nextGridCol < MAZE_GRID_WIDTH &&
                    nextGridRow >= 0 && nextGridRow < MAZE_GRID_HEIGHT &&
                    MAZE_LAYOUT_DATA[nextGridRow][nextGridCol] === 0) {
                    ghost.targetX = nextGridCol * cellWidth + cellWidth / 2;
                    ghost.targetY = nextGridRow * cellHeight + cellHeight / 2;
                    ghost.isMoving = true;
                    validMoveFound = true;
                }
                attempts++;
            }
        }
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

        moveGhost();
        drawGhost();

        for (let i = wineGlasses.length - 1; i >= 0; i--) {
            if (checkCollision(bacchus, wineGlasses[i])) {
                wineGlasses.splice(i, 1);
                score++;
                scoreDisplay.textContent = score;

                if (wineGlasses.length === 0) {
                    gameRunning = false;
                    alert('Congratulations! Bacchus is full! You drank all the wine!');
                    location.reload();
                    return;
                }
            }
        }
        wineGlasses.forEach(drawWineGlass);

        if (checkCollision(bacchus, ghost)) {
            gameRunning = false;
            alert(`Game Over! Bacchus got caught by the ghost! You drank ${score} wines.`);
            location.reload();
            return;
        }

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