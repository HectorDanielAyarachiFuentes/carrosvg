import * as Config from '../js/config.js';

/**
 * Clase que representa una bandada de pájaros volando.
 * Los pájaros aparecen durante el día y vuelan en formación.
 */
export default class BirdFlock {
    constructor() {
        this.reset();
    }

    /**
     * Reinicia la bandada con nuevos valores aleatorios.
     */
    reset() {
        // Posición de la bandada (punto de referencia del líder)
        this.x = -100; // Empieza fuera de la pantalla
        this.y = Math.random() * Config.CANVAS_HEIGHT * 0.4 + 20; // Parte superior del cielo

        // Velocidad base de la bandada
        this.baseSpeed = Math.random() * 0.08 + 0.04; // Entre 0.04 y 0.12

        // Dirección: 1 = izquierda a derecha, -1 = derecha a izquierda
        this.direction = Math.random() > 0.3 ? 1 : -1;

        // Si va de derecha a izquierda, empezar fuera por la derecha
        if (this.direction === -1) {
            this.x = Config.CANVAS_WIDTH + 100;
        }

        // Número de pájaros en la bandada (entre 5 y 12)
        this.birdCount = Math.floor(Math.random() * 8) + 5;

        // Crear los pájaros individuales con posiciones relativas al líder
        this.birds = [];
        for (let i = 0; i < this.birdCount; i++) {
            this.birds.push({
                // Offset relativo al líder (formación en V)
                offsetX: i * (8 + Math.random() * 4) * (i % 2 === 0 ? 1 : -1),
                offsetY: Math.abs(i) * (4 + Math.random() * 2),
                // Fase del aleteo (desfasado para que no todos aleen igual)
                wingPhase: Math.random() * Math.PI * 2,
                // Velocidad de aleteo individual
                wingSpeed: 0.008 + Math.random() * 0.004,
                // Pequeña variación en el movimiento
                wobblePhase: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.002 + Math.random() * 0.001,
            });
        }

        // Estado de visibilidad
        this.visible = true;

        // Escala de los pájaros (más pequeños = más lejanos)
        this.scale = Math.random() * 0.4 + 0.6; // Entre 0.6 y 1.0

        // Color de los pájaros (silueta oscura)
        this.color = `rgba(30, 30, 40, ${0.6 + this.scale * 0.3})`;
    }

    /**
     * Actualiza la posición y animación de la bandada.
     * @param {number} deltaTime Tiempo transcurrido desde el último frame.
     * @param {number} speedMultiplier Multiplicador de velocidad del camión.
     * @param {number} cycleProgress Progreso del ciclo día/noche (0-1).
     */
    update(deltaTime, speedMultiplier, cycleProgress) {
        // Solo visible durante el día (0.0 a 0.45 del ciclo)
        const isDaytime = cycleProgress < 0.45 || cycleProgress > 0.95;

        if (!isDaytime) {
            this.visible = false;
            return;
        }

        this.visible = true;

        // Mover la bandada
        const speed = this.baseSpeed * deltaTime * this.direction;

        // Los pájaros también se ven afectados por el paralaje (van más lentos que el primer plano)
        const parallaxFactor = 0.3 * this.scale;
        this.x += speed - (speedMultiplier - 1) * parallaxFactor * this.direction;

        // Actualizar el aleteo de cada pájaro
        this.birds.forEach(bird => {
            bird.wingPhase += bird.wingSpeed * deltaTime;
            bird.wobblePhase += bird.wobbleSpeed * deltaTime;
        });

        // Verificar si la bandada ha salido de la pantalla
        if (this.direction === 1 && this.x > Config.CANVAS_WIDTH + 150) {
            this.reset();
        } else if (this.direction === -1 && this.x < -150) {
            this.reset();
        }
    }

    /**
     * Dibuja la bandada de pájaros.
     * @param {CanvasRenderingContext2D} ctx El contexto del canvas.
     */
    draw(ctx) {
        if (!this.visible) return;

        ctx.save();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5 * this.scale;
        ctx.lineCap = 'round';

        this.birds.forEach(bird => {
            // Calcular posición del pájaro
            const wobble = Math.sin(bird.wobblePhase) * 2;
            const birdX = this.x + bird.offsetX * this.direction;
            const birdY = this.y + bird.offsetY + wobble;

            // Calcular el ángulo de las alas (aleteo)
            const wingAngle = Math.sin(bird.wingPhase) * 0.4; // -0.4 a 0.4 radianes

            // Dibujar el pájaro como una forma de "V" o "M" animada
            this.drawBird(ctx, birdX, birdY, wingAngle);
        });

        ctx.restore();
    }

    /**
     * Dibuja un pájaro individual.
     * @param {CanvasRenderingContext2D} ctx El contexto del canvas.
     * @param {number} x Posición X del pájaro.
     * @param {number} y Posición Y del pájaro.
     * @param {number} wingAngle Ángulo de las alas para el aleteo.
     */
    drawBird(ctx, x, y, wingAngle) {
        const wingSpan = 8 * this.scale; // Envergadura de las alas
        const bodyLength = 3 * this.scale;

        ctx.save();
        ctx.translate(x, y);

        // Si va hacia la izquierda, voltear horizontalmente
        if (this.direction === -1) {
            ctx.scale(-1, 1);
        }

        // Dibujar las alas como curvas bezier
        ctx.beginPath();

        // Ala izquierda
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
            -wingSpan * 0.5, -wingSpan * 0.3 + wingAngle * wingSpan,
            -wingSpan, wingAngle * wingSpan * 0.8
        );

        // Volver al centro
        ctx.moveTo(0, 0);

        // Ala derecha
        ctx.quadraticCurveTo(
            wingSpan * 0.5, -wingSpan * 0.3 + wingAngle * wingSpan,
            wingSpan, wingAngle * wingSpan * 0.8
        );

        ctx.stroke();

        // Cuerpo pequeño (punto central)
        ctx.beginPath();
        ctx.arc(bodyLength, 0, 1.5 * this.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
