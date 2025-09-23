import * as Config from '../js/config.js';

const CRITTER_TYPES = {
    RABBIT: {
        speed: 220,
        scale: 0.12,
    },
    FOX: {
        speed: 260,
        scale: 0.15,
    }
};

export default class Critter {
    constructor(critterImages) {
        this.images = critterImages; // { rabbit: img, fox: img }
        this.image = null;
        this.type = null;
        this.speed = 200;
        this.scale = 0.1;
        this.width = 0;
        this.height = 0;
        this.visible = false;
        this.hopAngle = 0; // Para la animación de salto del conejo

        this.reset();
    }

    reset() {
        // Elige un tipo de animal al azar
        this.type = Math.random() < 0.6 ? 'RABBIT' : 'FOX';
        const typeConfig = CRITTER_TYPES[this.type];
        this.image = this.type === 'RABBIT' ? this.images.rabbit : this.images.fox;

        this.speed = typeConfig.speed * (Math.random() * 0.4 + 0.8); // +/- 20% de velocidad
        this.scale = typeConfig.scale * (Math.random() * 0.2 + 0.9); // +/- 10% de escala

        this.width = this.image.width * this.scale;
        this.height = this.image.height * this.scale;

        // Posición inicial fuera de la pantalla
        this.x = Config.CANVAS_WIDTH + Math.random() * Config.CANVAS_WIDTH * 3;
        this.y = Config.CANVAS_HEIGHT - this.height - 5; // Cerca del borde de la carretera
        this.visible = true;
        this.hopAngle = Math.random() * Math.PI * 2;
    }

    update(deltaTime, truckSpeedMultiplier, cycleProgress) {
        // Los animales son más activos al atardecer, noche y amanecer.
        const isActiveTime = cycleProgress > 0.45 || cycleProgress < 0.05;
        this.visible = isActiveTime;

        if (!this.visible) {
            // Si no es hora activa, nos aseguramos de que esté fuera de pantalla para la próxima vez.
            if (this.x < Config.CANVAS_WIDTH) this.x = Config.CANVAS_WIDTH + 100;
            return;
        }

        this.x -= this.speed * truckSpeedMultiplier * (deltaTime / 1000);
        if (this.x < -this.width) {
            this.reset();
        }

        // Animación de salto para el conejo
        if (this.type === 'RABBIT') {
            this.hopAngle += deltaTime * 0.02 * (this.speed / 200);
        }
    }

    draw(ctx) {
        if (!this.visible || !this.image) return;

        let yPos = this.y;
        if (this.type === 'RABBIT') {
            yPos -= Math.abs(Math.sin(this.hopAngle)) * 8; // Salto de 8px de altura
        }

        ctx.drawImage(this.image, this.x, yPos, this.width, this.height);
    }
}