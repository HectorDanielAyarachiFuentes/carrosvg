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
import SkidMark from '../classes/SkidMark.js'; // Importa la nueva clase
import Radio from '../classes/Radio.js';
import Billboard from '../classes/Billboard.js'; // Importa la nueva clase Billboard
import Biplane from '../classes/Biplane.js';
import DustParticle from '../classes/DustParticle.js'; // Importa la nueva clase de polvo
import HUD from '../classes/HUD.js';
import Particle from '../classes/Particle.js';
import Critter from '../classes/Critter.js';
import Cityscape from '../classes/Cityscape.js'; // NUEVO: Paisaje urbano distante
import NuclearPlant from '../classes/NuclearPlant.js'; // NUEVO: Central nuclear como hito

// --- Estado Global de la Animación ---
const state = {
    lastTime: 0,
    cycleProgress: 0, // 0 a 1
    timeOfDay: 'day', // NUEVO: 'day', 'sunset', 'dusk', 'night', 'dawn'
    isNight: false,
    fogIntensity: 0, // 0 a 1, calculado en update
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
        skidMarks: [], // NUEVO: Array para las marcas de neumáticos
        critters: [], // Array para los nuevos animales
        raindrops: [],
        stars: [],
        particles: [],
        truck: null,
        ufo: null,
        radio: null,
        biplane: null,
        cityscape: null, // NUEVO
        nuclearPlant: null, // NUEVO
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
    draw(ctx, timestamp);

    // Solicitar el siguiente frame
    requestAnimationFrame(animate);
}

// --- NUEVO: Función para determinar el estado del ciclo día/noche ---
function updateCycleState() {
    const progress = state.cycleProgress;
    state.isNight = progress >= 0.60 && progress < 0.90;

    if (progress >= 0.90) {
        state.timeOfDay = 'dawn'; // Amanecer
    } else if (progress >= 0.60) {
        state.timeOfDay = 'night'; // Noche
    } else if (progress >= 0.50) {
        state.timeOfDay = 'dusk'; // Anochecer
    } else if (progress >= 0.40) {
        state.timeOfDay = 'sunset'; // Atardecer
    } else {
        state.timeOfDay = 'day'; // Día
    }
}

