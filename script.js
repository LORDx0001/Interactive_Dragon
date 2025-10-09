"use strict";

const screen = document.getElementById("screen");
const xmlns = "http://www.w3.org/2000/svg";
const xlinkns = "http://www.w3.org/1999/xlink";

// Проверяем поддержку гироскопа
let gyroSupported = false;
let useGyroscope = false;

// Добавляем отладочную информацию
const addDebugInfo = () => {
	const debug = document.createElement('div');
	debug.id = 'debug-panel';
	debug.style.position = 'fixed';
	debug.style.bottom = '10px';
	debug.style.left = '10px';
	debug.style.zIndex = '2000';
	debug.style.background = 'rgba(0,0,0,0.9)';
	debug.style.color = '#09ff00';
	debug.style.padding = '8px';
	debug.style.fontSize = '10px';
	debug.style.fontFamily = 'monospace';
	debug.style.borderRadius = '5px';
	debug.style.maxWidth = '250px';
	debug.style.border = '1px solid #09ff00';
	debug.style.cursor = 'pointer';
	debug.innerHTML = `
		<div style="font-weight: bold; margin-bottom: 5px;">🐉 Debug Info (tap to toggle)</div>
		<div id="debug-content" style="display: none;">
			<div>Gyro: <span id="gyro-status">проверяется...</span></div>
			<div>X: <span id="gyro-x">0</span>, Y: <span id="gyro-y">0</span></div>
			<div>Browser: ${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</div>
			<div>DeviceOrientation: ${!!window.DeviceOrientationEvent ? '✓' : '✗'}</div>
		</div>
	`;
	
	// Добавляем возможность свернуть/развернуть панель
	debug.onclick = () => {
		const content = document.getElementById('debug-content');
		if (content.style.display === 'none') {
			content.style.display = 'block';
		} else {
			content.style.display = 'none';
		}
	};
	
	document.body.appendChild(debug);
	return debug;
};

const updatePointer = (e) => {
	if (!useGyroscope) {
		let newX = e.clientX || (e.touches && e.touches[0].clientX);
		let newY = e.clientY || (e.touches && e.touches[0].clientY);
		const margin = 50;
		pointer.x = Math.max(margin, Math.min(width - margin, newX));
		pointer.y = Math.max(margin, Math.min(height - margin, newY));
		rad = 0;
	}
};

// Обработчик гироскопа
const handleOrientation = (event) => {
	if (useGyroscope) {
		// gamma: наклон влево-вправо (-90 до 90)
		// beta: наклон вперед-назад (-180 до 180)
		const gamma = event.gamma || 0; // лево-право
		const beta = event.beta || 0;   // вперед-назад
		
		// Увеличиваем чувствительность и диапазон
		// Используем более широкий диапазон и усиление
		const sensitivity = 2.5; // Коэффициент усиления
		const gammaRange = 60;    // Диапазон gamma (вместо 90)
		const betaRange = 30;     // Диапазон beta (вместо 45)
		
		// Преобразуем углы в координаты экрана с усилением
		let x = (gamma + gammaRange) * width / (gammaRange * 2);
		let y = (beta + betaRange) * height / (betaRange * 2);
		
		// Применяем усиление и ограничиваем координаты
		pointer.x = Math.max(0, Math.min(width, x * sensitivity - (width * (sensitivity - 1)) / 2));
		pointer.y = Math.max(0, Math.min(height, y * sensitivity - (height * (sensitivity - 1)) / 2));
		
		// Обновляем отладочную информацию
		const gyroX = document.getElementById('gyro-x');
		const gyroY = document.getElementById('gyro-y');
		if (gyroX) gyroX.textContent = gamma.toFixed(1);
		if (gyroY) gyroY.textContent = beta.toFixed(1);
		
		rad = 0;
	}
};

// Проверяем поддержку гироскопа
const checkGyroSupport = () => {
	const statusEl = document.getElementById('gyro-status');
	
	if (window.DeviceOrientationEvent) {
		gyroSupported = true;
		if (statusEl) statusEl.textContent = 'поддерживается';
		console.log("Гироскоп поддерживается!");
		return true;
	} else {
		if (statusEl) statusEl.textContent = 'не поддерживается';
		console.log("Гироскоп НЕ поддерживается!");
		return false;
	}
};

