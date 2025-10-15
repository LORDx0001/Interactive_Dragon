"use strict";

const screen = document.getElementById("screen");
const xmlns = "http://www.w3.org/2000/svg";
const xlinkns = "http://www.w3.org/1999/xlink";

// --- Универсальные параметры ---
const N = 14; // Оптимизация: уменьшено количество сегментов
const dragonColors = ['#09ff00', '#ff2222', '#2299ff', '#ffbb00', '#bb00ff'];

// --- Размеры ---
let width, height;
const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
};
window.addEventListener("resize", () => resize(), false);
resize();

// --- Очищаем экран ---
while (screen.firstChild) screen.removeChild(screen.firstChild);

// --- Определяем режим ---
const isMobileOrTablet = () => window.innerWidth < 900 || window.innerHeight < 900;

// --- Мобильный/Планшет: 1 дракон с гироскопом/тачем и автополётом ---
if (isMobileOrTablet()) {
    // Один зелёный дракон
    const elems = [];
    for (let i = 0; i < N; i++) elems[i] = { use: null, x: width / 2, y: height / 2 };
    for (let i = 1; i < N; i++) {
        let useType = "Espina";
        if (i === 1) useType = "Cabeza";
        else if (i === 8 || i === 12) useType = "Aletas";
        const elem = document.createElementNS(xmlns, "use");
        elems[i].use = elem;
        elem.setAttributeNS(xlinkns, "xlink:href", "#" + useType);
        elem.setAttribute("style", `stroke: #09ff00; fill: none;`);
        screen.prepend(elem);
    }

    let pointer = { x: width / 2, y: height / 2 };
    let useGyro = false;
    let lastUserMove = Date.now();
    let autoFlightPhase = Math.random() * Math.PI * 2;

    // Кнопка для включения/отключения гироскопа
    const button = document.createElement('button');
    button.textContent = 'Гироскоп';
    button.style.position = 'fixed';
    button.style.top = '15px';
    button.style.right = '15px';
    button.style.zIndex = '1000';
    button.style.padding = '12px 16px';
    button.style.backgroundColor = '#09ff00';
    button.style.color = '#000';
    button.style.border = '2px solid #09ff00';
    button.style.borderRadius = '8px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.fontWeight = 'bold';
    button.style.boxShadow = '0 4px 8px rgba(9, 255, 0, 0.3)';
    button.style.transition = 'all 0.3s ease';
    button.style.userSelect = 'none';
    if (window.innerWidth < 500) {
        button.style.fontSize = '12px';
        button.style.padding = '10px 14px';
        button.style.top = '10px';
        button.style.right = '10px';
    }
    document.body.appendChild(button);

    button.onclick = async () => {
        if (!useGyro) {
            if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
                try {
                    const response = await DeviceOrientationEvent.requestPermission();
                    if (response === "granted") {
                        useGyro = true;
                        button.textContent = "Отключить гироскоп";
                    }
                } catch (e) {
                    alert("Гироскоп не разрешён");
                }
            } else {
                useGyro = true;
                button.textContent = "Отключить гироскоп";
            }
        } else {
            useGyro = false;
            button.textContent = "Гироскоп";
        }
    };

    // Гироскоп (высокая чувствительность)
    window.addEventListener("deviceorientation", (e) => {
        if (useGyro && e.gamma !== null && e.beta !== null) {
            pointer.x = width / 2 + e.gamma * (width / 30);
            pointer.y = height / 2 + e.beta * (height / 30);
        }
    });

    // Тач/мышь
    window.addEventListener("pointermove", (e) => {
        if (!useGyro && e.clientX && e.clientY) {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            lastUserMove = Date.now();
        }
    });
    window.addEventListener("touchmove", (e) => {
        if (!useGyro && e.touches && e.touches.length > 0) {
            pointer.x = e.touches[0].clientX;
            pointer.y = e.touches[0].clientY;
            lastUserMove = Date.now();
        }
    });

    // Оптимизация FPS
    let lastFrame = 0;
    const FPS = 30;

    const run = (now) => {
        requestAnimationFrame(run);
        if (now - lastFrame < 1000 / FPS) return;
        lastFrame = now;

        // Автополёт если нет пользовательского ввода и гироскопа (через 1 сек)
        if (!useGyro && Date.now() - lastUserMove > 1000) {
            autoFlightPhase += 0.018;
            pointer.x = width / 2 + Math.cos(autoFlightPhase) * (width * 0.28);
            pointer.y = height / 2 + Math.sin(autoFlightPhase * 1.2) * (height * 0.18);
        }

        elems[0].x += (pointer.x - elems[0].x) * 0.12;
        elems[0].y += (pointer.y - elems[0].y) * 0.12;

        const margin = 30;
        elems[0].x = Math.max(margin, Math.min(width - margin, elems[0].x));
        elems[0].y = Math.max(margin, Math.min(height - margin, elems[0].y));

        for (let i = 1; i < N; i++) {
            let e = elems[i];
            let ep = elems[i - 1];
            const a = Math.atan2(e.y - ep.y, e.x - ep.x);
            e.x += (ep.x - e.x + (Math.cos(a) * (100 - i)) / 5) / 2.5;
            e.y += (ep.y - e.y + (Math.sin(a) * (100 - i)) / 5) / 2.5;
            let scaleFactor = 0.13;
            const s = ((162 + 4 * (1 - i)) / 50) * scaleFactor;
            e.use.setAttributeNS(
                null,
                "transform",
                `translate(${(ep.x + e.x) / 2},${(ep.y + e.y) / 2}) rotate(${(180 / Math.PI) * a}) scale(${s},${s})`
            );
        }
    };
    requestAnimationFrame(run);
}

