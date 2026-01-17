import * as Config from '../js/config.js';

export default class Billboard {
    constructor(billboardImages) {
        // Ahora recibe un array de imágenes
        this.billboardImages = billboardImages || [];
        this.billboardImg = null; // La imagen actual se elegirá en reset()

        this.baseSpeed = Math.random() * 50 + 100; // px/s, velocidad base

        // Las propiedades de tamaño y velocidad se inicializan en reset()
        this.scale = 1;
        this.speed = this.baseSpeed;
        this.width = 100;
        this.height = 50;

        this.reset();
    }

    reset() {
        // 1. Elige una nueva imagen aleatoria del array
        if (this.billboardImages.length > 0) {
            this.billboardImg = this.billboardImages[Math.floor(Math.random() * this.billboardImages.length)];
        }

        // 2. Elige un nuevo tamaño aleatorio para más variedad
        this.scale = Math.random() * 0.08 + 0.12; // Rango aumentado para carteles más visibles
        this.speed = this.baseSpeed * this.scale; // Parallax: más grandes (cercanos) se mueven más rápido
        this.width = (this.billboardImg ? this.billboardImg.width : 100) * this.scale;
        this.height = (this.billboardImg ? this.billboardImg.height : 50) * this.scale;

        // Posiciona el cartel fuera de la pantalla a la derecha
        this.x = Config.CANVAS_WIDTH + Math.random() * Config.CANVAS_WIDTH * 0.8;
        // Posiciona el cartel por encima del suelo
        this.y = Config.CANVAS_HEIGHT - this.height - (Math.random() * 15 + 50);
    }

    update(deltaTime, truckSpeedMultiplier) {
        this.x -= this.speed * truckSpeedMultiplier * (deltaTime / 1000);
        // Si el cartel sale completamente de la pantalla por la izquierda, lo reseteamos
        if (this.x < -this.width) {
            this.reset();
        }
    }

    draw(ctx, isNight, cycleProgress) {
        if (!this.billboardImg) return;

        ctx.save();

        // --- SOMBRA PROYECTADA EN EL SUELO ---
        this.drawGroundShadow(ctx);

        // --- ESTRUCTURA DE SOPORTE (Marco metálico trasero) ---
        this.drawSupportStructure(ctx);

        // --- PANEL PRINCIPAL CON EFECTO 3D ---
        this.drawMainPanel(ctx);

        // --- ILUMINACIÓN NOCTURNA ---
        this.drawNightLighting(ctx, isNight, cycleProgress);

        ctx.restore();
    }

    /**
     * Dibuja la sombra proyectada en el suelo
     */
    drawGroundShadow(ctx) {
        const groundY = Config.CANVAS_HEIGHT;
        const shadowOffset = 8 * this.scale;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';

        // Sombra del poste
        const poleWidth = 6 * this.scale;
        ctx.fillRect(
            this.x + this.width / 2 - poleWidth / 2 + shadowOffset,
            groundY - 3,
            poleWidth + 15 * this.scale,
            3
        );

        ctx.restore();
    }

