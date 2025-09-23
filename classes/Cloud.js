import * as Config from '../js/config.js';

export default class Cloud {
    constructor() {
        this.speed = Math.random() * 20 + 15; // px/s
        this.reset();
        this.y = Math.random() * 80 + 10;
        this.scale = Math.random() * 0.5 + 0.5;
    }

    reset() {
        this.x = Config.CANVAS_WIDTH + Math.random() * 300;
    }

    update(deltaTime) {
        this.x -= this.speed * (deltaTime / 1000);
        if (this.x < -150 * this.scale) {
            this.reset();
        }
    }

    draw(ctx, isNight) {
        ctx.fillStyle = isNight ? Config.CLOUD_NIGHT_COLOR : Config.CLOUD_DAY_COLOR;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 30 * this.scale, 0, Math.PI * 2);
        ctx.arc(this.x + 40 * this.scale, this.y - 15 * this.scale, 40 * this.scale, 0, Math.PI * 2);
        ctx.arc(this.x + 80 * this.scale, this.y, 35 * this.scale, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
}