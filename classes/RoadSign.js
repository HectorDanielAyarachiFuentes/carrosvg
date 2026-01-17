import * as Config from '../js/config.js';

/**
 * Tipos de señales disponibles
 */
const SIGN_TYPES = {
    SPEED_60: { type: 'speed', value: 60, shape: 'circle', color: '#FFFFFF', border: '#FF0000' },
    SPEED_80: { type: 'speed', value: 80, shape: 'circle', color: '#FFFFFF', border: '#FF0000' },
    SPEED_100: { type: 'speed', value: 100, shape: 'circle', color: '#FFFFFF', border: '#FF0000' },
    ANIMAL_CROSSING: { type: 'warning', icon: 'cow', shape: 'diamond', color: '#FFD700', border: '#000000' },
    DEER_CROSSING: { type: 'warning', icon: 'deer', shape: 'diamond', color: '#FFD700', border: '#000000' },
    CURVE_RIGHT: { type: 'warning', icon: 'curveRight', shape: 'diamond', color: '#FFD700', border: '#000000' },
    CURVE_LEFT: { type: 'warning', icon: 'curveLeft', shape: 'diamond', color: '#FFD700', border: '#000000' },
    GAS_STATION: { type: 'info', icon: 'gas', shape: 'rectangle', color: '#0066CC', border: '#FFFFFF' },
    ROAD_WORK: { type: 'warning', icon: 'work', shape: 'diamond', color: '#FF6600', border: '#000000' },
    NO_OVERTAKING: { type: 'prohibition', icon: 'noPass', shape: 'circle', color: '#FFFFFF', border: '#FF0000' },
};

/**
 * Clase que representa una señal de tráfico al lado de la carretera.
 */
export default class RoadSign {
    constructor() {
        this.reset();
    }

    /**
     * Reinicia la señal con nuevos valores aleatorios.
     */
    reset() {
        // Posición inicial fuera de la pantalla por la derecha
        this.x = Config.CANVAS_WIDTH + Math.random() * 300 + 100;
        this.y = Config.CANVAS_HEIGHT; // Base del poste en el suelo

        // Seleccionar un tipo de señal aleatorio
        const signKeys = Object.keys(SIGN_TYPES);
        const randomKey = signKeys[Math.floor(Math.random() * signKeys.length)];
        this.signData = SIGN_TYPES[randomKey];

        // Tamaño de la señal (reducido para mejor proporción)
        this.width = 18;
        this.height = 18;
        this.postHeight = 38;

        // Estado
        this.visible = true;

        // Velocidad base para el movimiento
        this.speed = 0.18;
    }

    /**
     * Actualiza la posición de la señal.
     * @param {number} deltaTime Tiempo transcurrido desde el último frame.
     * @param {number} speedMultiplier Multiplicador de velocidad del camión.
     */
    update(deltaTime, speedMultiplier) {
        // Mover hacia la izquierda (el camión avanza hacia la derecha)
        this.x -= this.speed * deltaTime * speedMultiplier;

        // Si sale de la pantalla por la izquierda, reiniciar
        if (this.x < -50) {
            this.reset();
        }
    }

    /**
     * Dibuja la señal de tráfico.
     * @param {CanvasRenderingContext2D} ctx El contexto del canvas.
     * @param {boolean} isNight Si es de noche (para efectos de iluminación).
     */
    draw(ctx, isNight) {
        if (!this.visible) return;

        ctx.save();

        // Dibujar el poste
        this.drawPost(ctx);

        // Dibujar la señal según su forma
        const signY = this.y - this.postHeight - this.height / 2;

        switch (this.signData.shape) {
            case 'circle':
                this.drawCircleSign(ctx, this.x, signY);
                break;
            case 'diamond':
                this.drawDiamondSign(ctx, this.x, signY);
                break;
            case 'rectangle':
                this.drawRectangleSign(ctx, this.x, signY);
                break;
        }

        // Efecto reflectante de noche
        if (isNight) {
            this.drawNightReflection(ctx, signY);
        }

        ctx.restore();
    }

    /**
     * Dibuja el poste de la señal.
     */
    drawPost(ctx) {
        ctx.fillStyle = '#888888';
        ctx.fillRect(this.x - 2, this.y - this.postHeight, 4, this.postHeight);

        // Base del poste
        ctx.fillStyle = '#666666';
        ctx.fillRect(this.x - 4, this.y - 3, 8, 3);
    }

    /**
     * Dibuja una señal circular (límites de velocidad, prohibiciones).
     */
    drawCircleSign(ctx, x, y) {
        const radius = this.width / 2;

        // Fondo
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.signData.color;
        ctx.fill();

        // Borde
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.signData.border;
        ctx.stroke();

        // Contenido
        if (this.signData.type === 'speed') {
            // Número de velocidad
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${radius * 0.9}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.signData.value.toString(), x, y + 1);
        } else if (this.signData.icon === 'noPass') {
            // Línea diagonal de prohibición
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.6, y - radius * 0.6);
            ctx.lineTo(x + radius * 0.6, y + radius * 0.6);
            ctx.stroke();