// --- Función de Actualización General ---
function update(deltaTime) {
    // Actualizar velocidad del camión
    state.elements.truck.updateSpeed(keys, deltaTime);
    state.truckSpeedMultiplier = state.elements.truck.speedMultiplier;

    // Progreso del ciclo día-noche
    state.cycleProgress = (state.lastTime % Config.CYCLE_DURATION) / Config.CYCLE_DURATION;    
    updateCycleState(); // Actualiza state.isNight y state.timeOfDay

    // --- MODIFICADO: Viento más fuerte y con más variación ---
    state.windStrength = Math.sin(state.lastTime / 5000) * 25 + 35; // Varia entre 10 y 60

    // --- NUEVO: Calcular intensidad de la niebla para que esté disponible globalmente ---
    const progress = state.cycleProgress;
    let intensity = 0;
    const FOG_APPEAR_START = 0.95;
    const FOG_PEAK_END = 0.05;
    const FOG_FADE_END = 0.20;
    if (progress >= FOG_APPEAR_START) {
        const t = (progress - FOG_APPEAR_START) / (1.0 - FOG_APPEAR_START);
        intensity = t;
    } else if (progress < FOG_PEAK_END) {
        intensity = 1.0;
    } else if (progress < FOG_FADE_END) {
        const t = (progress - FOG_PEAK_END) / (FOG_FADE_END - FOG_PEAK_END);
        intensity = 1.0 - t;
    }
    state.fogIntensity = intensity;

    // Actualizar elementos del escenario
    state.elements.mountains.forEach(m => m.update(deltaTime, state.truckSpeedMultiplier));
    state.elements.hills.forEach(h => h.update(deltaTime, state.truckSpeedMultiplier));
    state.elements.clouds.forEach(c => c.update(deltaTime, state.isNight));
    state.elements.trees.forEach(t => t.update(deltaTime, state.truckSpeedMultiplier));
    state.elements.cows.forEach(c => c.update(deltaTime, state.truckSpeedMultiplier));
    state.elements.billboards.forEach(b => b.update(deltaTime, state.truckSpeedMultiplier)); // Actualiza los carteles
    state.elements.critters.forEach(c => c.update(deltaTime, state.truckSpeedMultiplier, state.cycleProgress));
    // --- MODIFICADO: Pasar la fuerza del viento a las gotas de lluvia ---
    state.elements.raindrops.forEach(r => r.update(deltaTime, state.windStrength));
    // --- NUEVO: Actualizar marcas de neumáticos ---
    state.elements.skidMarks.forEach(sm => sm.update(deltaTime, state.truckSpeedMultiplier));

    // Actualizar elementos principales
    // --- MODIFICADO: Pasar `keys` y una función para añadir marcas de neumáticos ---
    state.elements.truck.update(deltaTime, state.isNight, state.windStrength, keys, (skidMark) => {
        state.elements.skidMarks.push(skidMark);
    });
    state.elements.ufo.update(deltaTime, state.cycleProgress, state.elements.trees, state.elements.cows, state.assets.mooSound);
    state.elements.radio.update(deltaTime, keys); // Actualiza el estado de la radio
    state.elements.biplane.update(deltaTime, state.isNight);
    state.elements.hud.update(state.isNight, deltaTime, state.cycleProgress, state.truckSpeedMultiplier); // Actualiza el DOM del HUD
    
    // --- NUEVO: Actualizar nuevos elementos de escenario ---
    state.elements.cityscape.update(deltaTime, state.truckSpeedMultiplier);
    state.elements.nuclearPlant.update(deltaTime, state.truckSpeedMultiplier);

    // --- NUEVO: Partículas de cambio de canción ---
    if (state.elements.radio.songJustChanged) {
        const radioVizX = state.elements.truck.x + 75;
        const radioVizY = state.elements.truck.y - 15;
        createParticleBurst(radioVizX, radioVizY, 40); // Create 40 particles
        state.elements.radio.songJustChanged = false; // Reset flag
    }

    // Actualizar partículas
    // OPTIMIZACIÓN: Iterar hacia atrás para eliminar elementos de forma segura y eficiente.
    for (let i = state.elements.particles.length - 1; i >= 0; i--) {
        const p = state.elements.particles[i];
        p.update();
        if (p.life <= 0) {
            state.elements.particles.splice(i, 1);
        }
    }
    // Limpiar marcas de neumáticos viejas
    for (let i = state.elements.skidMarks.length - 1; i >= 0; i--) {
        if (state.elements.skidMarks[i].life <= 0)
            state.elements.skidMarks.splice(i, 1);
    }
    // Reiniciar vacas para el siguiente ciclo
    if (state.cycleProgress > 0.95) {
        state.elements.cows.forEach(cow => {
            if (!cow.visible) cow.reset();
        });
    }
}

