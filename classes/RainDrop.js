import * as Config from '../js/config.js';

// Una pequeña clase para gestionar las partículas de la salpicadura
class RainParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 1.5 + 1;
        this.speedX = (Math.random() - 0.5) * 3;
        this.speedY = -Math.random() * 4 - 1; // Impulso hacia arriba
        this.gravity = 0.2;
        this.life = 1; // Representado como alpha/opacidad
    }

    update(deltaTime) {
        const dtFactor = deltaTime / 16.67;
        this.x += this.speedX * dtFactor;
        this.speedY += this.gravity * dtFactor;
        this.y += this.speedY * dtFactor;
        this.life -= 0.03 * dtFactor;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(200, 220, 255, ${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

export default class RainDrop {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * (Config.CANVAS_WIDTH + 200) - 100; // Permitir que la lluvia venga de fuera de la pantalla
        this.y = -Math.random() * Config.CANVAS_HEIGHT * 0.5;
        
        // La Z simulada afecta la velocidad, el tamaño y el color
        const z = Math.random();
        this.len = z * 15 + 10;
        this.speed = z * 8 + 4;
        this.lineWidth = z * 1.2 + 0.5;
        this.opacity = z * 0.3 + 0.2;

        this.wind = 2; // Inclinación por el viento

        this.isSplashed = false;
        this.splashParticles = [];
    }

    update(deltaTime) {
        if (!this.isSplashed) {
            const dtFactor = deltaTime / 16.67;
            this.y += this.speed * dtFactor;
            this.x += this.wind * dtFactor;

            if (this.y > Config.CANVAS_HEIGHT) {
                this.isSplashed = true;
                this.createSplash();
            }
        } else {
            // Actualizar partículas de la salpicadura
            // OPTIMIZACIÓN: Iterar hacia atrás para eliminar elementos de forma segura y eficiente.
            for (let i = this.splashParticles.length - 1; i >= 0; i--) {
                const p = this.splashParticles[i];
                p.update(deltaTime);
                if (p.life <= 0) this.splashParticles.splice(i, 1);
            }

            // Una vez que todas las partículas han desaparecido, resetear la gota
            if (this.splashParticles.length === 0) {
                this.reset();
            }
        }
    }

    createSplash() {
        const groundY = Config.CANVAS_HEIGHT;
        const numParticles = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numParticles; i++) {
            this.splashParticles.push(new RainParticle(this.x, groundY));
        }
    }

    draw(ctx) {
        ctx.save();
        if (!this.isSplashed) {
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.wind, this.y + this.len);
            gradient.addColorStop(0, `rgba(180, 200, 230, 0)`);
            gradient.addColorStop(0.5, `rgba(200, 220, 255, ${this.opacity})`);
            gradient.addColorStop(1, `rgba(220, 240, 255, 0)`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = this.lineWidth;
            ctx.lineCap = 'round';
            
            // Desenfoque para un look más suave
            ctx.shadowColor = 'rgba(150, 180, 255, 0.8)';
            ctx.shadowBlur = 5;

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.wind, this.y + this.len);
            ctx.stroke();
        } else {
            // Dibujar las partículas de la salpicadura
            this.splashParticles.forEach(p => p.draw(ctx));
        }
        ctx.restore();
    }
}