    /**
     * Dibuja la estructura de soporte metálica
     */
    drawSupportStructure(ctx) {
        const groundY = Config.CANVAS_HEIGHT;
        const poleHeight = groundY - (this.y + this.height);
        const poleWidth = 6 * this.scale;
        const centerX = this.x + this.width / 2;

        // --- Poste principal (tubo metálico) ---
        // Efecto 3D con gradiente
        const poleGradient = ctx.createLinearGradient(
            centerX - poleWidth, 0,
            centerX + poleWidth, 0
        );
        poleGradient.addColorStop(0, '#4a4a4a');
        poleGradient.addColorStop(0.3, '#8a8a8a');
        poleGradient.addColorStop(0.5, '#aaaaaa');
        poleGradient.addColorStop(0.7, '#8a8a8a');
        poleGradient.addColorStop(1, '#4a4a4a');

        ctx.fillStyle = poleGradient;
        ctx.fillRect(centerX - poleWidth / 2, this.y + this.height, poleWidth, poleHeight);

        // Reflejos en el poste
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(centerX - poleWidth / 4, this.y + this.height, poleWidth / 4, poleHeight);

        // --- Base del poste (plataforma de concreto) ---
        const baseWidth = poleWidth * 3;
        const baseHeight = 5 * this.scale;
        ctx.fillStyle = '#666666';
        ctx.fillRect(centerX - baseWidth / 2, groundY - baseHeight, baseWidth, baseHeight);
        ctx.fillStyle = '#888888';
        ctx.fillRect(centerX - baseWidth / 2, groundY - baseHeight, baseWidth, 2 * this.scale);

        // --- Brazos de soporte (estructura diagonal) ---
        ctx.strokeStyle = '#5a5a5a';
        ctx.lineWidth = 2 * this.scale;

        // Brazo izquierdo
        ctx.beginPath();
        ctx.moveTo(centerX, this.y + this.height * 0.8);
        ctx.lineTo(this.x + 5 * this.scale, this.y + this.height);
        ctx.stroke();

        // Brazo derecho
        ctx.beginPath();
        ctx.moveTo(centerX, this.y + this.height * 0.8);
        ctx.lineTo(this.x + this.width - 5 * this.scale, this.y + this.height);
        ctx.stroke();

        // --- Barra horizontal trasera ---
        const barY = this.y + this.height;
        ctx.fillStyle = '#6a6a6a';
        ctx.fillRect(this.x, barY, this.width, 4 * this.scale);
        ctx.fillStyle = '#888888';
        ctx.fillRect(this.x, barY, this.width, 1.5 * this.scale);
    }