// --- Десктоп: 5 волнистых драконов с оптимизацией и сердцем ---
else {
    const dragons = [];
    for (let d = 0; d < 5; d++) {
        const elems = [];
        const startX = Math.random() * (width - 100) + 50;
        const startY = Math.random() * (height - 100) + 50;
        for (let i = 0; i < N; i++) elems[i] = { use: null, x: startX, y: startY };
        dragons.push({
            elems,
            color: dragonColors[d],
            target: {
                x: Math.random() * (width - 100) + 50,
                y: Math.random() * (height - 100) + 50
            },
            speed: 2 + Math.random() * 2,
            wavePhase: Math.random() * Math.PI * 2,
            angle: Math.random() * Math.PI * 2,
            isHeart: false,
            heartSide: null,
            prevColor: dragonColors[d],
            prevTarget: null,
            prevSpeed: null,
            prevAngle: null,
            prevWavePhase: null,
            heartPhase: 0,
            heartProgress: 0,
            heartPhaseStart: 0
        });
    }
    for (let d = 0; d < 5; d++) {
        for (let i = 1; i < N; i++) {
            let useType = "Espina";
            if (i === 1) useType = "Cabeza";
            else if (i === 8 || i === 12) useType = "Aletas";
            const elem = document.createElementNS(xmlns, "use");
            dragons[d].elems[i].use = elem;
            elem.setAttributeNS(xlinkns, "xlink:href", "#" + useType);
            elem.setAttribute("style", `stroke: ${dragons[d].color}; fill: none;`);
            screen.prepend(elem);
        }
    }

    let heartActive = false;
    let heartDragons = [];
    let heartReady = false;

    function pickTwoRandomDragons() {
        let idx = [0, 1, 2, 3, 4];
        let a = idx.splice(Math.floor(Math.random() * idx.length), 1)[0];
        let b = idx.splice(Math.floor(Math.random() * idx.length), 1)[0];
        return [a, b];
    }

    function setHeartState(active) {
        heartActive = active;
        heartReady = false;
        for (let i = 0; i < 5; i++) {
            if (dragons[i].isHeart) {
                dragons[i].isHeart = false;
                dragons[i].heartSide = null;
                dragons[i].color = dragons[i].prevColor;
                dragons[i].target = dragons[i].prevTarget;
                dragons[i].speed = dragons[i].prevSpeed;
                dragons[i].angle = dragons[i].prevAngle;
                dragons[i].wavePhase = dragons[i].prevWavePhase;
                dragons[i].heartPhase = 0;
                dragons[i].heartProgress = 0;
                for (let j = 1; j < N; j++) {
                    dragons[i].elems[j].use.setAttribute("style", `stroke: ${dragons[i].color}; fill: none;`);
                }
            }
        }
    }

    function startHeartEvent() {
        setHeartState(false);
        heartDragons = pickTwoRandomDragons();
        const [a, b] = heartDragons;
        const centerX = width / 2;
        const centerY = height / 2;
        [a, b].forEach((idx, i) => {
            let d = dragons[idx];
            d.prevColor = d.color;
            d.prevTarget = d.target;
            d.prevSpeed = d.speed;
            d.prevAngle = d.angle;
            d.prevWavePhase = d.wavePhase;
            d.isHeart = true;
            d.heartSide = i === 0 ? "left" : "right";
            d.color = "#ff2222";
            d.target = { x: centerX + (i === 0 ? -90 : 90), y: centerY };
            d.speed = 6;
            d.heartPhase = 1;
            d.heartProgress = 0;
            d.heartPhaseStart = 0;
            for (let j = 1; j < N; j++) {
                d.elems[j].use.setAttribute("style", `stroke: #ff2222; fill: none;`);
            }
        });
        heartActive = true;
        heartReady = false;
    }

    setInterval(() => {
        startHeartEvent();
    }, 10000);

    setTimeout(() => {
        startHeartEvent();
    }, 10000);

    // Оптимизация FPS
    let lastFrame = 0;
    const FPS = 30;

    const run = (now) => {
        requestAnimationFrame(run);
        if (now - lastFrame < 1000 / FPS) return;
        lastFrame = now;

        // Проверяем, обе ли половинки прилетели к центру
        if (heartDragons.length === 2) {
            const [a, b] = heartDragons;
            const left = dragons[a];
            const right = dragons[b];
            const leftTarget = { x: width / 2 - 90, y: height / 2 };
            const rightTarget = { x: width / 2 + 90, y: height / 2 };
            heartReady =
                left.isHeart && right.isHeart &&
                Math.abs(left.elems[0].x - leftTarget.x) < 2 &&
                Math.abs(left.elems[0].y - leftTarget.y) < 2 &&
                Math.abs(right.elems[0].x - rightTarget.x) < 2 &&
                Math.abs(right.elems[0].y - rightTarget.y) < 2;
        } else {
            heartReady = false;
        }

        for (let d = 0; d < 5; d++) {
            let dragon = dragons[d];
            let e = dragon.elems[0];

            // --- Сердечко с фазами ---
            if (dragon.isHeart) {
                const centerX = width / 2 + (dragon.heartSide === "left" ? -90 : 90);
                const centerY = height / 2;

                if (dragon.heartPhase === 1) {
                    // Летит к центру
                    e.x += (centerX - e.x) * 0.18;
                    e.y += (centerY - e.y) * 0.18;
                    if (heartReady) {
                        dragon.heartPhase = 2;
                        dragon.heartProgress = 0;
                    }
                } else if (dragon.heartPhase === 2) {
                    // Плавно формирует половину сердца
                    dragon.heartProgress += 0.035;
                    if (dragon.heartProgress >= 1) {
                        dragon.heartProgress = 1;
                        dragon.heartPhase = 3;
                        dragon.heartPhaseStart = Date.now();
                    }
                } else if (dragon.heartPhase === 3) {
                    // Стоит 5 секунд
                    if (Date.now() - dragon.heartPhaseStart > 5000) {
                        dragon.heartPhase = 4;
                    }
                } else if (dragon.heartPhase === 4) {
                    setHeartState(false);
                    continue;
                }

                // Формируем тело в виде половины сердечка (анимируем t)
                let progress = (dragon.heartPhase === 2 || dragon.heartPhase === 3) ? dragon.heartProgress : 0;
                for (let i = 1; i < N; i++) {
                    let t = (i / (N - 1)) * progress;
                    let angle = dragon.heartSide === "left"
                        ? Math.PI - t * Math.PI
                        : t * Math.PI;
                    let hx = 16 * Math.pow(Math.sin(angle), 3);
                    let hy = -13 * Math.cos(angle) + 5 * Math.cos(2 * angle) + 2 * Math.cos(3 * angle) + Math.cos(4 * angle);
                    hx *= 7.5;
                    hy *= 7.5;
                    hx += dragon.heartSide === "left" ? -30 : 30;
                    let eBody = dragon.elems[i];
                    eBody.x = e.x + hx;
                    eBody.y = e.y + hy;
                    let a = Math.atan2(eBody.y - e.y, eBody.x - e.x);
                    let scaleFactor = 0.22;
                    const s = ((162 + 4 * (1 - i)) / 50) * scaleFactor;
                    eBody.use.setAttributeNS(
                        null,
                        "transform",
                        `translate(${eBody.x},${eBody.y}) rotate(${(180 / Math.PI) * a}) scale(${s},${s})`
                    );
                }
                continue;
            }

            // --- Обычное движение ---
            const targetAngle = Math.atan2(dragon.target.y - e.y, dragon.target.x - e.x);
            let da = targetAngle - dragon.angle;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;
            dragon.angle += da * 0.03;

            dragon.wavePhase += 0.13 + 0.03 * d;
            const waveRadius = 28 + 8 * Math.sin(performance.now() / 900 + d * 2);

            e.x += Math.cos(dragon.angle) * dragon.speed * 1.6 + Math.cos(dragon.angle + Math.PI / 2) * Math.sin(dragon.wavePhase) * waveRadius * 0.07;
            e.y += Math.sin(dragon.angle) * dragon.speed * 1.6 + Math.sin(dragon.angle + Math.PI / 2) * Math.sin(dragon.wavePhase) * waveRadius * 0.07;

            const dist = Math.hypot(e.x - dragon.target.x, e.y - dragon.target.y);
            if (dist < 120) {
                let tries = 0;
                let nx, ny, ndist;
                const centerX = width / 2;
                const centerY = height / 2;
                do {
                    const angle = Math.random() * Math.PI * 2;
                    const len = 200 + Math.random() * 200;
                    nx = e.x + Math.cos(angle) * len + (centerX - e.x) * 0.25 + (Math.random() - 0.5) * 80;
                    ny = e.y + Math.sin(angle) * len + (centerY - e.y) * 0.25 + (Math.random() - 0.5) * 80;
                    const margin = 30;
                    nx = Math.max(margin, Math.min(width - margin, nx));
                    ny = Math.max(margin, Math.min(height - margin, ny));
                    ndist = Math.hypot(e.x - nx, e.y - ny);
                    tries++;
                } while (ndist < 80 && tries < 10);
                dragon.target = { x: nx, y: ny };
            }

            const margin = 30;
            e.x = Math.max(margin, Math.min(width - margin, e.x));
            e.y = Math.max(margin, Math.min(height - margin, e.y));

            for (let i = 1; i < N; i++) {
                let e = dragon.elems[i];
                let ep = dragon.elems[i - 1];
                const a = Math.atan2(e.y - ep.y, e.x - ep.x);
                e.x += (ep.x - e.x + (Math.cos(a) * (100 - i)) / 5) / 2.5;
                e.y += (ep.y - e.y + (Math.sin(a) * (100 - i)) / 5) / 2.5;
                let scaleFactor = 0.18;
                const s = ((162 + 4 * (1 - i)) / 50) * scaleFactor;
                e.use.setAttributeNS(
                    null,
                    "transform",
                    `translate(${(ep.x + e.x) / 2},${(ep.y + e.y) / 2}) rotate(${(180 / Math.PI) * a}) scale(${s},${s})`
                );
            }
        }
    };
    requestAnimationFrame(run);
}