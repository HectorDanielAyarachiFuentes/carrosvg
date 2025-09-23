import * as Config from '../js/config.js';
import SmokeParticle from './SmokeParticle.js';
import SkidMark from './SkidMark.js';
import DustParticle from './DustParticle.js';
import SplashParticle from './SplashParticle.js';

export default class Truck {
    constructor() {
        this.x = Config.CANVAS_WIDTH * 0.25;
        this.baseY = Config.CANVAS_HEIGHT - 15 - 50;
        this.y = this.baseY;
        this.bounceAngle = 0;
        this.pipeOffsetX = 45;
        this.pipeOffsetY = 50;
        
        this.speedMultiplier = 1.0;
        
        this.smokeParticles = [];
        this.dustParticles = [];
        this.splashParticles = [];
        this.smokeEmitterCounter = 0;
        this.skidEmitterCounter = 0;
        this.dustEmitterCounter = 0;
        this.splashEmitterCounter = 0;

        // --- NUEVO: Propiedades para la antena ---
        this.antenna = {
            angle: 0,
            velocity: 0,   // Velocidad angular en rad/s
            spring: 25,    // Constante del resorte (qué tan rápido reacciona)
            damping: 8,    // Coeficiente de amortiguación (cómo de rápido para de oscilar)
            baseX: 65,     // Posición X en el camión
            baseY: 15,     // Posición Y en el camión
            length: 35     // Longitud de la antena (más corta y discreta)
        };
    }

    updateSpeed(keys) {
        if (keys.ArrowRight) {
            this.speedMultiplier = Math.min(Config.TRUCK_MAX_SPEED, this.speedMultiplier + Config.TRUCK_ACCELERATION);
        } else if (keys.ArrowLeft) {
            this.speedMultiplier = Math.max(Config.TRUCK_MIN_SPEED, this.speedMultiplier - Config.TRUCK_DECELERATION);
        } else {
            if (this.speedMultiplier > 1.0) {
                this.speedMultiplier = Math.max(1.0, this.speedMultiplier - Config.TRUCK_NATURAL_DECELERATION);
            } else if (this.speedMultiplier < 1.0) {
                this.speedMultiplier = Math.min(1.0, this.speedMultiplier + Config.TRUCK_NATURAL_DECELERATION);
            }
        }
    }

    update(deltaTime, isNight, windStrength, keys, addSkidMark) {
        // Rebote
        this.bounceAngle += deltaTime * 0.01 * this.speedMultiplier;
        this.y = this.baseY - Math.sin(this.bounceAngle) * 2;

        // --- NUEVO: Actualizar física de la antena ---
        this.updateAntenna(deltaTime, windStrength);

        // Emisores de partículas
        this.updateEmitters(deltaTime, isNight, keys, addSkidMark);

        // Actualizar partículas
        this.smokeParticles.forEach((p, i) => {
            p.update(deltaTime, windStrength);
            if (p.life <= 0) this.smokeParticles.splice(i, 1);
        });
        this.dustParticles.forEach((p, i) => {
            p.update(deltaTime);
            if (p.life <= 0) this.dustParticles.splice(i, 1);
        });
        this.splashParticles.forEach((p, i) => {
            p.update(deltaTime);
            if (p.life <= 0) this.splashParticles.splice(i, 1);
        });
    }

