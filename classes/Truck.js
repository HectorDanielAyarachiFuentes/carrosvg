import * as Config from '../js/config.js';
import SmokeParticle from './SmokeParticle.js';
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
        this.splashParticles = [];
        this.smokeEmitterCounter = 0;
        this.splashEmitterCounter = 0;
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

    update(deltaTime, isNight, windStrength) {
        // Rebote
        this.bounceAngle += deltaTime * 0.01 * this.speedMultiplier;
        this.y = this.baseY - Math.sin(this.bounceAngle) * 2;

        // Emisores de partículas
        this.updateEmitters(deltaTime, isNight);

        // Actualizar partículas
        this.smokeParticles.forEach((p, i) => {
            p.update(deltaTime, windStrength);
            if (p.life <= 0) this.smokeParticles.splice(i, 1);
        });
        this.splashParticles.forEach((p, i) => {
            p.update(deltaTime);
            if (p.life <= 0) this.splashParticles.splice(i, 1);
        });
    }

    updateEmitters(deltaTime, isNight) {
        // Humo
        this.smokeEmitterCounter += deltaTime;
        const smokeInterval = Math.max(80, 300 / this.speedMultiplier);
        if (this.smokeEmitterCounter > smokeInterval) {
            this.smokeEmitterCounter = 0;
            const pipeX = this.x + this.pipeOffsetX;
            const pipeY = this.y + this.pipeOffsetY;
            this.smokeParticles.push(new SmokeParticle(pipeX - 10, pipeY, isNight, this.speedMultiplier));
        }

        // Salpicaduras (solo de noche/lluvia)
        if (isNight) {
            this.splashEmitterCounter += deltaTime;
            const splashInterval = Math.max(25, 160 / this.speedMultiplier);
            if (this.splashEmitterCounter > splashInterval) {
                this.splashEmitterCounter = 0;
                const wheelX = this.x + 15;
                const wheelY = Config.CANVAS_HEIGHT - 3;
                for (let i = 0; i < 3; i++) {
                    this.splashParticles.push(new SplashParticle(wheelX, wheelY, this.speedMultiplier));
                }
            }
        } else {
            this.splashParticles = []; // Limpiar salpicaduras si deja de llover
        }
    }

    draw(ctx, truckImg, wheelsImg) {
        // Las partículas se dibujan primero
        this.smokeParticles.forEach(p => p.draw(ctx));
        this.splashParticles.forEach(p => p.draw(ctx));

        if (wheelsImg) {
            ctx.drawImage(wheelsImg, this.x, Config.CANVAS_HEIGHT - 15);
        }
        if (truckImg) {
            ctx.drawImage(truckImg, this.x, this.y);
        }

        // Tubo de escape
        const pipeX = this.x + this.pipeOffsetX;
        const pipeY = this.y + this.pipeOffsetY;
        ctx.fillStyle = '#3d3d3d';
        ctx.fillRect(pipeX - 8, pipeY - 2, 8, 4);
        ctx.fillStyle = '#222222';
        ctx.fillRect(pipeX - 10, pipeY - 3, 2, 6);

        // Faro (solo de noche)
        if (this.y < this.baseY + 50) { // Un truco para saber si es de noche
             this.drawHeadlight(ctx);
        }
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
}