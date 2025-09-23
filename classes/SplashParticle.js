export default class SplashParticle {
    constructor(x, y, truckSpeedMultiplier) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2.5 + 1;
        this.vx = -(Math.random() * 60 + 50) * truckSpeedMultiplier;
        this.vy = -(Math.random() * 100 + 50);
        this.gravity = 300;
        this.initialLife = Math.random() * 0.6 + 0.3;
        this.life = this.initialLife;
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const alpha = (this.life / this.initialLife) * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}