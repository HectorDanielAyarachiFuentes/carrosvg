export default class SmokeParticle {
    constructor(x, y, isNight, truckSpeedMultiplier) {
        this.x = x;
        this.y = y;
        this.isNight = isNight;
        this.size = Math.random() * 4 + 2;
        this.maxSize = Math.random() * 8 + 12;
        this.vx = -(Math.random() * 40 + 30) * (truckSpeedMultiplier * 0.5 + 0.5);
        this.vy = -(Math.random() * 30 + 20);
        this.initialLife = Math.random() * 1.5 + 1.0;
        this.life = this.initialLife;
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx -= 20 * dt; // Viento
    }

    draw(ctx) {
        if (this.life <= 0) return;

        const lifeProgress = Math.max(0, this.life / this.initialLife);
        const currentSize = this.size + (1 - lifeProgress) * (this.maxSize - this.size);
        const alpha = lifeProgress * (this.isNight ? 0.5 : 0.4);

        ctx.save();
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentSize);
        if (this.isNight) {
            gradient.addColorStop(0, `rgba(100, 100, 100, ${alpha})`);
            gradient.addColorStop(1, `rgba(60, 60, 60, 0)`);
        } else {
            gradient.addColorStop(0, `rgba(220, 220, 220, ${alpha})`);
            gradient.addColorStop(1, `rgba(180, 180, 180, 0)`);
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}