// --- Función de Dibujo General ---
function draw(ctx, timestamp) { // Recibe timestamp para animaciones consistentes
    // Limpiar canvas
    ctx.clearRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);

    // El orden de dibujado es importante (de atrás hacia adelante)
    drawSky(ctx);
    drawSunMoon(ctx);

    // --- NUEVO: Dibujar la ciudad distante detrás de las montañas ---
    state.elements.cityscape.draw(ctx, state.isNight, timestamp);
    
    // Estrellas y lluvia
    if (state.isNight) {
        drawStars(ctx);
        state.elements.raindrops.forEach(r => r.draw(ctx));
    }

    state.elements.mountains.forEach(m => m.draw(ctx));
    state.elements.hills.forEach(h => h.draw(ctx));
    state.elements.clouds.forEach(c => c.draw(ctx));

    // --- NUEVO: Dibujar la central nuclear en el plano medio ---
    state.elements.nuclearPlant.draw(ctx, state.isNight);
    state.elements.biplane.draw(ctx);
    state.elements.ufo.draw(ctx);

    // --- NUEVO: Dibujar marcas de neumáticos sobre el "suelo" pero debajo de otros objetos ---
    state.elements.skidMarks.forEach(sm => sm.draw(ctx));
    // --- NUEVO: Dibujar distorsión por calor durante el día ---
    drawHeatShimmer(ctx, timestamp);

    state.elements.billboards.forEach(b => b.draw(ctx, state.isNight, state.cycleProgress)); // Dibuja los carteles
    
    // OPTIMIZACIÓN: Pasar timestamp para animaciones consistentes como el balanceo de los árboles
    state.elements.trees.forEach(t => t.draw(ctx, state.windStrength, timestamp));
    state.elements.cows.forEach(c => c.draw(ctx, state.assets.cow));
    state.elements.critters.forEach(c => c.draw(ctx)); // Dibuja los animales
    
    // --- MODIFICADO: Pasar isNight y fogIntensity para controlar las luces del camión ---
    state.elements.truck.draw(ctx, state.assets.truck, state.assets.wheels, state.isNight, state.fogIntensity);
    state.elements.radio.draw(ctx);

    // --- NUEVO: Dibujar la niebla matutina ---
    // Se dibuja como una capa final para afectar a todos los elementos del escenario.
    drawFog(ctx);

    // Efectos (se dibujan encima de sus objetivos)
    state.elements.ufo.drawBeams(ctx, state.assets.cow);

    // --- NUEVO: Dibujar partículas ---
    state.elements.particles.forEach(p => p.draw(ctx));
    
    // --- NUEVO: Dibujar Lens Flare ---
    drawLensFlare(ctx);

    // Relámpago (ilumina toda la escena, se dibuja al final)
    if (state.isNight) state.elements.ufo.drawLightning(ctx);
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

/**
 * Dibuja una capa de niebla baja durante el amanecer y la mañana.
 * La intensidad de la niebla varía según la hora del día.
 * @param {CanvasRenderingContext2D} ctx El contexto del canvas.
 */