// Создаем простую кнопку
const createSimpleGyroButton = () => {
	// Создаем кнопку в любом случае для тестирования
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
	
	// Адаптация для мобильных устройств
	if (window.innerWidth < 500) {
		button.style.fontSize = '12px';
		button.style.padding = '10px 14px';
		button.style.top = '10px';
		button.style.right = '10px';
	}
	
	button.onclick = () => {
		console.log("Кнопка нажата!");
		
		if (!gyroSupported) {
			alert('Гироскоп не поддерживается этим браузером');
			return;
		}
		
		useGyroscope = !useGyroscope;
		button.textContent = useGyroscope ? 'Выкл' : 'Гироскоп';
		button.style.backgroundColor = useGyroscope ? '#ff4444' : '#09ff00';
		
		if (useGyroscope) {
			// Для iOS 13+ запрашиваем разрешение
			if (typeof DeviceOrientationEvent.requestPermission === 'function') {
				console.log("Запрашиваем разрешение для iOS...");
				DeviceOrientationEvent.requestPermission()
					.then(response => {
						console.log("Ответ iOS:", response);
						if (response == 'granted') {
							window.addEventListener('deviceorientation', handleOrientation, false);
							console.log("Гироскоп включен (iOS)!");
							button.textContent = 'Выкл';
							button.style.backgroundColor = '#ff4444';
						} else {
							useGyroscope = false;
							button.textContent = 'Гироскоп';
							button.style.backgroundColor = '#09ff00';
							alert('Разрешение отклонено');
						}
					})
					.catch(err => {
						console.error("Ошибка iOS:", err);
						useGyroscope = false;
						button.textContent = 'Гироскоп';
						button.style.backgroundColor = '#09ff00';
						alert('Ошибка: ' + err.message);
					});
			} else {
				// Для Android и старых iOS
				console.log("Включаем гироскоп для Android...");
				window.addEventListener('deviceorientation', handleOrientation, false);
				console.log("Гироскоп включен (Android)!");
				button.textContent = 'Выкл';
				button.style.backgroundColor = '#ff4444';
			}
		} else {
			window.removeEventListener('deviceorientation', handleOrientation, false);
			console.log("Гироскоп выключен!");
			button.textContent = 'Гироскоп';
			button.style.backgroundColor = '#09ff00';
		}
	};
	
	document.body.appendChild(button);
	console.log("Кнопка создана!");
};

window.addEventListener("pointermove", updatePointer, false);
window.addEventListener("touchmove", updatePointer, false);
window.addEventListener("mousemove", updatePointer, false);

// Инициализируем после загрузки страницы
window.addEventListener('load', () => {
	console.log("Страница загружена, инициализируем гироскоп...");
	addDebugInfo();
	checkGyroSupport();
	createSimpleGyroButton();
});

// Также пробуем инициализировать сразу
document.addEventListener('DOMContentLoaded', () => {
	console.log("DOM загружен, инициализируем гироскоп...");
	addDebugInfo();
	checkGyroSupport();
	createSimpleGyroButton();
});

const resize = () => {
	width = window.innerWidth;
	height = window.innerHeight;
};

let width, height;
window.addEventListener("resize", () => resize(), false);
resize();

const prepend = (use, i) => {
	const elem = document.createElementNS(xmlns, "use");
	elems[i].use = elem;
	elem.setAttributeNS(xlinkns, "xlink:href", "#" + use);
	screen.prepend(elem);
};

const N = 40;

const elems = [];
for (let i = 0; i < N; i++) elems[i] = { use: null, x: width / 2, y: 0 };
const pointer = { x: width / 2, y: height / 2 };
const radm = Math.min(pointer.x, pointer.y) - 20;
let frm = Math.random();
let rad = 0;

for (let i = 1; i < N; i++) {
	if (i === 1) prepend("Cabeza", i);
	else if (i === 8 || i === 14) prepend("Aletas", i);
	else prepend("Espina", i);
	// Сделать сегмент ярко-неоновым
	if (elems[i] && elems[i].use) {
		elems[i].use.setAttribute("style", "filter: drop-shadow(0 0 16px #39ff14); stroke: #39ff14; fill: none;");
	}
}

const run = () => {
	requestAnimationFrame(run);
	let e = elems[0];
	const ax = (Math.cos(3 * frm) * rad * width) / height;
	const ay = (Math.sin(4 * frm) * rad * height) / width;
	e.x += (ax + pointer.x - e.x) / 10;
	e.y += (ay + pointer.y - e.y) / 10;
	// Ограничиваем голову дракона в пределах экрана с тем же отступом
	const margin = 50;
    // Определяем масштаб для мобильных/планшетов
	let scaleFactor = 1;
	if (window.innerWidth < 500 || window.innerHeight < 500) {
		scaleFactor = 0.28; // ещё меньше для телефонов
	} else if (window.innerWidth < 900 || window.innerHeight < 900) {
		scaleFactor = 0.38; // ещё меньше для планшетов
	} else {
		scaleFactor = 0.7; // уменьшить и на десктопе
	}
    e.x = Math.max(margin, Math.min(width - margin, e.x));
    e.y = Math.max(margin, Math.min(height - margin, e.y));
    for (let i = 1; i < N; i++) {
        let e = elems[i];
        let ep = elems[i - 1];
        const a = Math.atan2(e.y - ep.y, e.x - ep.x);
        e.x += (ep.x - e.x + (Math.cos(a) * (100 - i)) / 5) / 4;
        e.y += (ep.y - e.y + (Math.sin(a) * (100 - i)) / 5) / 4;
        const s = ((162 + 4 * (1 - i)) / 50) * scaleFactor;
        e.use.setAttributeNS(
            null,
            "transform",
            `translate(${(ep.x + e.x) / 2},${(ep.y + e.y) / 2}) rotate(${(180 / Math.PI) * a}) translate(${0},${0}) scale(${s},${s})`
        );
	}
	if (rad < radm) rad++;
	frm += 0.003;
	if (rad > 60) {
		pointer.x += (width / 2 - pointer.x) * 0.05;
		pointer.y += (height / 2 - pointer.y) * 0.05;
	}
};

run();