import * as Config from '../js/config.js';
import LaserBeam from './LaserBeam.js'; // Necesario para la interacción con el UFO

export default class Tree {
    constructor(treeImg) {
        this.treeImg = treeImg; // Guardar la referencia a la imagen
        this.speed = 150; // px/s, velocidad base
        this.scale = Math.random() * 0.4 + 0.8; // 0.8 a 1.2
        this.speed *= (2.0 - this.scale); // Los árboles más pequeños parecen más lejanos
        this.isBurning = false;
        this.burnDownProgress = 0;
        this.reset();
    }

    reset() {
        this.x = Config.CANVAS_WIDTH + Math.random() * Config.CANVAS_WIDTH;
        this.isBurning = false;
        this.burnDownProgress = 0;
    }

    update(deltaTime, truckSpeedMultiplier) {
        if (this.isBurning) {
            this.burnDownProgress += (deltaTime / 1000) / 1.5; // Tarda 1.5 segundos en quemarse
            if (this.burnDownProgress >= 1) {
                this.reset();
            }
        } else {
            this.x -= this.speed * truckSpeedMultiplier * (deltaTime / 1000);
            if (this.x < -100) {
                this.reset();
            }
        }
    }

    draw(ctx) {
        if (this.treeImg) {
            if (this.isBurning) {
                const currentScale = this.scale * (1 - this.burnDownProgress);
                const imgWidth = this.treeImg.width * currentScale;
                const imgHeight = this.treeImg.height * currentScale;
                const yPos = Config.CANVAS_HEIGHT - imgHeight;

                ctx.save();
                // Efecto de quemado/brillo rojo
                ctx.filter = `sepia(100%) hue-rotate(-50deg) saturate(500%) brightness(${1 + this.burnDownProgress})`;
                ctx.drawImage(this.treeImg, this.x, yPos, imgWidth, imgHeight);
                ctx.restore();
            } else {
                const imgWidth = this.treeImg.width * this.scale;
                const imgHeight = this.treeImg.height * this.scale;
                ctx.drawImage(this.treeImg, this.x, Config.CANVAS_HEIGHT - imgHeight, imgWidth, imgHeight);
            }
        }
    }
}