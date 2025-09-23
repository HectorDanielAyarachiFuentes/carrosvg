import * as Config from '../js/config.js';

export default class RainDrop {
    constructor() {
        this.reset();
        this.len = Math.random() * 15 + 5;
        this.speed = Math.random() * 5 + 2;
    }

    reset() {
        this.x = Math.random() * Config.CANVAS_WIDTH;
        this.y = -Math.random() * Config.CANVAS_HEIGHT;
    }

    update(deltaTime) {
        this.y += this.speed * (deltaTime / 16.67);
        if (this.y > Config.CANVAS_HEIGHT) {
            this.reset();
            this.y = -this.len;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.len);
        ctx.stroke();
        ctx.restore();
    }
}