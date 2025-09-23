import * as Config from './config.js';
import { loadImage, loadAudio, lerp, lerpColor } from './utils.js';
import { setupInputHandlers, keys } from './input.js';
import { getAudioContext, resumeAudio } from './audio.js';

// Importa todas las clases de la animación
import SceneryObject from '../classes/SceneryObject.js';
import Cloud from '../classes/Cloud.js';
import Tree from '../classes/Tree.js';
import Cow from '../classes/Cow.js';
import Truck from '../classes/Truck.js';
import UFO from '../classes/UFO.js';
import RainDrop from '../classes/RainDrop.js';
import Radio from '../classes/Radio.js';
import Billboard from '../classes/Billboard.js'; // Importa la nueva clase Billboard
import Biplane from '../classes/Biplane.js';
import HUD from '../classes/HUD.js';

// --- Estado Global de la Animación ---
const state = {
    lastTime: 0,
    cycleProgress: 0, // 0 a 1
    isNight: false,
    truckSpeedMultiplier: 1.0,
    windStrength: 20, // Viento que afecta a árboles y humo
    assets: {},
    elements: {
        mountains: [],
        hills: [],
        clouds: [],
        trees: [],
        cows: [],
        billboards: [], // Añade un array para los carteles publicitarios
        raindrops: [],
        stars: [],
        truck: null,
        ufo: null,
        radio: null,
        biplane: null,
        hud: null,
    }
};

// --- Bucle Principal de Animación ---
function animate(timestamp) {
    if (!state.lastTime) state.lastTime = timestamp;
    const deltaTime = timestamp - state.lastTime;
    state.lastTime = timestamp;

    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');

    // 1. Actualizar estado de todos los objetos
    update(deltaTime);

    // 2. Limpiar y dibujar todo
    draw(ctx);

    // Solicitar el siguiente frame
    requestAnimationFrame(animate);
}

// --- Función de Actualización General ---
function update(deltaTime) {
    // Actualizar velocidad del camión
    state.elements.truck.updateSpeed(keys, deltaTime);
    state.truckSpeedMultiplier = state.elements.truck.speedMultiplier;

    // Progreso del ciclo día-noche
    state.cycleProgress = (state.lastTime % Config.CYCLE_DURATION) / Config.CYCLE_DURATION;
    state.isNight = state.cycleProgress >= 0.60 && state.cycleProgress < 0.90;

    // Actualizar la fuerza del viento con una oscilación suave
    state.windStrength = Math.sin(state.lastTime / 4000) * 15 + 20; // Varia entre 5 y 35

    // Actualizar elementos del escenario
    state.elements.mountains.forEach(m => m.update(deltaTime, state.truckSpeedMultiplier));
    state.elements.hills.forEach(h => h.update(deltaTime, state.truckSpeedMultiplier));
    state.elements.clouds.forEach(c => c.update(deltaTime, state.isNight));
    state.elements.trees.forEach(t => t.update(deltaTime, state.truckSpeedMultiplier));
    state.elements.cows.forEach(c => c.update(deltaTime, state.truckSpeedMultiplier));
    state.elements.billboards.forEach(b => b.update(deltaTime, state.truckSpeedMultiplier)); // Actualiza los carteles
    state.elements.raindrops.forEach(r => r.update(deltaTime));

    // Actualizar elementos principales
    state.elements.truck.update(deltaTime, state.isNight, state.windStrength);
    state.elements.ufo.update(deltaTime, state.cycleProgress, state.elements.trees, state.elements.cows, state.assets.mooSound);
    state.elements.radio.update(deltaTime, keys); // Actualiza el estado de la radio
    state.elements.biplane.update(deltaTime, state.isNight);
    state.elements.hud.update(state.isNight); // Actualiza el DOM del HUD basado en el estado de la radio y el ciclo día/noche
    
    // Reiniciar vacas para el siguiente ciclo
    if (state.cycleProgress > 0.95) {
        state.elements.cows.forEach(cow => {
            if (!cow.visible) cow.reset();
        });
    }
}

