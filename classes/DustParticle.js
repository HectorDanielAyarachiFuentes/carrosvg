export default class DustParticle {
    constructor(x, y, truckSpeedMultiplier) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1.5;
        // El polvo se mueve hacia atrás y un poco hacia los lados
        this.vx = -(Math.random() * 40 + 40) * truckSpeedMultiplier + (Math.random() - 0.5) * 20;
        // El polvo es levantado hacia arriba
        this.vy = -(Math.random() * 60 + 20);
        this.gravity = 150; // El polvo es más ligero que el agua, cae más lento
        this.initialLife = Math.random() * 0.8 + 0.5; // Dura un poco más en el aire
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
        // El polvo se desvanece a medida que muere
        const alpha = (this.life / this.initialLife) * 0.5;
        // Color terroso/arena
        ctx.fillStyle = `rgba(194, 178, 128, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}