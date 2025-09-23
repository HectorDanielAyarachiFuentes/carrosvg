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
        this.swayPhase = Math.random() * Math.PI * 2; // Fase inicial para el balanceo
        this.reset();
    }

    reset() {
        this.x = Config.CANVAS_WIDTH + Math.random() * Config.CANVAS_WIDTH;
        this.isBurning = false;
        this.swayPhase = Math.random() * Math.PI * 2;
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

    draw(ctx, windStrength, timestamp) {
        if (this.treeImg) {
            const imgWidth = this.treeImg.width * this.scale;
            const imgHeight = this.treeImg.height * this.scale;
            const yPos = Config.CANVAS_HEIGHT - imgHeight;

            // El punto de pivote para el balanceo es la base del tronco
            const pivotX = this.x + imgWidth / 2;
            const pivotY = Config.CANVAS_HEIGHT;

            // La amplitud máxima del balanceo depende de la fuerza del viento
            const maxSway = windStrength / 1500; // Convertir la fuerza del viento en un ángulo sutil
            // OPTIMIZACIÓN: Usar el timestamp del bucle de animación en lugar de Date.now()
            // para un movimiento más suave y consistente, y evitar una llamada extra al sistema.
            const swayAngle = Math.sin(this.swayPhase + timestamp / 700) * maxSway;

            ctx.save();
            // Mover el origen al punto de pivote, rotar y devolver el origen
            ctx.translate(pivotX, pivotY);
            ctx.rotate(swayAngle);
            ctx.translate(-pivotX, -pivotY);

            // Ahora dibuja el árbol, que aparecerá rotado
            if (this.isBurning) {
                const currentScale = this.scale * (1 - this.burnDownProgress);
                const currentImgWidth = this.treeImg.width * currentScale;
                const currentImgHeight = this.treeImg.height * currentScale;
                const currentYPos = Config.CANVAS_HEIGHT - currentImgHeight;

                ctx.save();
                ctx.filter = `sepia(100%) hue-rotate(-50deg) saturate(500%) brightness(${1 + this.burnDownProgress})`;
                ctx.drawImage(this.treeImg, this.x, currentYPos, currentImgWidth, currentImgHeight);
                ctx.restore();
            } else {
                ctx.drawImage(this.treeImg, this.x, yPos, imgWidth, imgHeight);
            }
            ctx.restore(); // Restaura la transformación (rotación)
        }
    }
}