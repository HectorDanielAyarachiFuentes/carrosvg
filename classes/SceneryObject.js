import * as Config from '../js/config.js';

export default class SceneryObject {
    constructor(x, y, radius, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = speed;
    }

    update(deltaTime, truckSpeedMultiplier) {
        this.x -= this.speed * truckSpeedMultiplier * (deltaTime / 16.67);
        if (this.x < -this.radius * 2) {
            this.x = Config.CANVAS_WIDTH + this.radius * 2;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = Config.SCENERY_COLOR;
        ctx.fill();
    }
}