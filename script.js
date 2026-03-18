
// ================== CANVAS ==================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ================== STAN ==================
let gameState = "menu";

// ================== MAPA (DUŻE POKOJE) ==================
const tileSize = 80;
const mapCols = 15;
const mapRows = 15;

// 0 = ściana, 1 = podłoga
let mapGrid = [
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,1,1,1,1,0,1,1,1,1,1,1,1,0],
[0,1,1,1,1,1,0,1,1,1,1,1,1,1,0],
[0,1,1,1,1,1,0,1,1,1,1,1,1,1,0],
[0,1,1,1,1,1,0,1,1,1,1,1,1,1,0],
[0,1,1,1,1,1,0,1,1,1,1,1,1,1,0],
[0,0,0,0,1,0,0,0,0,0,1,0,0,0,0],
[0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
[0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
[0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
[0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
[0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
[0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
[0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ================== GRACZ ==================
let player = {
    x: 200,
    y: 200,
    size: 20,
    speed: 4,
    hp: 100,
    maxHp: 100,
    alive: true
};

// ================== KAMERA ==================
let camera = { x: 0, y: 0 };

// ================== INPUT ==================
let keys = {};
document.addEventListener("keydown", e => {
    keys[e.key] = true;

    if (e.key === "Escape" && gameState === "playing") gameState = "pause";
    else if (e.key === "Escape" && gameState === "pause") gameState = "playing";
});
document.addEventListener("keyup", e => keys[e.key] = false);

// ================== MYSZ ==================
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener("mousemove", e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// ================== POCISKI ==================
let bullets = [];

function shoot() {
    if (gameState !== "playing") return;

    // 🔥 POPRAWIONE CELowanie (uwzględnia kamerę)
    let worldMouseX = mouseX + camera.x;
    let worldMouseY = mouseY + camera.y;

    let angle = Math.atan2(
        worldMouseY - player.y,
        worldMouseX - player.x
    );

    bullets.push({
        x: player.x,
        y: player.y,
        dx: Math.cos(angle),
        dy: Math.sin(angle),
        speed: 10,
        life: 60
    });
}

canvas.addEventListener("click", shoot);

// ================== PRZECIWNICY ==================
let enemies = [];

function spawnEnemy() {
    if (gameState !== "playing") return;

    enemies.push({
        x: 600,
        y: 600,
        size: 20,
        speed: 1.5,
        hp: 30
    });
}
setInterval(spawnEnemy, 2000);

// ================== KOLIZJA ==================
function isWall(x, y) {
    let col = Math.floor(x / tileSize);
    let row = Math.floor(y / tileSize);
    return mapGrid[row] && mapGrid[row][col] === 0;
}

// ================== UPDATE ==================
function update() {

    if (gameState !== "playing") return;

    if (!player.alive) {
        gameState = "gameover";
        document.getElementById("gameOver").classList.remove("hidden");
        return;
    }

    let nextX = player.x;
    let nextY = player.y;

    if (keys["w"]) nextY -= player.speed;
    if (keys["s"]) nextY += player.speed;
    if (keys["a"]) nextX -= player.speed;
    if (keys["d"]) nextX += player.speed;

    // kolizja gracza
    if (!isWall(nextX, nextY)) {
        player.x = nextX;
        player.y = nextY;
    }

    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    // pociski
    bullets.forEach((b, i) => {
        b.x += b.dx * b.speed;
        b.y += b.dy * b.speed;
        b.life--;

        if (isWall(b.x, b.y) || b.life <= 0) {
            bullets.splice(i, 1);
        }
    });

    // przeciwnicy (NIE PRZENIKAJĄ)
    enemies.forEach(e => {
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let dist = Math.hypot(dx, dy);

        let nextEx = e.x + (dx / dist) * e.speed;
        let nextEy = e.y + (dy / dist) * e.speed;

        // 🔥 kolizja przeciwnika ze ścianą
        if (!isWall(nextEx, nextEy)) {
            e.x = nextEx;
            e.y = nextEy;
        }

        if (dist < player.size) {
            player.hp -= 1;
            if (player.hp <= 0) player.alive = false;
        }
    });

    // trafienia
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            let dx = b.x - e.x;
            let dy = b.y - e.y;

            if (Math.hypot(dx, dy) < e.size) {
                e.hp -= 10;
                bullets.splice(bi, 1);

                if (e.hp <= 0) enemies.splice(ei, 1);
            }
        });
    });
}

// ================== DRAW ==================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState !== "playing") return;

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // mapa
    for (let r = 0; r < mapRows; r++) {
        for (let c = 0; c < mapCols; c++) {
            ctx.fillStyle = mapGrid[r][c] === 0 ? "#555" : "#222";
            ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
        }
    }

    // gracz
    ctx.fillStyle = "lime";
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // pociski
    ctx.fillStyle = "yellow";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 5, 5));

    // przeciwnicy
    ctx.fillStyle = "red";
    enemies.forEach(e => ctx.fillRect(e.x, e.y, e.size, e.size));

    ctx.restore();

    // HP
    ctx.fillStyle = "red";
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = "lime";
    ctx.fillRect(20, 20, 200 * (player.hp / player.maxHp), 20);
}

// ================== LOOP ==================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
function startGame() {
    console.log("PLAY kliknięty");

    document.getElementById("menu").classList.add("hidden");

    player.x = 100;
    player.y = 100;
    player.hp = player.maxHp;
    player.alive = true;

    enemies = [];
    bullets = [];
    score = 0;
    boss = null;

    gameState = "playing";
}
function retryGame() {
    console.log("Restart gry"); // debug

    // Ukryj ekran GameOver
    const goScreen = document.getElementById("gameOver");
    if (goScreen) goScreen.classList.add("hidden");

    // Reset gracza
    player.x = 200;
    player.y = 200;
    player.hp = player.maxHp;
    player.alive = true;

    // Reset pocisków i przeciwników
    bullets = [];
    enemies = [];

    // Reset boss
    boss = null;

    // Reset score
    score = 0;

    // Włącz grę
    gameState = "playing";
}