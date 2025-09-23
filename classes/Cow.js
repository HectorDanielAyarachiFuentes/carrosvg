import * as Config from '../js/config.js';
import { lerp } from '../js/utils.js';

export default class Cow {
    constructor(cowImg) {
        this.cowImg = cowImg;
        this.speed = 150; // px/s
        this.scale = Math.random() * 0.1 + 0.15;
        this.isAbducted = false;
        this.abductionProgress = 0;
        this.visible = true;
        this.initialY = Config.CANVAS_HEIGHT - (this.cowImg.height * this.scale) + 5;
        this.y = this.initialY;
        this.reset();
    }

    reset() {
        this.x = Config.CANVAS_WIDTH + Math.random() * Config.CANVAS_WIDTH * 1.5;
        this.y = this.initialY;
        this.isAbducted = false;
        this.abductionProgress = 0;
        this.visible = true;
    }

    update(deltaTime, truckSpeedMultiplier) {
        if (!this.isAbducted) {
            this.x -= this.speed * truckSpeedMultiplier * (deltaTime / 1000);
            if (this.x < -100) {
                this.reset();
            }
        }
    }
    
    // La lógica de abducción se controla desde la clase UFO, que actualiza las propiedades de la vaca.

    draw(ctx) {
        if (this.cowImg && this.visible) {
            const currentScale = this.scale * (1 - this.abductionProgress);
            const imgWidth = this.cowImg.width * currentScale;
            const imgHeight = this.cowImg.height * currentScale;
            const drawX = this.isAbducted ? this.x - imgWidth / 2 : this.x;
            ctx.drawImage(this.cowImg, drawX, this.y, imgWidth, imgHeight);
        }
    }
}