function drawFog(ctx) {
    // --- MODIFICADO: Usar la intensidad de niebla precalculada en el estado ---
    const intensity = state.fogIntensity;

    if (intensity <= 0) return;

    const maxFogAlpha = 0.75;
    const fogAlpha = intensity * maxFogAlpha;

    const fogHeight = 140; // Altura de la niebla desde el suelo
    const groundY = Config.CANVAS_HEIGHT;
    const gradient = ctx.createLinearGradient(0, groundY - fogHeight, 0, groundY);
    gradient.addColorStop(0, `rgba(200, 210, 220, 0)`);
    gradient.addColorStop(0.5, `rgba(200, 210, 220, ${fogAlpha * 0.8})`);
    gradient.addColorStop(1, `rgba(220, 225, 230, ${fogAlpha})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, groundY - fogHeight, Config.CANVAS_WIDTH, fogHeight);
}

/**
 * Dibuja un efecto de distorsión por calor sobre el asfalto durante el día.
 * @param {CanvasRenderingContext2D} ctx El contexto del canvas.
 * @param {number} timestamp El timestamp actual para la animación.
 */
function drawHeatShimmer(ctx, timestamp) {
    const progress = state.cycleProgress;
    // El efecto es visible durante el mediodía (0.1 a 0.4 del ciclo)
    const shimmerStart = 0.1;
    const shimmerPeak = 0.25;
    const shimmerEnd = 0.4;
    let intensity = 0;

    if (progress > shimmerStart && progress < shimmerPeak) {
        intensity = (progress - shimmerStart) / (shimmerPeak - shimmerStart);
    } else if (progress >= shimmerPeak && progress < shimmerEnd) {
        intensity = 1 - ((progress - shimmerPeak) / (shimmerEnd - shimmerPeak));
    }

    if (intensity <= 0) return;

    const roadY = Config.CANVAS_HEIGHT;
    const shimmerHeight = 25;
    const waveAmplitude = 1.5 * intensity;
    const waveLength = 150;

    ctx.save();
    // Copiamos una fina franja del canvas (que contiene el asfalto) y la redibujamos con una ondulación.
    // El propio canvas puede ser la fuente para drawImage.
    // Esto reemplaza el método erróneo de getImageData y drawImage(imageData.source, ...).
    ctx.drawImage(
        ctx.canvas, // La fuente es el canvas actual
        0, roadY - shimmerHeight, // Coordenadas de la franja a copiar (sx, sy)
        Config.CANVAS_WIDTH, shimmerHeight, // Tamaño de la franja a copiar (sWidth, sHeight)
        0, roadY - shimmerHeight + Math.sin(timestamp / 200) * waveAmplitude, // Posición de destino (dx, dy)
        Config.CANVAS_WIDTH, shimmerHeight // Tamaño de destino (dWidth, dHeight)
    );
    ctx.restore();
}

/**
 * Dibuja un efecto de "lens flare" cuando el sol está en pantalla.
 * @param {CanvasRenderingContext2D} ctx El contexto del canvas.
 */
function drawLensFlare(ctx) {
    // Solo visible durante el día cuando el sol está en pantalla
    if (state.cycleProgress >= 0.50) return;

    // 1. Calcular la posición del sol (usando la misma lógica que drawSunMoon)
    const sunProgress = state.cycleProgress / 0.50;
    const sunX = lerp(-40, Config.CANVAS_WIDTH + 40, sunProgress);
    const sunY = 80 + Math.sin(sunProgress * Math.PI) * -50;

    // Si el sol no está en pantalla, no hacer nada
    if (sunX < 0 || sunX > Config.CANVAS_WIDTH || sunY < 0 || sunY > Config.CANVAS_HEIGHT) {
        return;
    }

    // 2. Calcular la intensidad basada en la altura del sol
    const intensity = Math.sin(sunProgress * Math.PI) * 0.6; // Opacidad máxima de 0.6
    if (intensity <= 0) return;

    // 3. Calcular la posición de los "fantasmas" del flare en el lado opuesto de la pantalla
    const centerX = Config.CANVAS_WIDTH / 2;
    const centerY = Config.CANVAS_HEIGHT / 2;
    const vecX = sunX - centerX;
    const vecY = sunY - centerY;

    ctx.save();
    ctx.globalCompositeOperation = 'screen'; // El modo de fusión "screen" es ideal para efectos de luz

    // 4. Dibujar los elementos del flare
    const flareColors = [
        `rgba(255, 100, 100, ${intensity * 0.1})`,
        `rgba(100, 255, 100, ${intensity * 0.1})`,
        `rgba(100, 100, 255, ${intensity * 0.15})`,
        `rgba(255, 200, 100, ${intensity * 0.2})`,
    ];

    // Dibujar varios "fantasmas" (círculos de colores) a lo largo del vector opuesto
    for (let i = 0; i < flareColors.length; i++) {
        const ghostDist = i * 0.4 - 0.5; // Posiciones relativas (-0.5, -0.1, 0.3, 0.7)
        const ghostX = centerX - vecX * ghostDist;
        const ghostY = centerY - vecY * ghostDist;
        const ghostSize = (Math.random() * 40 + 20) * (1 - Math.abs(ghostDist));
        ctx.fillStyle = flareColors[i];
        ctx.beginPath();
        ctx.arc(ghostX, ghostY, ghostSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Dibujar un gran halo sutil alrededor del sol
    ctx.fillStyle = `rgba(255, 220, 180, ${intensity * 0.1})`;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 150, 0, Math.PI * 2);
    ctx.fill();

    // Dibujar un destello horizontal
    const streakWidth = 400;
    const streakGradient = ctx.createLinearGradient(sunX - streakWidth / 2, sunY, sunX + streakWidth / 2, sunY);
    streakGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    streakGradient.addColorStop(0.5, `rgba(255, 255, 255, ${intensity * 0.3})`);
    streakGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = streakGradient;
    ctx.fillRect(sunX - streakWidth / 2, sunY - 1, streakWidth, 2);

    ctx.restore();
}

function createParticleBurst(x, y, count) {
    for (let i = 0; i < count; i++) {
        state.elements.particles.push(new Particle(x, y));
    }
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

        // Eventos táctiles para dispositivos móviles
        element.addEventListener('touchstart', press, { passive: false });
        element.addEventListener('touchend', release, { passive: false });
        element.addEventListener('touchcancel', release, { passive: false });

        // Fallback para el ratón en escritorio (útil para depuración y ventanas pequeñas)
        element.addEventListener('mousedown', press, { passive: false });
        element.addEventListener('mouseup', release, { passive: false });
        element.addEventListener('mouseleave', release, { passive: false }); // Si el ratón se sale del botón
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

// --- NUEVO: Función para precargar la primera pista de música en segundo plano ---
/**
 * Carga la primera pista de audio sin bloquear el inicio de la animación.
 * @param {Array} musicTracks - El array de pistas de música.
 * @param {AudioContext} audioCtx - El contexto de audio.
 */
function preloadFirstTrack(musicTracks, audioCtx) {
    // Solo precarga el audio, no lo reproduce.
    // El buffer se asigna para que esté listo cuando el usuario presione 'R' o 'M'.
    if (musicTracks.length > 0 && musicTracks[0].src && !musicTracks[0].buffer) {
        loadAudio(musicTracks[0].src, audioCtx)
            .then(buffer => { musicTracks[0].buffer = buffer; })
            .catch(err => console.error('Error al precargar la primera canción:', err));
    }
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

    // --- NUEVO: Activar el audio en la primera interacción del usuario ---
    // Los navegadores modernos requieren una interacción para iniciar el audio.
    const activateAudio = () => {
        resumeAudio();
        // Eliminar los listeners una vez que el audio está activo.
        document.removeEventListener('click', activateAudio);
        document.removeEventListener('keydown', activateAudio);
    };
    document.addEventListener('click', activateAudio);
    document.addEventListener('keydown', activateAudio);
    
    const audioCtx = getAudioContext();

    try {
        // Cargar todos los assets en paralelo
        // NOTA: Debes reemplazar los archivos placeholder con tus propios MP3
        const [truckImg, wheelsImg, treeImg, cowImg, pilotImg, mooSound, billboardImg1, billboardImg2, rabbitImg, foxImg] = await Promise.all([
            loadImage('svg/truck.svg'),
            loadImage('svg/wheels.svg'),
            loadImage('svg/tree.svg'),
            loadImage('svg/cow.svg'),
            loadImage('img/dulcepiloto.png'), // Este es el piloto
            loadAudio('sonidos/moo.mp3', audioCtx),
            loadImage('img/dulce-cartel-1.jpg'),
            loadImage('img/dulce-cartel-2.jpg'),
            loadImage('svg/rabbit.svg'), // NUEVO: Imagen del conejo
            loadImage('svg/fox.svg'), // NUEVO: Imagen del zorro
        ]);

        state.assets = { 
            truck: truckImg, 
            wheels: wheelsImg, 
            tree: treeImg, 
            cow: cowImg, 
            pilot: pilotImg, 
            mooSound: mooSound,
            critterImages: { rabbit: rabbitImg, fox: foxImg } // Agrupa las imágenes de los animales
        };
        
        // Crear una lista de imágenes disponibles para los carteles
        const billboardImages = [pilotImg, billboardImg1, billboardImg2].filter(img => img); // Filtra si alguna imagen no cargó
        state.assets.billboardImages = billboardImages;

        // Definir las canciones para la radio, pero sin cargarlas aún para no bloquear el inicio
        const musicTracks = [
            { src: 'sonidos/Un Montón de Estrellas - Santiago Cañete.mp3', name: 'Un Montón de Estrellas', buffer: null },
            { src: 'sonidos/Rakim-Ken-Y-Quedate-Junto-A-Mi.mp3', name: 'Carretera Infinita', buffer: null },
            { src: 'sonidos/Ken-Y-Ese-no-soy-yo-Video-Oficial-Kenny.mp3', name: 'Ritmo Nocturno', buffer: null }
        ];

        // Inicia la precarga de la primera canción sin bloquear el renderizado
        preloadFirstTrack(musicTracks, audioCtx);

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
        // Instancia los nuevos animales
        state.elements.critters = Array.from({ length: 3 }, () => new Critter(state.assets.critterImages));
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

        state.elements.cityscape = new Cityscape();
        state.elements.nuclearPlant = new NuclearPlant();

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