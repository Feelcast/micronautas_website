// Wait for the DOM to be fully loaded before running the script
window.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONSTANTS & STATE ---

    const canvas = document.getElementById('garden-canvas');
    const ctx = canvas.getContext('2d');

    // Grid and Tile dimensions
    const GRID_WIDTH = 24;
    const GRID_HEIGHT = 40;
    const TILE_WIDTH = 32;  // Width of the isometric tile (2:1 ratio)
    const TILE_HEIGHT = 16; // Height of the isometric tile (2:1 ratio)
    
    const TILE_WIDTH_HALF = TILE_WIDTH / 2;
    const TILE_HEIGHT_HALF = TILE_HEIGHT / 2;
    
    // Center the grid on the canvas
    const originX = canvas.width/2 +4*TILE_WIDTH;
    const originY = TILE_HEIGHT*6; // Start drawing a bit down from the top
    
    // The "Source of Truth" - a 2D array representing the grid
    let gridModel =[];

    function initializeGrid() {
        gridModel =[];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            let row =[];
            for (let x = 0; x < GRID_WIDTH; x++) {
                row.push(0); // 0 = empty
            }
            gridModel.push(row);
        }
    }


    // --- 2. COORDINATE TRANSFORMATION UTILITIES ---

    /**
     * Converts 2D grid coordinates (x, y) to 2D screen coordinates (x, y).
     * @param {number} gridX - The X-coordinate on the grid.
     * @param {number} gridY - The Y-coordinate on the grid.
     * @returns {{x: number, y: number}} Screen coordinates.
     */
    function gridToScreen(gridX, gridY) {
        const screenX = (gridX - gridY) * TILE_WIDTH_HALF + originX;
        const screenY = (gridX + gridY) * TILE_HEIGHT_HALF + originY;
        return { x: screenX, y: screenY };
    }

    /**
     * Converts 2D screen coordinates (x, y) to 2D grid coordinates (x, y).
     * @param {number} screenX - The X-coordinate on the screen (canvas).
     * @param {number} screenY - The Y-coordinate on the screen (canvas).
     * @returns {{x: number, y: number}} Grid coordinates.
     */
    function screenToGrid(screenX, screenY) {
        const screenX_adj = screenX - originX;
        const screenY_adj = screenY - originY;

        const gridX = Math.floor(0.5 * ((screenX_adj / TILE_WIDTH_HALF) + (screenY_adj / TILE_HEIGHT_HALF)));
        const gridY = Math.floor(0.5 * ((screenY_adj / TILE_HEIGHT_HALF) - (screenX_adj / TILE_WIDTH_HALF)));

        return { x: gridX+1, y: gridY+1 };
    }

    function isOnEraseButton(mouseX, mouseY) {
        const buttonX = 100;
        const buttonY = 100;
        const buttonWidth = 40;
        const buttonHeight = 20;

        return (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
                mouseY >= buttonY && mouseY <= buttonY + buttonHeight);
    }

    // --- 3. RENDERING FUNCTIONS ---

    /**
     * A helper function to lighten or darken a hex color.
     * @param {string} color - The base hex color (e.g., "#007bff").
     * @param {number} percent - The percentage to shade (e.g., 0.2 for 20% lighter, -0.1 for 10% darker).
     * @returns {string} The new shaded hex color.
     */
    function shadeColor(color, percent) {
        let f = parseInt(color.slice(1), 16), t = percent < 0? 0 : 255, p = percent < 0? percent * -1 : percent,
            R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 +
               (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B))
              .toString(16).slice(1);
    }

    /**
     * Draws a single isometric cube anchored at the bottom-center (x, y).
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * @param {number} x - The screen X-coordinate (anchor point).
     * @param {number} y - The screen Y-coordinate (anchor point).
     * @param {string} baseColor - The base hex color for the cube.
     */
    function drawCube(ctx, x, y, baseColor = '#007bff') {
        const cubeHeight = TILE_HEIGHT; // The visual height of the cube

        // 1. Draw Top Face (Brightest)
        ctx.fillStyle = shadeColor(baseColor, 0.20); // +20%
        ctx.beginPath();
        ctx.moveTo(x, y - cubeHeight);
        ctx.lineTo(x - TILE_WIDTH_HALF, y - cubeHeight - TILE_HEIGHT_HALF);
        ctx.lineTo(x, y - cubeHeight - TILE_HEIGHT);
        ctx.lineTo(x + TILE_WIDTH_HALF, y - cubeHeight - TILE_HEIGHT_HALF);
        ctx.closePath();
        ctx.fill();

        // 2. Draw Left Face (Mid-tone)
        ctx.fillStyle = shadeColor(baseColor, 0.10); // +10%
        ctx.beginPath();
        ctx.moveTo(x, y - cubeHeight);
        ctx.lineTo(x - TILE_WIDTH_HALF, y - cubeHeight - TILE_HEIGHT_HALF);
        ctx.lineTo(x - TILE_WIDTH_HALF, y - TILE_HEIGHT_HALF);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();

        // 3. Draw Right Face (Darkest)
        ctx.fillStyle = shadeColor(baseColor, -0.10); // -10%
        ctx.beginPath();
        ctx.moveTo(x, y - cubeHeight);
        ctx.lineTo(x + TILE_WIDTH_HALF, y - cubeHeight - TILE_HEIGHT_HALF);
        ctx.lineTo(x + TILE_WIDTH_HALF, y - TILE_HEIGHT_HALF);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
    }
    function drawEraseButton(ctx, x, y) {
        const buttonWidth = 40;
        const buttonHeight = 20;

        // Draw button rectangle
        ctx.fillStyle = '#ff4d4d'; // Red color
        ctx.fillRect(x, y, buttonWidth, buttonHeight);

        // Draw button text
        ctx.fillStyle = '#ffffff'; // White color
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Erase', x + buttonWidth / 2, y + buttonHeight / 2);
    }   
    /**
     * The main application render loop.
     */
    function mainRenderLoop() {
        // 1. Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Draw the state from the gridModel
        // We must draw from back-to-front (y=0, x=0)
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                
                // Get the screen coordinates for this grid cell's anchor
                const { x: screenX, y: screenY } = gridToScreen(x, y);
                
                if (gridModel[y][x] === 1) {
                    // If the model has a 1, draw a blue cube
                    drawCube(ctx, screenX, screenY, '#007bff');
                } else {
                    // Optional: Draw an empty tile "floor"
                    // For simplicity, we just draw the outline
                    drawEmptyTile(ctx, screenX, screenY, '#999999');
                }
            }
        }
        drawEraseButton(ctx, 100, 100);
        // 3. Request the next frame
        window.requestAnimationFrame(mainRenderLoop);
    }

    /**
     * Optional: Draws the "floor" tile for an empty grid cell.
     */
    function drawEmptyTile(ctx, x, y, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - TILE_WIDTH_HALF, y - TILE_HEIGHT_HALF);
        ctx.lineTo(x, y - TILE_HEIGHT);
        ctx.lineTo(x + TILE_WIDTH_HALF, y - TILE_HEIGHT_HALF);
        ctx.closePath();
        ctx.stroke();
    }


    // --- 4. EVENT HANDLERS ---

    /**
     * Gets the mouse position relative to the canvas element.
     * @param {HTMLCanvasElement} canvas - The canvas element.
     * @param {MouseEvent} event - The mouse event.
     * @returns {{x: number, y: number}} Mouse coordinates relative to the canvas.
     */
    function getMousePos(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    /**
     * Handles the left-click event to place a cube.
     */
    function onLeftClick(event) {
        const mouse = getMousePos(canvas, event);
        
        if (isOnEraseButton(mouse.x, mouse.y)) {
            //erase all cubes from the gridmodel array
            initializeGrid();
        }
        
    }
    // add mousemove listener to continue drawing while moving
    function onMouseMove(event) {
        const mouse = getMousePos(canvas, event);
        const gridCoords = screenToGrid(mouse.x, mouse.y);
        if (event.buttons == 1){
            if (gridCoords.x >= 0 && gridCoords.x < GRID_WIDTH &&
                gridCoords.y >= 0 && gridCoords.y < GRID_HEIGHT) {
                
                // Modify the state
                gridModel[gridCoords.y][gridCoords.x] = 1;
            }
        } // only proceed if left button is held down
        else if(event.buttons == 2){
                // MUST prevent the default context menu from appearing
            event.preventDefault();

            const mouse = getMousePos(canvas, event);
            const gridCoords = screenToGrid(mouse.x, mouse.y);

            if (gridCoords.x >= 0 && gridCoords.x < GRID_WIDTH &&
                gridCoords.y >= 0 && gridCoords.y < GRID_HEIGHT) {
                
                // Modify the state
                gridModel[gridCoords.y][gridCoords.x] = 0;
            }
        }
    }


    /**
     * Handles the right-click event to erase a cube.
     */
    function onRightClick(event) {
        // MUST prevent the default context menu from appearing
        event.preventDefault();

        const mouse = getMousePos(canvas, event);
        const gridCoords = screenToGrid(mouse.x, mouse.y);

        if (gridCoords.x >= 0 && gridCoords.x < GRID_WIDTH &&
            gridCoords.y >= 0 && gridCoords.y < GRID_HEIGHT) {
            
            // Modify the state
            gridModel[gridCoords.y][gridCoords.x] = 0;
        }
    }


    // --- 5. INITIALIZATION ---

    function initializeApp() {
        // Set up the logical grid
        initializeGrid();
        
        // Add event listeners for interaction
        canvas.addEventListener('click', onLeftClick);
        canvas.addEventListener('contextmenu', onRightClick);
        //canvas.addEventListener('mousedown', onLeftDown);
        canvas.addEventListener('mousemove', onMouseMove);

        // Start the render loop
        window.requestAnimationFrame(mainRenderLoop);
        
        console.log("Isometric Canvas Garden initialized.");
    }

    initializeApp();

});