// --- Función de Dibujo General ---
function draw(ctx) {
    // Limpiar canvas
    ctx.clearRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);

    // El orden de dibujado es importante (de atrás hacia adelante)
    drawSky(ctx);
    drawSunMoon(ctx);
    
    // Estrellas y lluvia
    if (state.isNight) {
        drawStars(ctx);
        state.elements.raindrops.forEach(r => r.draw(ctx));
    }

    state.elements.mountains.forEach(m => m.draw(ctx));
    state.elements.hills.forEach(h => h.draw(ctx));
    state.elements.clouds.forEach(c => c.draw(ctx));
    state.elements.biplane.draw(ctx);
    state.elements.ufo.draw(ctx);
    state.elements.billboards.forEach(b => b.draw(ctx, state.isNight)); // Dibuja los carteles
    
    state.elements.trees.forEach(t => t.draw(ctx, state.windStrength));
    state.elements.cows.forEach(c => c.draw(ctx, state.assets.cow));
    
    state.elements.truck.draw(ctx, state.assets.truck, state.assets.wheels);
    state.elements.radio.draw(ctx);

    // Efectos (se dibujan encima de sus objetivos)
    state.elements.ufo.drawBeams(ctx, state.assets.cow);
    
    // Relámpago (ilumina toda la escena)
    if (state.isNight) {
         state.elements.ufo.drawLightning(ctx);
    }
}

// --- Funciones de Dibujo del Entorno ---
function drawSky(ctx) {
    const progress = state.cycleProgress;
    let skyColor;

    // Atardecer (Día -> Atardecer) 0.40 -> 0.50
    if (progress > 0.40 && progress < 0.50) {
        const t = (progress - 0.40) / 0.10;
        skyColor = lerpColor(Config.DAY_SKY, Config.SUNSET_SKY, t);
    } 
    // Anochecer (Atardecer -> Noche) 0.50 -> 0.60
    else if (progress >= 0.50 && progress < 0.60) {
        const t = (progress - 0.50) / 0.10;
        skyColor = lerpColor(Config.SUNSET_SKY, Config.NIGHT_SKY, t);
    }
    // Noche 0.60 -> 0.90
    else if (state.isNight) {
        skyColor = Config.NIGHT_SKY;
    }
    // Amanecer (Noche -> Día) 0.90 -> 1.0
    else if (progress >= 0.90) {
        const t = (progress - 0.90) / 0.10;
        skyColor = lerpColor(Config.NIGHT_SKY, Config.DAY_SKY, t);
    }
    // Día
    else {
        skyColor = Config.DAY_SKY;
    }

    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
}

