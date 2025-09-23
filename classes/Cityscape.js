import * as Config from '../js/config.js';

export default class Cityscape {
    constructor() {
        this.speed = 5; // Muy lento, está muy lejos
        this.buildings = [];
        this.totalWidth = Config.CANVAS_WIDTH * 2; // El paisaje urbano es el doble de ancho que el canvas
        this.x = 0;

        this.generateBuildings();
    }

    generateBuildings() {
        this.buildings = [];
        let currentX = 0;
        while (currentX < this.totalWidth) {
            const width = Math.random() * 60 + 30;
            const height = Math.random() * 80 + 40;
            const y = Config.CANVAS_HEIGHT - height;
            
            // Generar ventanas para la noche
            const windows = [];
            const numWindows = Math.floor((width * height) / 200); // Densidad de ventanas
            for (let i = 0; i < numWindows; i++) {
                windows.push({
                    x: Math.random() * (width - 6) + 2,
                    y: Math.random() * (height - 8) + 4,
                    on: Math.random() > 0.4 // 60% de las ventanas encendidas
                });
            }

            this.buildings.push({ x: currentX, y, width, height, windows });
            currentX += width + Math.random() * 5;
        }
    }

    update(deltaTime, truckSpeedMultiplier) {
        // El movimiento de la ciudad es muy sutil y no depende tanto de la velocidad del camión
        const effectiveSpeed = this.speed * (truckSpeedMultiplier * 0.2 + 0.8);
        this.x -= effectiveSpeed * (deltaTime / 1000);
        if (this.x < -this.totalWidth) {
            this.x += this.totalWidth;
        }
    }

    draw(ctx, isNight, timestamp) {
        ctx.save();
        
        // Dibuja dos veces para un bucle infinito
        this.drawSet(ctx, this.x, isNight, timestamp);
        this.drawSet(ctx, this.x + this.totalWidth, isNight, timestamp);

        ctx.restore();
    }

    drawSet(ctx, offsetX, isNight, timestamp) {
        // Silueta de los edificios
        ctx.fillStyle = '#1a252a'; // Un color oscuro, casi negro
        this.buildings.forEach(b => {
            ctx.fillRect(offsetX + b.x, b.y, b.width, b.height);
        });

        // Luces de la ciudad por la noche
        if (isNight) {
            const timeFactor = timestamp / 500;
            this.buildings.forEach(b => {
                b.windows.forEach((w, i) => {
                    // Parpadeo sutil y aleatorio
                    const flicker = (Math.sin(timeFactor + i * 0.5) > 0.8);
                    if (w.on || flicker) {
                        ctx.fillStyle = flicker ? '#FFFFFF' : '#fdf5a9'; // Blanco para parpadeo, amarillo para fijas
                        ctx.fillRect(offsetX + b.x + w.x, b.y + w.y, 2, 3);
                    }
                });
            });
        }
    }
}