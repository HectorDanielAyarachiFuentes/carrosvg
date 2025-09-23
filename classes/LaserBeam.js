export default class LaserBeam {
    constructor(x, startY, endY) {
        this.x = x;
        this.startY = startY;
        this.endY = endY;
        this.initialLife = 0.25; // Duración en segundos
        this.life = this.initialLife;
    }

    update(deltaTime) {
        this.life -= deltaTime / 1000;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        const alpha = (this.life / this.initialLife);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.x, this.startY);
        ctx.lineTo(this.x, this.endY);
        ctx.strokeStyle = `rgba(255, 50, 50, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.restore();
    }
}