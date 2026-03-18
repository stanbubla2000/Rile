const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ================== STAN GRY ==================
let gameState = "menu"; // menu | playing | gameover

// ================== MAPA ==================
const map = {
    width: 2000,
    height: 2000
};

// ================== ŚCIANY ==================
let walls = [
    {x: 200, y: 200, w: 600, h: 40},
    {x: 200, y: 200, w: 40, h: 400},
    {x: 800, y: 200, w: 40, h: 400},
    {x: 200, y: 600, w: 640, h: 40},
    {x: 1200, y: 300, w: 300, h: 40},
    {x: 1200, y: 300, w: 40, h: 300}
];

// ================== GRACZ ==================
let player = {
    x: 400,
    y: 400,
    size: 20,
    speed: 4,
    alive: true
};

// ================== KAMERA ==================
let camera = { x: 0, y: 0 };

// ================== INPUT ==================
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
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

    let angle = Math.atan2(
        mouseY - canvas.height / 2,
        mouseX - canvas.width / 2
    );

    bullets.push({
        x: player.x + player.size/2,
        y: player.y + player.size/2,
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
        x: Math.random() * map.width,
        y: Math.random() * map.height,
        size: 20,
        speed: 2
    });
}

setInterval(spawnEnemy, 1500);

// ================== KOLIZJA ==================
function rectCollision(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.size > b.x &&
           a.y < b.y + b.h &&
           a.y + a.size > b.y;
}

// ================== UI ==================
function startGame() {
    document.getElementById("menu").classList.add("hidden");

    player.x = 400;
    player.y = 400;
    player.alive = true;

    enemies = [];
    bullets = [];

    camera.x = 0;
    camera.y = 0;

    gameState = "playing";
}

function openSettings() {
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("settings").classList.remove("hidden");
}

function closeSettings() {
    document.getElementById("settings").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
}

function retryGame() {
    player.x = 400;
    player.y = 400;
    player.alive = true;

    enemies = [];
    bullets = [];

    document.getElementById("gameOver").classList.add("hidden");
    gameState = "playing";
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

    let future = {x: nextX, y: nextY, size: player.size};

    let blocked = walls.some(w => rectCollision(future, w));

    if (!blocked) {
        player.x = nextX;
        player.y = nextY;
    }

    // kamera
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    // pociski
    bullets.forEach((b, i) => {
        b.x += b.dx * b.speed;
        b.y += b.dy * b.speed;
        b.life--;

        walls.forEach(w => {
            if (rectCollision({x: b.x, y: b.y, size: 5}, w)) {
                b.life = 0;
            }
        });

        if (b.life <= 0) bullets.splice(i, 1);
    });

    // przeciwnicy
    enemies.forEach(e => {
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let dist = Math.hypot(dx, dy);

        e.x += dx / dist * e.speed;
        e.y += dy / dist * e.speed;

        if (dist < player.size) {
            player.alive = false;
        }
    });

    // trafienia
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            let dx = b.x - e.x;
            let dy = b.y - e.y;

            if (Math.hypot(dx, dy) < e.size) {
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
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

    // tło mapy
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, map.width, map.height);

    // ściany
    ctx.fillStyle = "gray";
    walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

    // gracz
    ctx.fillStyle = "lime";
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // broń
    let angle = Math.atan2(
        mouseY - canvas.height / 2,
        mouseX - canvas.width / 2
    );

    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(player.x + player.size/2, player.y + player.size/2);
    ctx.lineTo(
        player.x + player.size/2 + Math.cos(angle) * 30,
        player.y + player.size/2 + Math.sin(angle) * 30
    );
    ctx.stroke();

    // pociski
    ctx.fillStyle = "yellow";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 5, 5));

    // przeciwnicy
    ctx.fillStyle = "red";
    enemies.forEach(e => ctx.fillRect(e.x, e.y, e.size, e.size));

    ctx.restore();
}

// ================== LOOP ==================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();