function drawSunMoon(ctx) {
    ctx.save();
    // Sol: visible durante el día y el atardecer
    if (state.cycleProgress < 0.50) { // El sol se pone durante el anochecer
        const sunProgress = state.cycleProgress / 0.50;
        const x = lerp(-40, Config.CANVAS_WIDTH + 40, sunProgress);
        const y = 80 + Math.sin(sunProgress * Math.PI) * -50; // Arco suave
        ctx.fillStyle = Config.SUN_COLOR;
        ctx.shadowColor = Config.SUN_COLOR;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
    } 
    // Luna: visible durante la noche
    else if (state.cycleProgress > 0.60) { // La luna sale al empezar la noche
        const moonProgress = (state.cycleProgress - 0.60) / (1.0 - 0.60);
        const x = lerp(Config.CANVAS_WIDTH + 40, -40, moonProgress);
        const y = 80 + Math.sin(moonProgress * Math.PI) * -50; // Arco suave
        
        ctx.fillStyle = Config.MOON_COLOR;
        ctx.shadowColor = Config.MOON_COLOR;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Cráteres para dar textura
        ctx.fillStyle = Config.MOON_CRATER_COLOR;
        ctx.beginPath();
        ctx.arc(x + 5, y - 10, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - 10, y - 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawStars(ctx) {
    const nightProgress = (state.cycleProgress - 0.60) / (0.90 - 0.60);
    const maxAlpha = Math.sin(nightProgress * Math.PI);

    ctx.fillStyle = '#FFFFFF';
    state.elements.stars.forEach(star => {
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0) star.twinkleSpeed *= -1;
        
        ctx.globalAlpha = star.alpha * maxAlpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function setupMobileControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnRadio = document.getElementById('btn-radio');
    const btnSong = document.getElementById('btn-song');

    // Si los botones no existen en el DOM, no hacer nada.
    if (!btnLeft || !btnRight || !btnRadio || !btnSong) {
        return;
    }

    // --- Botones de Aceleración y Freno (mantener pulsado) ---
    const setupHoldableButton = (element, key) => {
        const press = (e) => { e.preventDefault(); keys[key] = true; };
        const release = (e) => { e.preventDefault(); keys[key] = false; };
        
        element.addEventListener('touchstart', press, { passive: false });
        element.addEventListener('touchend', release, { passive: false });
        element.addEventListener('touchcancel', release, { passive: false });
    };

    setupHoldableButton(btnLeft, 'ArrowLeft');
    setupHoldableButton(btnRight, 'ArrowRight');

    // --- Botones de Radio (un solo toque) ---
    const setupTapButton = (element, action) => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            action();
        });
    };

    setupTapButton(btnRadio, () => {
        if (state.elements.radio) state.elements.radio.toggle();
    });

    setupTapButton(btnSong, () => {
        if (state.elements.radio) state.elements.radio.changeTrack();
    });
}

// --- Función de Inicio ---
async function start() {
    const canvas = document.getElementById('animationCanvas');
    if (!canvas) {
        console.error("No se encontró el elemento canvas.");
        return;
    }
    canvas.width = Config.CANVAS_WIDTH;
    canvas.height = Config.CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');

    // Configurar manejadores de eventos
    setupInputHandlers();
    setupMobileControls();
    
    try {
        // Cargar todos los assets en paralelo
        // NOTA: Debes reemplazar los archivos placeholder con tus propios MP3
        const [truckImg, wheelsImg, treeImg, cowImg, pilotImg, mooSound, billboardImg1, billboardImg2] = await Promise.all([
            loadImage('svg/truck.svg'),
            loadImage('svg/wheels.svg'),
            loadImage('svg/tree.svg'),
            loadImage('svg/cow.svg'),
            loadImage('img/dulcepiloto.png'),
            loadAudio('sonidos/moo.mp3', getAudioContext()),
            loadImage('img/dulce-cartel-1.jpg'),
            loadImage('img/dulce-cartel-2.jpg'), // Cargar la segunda imagen para el cartel
        ]);

        state.assets = { truck: truckImg, wheels: wheelsImg, tree: treeImg, cow: cowImg, pilot: pilotImg, mooSound: mooSound };
        
        // Crear una lista de imágenes disponibles para los carteles
        const billboardImages = [pilotImg, billboardImg1, billboardImg2].filter(img => img); // Filtra si alguna imagen no cargó
        state.assets.billboardImages = billboardImages;

        // Definir las canciones para la radio, pero sin cargarlas aún para no bloquear el inicio
        const musicTracks = [
            { src: 'sonidos/Un Montón de Estrellas - Santiago Cañete.mp3', name: 'Un Montón de Estrellas', buffer: null },
            { src: 'sonidos/Rakim-Ken-Y-Quedate-Junto-A-Mi.mp3', name: 'Carretera Infinita', buffer: null },
            { src: 'sonidos/Ken-Y-Ese-no-soy-yo-Video-Oficial-Kenny.mp3', name: 'Ritmo Nocturno', buffer: null }
        ];

        // Inicializar todos los objetos de la animación
        state.elements.truck = new Truck();
        state.elements.ufo = new UFO();
        state.elements.biplane = new Biplane(state.assets.pilot);
        
        state.elements.mountains = [
            new SceneryObject(100, Config.CANVAS_HEIGHT + 100, 120, 1),
            new SceneryObject(400, Config.CANVAS_HEIGHT + 80, 150, 1),
            new SceneryObject(700, Config.CANVAS_HEIGHT + 120, 100, 1),
        ];
        state.elements.hills = [
            new SceneryObject(200, Config.CANVAS_HEIGHT + 20, 80, 2),
            new SceneryObject(500, Config.CANVAS_HEIGHT + 30, 100, 2),
            new SceneryObject(800, Config.CANVAS_HEIGHT + 15, 90, 2),
        ];
        state.elements.clouds = Array.from({ length: 3 }, () => new Cloud());
        state.elements.trees = Array.from({ length: 4 }, () => new Tree(treeImg));
        state.elements.cows = Array.from({ length: 3 }, () => new Cow(cowImg));
        // Instancia los carteles, eligiendo una imagen al azar de las disponibles
        // Pasamos el array completo de imágenes para que cada cartel pueda cambiarla al resetearse.
        state.elements.billboards = Array.from({ length: 2 }, () => new Billboard(state.assets.billboardImages));
        state.elements.raindrops = Array.from({ length: 200 }, () => new RainDrop());
        state.elements.stars = Array.from({ length: 100 }, () => ({
            x: Math.random() * Config.CANVAS_WIDTH,
            y: Math.random() * Config.CANVAS_HEIGHT * 0.8,
            radius: Math.random() * 1.2,
            alpha: Math.random(),
            twinkleSpeed: Math.random() * 0.05
        }));

        // Inicializar la radio después del camión
        state.elements.radio = new Radio(musicTracks, state.elements.truck);

        // Inicializar el HUD
        state.elements.hud = new HUD(state.elements.radio);

        // Iniciar el bucle de animación
        requestAnimationFrame(animate);

    } catch (error) {
        console.error("Error al cargar los recursos:", error);
        ctx.fillStyle = 'red';
        ctx.font = '16px sans-serif';
        ctx.fillText('Error al cargar recursos. Revisa la consola.', 10, 50);
    }
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', start);