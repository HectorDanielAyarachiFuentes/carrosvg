export default class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1; // Speed from 1 to 3

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.05;

        this.life = Math.random() * 60 + 40; // Life in frames (40 to 100)
        this.initialLife = this.life;

        this.size = Math.random() * 2.5 + 1; // Size from 1 to 3.5
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;
    }

    draw(ctx) {
        ctx.save();
        
        // Fade out effect
        const opacity = Math.max(0, this.life / this.initialLife);
        ctx.globalAlpha = opacity;

        // Star color and glow
        ctx.fillStyle = '#fffbe6'; // Creamy white
        ctx.shadowColor = '#f9d71c'; // Golden yellow glow
        ctx.shadowBlur = 8;

        // Draw a simple 5-pointed star shape
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? this.size : this.size / 2;
            const angle = (i / 10) * Math.PI * 2;
            ctx.lineTo(this.x + Math.cos(angle) * radius, this.y + Math.sin(angle) * radius);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}