    /**
     * Dibuja el panel principal del cartel con efecto 3D
     */
    drawMainPanel(ctx) {
        const depth = 4 * this.scale; // Profundidad del efecto 3D

        // --- Lado derecho del panel (efecto 3D) ---
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width + depth, this.y + depth);
        ctx.lineTo(this.x + this.width + depth, this.y + this.height + depth);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // --- Parte inferior del panel (efecto 3D) ---
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + depth, this.y + this.height + depth);
        ctx.lineTo(this.x + this.width + depth, this.y + this.height + depth);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // --- Sombra suave detrás del panel ---
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10 * this.scale;
        ctx.shadowOffsetX = 3 * this.scale;
        ctx.shadowOffsetY = 3 * this.scale;

        // --- Panel frontal (fondo blanco) ---
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Resetear sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // --- Imagen del cartel ---
        ctx.drawImage(this.billboardImg, this.x, this.y, this.width, this.height);

        // --- Marco metálico exterior ---
        const frameWidth = 3 * this.scale;

        // Marco exterior oscuro
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = frameWidth;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Reflejo en el marco (parte superior e izquierda)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1 * this.scale;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.stroke();

        // Sombra en el marco (parte inferior y derecha)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.stroke();

        // --- Detalles de esquinas (remaches/tornillos) ---
        this.drawCornerDetails(ctx);
    }

    /**
     * Dibuja detalles en las esquinas del cartel (remaches)
     */
    drawCornerDetails(ctx) {
        const cornerOffset = 4 * this.scale;
        const rivetSize = 2 * this.scale;

        ctx.fillStyle = '#4a4a4a';

        // Esquina superior izquierda
        ctx.beginPath();
        ctx.arc(this.x + cornerOffset, this.y + cornerOffset, rivetSize, 0, Math.PI * 2);
        ctx.fill();

        // Esquina superior derecha
        ctx.beginPath();
        ctx.arc(this.x + this.width - cornerOffset, this.y + cornerOffset, rivetSize, 0, Math.PI * 2);
        ctx.fill();

        // Esquina inferior izquierda
        ctx.beginPath();
        ctx.arc(this.x + cornerOffset, this.y + this.height - cornerOffset, rivetSize, 0, Math.PI * 2);
        ctx.fill();

        // Esquina inferior derecha
        ctx.beginPath();
        ctx.arc(this.x + this.width - cornerOffset, this.y + this.height - cornerOffset, rivetSize, 0, Math.PI * 2);
        ctx.fill();

        // Brillo en los remaches
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const highlightOffset = 0.5 * this.scale;

        ctx.beginPath();
        ctx.arc(this.x + cornerOffset - highlightOffset, this.y + cornerOffset - highlightOffset, rivetSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width - cornerOffset - highlightOffset, this.y + cornerOffset - highlightOffset, rivetSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Dibuja la iluminación nocturna del cartel
     */
    drawNightLighting(ctx, isNight, cycleProgress) {
        let lightIntensity = 0;

        if (cycleProgress !== undefined) {
            const duskStart = 0.50;
            const duskEnd = 0.60;
            const dawnStart = 0.90;
            const dawnEnd = 1.0;

            if (cycleProgress >= duskStart && cycleProgress < duskEnd) {
                lightIntensity = (cycleProgress - duskStart) / (duskEnd - duskStart);
            } else if (cycleProgress >= duskEnd && cycleProgress < dawnStart) {
                lightIntensity = 1;
            } else if (cycleProgress >= dawnStart && cycleProgress < dawnEnd) {
                lightIntensity = 1 - ((cycleProgress - dawnStart) / (dawnEnd - dawnStart));
            }
        } else if (isNight) {
            lightIntensity = 1;
        }

        if (lightIntensity > 0) {
            // --- Focos en la parte superior del cartel ---
            const lightSize = 5 * this.scale;
            const lightY = this.y - lightSize - 2 * this.scale;
            const light1X = this.x + this.width * 0.3;
            const light2X = this.x + this.width * 0.7;

            // Conos de luz hacia abajo
            this.drawTopSpotlight(ctx, light1X, lightY + lightSize, lightIntensity);
            this.drawTopSpotlight(ctx, light2X, lightY + lightSize, lightIntensity);

            // Carcasas de los focos
            ctx.fillStyle = '#333';
            ctx.fillRect(light1X - lightSize, lightY, lightSize * 2, lightSize);
            ctx.fillRect(light2X - lightSize, lightY, lightSize * 2, lightSize);

            // Luz de los focos
            ctx.fillStyle = `rgba(255, 255, 220, ${0.9 * lightIntensity})`;
            ctx.beginPath();
            ctx.arc(light1X, lightY + lightSize * 0.7, lightSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(light2X, lightY + lightSize * 0.7, lightSize * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Efecto de luz sobre la imagen
            const overlayGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            overlayGradient.addColorStop(0, `rgba(255, 255, 224, ${0.35 * lightIntensity})`);
            overlayGradient.addColorStop(0.5, `rgba(255, 255, 224, ${0.15 * lightIntensity})`);
            overlayGradient.addColorStop(1, `rgba(255, 255, 224, ${0.05 * lightIntensity})`);
            ctx.fillStyle = overlayGradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    /**
     * Dibuja un cono de luz desde arriba hacia el cartel
     */
    drawTopSpotlight(ctx, lightX, lightY, lightIntensity) {
        const targetY = this.y + this.height;
        const coneWidthAtBottom = this.width * 0.4;

        // Cono de luz difuso
        ctx.save();
        const gradient = ctx.createLinearGradient(lightX, lightY, lightX, targetY);
        gradient.addColorStop(0, `rgba(255, 255, 224, ${0.3 * lightIntensity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 224, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(lightX - 3 * this.scale, lightY);
        ctx.lineTo(lightX - coneWidthAtBottom / 2, targetY);
        ctx.lineTo(lightX + coneWidthAtBottom / 2, targetY);
        ctx.lineTo(lightX + 3 * this.scale, lightY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}