    /**
     * Actualiza la física de la antena basándose en la velocidad y el viento.
     * @param {number} deltaTime El tiempo transcurrido desde el último frame.
     * @param {number} windStrength La fuerza actual del viento.
     */
    updateAntenna(deltaTime, windStrength) {
        // Se ha rediseñado la física de la antena para un movimiento mucho más natural y fluido.
        // Ahora utiliza un sistema de resorte-amortiguador estándar, que es independiente de la tasa de frames.
        const dt = deltaTime / 1000; // Delta time en segundos
        let targetAngle = 0;

        // 1. Calcular el ángulo objetivo basado en las fuerzas externas (viento y aceleración/resistencia)
        // La fuerza del viento la empuja hacia atrás.
        targetAngle -= (windStrength / 250);
        // La resistencia del aire (al acelerar) y la inercia (al frenar) la mueven.
        targetAngle -= (this.speedMultiplier - 1.0) * 0.2;

        // 2. Calcular las fuerzas del sistema resorte-amortiguador
        // Fuerza del resorte (Hooke's Law): F = -k * x
        const springForce = this.antenna.spring * (targetAngle - this.antenna.angle);
        // Fuerza de amortiguación: F = -c * v
        const dampingForce = -this.antenna.damping * this.antenna.velocity;

        // 3. Calcular la aceleración (asumiendo masa = 1)
        const acceleration = springForce + dampingForce;

        // 4. Actualizar la velocidad y el ángulo usando integración de Euler
        this.antenna.velocity += acceleration * dt;
        this.antenna.angle += this.antenna.velocity * dt;

        // 5. Limitar el ángulo para que no se salga de control
        this.antenna.angle = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.antenna.angle));
    }

    updateEmitters(deltaTime, isNight, keys, addSkidMark) {
        // Humo
        this.smokeEmitterCounter += deltaTime;
        const smokeInterval = Math.max(80, 300 / this.speedMultiplier);
        if (this.smokeEmitterCounter > smokeInterval) {
            this.smokeEmitterCounter = 0;
            const pipeX = this.x + this.pipeOffsetX;
            const pipeY = this.y + this.pipeOffsetY;
            this.smokeParticles.push(new SmokeParticle(pipeX - 10, pipeY, isNight, this.speedMultiplier));
        }

        // --- NUEVO: Marcas de neumáticos y humo al frenar bruscamente ---
        const isBrakingHard = keys.ArrowLeft && this.speedMultiplier > 1.2;
        if (isBrakingHard && !isNight) {
            this.skidEmitterCounter += deltaTime;
            if (this.skidEmitterCounter > 50) { // Intervalo para no crear demasiadas marcas
                this.skidEmitterCounter = 0;
                const wheelX = this.x + 15;
                const wheelY = Config.CANVAS_HEIGHT - 3;
                // Añadir marca de neumático a la lista global
                addSkidMark(new SkidMark(wheelX, wheelY, this.speedMultiplier));
                // Añadir humo de las ruedas
                this.smokeParticles.push(new SmokeParticle(wheelX, wheelY - 5, isNight, 0.5, 'rgba(80,80,80,0.6)'));
            }
        }

        if (isNight) {
            // --- Salpicaduras de agua (solo de noche/lluvia) ---
            this.splashEmitterCounter += deltaTime;
            const splashInterval = Math.max(25, 160 / this.speedMultiplier);
            if (this.splashEmitterCounter > splashInterval) {
                this.splashEmitterCounter = 0;
                const wheelX = this.x + 15;
                const wheelY = Config.CANVAS_HEIGHT - 3;
                for (let i = 0; i < 2; i++) { // Un poco menos de partículas de agua
                    this.splashParticles.push(new SplashParticle(wheelX, wheelY, this.speedMultiplier));
                }
            }
            // Limpiar el polvo si empieza a llover
            if (this.dustParticles.length > 0) this.dustParticles = [];

        } else {
            // --- Polvo (solo de día) ---
            this.dustEmitterCounter += deltaTime;
            const dustInterval = Math.max(30, 180 / this.speedMultiplier);
            if (this.dustEmitterCounter > dustInterval) {
                this.dustEmitterCounter = 0;
                const wheelX = this.x + 15;
                const wheelY = Config.CANVAS_HEIGHT - 3;
                for (let i = 0; i < 2; i++) {
                    this.dustParticles.push(new DustParticle(wheelX, wheelY, this.speedMultiplier));
                }
            }
            // Limpiar salpicaduras si deja de llover
            if (this.splashParticles.length > 0) this.splashParticles = [];
        }
    }

    draw(ctx, truckImg, wheelsImg, isNight, fogIntensity) {
        // Las partículas se dibujan primero
        this.smokeParticles.forEach(p => p.draw(ctx));
        this.dustParticles.forEach(p => p.draw(ctx));
        this.splashParticles.forEach(p => p.draw(ctx));

        if (wheelsImg) {
            ctx.drawImage(wheelsImg, this.x, Config.CANVAS_HEIGHT - 15);
        }
        if (truckImg) {
            ctx.drawImage(truckImg, this.x, this.y);
        }

        // --- NUEVO: Dibujar la antena ---
        this.drawAntenna(ctx);

        // Tubo de escape
        const pipeX = this.x + this.pipeOffsetX;
        const pipeY = this.y + this.pipeOffsetY;
        ctx.fillStyle = '#3d3d3d';
        ctx.fillRect(pipeX - 8, pipeY - 2, 8, 4);
        ctx.fillStyle = '#222222';
        ctx.fillRect(pipeX - 10, pipeY - 3, 2, 6);

        // --- LUCES ---
        // Faro principal (solo de noche)
        if (isNight) {
             this.drawHeadlight(ctx);
        }
        // Luces antiniebla (cuando hay niebla)
        if (fogIntensity > 0) {
            this.drawFogLights(ctx, fogIntensity);
        }
    }

    /**
     * Dibuja la antena del camión.
     * @param {CanvasRenderingContext2D} ctx El contexto del canvas.
     */
    drawAntenna(ctx) {
        const baseX = this.x + this.antenna.baseX;
        const baseY = this.y + this.antenna.baseY;

        ctx.save();
        ctx.translate(baseX, baseY);
        ctx.rotate(this.antenna.angle);

        // Dibuja el mástil de la antena
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5; // Más delgada
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -this.antenna.length);
        ctx.stroke();

        // Dibuja la bola roja en la punta
        ctx.fillStyle = '#a93226'; // Un rojo un poco más oscuro
        ctx.beginPath();
        ctx.arc(0, -this.antenna.length, 2, 0, Math.PI * 2); // Punta más pequeña
        ctx.fill();

        ctx.restore();
    }

    drawHeadlight(ctx) {
        const headLightX = this.x + 85;
        const headLightYTop = this.y + 32;
        const headLightYBottom = this.y + 47;
        const flicker = Math.random() > 0.1 ? 0.6 : 0.5;

        // Estela de luz
        const trailLength = 150 * (0.5 + this.speedMultiplier / 2);
        const trailGradient = ctx.createLinearGradient(headLightX, 0, headLightX + trailLength, 0);
        trailGradient.addColorStop(0, `rgba(255, 255, 224, ${flicker * 0.25})`);
        trailGradient.addColorStop(1, 'rgba(255, 255, 224, 0)');
        
        ctx.fillStyle = trailGradient;
        ctx.beginPath();
        ctx.moveTo(headLightX, headLightYTop);
        ctx.lineTo(headLightX + trailLength, headLightYTop);
        ctx.lineTo(headLightX + trailLength, headLightYBottom + 40);
        ctx.lineTo(headLightX, headLightYBottom);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Dibuja las luces antiniebla del camión.
     * @param {CanvasRenderingContext2D} ctx El contexto del canvas.
     * @param {number} intensity La intensidad de la niebla (0 a 1), que afecta el brillo.
     */
    drawFogLights(ctx, intensity) {
        const flicker = Math.random() > 0.1 ? 1.0 : 0.9;
        const alpha = intensity * 0.7 * flicker; // Máxima opacidad de 0.7

        const lightY = this.y + 58;
        const light1X = this.x + 70;
        const light2X = this.x + 82;

        // Dibuja el cono de luz para cada faro
        this.drawFogLightCone(ctx, light1X, lightY, alpha);
        this.drawFogLightCone(ctx, light2X, lightY, alpha);

        // Dibuja la bombilla/faro en sí
        ctx.fillStyle = `rgba(255, 220, 150, ${intensity * 0.9})`;
        ctx.shadowColor = 'rgba(255, 200, 100, 1)';
        ctx.shadowBlur = 8;
        ctx.fillRect(light1X - 2, lightY - 2, 4, 4);
        ctx.fillRect(light2X - 2, lightY - 2, 4, 4);
        ctx.shadowBlur = 0;
    }

    drawFogLightCone(ctx, lightX, lightY, alpha) {
        const coneLength = 90;
        const coneSpread = 50; // Qué tan ancho se vuelve el cono al final

        const gradient = ctx.createLinearGradient(lightX, lightY, lightX + coneLength, lightY);
        gradient.addColorStop(0, `rgba(255, 220, 150, ${alpha})`);
        gradient.addColorStop(1, 'rgba(255, 220, 150, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(lightX, lightY - 3); // Empieza ligeramente por encima del centro de la luz
        ctx.lineTo(lightX + coneLength, lightY - coneSpread / 2 + 20); // Apunta ligeramente hacia abajo
        ctx.lineTo(lightX + coneLength, lightY + coneSpread / 2 + 20);
        ctx.lineTo(lightX, lightY + 3); // Termina ligeramente por debajo del centro
        ctx.closePath();
        ctx.fill();
    }
}