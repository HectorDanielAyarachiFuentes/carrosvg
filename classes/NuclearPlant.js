import * as Config from '../js/config.js';

// Partícula de vapor para las torres
class SteamParticle {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 20;
        this.y = y;
        this.size = Math.random() * 10 + 5;
        this.maxSize = 35;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = -(Math.random() * 10 + 10);
        this.initialLife = Math.random() * 4 + 3; // 3-7 segundos de vida
        this.life = this.initialLife;
    }

    update(deltaTime, windStrength) {
        const dt = deltaTime / 1000;
        this.life -= dt;
        this.x += (this.vx - windStrength * 0.3) * dt; // Afectado por el viento
        this.y += this.vy * dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const lifeProgress = Math.max(0, this.life / this.initialLife);
        const currentSize = this.size + (1 - lifeProgress) * (this.maxSize - this.size);
        const alpha = lifeProgress * 0.25;

        ctx.fillStyle = `rgba(220, 225, 230, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
    }
}


export default class NuclearPlant {
    constructor() {
        this.speed = 80; // Velocidad de parallax media
        this.scale = 0.8;
        this.width = 300 * this.scale;
        this.height = 250 * this.scale;
        
        this.steamParticles = [];
        this.steamEmitterCounter = 0;
        this.blinkTimer = 0;
        this.blinkOn = false;

        this.reset();
    }

    reset() {
        this.x = Config.CANVAS_WIDTH + Math.random() * Config.CANVAS_WIDTH * 5; // Aparece con menos frecuencia
        this.y = Config.CANVAS_HEIGHT - this.height;
        this.steamParticles = [];
    }

    update(deltaTime, truckSpeedMultiplier) {
        this.x -= this.speed * truckSpeedMultiplier * (deltaTime / 1000);
        if (this.x < -this.width) {
            this.reset();
        }

        // Actualizar emisor de vapor
        this.steamEmitterCounter += deltaTime;
        if (this.steamEmitterCounter > 100) {
            this.steamEmitterCounter = 0;
            const towerTopY = this.y + 50 * this.scale;
            // Torre 1
            this.steamParticles.push(new SteamParticle(this.x + 70 * this.scale, towerTopY));
            // Torre 2
            this.steamParticles.push(new SteamParticle(this.x + 230 * this.scale, towerTopY));
        }

        // Actualizar partículas de vapor
        for (let i = this.steamParticles.length - 1; i >= 0; i--) {
            const p = this.steamParticles[i];
            p.update(deltaTime, 20); // Usamos un valor de viento fijo para el vapor
            if (p.life <= 0) this.steamParticles.splice(i, 1);
        }
        
        // Actualizar luz parpadeante
        this.blinkTimer += deltaTime;
        if (this.blinkTimer > 1000) {
            this.blinkTimer = 0;
            this.blinkOn = !this.blinkOn;
        }
    }

    draw(ctx, isNight) {
        ctx.save();
        
        // Dibujar vapor detrás de las torres
        this.steamParticles.forEach(p => p.draw(ctx));

        // --- Torres de refrigeración ---
        const towerWidth = 80 * this.scale;
        const towerHeight = 200 * this.scale;
        const towerTopWidth = 50 * this.scale;
        const towerBaseY = this.y + this.height;

        // Torre 1
        this.drawCoolingTower(ctx, this.x + 30 * this.scale, towerBaseY, towerWidth, towerHeight, towerTopWidth);
        // Torre 2
        this.drawCoolingTower(ctx, this.x + 190 * this.scale, towerBaseY, towerWidth, towerHeight, towerTopWidth);

        // --- Edificio del reactor ---
        const reactorRadius = 45 * this.scale;
        const reactorX = this.x + 150 * this.scale;
        const reactorY = this.y + this.height - reactorRadius;
        
        const reactorGradient = ctx.createLinearGradient(reactorX, reactorY - reactorRadius, reactorX, reactorY + reactorRadius);
        reactorGradient.addColorStop(0, '#d5d8dc');
        reactorGradient.addColorStop(1, '#a1a6ab');
        ctx.fillStyle = reactorGradient;
        
        ctx.beginPath();
        ctx.arc(reactorX, reactorY, reactorRadius, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#566573';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Luz de advertencia nocturna
        if (isNight && this.blinkOn) {
            const lightX = reactorX;
            const lightY = reactorY - reactorRadius;
            ctx.fillStyle = '#ff3333';
            ctx.shadowColor = '#ff3333';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(lightX, lightY, 4 * this.scale, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawCoolingTower(ctx, x, baseY, width, height, topWidth) {
        const topY = baseY - height;
        const midY = baseY - height * 0.3;

        const gradient = ctx.createLinearGradient(x, topY, x + width, topY);
        gradient.addColorStop(0, '#bdc3c7');
        gradient.addColorStop(0.5, '#f0f3f4');
        gradient.addColorStop(1, '#a2a9af');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.quadraticCurveTo(x + width * 0.4, midY, x + (width - topWidth) / 2, topY);
        ctx.lineTo(x + (width + topWidth) / 2, topY);
        ctx.quadraticCurveTo(x + width * 0.6, midY, x + width, baseY);
        ctx.closePath();
        ctx.fill();
        
        // Borde superior
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.ellipse(x + width / 2, topY, topWidth / 2, 4 * this.scale, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}