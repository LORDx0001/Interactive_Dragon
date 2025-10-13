"use strict";

const screen = document.getElementById("screen");
const xmlns = "http://www.w3.org/2000/svg";
const xlinkns = "http://www.w3.org/1999/xlink";

// --- Универсальные параметры ---
const N = 24;
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

// --- Мобильный/Планшет: 1 дракон с гироскопом/тачем ---
if (isMobileOrTablet()) {
    // Один зелёный дракон
    const elems = [];
    for (let i = 0; i < N; i++) elems[i] = { use: null, x: width / 2, y: height / 2 };
    for (let i = 1; i < N; i++) {
        let useType = "Espina";
        if (i === 1) useType = "Cabeza";
        else if (i === 8 || i === 14) useType = "Aletas";
        const elem = document.createElementNS(xmlns, "use");
        elems[i].use = elem;
        elem.setAttributeNS(xlinkns, "xlink:href", "#" + useType);
        elem.setAttribute("style", `stroke: #09ff00; fill: none;`);
        screen.prepend(elem);
    }

    let pointer = { x: width / 2, y: height / 2 };
    let useGyro = false;

    // Кнопка для включения гироскопа
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

    // Включение гироскопа по нажатию
    button.onclick = async () => {
        if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
            try {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response === "granted") {
                    useGyro = true;
                    button.style.display = "none";
                }
            } catch (e) {
                alert("Гироскоп не разрешён");
            }
        } else {
            useGyro = true;
            button.style.display = "none";
        }
    };

    // Гироскоп
    window.addEventListener("deviceorientation", (e) => {
        if (useGyro && e.gamma !== null && e.beta !== null) {
            pointer.x = width / 2 + e.gamma * (width / 90) * 0.4;
            pointer.y = height / 2 + e.beta * (height / 90) * 0.4;
        }
    });

    // Тач/мышь
    window.addEventListener("pointermove", (e) => {
        if (!useGyro) {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
        }
    });

    // Анимация
    const run = () => {
        requestAnimationFrame(run);

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
    run();
}

// --- Десктоп: 5 волнистых драконов ---
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
            angle: Math.random() * Math.PI * 2
        });
    }
    for (let d = 0; d < 5; d++) {
        for (let i = 1; i < N; i++) {
            let useType = "Espina";
            if (i === 1) useType = "Cabeza";
            else if (i === 8 || i === 14) useType = "Aletas";
            const elem = document.createElementNS(xmlns, "use");
            dragons[d].elems[i].use = elem;
            elem.setAttributeNS(xlinkns, "xlink:href", "#" + useType);
            elem.setAttribute("style", `stroke: ${dragons[d].color}; fill: none;`);
            screen.prepend(elem);
        }
    }

    const run = () => {
        requestAnimationFrame(run);

        for (let d = 0; d < 5; d++) {
            let dragon = dragons[d];
            let e = dragon.elems[0];

            // Плавно меняем угол направления к цели
            const targetAngle = Math.atan2(dragon.target.y - e.y, dragon.target.x - e.x);
            let da = targetAngle - dragon.angle;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;
            dragon.angle += da * 0.03;

            // Волновое смещение
            dragon.wavePhase += 0.13 + 0.03 * d;
            const waveRadius = 28 + 8 * Math.sin(performance.now() / 900 + d * 2);

            // Новая позиция головы
            e.x += Math.cos(dragon.angle) * dragon.speed * 1.6 + Math.cos(dragon.angle + Math.PI / 2) * Math.sin(dragon.wavePhase) * waveRadius * 0.07;
            e.y += Math.sin(dragon.angle) * dragon.speed * 1.6 + Math.sin(dragon.angle + Math.PI / 2) * Math.sin(dragon.wavePhase) * waveRadius * 0.07;

            // Если голова близко к цели — выбираем новую цель (с притяжением к центру)
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

            // Ограничиваем в пределах экрана
            const margin = 30;
            e.x = Math.max(margin, Math.min(width - margin, e.x));
            e.y = Math.max(margin, Math.min(height - margin, e.y));

            // Анимация тела
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
    run();
}