import * as Config from '../js/config.js';

export default class Billboard {
    constructor(billboardImg) {
        this.billboardImg = billboardImg;
        this.speed = Math.random() * 50 + 100; // px/s, velocidad base
        this.scale = Math.random() * 0.1 + 0.1; // Escala de 0.4 a 0.7 para variar el tamaño
        this.width = (this.billboardImg ? this.billboardImg.width : 100) * this.scale;
        this.height = (this.billboardImg ? this.billboardImg.height : 50) * this.scale;
        this.reset();
    }

    reset() {
        // Posiciona el cartel fuera de la pantalla a la derecha, con algo de aleatoriedad
        this.x = Config.CANVAS_WIDTH + Math.random() * Config.CANVAS_WIDTH * 2.5;
        // Posiciona el cartel por encima del suelo, con algo de variación vertical
        this.y = Config.CANVAS_HEIGHT - this.height - (Math.random() * 20 + 30);
    }

    update(deltaTime, truckSpeedMultiplier) {
        this.x -= this.speed * truckSpeedMultiplier * (deltaTime / 1000);
        // Si el cartel sale completamente de la pantalla por la izquierda, lo reseteamos
        if (this.x < -this.width) {
            this.reset();
        }
    }

    draw(ctx, isNight) {
        if (this.billboardImg) {
            // 1. Dibujar la luz nocturna si es de noche (detrás de todo)
            if (isNight) {
                const lightSourceX = this.x + this.width / 2;
                const lightSourceY = Config.CANVAS_HEIGHT;
                const targetY = this.y;
                const targetWidth = this.width * 1.5;

                const gradient = ctx.createLinearGradient(lightSourceX, lightSourceY, lightSourceX, targetY);
                gradient.addColorStop(0, 'rgba(255, 255, 224, 0.2)');
                gradient.addColorStop(1, 'rgba(255, 255, 224, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(lightSourceX, lightSourceY);
                ctx.lineTo(this.x - (targetWidth - this.width) / 2, targetY);
                ctx.lineTo(this.x + this.width + (targetWidth - this.width) / 2, targetY);
                ctx.closePath();
                ctx.fill();
            }

            // 2. Dibuja el poste de soporte del cartel
            ctx.fillStyle = '#5c3d21'; // Color marrón para el poste
            const poleWidth = 5 * this.scale;
            const poleHeight = Config.CANVAS_HEIGHT - (this.y + this.height);
            ctx.fillRect(this.x + this.width / 2 - poleWidth / 2, this.y + this.height, poleWidth, poleHeight);

            // 3. Dibuja la imagen del cartel
            ctx.drawImage(this.billboardImg, this.x, this.y, this.width, this.height);

            // 4. Brillo sutil sobre la imagen del cartel (solo de noche)
            if (isNight) {
                ctx.fillStyle = 'rgba(255, 255, 200, 0.15)';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }

            // 5. Opcional: Añadir un marco al cartel para darle más definición
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2 * this.scale;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}