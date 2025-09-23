import * as Config from '../js/config.js';

export default class Billboard {
    constructor(billboardImg) {
        this.billboardImg = billboardImg;
        this.baseSpeed = Math.random() * 50 + 100; // px/s, velocidad base
        // Se ajusta a 0.4-0.7 para un tamaño más visible y realista, como indicaba el comentario original.
        this.scale = Math.random() * 0.1 + 0.1;
        this.speed = this.baseSpeed * (1.5 - this.scale); // Parallax: más pequeños (lejanos) se mueven más lento
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
        if (!this.billboardImg) return;

        ctx.save();

        // --- 1. Estructura de Soporte (Postes) ---
        // Más realista con dos postes para mayor estabilidad.
        const poleWidth = 8 * this.scale;
        const poleHeight = Config.CANVAS_HEIGHT - (this.y + this.height);
        const poleOffset = this.width * 0.3; // Distancia de los postes desde el centro

        // Postes (con una pequeña sombra para dar volumen)
        ctx.fillStyle = '#4a3a2a'; // Sombra del poste
        ctx.fillRect(this.x + this.width / 2 - poleOffset - (poleWidth / 2) + 2 * this.scale, this.y + this.height, poleWidth, poleHeight);
        ctx.fillRect(this.x + this.width / 2 + poleOffset - (poleWidth / 2) + 2 * this.scale, this.y + this.height, poleWidth, poleHeight);
        ctx.fillStyle = '#5c3d21'; // Color principal del poste
        ctx.fillRect(this.x + this.width / 2 - poleOffset - (poleWidth / 2), this.y + this.height, poleWidth, poleHeight);
        ctx.fillRect(this.x + this.width / 2 + poleOffset - (poleWidth / 2), this.y + this.height, poleWidth, poleHeight);

        // --- 2. Marco y Cara del Cartel ---
        // Sombra para dar profundidad
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(this.x + 4 * this.scale, this.y + 4 * this.scale, this.width, this.height);

        // Cara del cartel (fondo blanco)
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Dibuja la imagen del cartel
        ctx.drawImage(this.billboardImg, this.x, this.y, this.width, this.height);

        // Marco exterior más detallado
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4 * this.scale;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5 * this.scale;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // --- 3. Iluminación Nocturna (Spotlights) ---
        if (isNight) {
            // Dibuja dos focos en la base del cartel
            const lightSize = 8 * this.scale;
            const lightY = this.y + this.height + 2 * this.scale;

            // --- Foco 1 ---
            const light1X = this.x + this.width * 0.5;
            this.drawSpotlightCone(ctx, light1X, lightY + lightSize / 2);
            ctx.fillStyle = '#222';
            ctx.fillRect(light1X - lightSize / 2, lightY, lightSize, lightSize);
            ctx.fillStyle = 'rgba(255, 255, 240, 0.9)';
            ctx.beginPath();
            ctx.arc(light1X, lightY + lightSize / 2, lightSize * 0.3, 0, Math.PI * 2);
            ctx.fill();

            // --- Foco 2 ---
            const light2X = this.x + this.width * 0.5;
            this.drawSpotlightCone(ctx, light2X, lightY + lightSize / 2);
            ctx.fillStyle = '#222';
            ctx.fillRect(light2X - lightSize / 2, lightY, lightSize, lightSize);
            ctx.fillStyle = 'rgba(255, 255, 240, 0.9)';
            ctx.beginPath();
            ctx.arc(light2X, lightY + lightSize / 2, lightSize * 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Efecto de luz sobre la imagen
            const overlayGradient = ctx.createLinearGradient(this.x, this.y + this.height, this.x, this.y);
            overlayGradient.addColorStop(0, 'rgba(255, 255, 224, 0.45)');
            overlayGradient.addColorStop(0.4, 'rgba(255, 255, 224, 0.3)');
            overlayGradient.addColorStop(1, 'rgba(255, 255, 224, 0.1)');
            ctx.fillStyle = overlayGradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.restore();
    }

    drawSpotlightCone(ctx, lightX, lightY) {
        const targetY = this.y;
        // El cono de luz se abre hacia arriba, iluminando una porción del cartel
        const coneWidthAtTop = this.width * 0.8;
        const targetLeftX = lightX - coneWidthAtTop / 2;
        const targetRightX = lightX + coneWidthAtTop / 2;

        // 1. Halo de luz suave para dar atmósfera
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(lightX, lightY);
        ctx.lineTo(targetLeftX - 20 * this.scale, targetY);
        ctx.lineTo(targetRightX + 20 * this.scale, targetY);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 224, 0.1)';
        ctx.shadowColor = 'rgba(255, 255, 200, 0.7)';
        ctx.shadowBlur = 30 * this.scale;
        ctx.fill();
        ctx.restore();

        // 2. Cono de luz principal, más definido
        const gradient = ctx.createLinearGradient(lightX, lightY, lightX, targetY);
        gradient.addColorStop(0, 'rgba(255, 255, 224, 0.4)'); // Más brillante cerca de la fuente
        gradient.addColorStop(1, 'rgba(255, 255, 224, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(lightX, lightY);
        ctx.lineTo(targetLeftX, targetY);
        ctx.lineTo(targetRightX, targetY);
        ctx.closePath();
        ctx.fill();
    }
}