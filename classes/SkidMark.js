import * as Config from '../js/config.js';

/**
 * Representa una marca de neumático dejada en la carretera al frenar.
 */
export default class SkidMark {
    constructor(x, y, initialSpeed) {
        this.x = x;
        this.y = y;
        // Las marcas son más anchas y opacas a mayor velocidad de frenado
        const intensity = Math.max(0, (initialSpeed - 1.0) / (Config.TRUCK_MAX_SPEED - 1.0));
        this.width = 3 + intensity * 5;
        this.opacity = 0.4 + intensity * 0.3;

        this.speed = 150; // Velocidad base del parallax del suelo
        this.initialLife = 15; // Segundos de vida
        this.life = this.initialLife;
    }

    update(deltaTime, truckSpeedMultiplier) {
        const dt = deltaTime / 1000;
        // Se mueve junto con el escenario
        this.x -= this.speed * truckSpeedMultiplier * dt;
        this.life -= dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        // La marca se desvanece con el tiempo
        const alpha = (this.life / this.initialLife) * this.opacity;
        ctx.fillStyle = `rgba(40, 40, 40, ${alpha})`;

        // Dibuja dos marcas paralelas para las ruedas traseras
        ctx.fillRect(this.x, this.y, this.width, 2);
        ctx.fillRect(this.x + 20, this.y, this.width, 2);
    }
}