            // Dos coches
            ctx.fillStyle = '#000000';
            ctx.fillRect(x - 6, y - 4, 5, 8);
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(x + 1, y - 4, 5, 8);
        }
    }

    /**
     * Dibuja una señal en forma de diamante (advertencias).
     */
    drawDiamondSign(ctx, x, y) {
        const size = this.width / 2;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4); // Rotar 45 grados

        // Fondo
        ctx.fillStyle = this.signData.color;
        ctx.fillRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);

        // Borde
        ctx.strokeStyle = this.signData.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);

        ctx.restore();

        // Iconos (sin rotación)
        ctx.fillStyle = '#000000';
        this.drawWarningIcon(ctx, x, y, this.signData.icon);
    }

    /**
     * Dibuja una señal rectangular (información).
     */
    drawRectangleSign(ctx, x, y) {
        const w = this.width * 1.2;
        const h = this.height * 0.8;

        // Fondo
        ctx.fillStyle = this.signData.color;
        ctx.fillRect(x - w / 2, y - h / 2, w, h);

        // Borde
        ctx.strokeStyle = this.signData.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - w / 2, y - h / 2, w, h);

        // Icono
        ctx.fillStyle = '#FFFFFF';
        this.drawInfoIcon(ctx, x, y, this.signData.icon);
    }

    /**
     * Dibuja el icono de advertencia correspondiente.
     */
    drawWarningIcon(ctx, x, y, icon) {
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;

        switch (icon) {
            case 'cow':
                // Vaca simplificada
                ctx.beginPath();
                ctx.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                // Cabeza
                ctx.beginPath();
                ctx.arc(x + 5, y - 1, 3, 0, Math.PI * 2);
                ctx.fill();
                // Patas
                ctx.fillRect(x - 4, y + 3, 2, 5);
                ctx.fillRect(x + 2, y + 3, 2, 5);
                break;

            case 'deer':
                // Ciervo simplificado
                ctx.beginPath();
                ctx.ellipse(x, y + 2, 5, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                // Cabeza y cuello
                ctx.beginPath();
                ctx.moveTo(x + 3, y);
                ctx.lineTo(x + 6, y - 4);
                ctx.lineTo(x + 8, y - 6);
                ctx.stroke();
                // Astas
                ctx.beginPath();
                ctx.moveTo(x + 7, y - 5);
                ctx.lineTo(x + 5, y - 9);
                ctx.moveTo(x + 7, y - 5);
                ctx.lineTo(x + 10, y - 8);
                ctx.stroke();
                // Patas
                ctx.fillRect(x - 3, y + 5, 2, 4);
                ctx.fillRect(x + 1, y + 5, 2, 4);
                break;

            case 'curveRight':
                // Flecha curva derecha
                ctx.beginPath();
                ctx.moveTo(x - 6, y + 6);
                ctx.quadraticCurveTo(x, y + 6, x, y);
                ctx.quadraticCurveTo(x, y - 6, x + 6, y - 6);
                ctx.lineWidth = 3;
                ctx.stroke();
                // Punta de flecha
                ctx.beginPath();
                ctx.moveTo(x + 3, y - 9);
                ctx.lineTo(x + 8, y - 6);
                ctx.lineTo(x + 3, y - 3);
                ctx.fill();
                break;

            case 'curveLeft':
                // Flecha curva izquierda
                ctx.beginPath();
                ctx.moveTo(x + 6, y + 6);
                ctx.quadraticCurveTo(x, y + 6, x, y);
                ctx.quadraticCurveTo(x, y - 6, x - 6, y - 6);
                ctx.lineWidth = 3;
                ctx.stroke();
                // Punta de flecha
                ctx.beginPath();
                ctx.moveTo(x - 3, y - 9);
                ctx.lineTo(x - 8, y - 6);
                ctx.lineTo(x - 3, y - 3);
                ctx.fill();
                break;

            case 'work':
                // Persona trabajando
                ctx.beginPath();
                ctx.arc(x, y - 6, 3, 0, Math.PI * 2);
                ctx.fill();
                // Cuerpo
                ctx.beginPath();
                ctx.moveTo(x, y - 3);
                ctx.lineTo(x, y + 3);
                ctx.moveTo(x - 5, y);
                ctx.lineTo(x + 5, y);
                ctx.moveTo(x, y + 3);
                ctx.lineTo(x - 4, y + 8);
                ctx.moveTo(x, y + 3);
                ctx.lineTo(x + 4, y + 8);
                ctx.lineWidth = 2;
                ctx.stroke();
                // Pala
                ctx.beginPath();
                ctx.moveTo(x + 4, y - 2);
                ctx.lineTo(x + 8, y + 6);
                ctx.stroke();
                break;
        }

        ctx.restore();
    }

    /**
     * Dibuja iconos informativos.
     */
    drawInfoIcon(ctx, x, y, icon) {
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#FFFFFF';

        if (icon === 'gas') {
            // Surtidor de gasolina
            ctx.lineWidth = 2;
            // Bomba
            ctx.fillRect(x - 5, y - 6, 8, 12);
            // Manguera
            ctx.beginPath();
            ctx.moveTo(x + 3, y - 3);
            ctx.quadraticCurveTo(x + 8, y - 3, x + 8, y + 2);
            ctx.lineTo(x + 8, y + 4);
            ctx.stroke();
            // Base
            ctx.fillRect(x - 7, y + 6, 12, 3);
        }

        ctx.restore();
    }

    /**
     * Dibuja efecto reflectante para señales de noche.
     */
    drawNightReflection(ctx, signY) {
        // Brillo sutil para simular material reflectante
        const gradient = ctx.createRadialGradient(
            this.x, signY, 0,
            this.x, signY, this.width
        );
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, signY, this.width, 0, Math.PI * 2);
        ctx.fill();
    }
}
