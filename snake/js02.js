// Canvas elem kiválasztása és 2D kontextus megszerzése
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d'); // canvas kötelező metódusa

// Beállítjuk a canvas méreteit
canvas.width = 1000; // Canvas szélessége pixelben
canvas.height = 500; // Canvas magassága pixelben
canvas.style.width = '1000px'; // Canvas szélessége CSS-ben
canvas.style.height = '500px'; // Canvas magassága CSS-ben
canvas.style.marginLeft = '50px'; // Margin a bal oldalon
canvas.style.border = '3px solid #000'; // Képkeret
canvas.style.boxShadow = '0 0 30px black'; // Árnyék hozzáadása

// A cellák mérete az új canvas méretekhez igazítva
const CELL_SIZE = 25; // Cella mérete pixelben, amely alapján a kígyó és az étel megjelenik
const WORLD_WIDTH = Math.floor(canvas.width / CELL_SIZE); // A játék világ szélessége cellákban
const WORLD_HEIGHT = Math.floor(canvas.height / CELL_SIZE); // A játék világ magassága cellákban
const MOVE_INTERVAL = 300; // Milyen sűrűn mozogjon a kígyó feje (300 millimásodperc)
const FOOD_SPAWN_INTERVAL = 1500; // Milyen gyakran jelenjen meg új étel (1500 millimásodperc)

let input; // Felhasználói input változó
let snake; // Kígyó állapot
let foods; // Ételek tömb
let foodSpawnElapsed; // Idő az utolsó étel megjelenítése óta
let gameOver; // Játék állapota (vég)
let score; // Játékos eredménye

// Inicializálja a játékot
function reset() {
    input = {}; // Input változó inicializálása
    snake = {
        moveElapsed: 0, // Idő a kígyó mozgásához
        length: 4, // Kígyó hossza
        parts: [{ x: Math.floor(WORLD_WIDTH / 2), y: Math.floor(WORLD_HEIGHT / 2) }], // Kígyó kezdeti helyzete
        dir: null, // Jelenlegi irány
        newDir: { x: 1, y: 0 } // Új irány (jobbra)
    };
    foods = []; // Ételek tömbjének inicializálása
    foodSpawnElapsed = 0; // Idő az utolsó étel megjelenítése óta
    gameOver = false; // Játék vége állapota
    score = 0; // Pontszám inicializálása
}

// Ételtípusok és képek betöltése
const foodTypes = [
    { type: 'apple', points: 1, image: new Image() }, // Alma típus
    { type: 'banana', points: 2, image: new Image() }, // Banán típus
    { type: 'cherry', points: 3, image: new Image() } // Cseresznye típus
];

// Képek forrása
foodTypes[0].image.src = 'img/apple.png'; // Alma kép
foodTypes[1].image.src = 'img/banana.svg'; // Banán kép
foodTypes[2].image.src = 'img/cherry.png'; // Cseresznye kép

// Kört rajzoló függvény
function fillCircle(x, y, radius) {
    ctx.beginPath(); // Új útvonal kezdése
    ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2); // Kör rajzolása
    ctx.fill(); // Kör kitöltése
}

// Kígyó mozgásának frissítése
function update(delta) {
    if (gameOver) { // Ha a játék véget ért
        if (input[' ']) { // Ha a szóköz billentyűt nyomták meg
            reset(); // Játék újraindítása
        }
        return; // Kilépés, ha a játék véget ért
    }

    // Kígyó irányának frissítése
    if (input.ArrowLeft && snake.dir.x !== 1) {
        snake.newDir = { x: -1, y: 0 }; // Balra fordulás
    } else if (input.ArrowUp && snake.dir.y !== 1) {
        snake.newDir = { x: 0, y: -1 }; // Felfelé fordulás
    } else if (input.ArrowRight && snake.dir.x !== -1) {
        snake.newDir = { x: 1, y: 0 }; // Jobbra fordulás
    } else if (input.ArrowDown && snake.dir.y !== -1) {
        snake.newDir = { x: 0, y: 1 }; // Lefelé fordulás
    }

    // Kígyó mozgásának kezelése
    snake.moveElapsed += delta; // Frissítjük az időt
    if (snake.moveElapsed > MOVE_INTERVAL) { // Ha elérte a mozgási intervallumot
        snake.dir = snake.newDir; // Beállítjuk az új irányt
        snake.moveElapsed -= MOVE_INTERVAL; // Reseteljük az időt
        const newSnakePart = { // Új kígyó rész létrehozása
            x: snake.parts[0].x + snake.dir.x,
            y: snake.parts[0].y + snake.dir.y
        };
        snake.parts.unshift(newSnakePart); // Új rész hozzáadása a kígyó elejéhez

        if (snake.parts.length > snake.length) {
            snake.parts.pop(); // Ha túl hosszú a kígyó, eltávolítjuk a végéről egy darabot
        }

        const head = snake.parts[0]; // Kígyó fejének koordinátái
        const foodEatenIndex = foods.findIndex(f => f.x === head.x && f.y === head.y); // Ellenőrizzük, hogy a kígyó eszik-e valamit
        if (foodEatenIndex >= 0) {
            const eatenFood = foods[foodEatenIndex]; // Elfogyasztott étel
            snake.length++; // Kígyó hossza növelése
            score += eatenFood.foodType.points; // Pontszám növelése
            document.getElementById("pont").innerHTML = "Eredmény: " + score; // Pontszám frissítése a képernyőn
            foods.splice(foodEatenIndex, 1); // Az elfogyasztott étel eltávolítása
        }

        // Ellenőrizzük, hogy a kígyó ütközik-e a világ szélével
        const worldEdgeIntersect = head.x < 0 || head.x >= WORLD_WIDTH || head.y < 0 || head.y >= WORLD_HEIGHT;
        if (worldEdgeIntersect) {
            gameOver = true; // Játék vége, ha ütközött
            return;
        }

        // Ellenőrizzük, hogy a kígyó saját magával ütközik-e
        const snakeartIntersect = snake.parts.some((part, index) => index !== 0 && head.x === part.x && head.y === part.y);
        if (snakeartIntersect) {
            gameOver = true; // Játék vége, ha ütközött saját magával
            return;
        }
    }

    // Étel megjelenítésének frissítése
    foodSpawnElapsed += delta; // Frissítjük az időt
    if (foodSpawnElapsed > FOOD_SPAWN_INTERVAL) { // Ha elérte az étel spawn intervallumot
        foodSpawnElapsed -= FOOD_SPAWN_INTERVAL; // Reseteljük az időt
        spawnFood(); // Új étel generálása
    }
}

