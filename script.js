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
	debug.style.position = 'fixed';
	debug.style.top = '10px';
	debug.style.left = '10px';
	debug.style.zIndex = '2000';
	debug.style.background = 'rgba(0,0,0,0.8)';
	debug.style.color = '#09ff00';
	debug.style.padding = '10px';
	debug.style.fontSize = '12px';
	debug.style.fontFamily = 'monospace';
	debug.style.borderRadius = '5px';
	debug.innerHTML = `
		<div>Браузер: ${navigator.userAgent.substring(0, 50)}...</div>
		<div>DeviceOrientationEvent: ${!!window.DeviceOrientationEvent}</div>
		<div>RequestPermission: ${!!DeviceOrientationEvent.requestPermission}</div>
		<div>Гироскоп: <span id="gyro-status">проверяется...</span></div>
		<div>X: <span id="gyro-x">0</span>, Y: <span id="gyro-y">0</span></div>
	`;
	document.body.appendChild(debug);
	return debug;
};

const updatePointer = (e) => {
	if (!useGyroscope) {
		pointer.x = e.clientX || (e.touches && e.touches[0].clientX);
		pointer.y = e.clientY || (e.touches && e.touches[0].clientY);
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
		
		// Преобразуем углы в координаты экрана
		pointer.x = Math.max(0, Math.min(width, (gamma + 90) * width / 180));
		pointer.y = Math.max(0, Math.min(height, (beta + 45) * height / 90));
		
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
	button.textContent = 'Тест гироскопа';
	button.style.position = 'fixed';
	button.style.top = '20px';
	button.style.right = '20px';
	button.style.zIndex = '1000';
	button.style.padding = '15px 20px';
	button.style.backgroundColor = '#09ff00';
	button.style.color = '#000';
	button.style.border = 'none';
	button.style.borderRadius = '8px';
	button.style.cursor = 'pointer';
	button.style.fontSize = '16px';
	button.style.fontWeight = 'bold';
	
	button.onclick = () => {
		console.log("Кнопка нажата!");
		
		if (!gyroSupported) {
			alert('Гироскоп не поддерживается этим браузером');
			return;
		}
		
		useGyroscope = !useGyroscope;
		button.textContent = useGyroscope ? 'Выключить гироскоп' : 'Включить гироскоп';
		
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
							alert('Гироскоп включен! Наклоняйте устройство.');
						} else {
							useGyroscope = false;
							button.textContent = 'Включить гироскоп';
							alert('Разрешение отклонено');
						}
					})
					.catch(err => {
						console.error("Ошибка iOS:", err);
						useGyroscope = false;
						button.textContent = 'Включить гироскоп';
						alert('Ошибка: ' + err.message);
					});
			} else {
				// Для Android и старых iOS
				console.log("Включаем гироскоп для Android...");
				window.addEventListener('deviceorientation', handleOrientation, false);
				console.log("Гироскоп включен (Android)!");
				alert('Гироскоп включен! Наклоняйте устройство.');
			}
		} else {
			window.removeEventListener('deviceorientation', handleOrientation, false);
			console.log("Гироскоп выключен!");
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
}

const run = () => {
	requestAnimationFrame(run);
	let e = elems[0];
	const ax = (Math.cos(3 * frm) * rad * width) / height;
	const ay = (Math.sin(4 * frm) * rad * height) / width;
	e.x += (ax + pointer.x - e.x) / 10;
	e.y += (ay + pointer.y - e.y) / 10;
	for (let i = 1; i < N; i++) {
		let e = elems[i];
		let ep = elems[i - 1];
		const a = Math.atan2(e.y - ep.y, e.x - ep.x);
		e.x += (ep.x - e.x + (Math.cos(a) * (100 - i)) / 5) / 4;
		e.y += (ep.y - e.y + (Math.sin(a) * (100 - i)) / 5) / 4;
		const s = (162 + 4 * (1 - i)) / 50;
		e.use.setAttributeNS(
			null,
			"transform",
			`translate(${(ep.x + e.x) / 2},${(ep.y + e.y) / 2}) rotate(${
				(180 / Math.PI) * a
			}) translate(${0},${0}) scale(${s},${s})`
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