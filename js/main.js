import * as Config from './config.js';
import { loadImage, loadAudio, lerp } from './utils.js';
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
import Biplane from '../classes/Biplane.js';
import HUD from '../classes/HUD.js';

// --- Estado Global de la Animación ---
const state = {
    lastTime: 0,
    cycleProgress: 0, // 0 a 1
    isNight: false,
    truckSpeedMultiplier: 1.0,
    assets: {},
    elements: {
        mountains: [],
        hills: [],
        clouds: [],
        trees: [],
        cows: [],
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
    state.isNight = state.cycleProgress > 0.55 && state.cycleProgress < 0.95;

    // Actualizar elementos del escenario
    state.elements.mountains.forEach(m => m.update(deltaTime, state.truckSpeedMultiplier));
    state.elements.hills.forEach(h => h.update(deltaTime, state.truckSpeedMultiplier));
    state.elements.clouds.forEach(c => c.update(deltaTime, state.isNight));
    state.elements.trees.forEach(t => t.update(deltaTime, state.truckSpeedMultiplier));
    state.elements.cows.forEach(c => c.update(deltaTime, state.truckSpeedMultiplier));
    state.elements.raindrops.forEach(r => r.update(deltaTime));

    // Actualizar elementos principales
    state.elements.truck.update(deltaTime, state.isNight);
    state.elements.ufo.update(deltaTime, state.cycleProgress, state.elements.trees, state.elements.cows, state.assets.mooSound);
    state.elements.radio.update(deltaTime, keys); // Actualiza el estado de la radio
    state.elements.biplane.update(deltaTime, state.isNight);
    state.elements.hud.update(); // Actualiza el DOM del HUD basado en el estado de la radio
    
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
    
    state.elements.trees.forEach(t => t.draw(ctx, state.assets.tree));
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
    let skyColor = Config.DAY_SKY;
    if (state.cycleProgress > 0.45 && state.cycleProgress < 0.55) {
        const t = (state.cycleProgress - 0.45) / 0.10;
        ctx.fillStyle = Config.DAY_SKY;
        ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
        ctx.fillStyle = Config.SUNSET_SKY;
        ctx.globalAlpha = t;
        ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
        ctx.globalAlpha = 1;
        return;
    } else if (state.isNight) {
        skyColor = Config.NIGHT_SKY;
    } else if (state.cycleProgress >= 0.95) {
        const t = (state.cycleProgress - 0.95) / 0.05;
        ctx.fillStyle = Config.NIGHT_SKY;
        ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
        ctx.fillStyle = Config.DAY_SKY;
        ctx.globalAlpha = t;
        ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
        ctx.globalAlpha = 1;
        return;
    }
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
}

function drawSunMoon(ctx) {
    ctx.save();
    if (state.cycleProgress < 0.5) {
        const sunProgress = state.cycleProgress / 0.5;
        const x = lerp(-40, Config.CANVAS_WIDTH + 40, sunProgress);
        ctx.fillStyle = Config.SUN_COLOR;
        ctx.shadowColor = Config.SUN_COLOR;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(x, 40, 20, 0, Math.PI * 2);
        ctx.fill();
    } else if (state.cycleProgress > 0.55) {
        const moonProgress = (state.cycleProgress - 0.55) / 0.45;
        const x = lerp(Config.CANVAS_WIDTH + 40, -40, moonProgress);
        ctx.fillStyle = Config.MOON_COLOR;
        ctx.beginPath();
        ctx.arc(x, 40, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = Config.MOON_CRATER_COLOR;
        ctx.beginPath();
        ctx.arc(x - 8, 40 - 8, 20, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawStars(ctx) {
    const nightProgress = (state.cycleProgress - 0.55) / (0.95 - 0.55);
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
    // Añadir listener para reanudar audio en la primera interacción
    const resumeAndSetupKeys = (e) => {
        resumeAudio();
        // Añadir teclas de interacción a nuestro objeto de teclas
        if (!keys.KeyR) {
            keys.KeyR = { pressed: false };
            keys.KeyM = { pressed: false };
            window.addEventListener('keydown', (e) => {
                if (e.code === 'KeyR') keys.KeyR.pressed = true;
                if (e.code === 'KeyM') keys.KeyM.pressed = true;
            });
            window.addEventListener('keyup', (e) => {
                if (e.code === 'KeyR') keys.KeyR.pressed = false;
                if (e.code === 'KeyM') keys.KeyM.pressed = false;
            });
        }
    };
    window.addEventListener('keydown', resumeAndSetupKeys, { once: true });

    try {
        // Cargar todos los assets en paralelo
        // NOTA: Debes reemplazar los archivos placeholder con tus propios MP3
        const [truckImg, wheelsImg, treeImg, cowImg, pilotImg, mooSound, radioMusic1, radioMusic2, radioMusic3] = await Promise.all([
            loadImage('svg/truck.svg'),
            loadImage('svg/wheels.svg'),
            loadImage('svg/tree.svg'),
            loadImage('svg/cow.svg'),
            loadImage('img/dulcepiloto.png'),
            loadAudio('sonidos/moo.mp3', getAudioContext()),
            loadAudio('sonidos/Un Montón de Estrellas - Santiago Cañete.mp3', getAudioContext()),
            loadAudio('sonidos/Cancion_2_Placeholder.mp3', getAudioContext()), // Placeholder
            loadAudio('sonidos/Cancion_3_Placeholder.mp3', getAudioContext())  // Placeholder
        ]);

        state.assets = { truck: truckImg, wheels: wheelsImg, tree: treeImg, cow: cowImg, pilot: pilotImg, mooSound: mooSound };

        // Agrupar canciones para la radio
        const musicTracks = [
            { buffer: radioMusic1, name: 'Un Montón de Estrellas' },
            { buffer: radioMusic2, name: 'Carretera Infinita' },
            { buffer: radioMusic3, name: 'Ritmo Nocturno' }
        ].filter(track => track.buffer); // Filtrar canciones que no se cargaron

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