// Új étel megjelenítése
function spawnFood() {
    const randomFood = foodTypes[Math.floor(Math.random() * foodTypes.length)]; // Véletlenszerű étel választása
    foods.push({
        x: Math.floor(Math.random() * WORLD_WIDTH), // Véletlenszerű x koordináta
        y: Math.floor(Math.random() * WORLD_HEIGHT), // Véletlenszerű y koordináta
        foodType: randomFood // Kiválasztott étel típus
    });
}

// Étel kirajzolása
function renderFood(food) {
    if (food && food.foodType && food.foodType.image) {
        ctx.drawImage(food.foodType.image, food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE); // Étel kirajzolása
    } else {
        console.error("Food or food image is undefined!"); // Hibakezelés, ha az étel vagy a kép nem található
    }
}

// Játék jelenlegi állapotának kirajzolása
function render() {
    ctx.textAlign = 'center'; // Szöveg igazítása középre
    ctx.textBaseline = 'middle'; // Szöveg alapvonalának középre állítása
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Letörli a canvas-t

    // Kígyó kirajzolása körökkel
    snake.parts.forEach(({ x, y }, index) => {
        ctx.fillStyle = index === 0 ? 'limegreen' : 'darkgreen'; // Kígyó fejének és testének színei
        fillCircle(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE / 2); // Körök kirajzolása
    });

    // Kígyó fejének szemek hozzáadása
    if (snake.parts.length > 0) {
        const head = snake.parts[0]; // Kígyó fejének koordinátái
        ctx.fillStyle = 'black'; // Szem szín
        ctx.beginPath(); // Új útvonal kezdése
        ctx.arc(head.x * CELL_SIZE + CELL_SIZE / 4, head.y * CELL_SIZE + CELL_SIZE / 4, CELL_SIZE / 8, 0, Math.PI * 2); // Bal szem
        ctx.fill(); // Szem kitöltése
        ctx.beginPath(); // Új útvonal kezdése
        ctx.arc(head.x * CELL_SIZE + 3 * CELL_SIZE / 4, head.y * CELL_SIZE + CELL_SIZE / 4, CELL_SIZE / 8, 0, Math.PI * 2); // Jobb szem
        ctx.fill(); // Szem kitöltése
    }

    // Ételek kirajzolása
    foods.forEach(renderFood);

    // Eredmény és játék vége szöveg
    ctx.fillStyle = 'green'; // Alap szín
    ctx.font = '20px Arial'; // Alap betűtípus
    if (gameOver) { // Ha a játék véget ért
        ctx.fillStyle = 'red'; // Végső szöveg szín
        ctx.font = '60px Arial'; // Nagy betűméret a "VÉGE!" szöveghez
        ctx.fillText('VÉGE!', canvas.width / 2, canvas.height / 2); // Játék vége szöveg
        ctx.fillStyle = 'black'; // Új szín az újrakezdéshez
        ctx.font = '20px Arial'; // Alap betűtípus
        ctx.fillText('Nyomd meg a szóközt az újrakezdéshez!', canvas.width / 2, canvas.height / 2 + 40); // Újrakezdés szöveg
    } else {
        ctx.fillStyle = 'black'; // Szín az eredményhez
        ctx.font = '20px Arial'; // Betűtípus
        ctx.fillText(`Eredmény: ${score}`, canvas.width / 2, 20); // Eredmény szöveg
    }
}

let lastLoopTime = Date.now(); // Utolsó ciklus ideje

// A játék futtatásáért felelős függvény
function gameLoop() {
    const now = Date.now(); // Jelenlegi idő
    const delta = now - lastLoopTime; // Időeltérés az utolsó ciklus óta
    lastLoopTime = now; // Frissítjük az utolsó ciklus idejét
    update(delta); // Játék frissítése
    render(); // Játék állapotának kirajzolása
    window.requestAnimationFrame(gameLoop); // Következő ciklus kérése
}

reset(); // Játék inicializálása
gameLoop(); // Játék indítása

// Billentyűzet események kezelése
window.addEventListener('keydown', (event) => {
    input[event.key] = true; // Billentyű lenyomásának kezelése
});
window.addEventListener('keyup', (event) => {
    input[event.key] = false; // Billentyű felengedésének kezelése
});

