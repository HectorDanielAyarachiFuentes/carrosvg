document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');

    // --- Configuración ---
    const CANVAS_WIDTH = 600;
    const CANVAS_HEIGHT = 250;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const CYCLE_DURATION = 20000; // 20 segundos para un ciclo día-noche

    // --- Colores ---
    const DAY_SKY = '#009688';
    const SUNSET_SKY = '#ffb8b8';
    const NIGHT_SKY = '#2c3e50';
    const SUN_COLOR = '#fdd835';
    const MOON_COLOR = '#f5f5f5';
    const MOON_CRATER_COLOR = '#bdc3c7';
    const CLOUD_DAY_COLOR = 'rgba(255, 255, 255, 0.8)';
    const CLOUD_NIGHT_COLOR = 'rgba(160, 160, 160, 0.8)';
    const SCENERY_COLOR = '#4DB6AC';

    // --- Carga de assets (imágenes) ---
    const loadImage = src => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });

    let truckImg, wheelsImg, treeImg;

    // --- Estado de la animación ---
    let lastTime = 0;
    let cycleProgress = 0; // 0 a 1
    let isNight = false;
    let truckSpeedMultiplier = 1.0;

    // --- Estado del Teclado ---
    const keys = {
        ArrowRight: false,
        ArrowLeft: false,
    };

    // --- Clases y Objetos de la Animación ---

    // Elementos del escenario con efecto parallax
    class SceneryObject {
        constructor(x, y, radius, speed) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.speed = speed;
        }

        update(deltaTime) {
            this.x -= this.speed * truckSpeedMultiplier * (deltaTime / 16.67);
            if (this.x < -this.radius * 2) {
                this.x = CANVAS_WIDTH + this.radius * 2;
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = SCENERY_COLOR;
            ctx.fill();
        }
    }

    // Nubes
    class Cloud {
        constructor() {
            this.speed = Math.random() * 20 + 15; // px/s
            this.reset();
            this.y = Math.random() * 80 + 10;
            this.scale = Math.random() * 0.5 + 0.5;
        }

        reset() {
            this.x = CANVAS_WIDTH + Math.random() * 300;
        }

        update(deltaTime) {
            this.x -= this.speed * (deltaTime / 1000);
            if (this.x < -150 * this.scale) {
                this.reset();
            }
        }

        draw(ctx) {
            ctx.fillStyle = isNight ? CLOUD_NIGHT_COLOR : CLOUD_DAY_COLOR;
            ctx.beginPath();
            // Dibuja la nube con 3 círculos, como en el CSS original
            ctx.arc(this.x, this.y, 30 * this.scale, 0, Math.PI * 2);
            ctx.arc(this.x + 40 * this.scale, this.y - 15 * this.scale, 40 * this.scale, 0, Math.PI * 2);
            ctx.arc(this.x + 80 * this.scale, this.y, 35 * this.scale, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Árboles
    class Tree {
        constructor() {
            this.speed = 150; // px/s, velocidad base
            this.reset();
            this.scale = Math.random() * 0.4 + 0.8; // 0.8 a 1.2
            this.speed *= (2.0 - this.scale); // Los árboles más pequeños parecen más lejanos y se mueven más lento
        }

        reset() {
            this.x = CANVAS_WIDTH + Math.random() * CANVAS_WIDTH;
        }

        update(deltaTime) {
            this.x -= this.speed * truckSpeedMultiplier * (deltaTime / 1000);
            if (this.x < -100) {
                this.reset();
            }
        }

        draw(ctx) {
            if (treeImg) {
                const imgWidth = treeImg.width * this.scale;
                const imgHeight = treeImg.height * this.scale;
                ctx.drawImage(treeImg, this.x, CANVAS_HEIGHT - imgHeight, imgWidth, imgHeight);
            }
        }
    }

    // Partículas de humo mejoradas
    class SmokeParticle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 4 + 2; // Tamaño inicial
            this.maxSize = Math.random() * 8 + 12; // Tamaño máximo que alcanzará

            // Velocidad en píxeles por segundo. El humo sube y se va hacia atrás.
            this.vx = -(Math.random() * 40 + 30) * (truckSpeedMultiplier * 0.5 + 0.5);
            this.vy = -(Math.random() * 30 + 20);
            
            this.initialLife = Math.random() * 1.5 + 1.0; // Duración en segundos
            this.life = this.initialLife;
        }

        update(deltaTime) {
            const dt = deltaTime / 1000; // delta en segundos
            this.life -= dt;

            this.x += this.vx * dt;
            this.y += this.vy * dt;
            
            // El "viento" empuja el humo hacia atrás
            this.vx -= 20 * dt;
        }

        draw(ctx) {
            if (this.life <= 0) return;

            const lifeProgress = Math.max(0, this.life / this.initialLife);
            const currentSize = this.size + (1 - lifeProgress) * (this.maxSize - this.size);
            const alpha = lifeProgress * 0.4; // Opacidad máxima de 0.4

            ctx.save();
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentSize);
            gradient.addColorStop(0, `rgba(220, 220, 220, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(200, 200, 200, ${alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(180, 180, 180, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Gotas de lluvia
    class RainDrop {
        constructor() {
            this.reset();
            this.len = Math.random() * 15 + 5;
            this.speed = Math.random() * 5 + 2; // Velocidad de caída
        }

        reset() {
            this.x = Math.random() * CANVAS_WIDTH;
            this.y = -Math.random() * CANVAS_HEIGHT;
        }

        update(deltaTime) {
            this.y += this.speed * (deltaTime / 16.67); // Movimiento independiente del framerate
            if (this.y > CANVAS_HEIGHT) {
                this.reset();
                this.y = -this.len;
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.len);
            ctx.stroke();
        }
    }

    // --- Inicialización de objetos ---
    const mountains = [
        new SceneryObject(100, CANVAS_HEIGHT + 100, 120, 1),
        new SceneryObject(400, CANVAS_HEIGHT + 80, 150, 1),
        new SceneryObject(700, CANVAS_HEIGHT + 120, 100, 1),
    ];

    const hills = [
        new SceneryObject(200, CANVAS_HEIGHT + 20, 80, 2),
        new SceneryObject(500, CANVAS_HEIGHT + 30, 100, 2),
        new SceneryObject(800, CANVAS_HEIGHT + 15, 90, 2),
    ];

    const clouds = [new Cloud(), new Cloud(), new Cloud()];
    const trees = [new Tree(), new Tree(), new Tree()];
    const raindrops = Array.from({ length: 200 }, () => new RainDrop());
    const stars = Array.from({ length: 100 }, () => ({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT * 0.8,
        radius: Math.random() * 1.2,
        alpha: Math.random(),
        twinkleSpeed: Math.random() * 0.05
    }));

    const smokeParticles = [];
    let smokeEmitterCounter = 0;

    const truck = {
        x: CANVAS_WIDTH * 0.25,
        y: CANVAS_HEIGHT - 15 - 50, // Ruedas + Carrocería
        baseY: CANVAS_HEIGHT - 15 - 50,
        bounceAngle: 0
    };

    const ufo = {
        x: -100,
        y: 60,
        width: 60,
        height: 18,
        lightsAngle: 0,
        visible: false
    };

    const rock = {
        x: CANVAS_WIDTH + 200,
        y: CANVAS_HEIGHT - 10,
        speed: (CANVAS_WIDTH + 200 - 280) / (CYCLE_DURATION * 0.74), // Speed to reach abduction spot
        isAbducted: false,
        abductionProgress: 0,
        visible: true
    };

    const lightning = {
        active: false,
        alpha: 0,
        strikeCooldown: Math.random() * 5000 + 3000, // Cooldown inicial
    };

    // --- Funciones de ayuda ---
    const lerp = (a, b, t) => a + (b - a) * t;

    // --- Funciones de Actualización (Update) ---

    function update(deltaTime) {
        // --- Control de velocidad del camión ---
        const ACCELERATION = 0.03;
        const DECELERATION = 0.05;
        const MAX_SPEED = 2.5;
        const MIN_SPEED = 0.2;
        const NATURAL_DECELERATION = 0.01;

        if (keys.ArrowRight) {
            truckSpeedMultiplier = Math.min(MAX_SPEED, truckSpeedMultiplier + ACCELERATION);
        } else if (keys.ArrowLeft) {
            truckSpeedMultiplier = Math.max(MIN_SPEED, truckSpeedMultiplier - DECELERATION);
        } else {
            // Regresar gradualmente a la velocidad normal
            if (truckSpeedMultiplier > 1.0) {
                truckSpeedMultiplier = Math.max(1.0, truckSpeedMultiplier - NATURAL_DECELERATION);
            } else if (truckSpeedMultiplier < 1.0) {
                truckSpeedMultiplier = Math.min(1.0, truckSpeedMultiplier + NATURAL_DECELERATION);
            }
        }

        // Progreso del ciclo día-noche
        cycleProgress = (lastTime % CYCLE_DURATION) / CYCLE_DURATION;
        isNight = cycleProgress > 0.55 && cycleProgress < 0.95;

        // Actualizar escenario
        mountains.forEach(m => m.update(deltaTime));
        hills.forEach(h => h.update(deltaTime));
        clouds.forEach(c => c.update(deltaTime));
        trees.forEach(t => t.update(deltaTime));

        // Actualizar estrellas (parpadeo)
        // y lluvia
        if (isNight) {
            raindrops.forEach(r => r.update(deltaTime));
            stars.forEach(star => {
                star.alpha += star.twinkleSpeed;
                if (star.alpha > 1) {
                    star.alpha = 1;
                    star.twinkleSpeed *= -1;
                } else if (star.alpha < 0) {
                    star.alpha = 0;
                    star.twinkleSpeed *= -1;
                }
            });

            // --- Actualizar Relámpagos ---
            lightning.strikeCooldown -= deltaTime;
            if (lightning.strikeCooldown <= 0 && !lightning.active) {
                // Una pequeña probabilidad de que caiga un rayo cada vez que el cooldown termina
                if (Math.random() < 0.3) { // 30% de probabilidad de rayo
                    lightning.active = true;
                    lightning.alpha = 0.9; // Flash brillante
                }
                // Reiniciar el cooldown para el próximo intento
                lightning.strikeCooldown = Math.random() * 8000 + 4000; // Próxima oportunidad en 4-12 segundos
            }

            if (lightning.active) {
                lightning.alpha -= deltaTime / 120; // Desvanecimiento rápido
                if (lightning.alpha <= 0) {
                    lightning.active = false;
                    lightning.alpha = 0;
                }
            }
        } else {
            lightning.active = false;
            lightning.alpha = 0;
        }

        // Actualizar camión (rebote)
        truck.bounceAngle += deltaTime * 0.01 * truckSpeedMultiplier;
        truck.y = truck.baseY - Math.sin(truck.bounceAngle) * 2;

        // Emitir humo
        smokeEmitterCounter += deltaTime;
        const smokeInterval = Math.max(80, 300 / truckSpeedMultiplier); // Más humo al acelerar
        if (smokeEmitterCounter > smokeInterval) {
            smokeEmitterCounter = 0;
            // El humo sale de la punta del tubo de escape
            const pipeX = truck.x + 45; // Movido más atrás, cerca del centro
            const pipeY = truck.y + 50; // Movido abajo, al nivel del chasis/depósito
            smokeParticles.push(new SmokeParticle(pipeX - 10, pipeY));
        }
        smokeParticles.forEach((p, i) => {
            p.update(deltaTime);
            if (p.life <= 0) smokeParticles.splice(i, 1);
        });

        // Actualizar UFO y abducción de la roca
        ufo.visible = cycleProgress > 0.55 && cycleProgress < 0.95;
        if (ufo.visible) {
            const ufoCycle = (cycleProgress - 0.55) / (0.95 - 0.55);
            ufo.x = lerp(-100, CANVAS_WIDTH + 50, ufoCycle);
            ufo.y = lerp(60, 100, ufoCycle);
            ufo.lightsAngle += deltaTime * 0.01;
        }

        // Lógica de la roca
        if (rock.visible) {
            if (!rock.isAbducted) {
                rock.x -= rock.speed * deltaTime;
                // Comprobar si empieza la abducción
                if (cycleProgress >= 0.74 && cycleProgress < 0.78) {
                    rock.isAbducted = true;
                }
            } else {
                // La abducción dura del 74% al 78% del ciclo
                const abductionDuration = CYCLE_DURATION * (0.78 - 0.74);
                rock.abductionProgress += deltaTime / abductionDuration;
                rock.abductionProgress = Math.min(1, rock.abductionProgress);

                rock.y = lerp(CANVAS_HEIGHT - 10, ufo.y, rock.abductionProgress);
                rock.x = lerp(280, ufo.x + ufo.width / 2, rock.abductionProgress);

                if (rock.abductionProgress >= 1) {
                    rock.visible = false;
                }
            }
        }

        // Reiniciar roca para el siguiente ciclo
        if (cycleProgress > 0.9 && !rock.visible && rock.abductionProgress >= 1) {
            rock.x = CANVAS_WIDTH + 200;
            rock.y = CANVAS_HEIGHT - 10;
            rock.isAbducted = false;
            rock.abductionProgress = 0;
            rock.visible = true;
        }
    }

    // --- Funciones de Dibujo (Draw) ---

    function drawSky() {
        let skyColor = DAY_SKY;
        if (cycleProgress > 0.45 && cycleProgress < 0.55) {
            const t = (cycleProgress - 0.45) / 0.10;
            // No tengo lerpColor, así que haré una transición simple con opacidad
            ctx.fillStyle = DAY_SKY;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = SUNSET_SKY;
            ctx.globalAlpha = t;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.globalAlpha = 1;
            return;
        } else if (cycleProgress >= 0.55 && cycleProgress < 0.95) {
            skyColor = NIGHT_SKY;
        } else if (cycleProgress >= 0.95) {
            const t = (cycleProgress - 0.95) / 0.05;
            ctx.fillStyle = NIGHT_SKY;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = DAY_SKY;
            ctx.globalAlpha = t;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.globalAlpha = 1;
            return;
        }
        ctx.fillStyle = skyColor;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    function drawSunMoon() {
        ctx.save();
        // Sol (0% -> 50%)
        if (cycleProgress < 0.5) {
            const sunProgress = cycleProgress / 0.5;
            const x = lerp(-40, CANVAS_WIDTH + 40, sunProgress);
            ctx.fillStyle = SUN_COLOR;
            ctx.shadowColor = SUN_COLOR;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(x, 40, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        // Luna (55% -> 100%)
        else if (cycleProgress > 0.55) {
            const moonProgress = (cycleProgress - 0.55) / 0.45;
            const x = lerp(CANVAS_WIDTH + 40, -40, moonProgress);
            // Luna llena
            ctx.fillStyle = MOON_COLOR;
            ctx.beginPath();
            ctx.arc(x, 40, 20, 0, Math.PI * 2);
            ctx.fill();
            // Sombra para efecto creciente
            ctx.fillStyle = MOON_CRATER_COLOR;
            ctx.beginPath();
            ctx.arc(x - 8, 40 - 8, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawStars() {
        if (cycleProgress > 0.55 && cycleProgress < 0.95) {
            const nightProgress = (cycleProgress - 0.55) / (0.95 - 0.55);
            const maxAlpha = Math.sin(nightProgress * Math.PI); // Fade in y fade out

            ctx.fillStyle = '#FFFFFF';
            stars.forEach(star => {
                ctx.globalAlpha = star.alpha * maxAlpha;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        }
    }

    function drawRain() {
        if (isNight) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            raindrops.forEach(r => r.draw(ctx));
            ctx.restore();
        }
    }

    function drawTruck() {
        // Humo (se dibuja primero para que quede detrás del camión)
        smokeParticles.forEach(p => p.draw(ctx));

        // Ruedas
        if (wheelsImg) {
            ctx.drawImage(wheelsImg, truck.x, CANVAS_HEIGHT - 15);
        }
        // Carrocería del camión
        if (truckImg) {
            ctx.drawImage(truckImg, truck.x, truck.y);
        }

        // Tubo de escape (dibujado encima del camión)
        const pipeX = truck.x + 45; // Movido más atrás, cerca del centro
        const pipeY = truck.y + 50; // Movido abajo, al nivel del chasis/depósito
        ctx.fillStyle = '#3d3d3d'; // Metal oscuro
        ctx.fillRect(pipeX - 8, pipeY - 2, 8, 4); // El tubo horizontal
        ctx.fillStyle = '#222222'; // La apertura oscura
        ctx.fillRect(pipeX - 10, pipeY - 3, 2, 6); // La punta del tubo

        // Faro (delante del camión)
        if (isNight) {
            const flicker = Math.random() > 0.1 ? 0.5 : 0.4;
            const gradient = ctx.createLinearGradient(truck.x + 85, 0, truck.x + 85 + 70, 0);
            gradient.addColorStop(0, `rgba(255, 255, 224, ${flicker})`);
            gradient.addColorStop(1, 'rgba(255, 255, 224, 0)');

            ctx.save();
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(truck.x + 85, truck.y + 32);
            ctx.lineTo(truck.x + 85 + 70, truck.y + 32 + 10);
            ctx.lineTo(truck.x + 85 + 70, truck.y + 47 + 10);
            ctx.lineTo(truck.x + 85, truck.y + 47);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    function drawUFO() {
        if (!ufo.visible) return;

        ctx.save();
        // Rayo tractor
        if (cycleProgress > 0.75 && cycleProgress < 0.78) {
            const beamProgress = (cycleProgress - 0.75) / 0.03;
            const beamAlpha = Math.sin(beamProgress * Math.PI); // Fade in y out rápido

            ctx.fillStyle = `rgba(173, 216, 230, ${beamAlpha * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(ufo.x + ufo.width * 0.25, ufo.y + ufo.height);
            ctx.lineTo(ufo.x + ufo.width * 0.75, ufo.y + ufo.height);
            ctx.lineTo(rock.x + 10, rock.y);
            ctx.lineTo(rock.x - 10, rock.y);
            ctx.closePath();
            ctx.fill();
        }

        // Cuerpo del UFO
        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        ctx.ellipse(ufo.x + ufo.width / 2, ufo.y + ufo.height / 2, ufo.width / 2, ufo.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cabina
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.ellipse(ufo.x + ufo.width / 2, ufo.y, 10, 6, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // Luces
        const lightColors = ['#f1c40f', '#2ecc71', '#e74c3c', '#3498db'];
        const lightBrightness = 0.6 + Math.sin(ufo.lightsAngle) * 0.4;
        ctx.globalAlpha = lightBrightness;
        lightColors.forEach((color, i) => {
            ctx.fillStyle = color;
            ctx.fillRect(ufo.x + 5 + i * 15, ufo.y + ufo.height - 3, 5, 3);
        });
        ctx.globalAlpha = 1.0;

        ctx.restore();
    }

    function drawRock() {
        if (!rock.visible) return;

        const scale = 1 - rock.abductionProgress;
        ctx.save();
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        // Dibuja la roca como 3 círculos, similar al box-shadow del CSS
        ctx.arc(rock.x, rock.y, 5 * scale, 0, Math.PI * 2);
        ctx.arc(rock.x + 10 * scale, rock.y, 10 * scale, 0, Math.PI * 2);
        ctx.arc(rock.x - 10 * scale, rock.y, 5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawLightning() {
        if (lightning.active) {
            ctx.save();
            // Un flash blanco que cubre toda la pantalla
            ctx.globalAlpha = lightning.alpha;
            ctx.fillStyle = '#f8f9fa'; // Un blanco ligeramente azulado para el flash
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.restore();
        }
    }

    // --- Bucle Principal de Animación ---

    function animate(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        // 1. Actualizar estado de todos los objetos
        update(deltaTime);

        // 2. Limpiar y dibujar todo en el canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // El orden de dibujado es importante (de atrás hacia adelante)
        drawSky();
        drawSunMoon();
        drawStars();
        drawRain();
        mountains.forEach(m => m.draw(ctx));
        hills.forEach(h => h.draw(ctx));
        clouds.forEach(c => c.draw(ctx));
        drawUFO(); // El UFO está detrás de los árboles
        trees.forEach(t => t.draw(ctx));
        if (rock.visible) drawRock();
        drawTruck();

        // El relámpago se dibuja al final para que ilumine toda la escena
        drawLightning();

        // Solicitar el siguiente frame
        requestAnimationFrame(animate);
    }

    // --- Control por Teclado ---
    window.addEventListener('keydown', (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
        }
    });
    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = false;
        }
    });

    // --- Iniciar la animación ---
    async function start() {
        try {
            [truckImg, wheelsImg, treeImg] = await Promise.all([
                loadImage('truck.svg'),
                loadImage('wheels.svg'),
                loadImage('tree.svg')
            ]);
            // Una vez cargadas las imágenes, comienza la animación
            requestAnimationFrame(animate);
        } catch (error) {
            console.error("Error al cargar las imágenes:", error);
            ctx.fillStyle = 'red';
            ctx.font = '16px sans-serif';
            ctx.fillText('Error al cargar imágenes. Revisa la consola.', 10, 50);
        }
    }

    start();
});