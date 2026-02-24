import * as Config from '../js/config.js';

const BANNER_TEXTS = [
    "Dulce",
    "Te Quiero",
    "Sonríe",
    "Hola Mundo",
    "Feliz Día",
    "Carretera y Manta"
];

export default class Biplane {
    /**
     * @param {HTMLImageElement} pilotImg La imagen para el piloto.
     */
    constructor(pilotImg) {
        this.x = -300; // Empezar fuera de la pantalla
        this.pilotImg = pilotImg;
        this.y = 60; // La movemos más arriba
        this.speed = 165; // px/s
        this.scale = 0.75; // Reducimos el tamaño general en un 25%
        this.visible = false;
        this.propellerAngle = 0;
        this.bobbingAngle = Math.random() * Math.PI * 2; // Para un suave balanceo

        // Propiedades del cartel
        this.bannerText = ""; // Inicia vacío
        this.bannerWidth = 150; // Valor por defecto
        this.bannerHeight = 45;
        this.bannerOffset = { x: -200, y: 10 }; // Ajustado para la nueva escala
        this.bannerWaveAngle = 0;

        this.setNewBanner(); // Elige el primer texto y ajusta el tamaño del cartel
    }

    setNewBanner() {
        this.bannerText = BANNER_TEXTS[Math.floor(Math.random() * BANNER_TEXTS.length)];

        // Estimamos el ancho del cartel basado en la longitud del texto.
        // Esto es una aproximación que funciona bien para la mayoría de las fuentes.
        const estimatedCharWidth = 18; // Ancho promedio por caracter
        const padding = 40; // 20px de espacio a cada lado del texto
        this.bannerWidth = this.bannerText.length * estimatedCharWidth + padding;
    }

    update(deltaTime, isNight) {
        // El avión solo debe empezar un nuevo vuelo si es de día.
        const isWaitingOffscreen = this.x <= -300 - (this.bannerWidth * this.scale);
        if (isNight && isWaitingOffscreen) {
            this.visible = false;
            return; // No hacer nada si es de noche y está esperando fuera de pantalla.
        }

        // Si llega aquí, el avión o está volando o es de día y puede empezar.
        this.visible = true;
        this.x += this.speed * (deltaTime / 1000);
        this.propellerAngle += deltaTime * 0.05;
        this.bobbingAngle += deltaTime * 0.005;
        this.bannerWaveAngle += deltaTime * 0.01;

        // Si el avión sale completamente de la pantalla por la derecha, se reinicia su posición.
        // La lógica del principio evitará que se mueva si se reinicia durante la noche.
        if (this.x > Config.CANVAS_WIDTH + 200) {
            this.x = -300 - (this.bannerWidth * this.scale);
            this.y = 50 + Math.random() * 40; // Rango de altura nuevo: 50 a 90
            // Elegir un nuevo texto y ajustar el tamaño del cartel para la siguiente pasada
            this.setNewBanner();
        }
    }

    draw(ctx) {
        if (!this.visible) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Suave balanceo vertical
        const bobbing = Math.sin(this.bobbingAngle) * 3;
        ctx.translate(0, bobbing);

        // Aplicamos la escala global a la avioneta y su cartel
        ctx.scale(this.scale, this.scale);

        // Dibujar el cartel primero para que esté detrás
        this.drawBanner(ctx);

        // --- Tail Structure ---
        // Vertical stabilizer
        const tailGradVertical = ctx.createLinearGradient(-110, -5, -80, -35);
        tailGradVertical.addColorStop(0, '#e74c3c');
        tailGradVertical.addColorStop(1, '#c0392b');
        ctx.fillStyle = tailGradVertical;
        ctx.beginPath();
        ctx.moveTo(-95, 2);
        ctx.quadraticCurveTo(-110, -35, -85, -30);
        ctx.lineTo(-75, 2);
        ctx.closePath();
        ctx.fill();

        // Inner blue stripe on vertical stabilizer
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.moveTo(-95, 2);
        ctx.quadraticCurveTo(-102, -28, -88, -25);
        ctx.lineTo(-82, 2);
        ctx.closePath();
        ctx.fill();

        // Horizontal stabilizer
        const tailWingGradient = ctx.createLinearGradient(-95, -5, -95, 5);
        tailWingGradient.addColorStop(0, '#3498db');
        tailWingGradient.addColorStop(1, '#2980b9');
        ctx.fillStyle = tailWingGradient;
        ctx.beginPath();
        ctx.ellipse(-85, 2, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- Bottom Wing ---
        const bottomWingGrad = ctx.createLinearGradient(0, 20, 0, 35);
        bottomWingGrad.addColorStop(0, '#3498db');
        bottomWingGrad.addColorStop(1, '#2980b9');
        ctx.fillStyle = bottomWingGrad;
        ctx.beginPath();
        ctx.ellipse(15, 26, 60, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- Main Fuselage ---
        // Lower half (Yellow/Orange gradient)
        const lowerBodyGrad = ctx.createLinearGradient(0, 5, 0, 30);
        lowerBodyGrad.addColorStop(0, '#f1c40f');
        lowerBodyGrad.addColorStop(1, '#f39c12');
        ctx.fillStyle = lowerBodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 10, 85, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bottom shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(0, 26, 80, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mid stripe (Blue)
        const midBodyGrad = ctx.createLinearGradient(0, -2, 0, 18);
        midBodyGrad.addColorStop(0, '#3498db');
        midBodyGrad.addColorStop(1, '#2980b9');
        ctx.fillStyle = midBodyGrad;
        // Clip to fuselage shape
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 10, 85, 22, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillRect(-90, 0, 180, 16);
        ctx.restore();

        // Upper half (Red)
        const upperBodyGrad = ctx.createLinearGradient(0, -25, 0, 5);
        upperBodyGrad.addColorStop(0, '#e74c3c');
        upperBodyGrad.addColorStop(1, '#c0392b');
        ctx.fillStyle = upperBodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 82, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Front nose curve refinement
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.ellipse(78, 5, 6, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- Cockpit & Pilot Setup ---
        ctx.save();

        // 1. Cockpit Hole (Dark Inside)
        const cockpitPath = new Path2D();
        cockpitPath.ellipse(10, -6, 38, 16, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#2c3e50'; // Deep dark interior
        ctx.fill(cockpitPath);

        // 2. Cockpit Inner Shadow for depth
        ctx.save();
        ctx.clip(cockpitPath);
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8;
        ctx.strokeStyle = 'transparent';
        ctx.lineWidth = 15;
        ctx.stroke(cockpitPath); // Creates the inner shadow effect
        ctx.restore();

        // 3. Clip for the pilot so they stay inside the cockpit bounds
        ctx.clip(cockpitPath);

        if (this.pilotImg) {
            const pilotWidth = 100; // Un poco más grande
            const pilotHeight = 100;
            // Center pilot inside the cockpit and move higher
            const pilotX = 10 - (pilotWidth / 2);
            const pilotY = -8 - (pilotHeight / 2);
            ctx.drawImage(this.pilotImg, pilotX, pilotY, pilotWidth, pilotHeight);

            // Add a slight dark gradient over the lower half of the pilot to simulate being inside
            const pilotShadow = ctx.createLinearGradient(0, -2, 0, 10);
            pilotShadow.addColorStop(0, 'rgba(0,0,0,0)');
            pilotShadow.addColorStop(1, 'rgba(0,0,0,0.5)');
            ctx.fillStyle = pilotShadow;
            ctx.fillRect(pilotX, -2, pilotWidth, pilotHeight);
        }
        ctx.restore(); // Remove clipping mask

        // 4. Cockpit rim / border (Leather aesthetic)
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 3;
        ctx.stroke(cockpitPath);

        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 1;
        ctx.stroke(cockpitPath);

        // --- Landing Gear ---
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 3;
        // Right strut
        ctx.beginPath(); ctx.moveTo(-5, 28); ctx.lineTo(-15, 45); ctx.stroke();
        // Left strut
        ctx.beginPath(); ctx.moveTo(35, 28); ctx.lineTo(45, 45); ctx.stroke();

        // Wheels
        this.drawWheel(ctx, -15, 48);
        this.drawWheel(ctx, 45, 48);

        // --- Nose Propeller Cap ---
        const noseGrad = ctx.createLinearGradient(78, -10, 78, 20);
        noseGrad.addColorStop(0, '#3498db');
        noseGrad.addColorStop(1, '#2980b9');
        ctx.fillStyle = noseGrad;
        ctx.beginPath();
        ctx.ellipse(82, 5, 6, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(90, 0);

        // Advanced Propeller Blur
        const propBlur = ctx.createRadialGradient(0, 0, 2, 0, 0, 32);
        propBlur.addColorStop(0, 'rgba(236, 240, 241, 0.7)');
        propBlur.addColorStop(0.5, 'rgba(236, 240, 241, 0.3)');
        propBlur.addColorStop(1, 'rgba(236, 240, 241, 0)');
        ctx.fillStyle = propBlur;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fill();

        // Actual spinning propeller blades
        ctx.rotate(this.propellerAngle);
        ctx.fillStyle = '#bdc3c7';
        // Rounded blades
        ctx.beginPath(); ctx.roundRect(-3, -32, 6, 64, 3); ctx.fill();
        ctx.beginPath(); ctx.roundRect(-32, -3, 64, 6, 3); ctx.fill();

        // Propeller spinner (center cone)
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(-1, -1, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // Restaura el estado antes de la hélice

        ctx.restore(); // Restaura el estado inicial del canvas
    }

    drawWheel(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Tire
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        // Inner tire highlight
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Rim
        ctx.fillStyle = '#bdc3c7';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Hubcap
        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawBanner(ctx) {
        const bannerAttachPoint = { x: -90, y: 5 }; // Punto de anclaje en la cola
        const bannerFront = { x: this.bannerOffset.x, y: this.bannerOffset.y };

        // Líneas de sujeción
        ctx.strokeStyle = '#5c3d21';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bannerAttachPoint.x, bannerAttachPoint.y);
        ctx.lineTo(bannerFront.x, bannerFront.y - this.bannerHeight / 2);
        ctx.moveTo(bannerAttachPoint.x, bannerAttachPoint.y + 5);
        ctx.lineTo(bannerFront.x, bannerFront.y + this.bannerHeight / 2);
        ctx.stroke();

        // Tela del cartel
        ctx.fillStyle = 'rgba(255, 253, 240, 0.95)';
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        const waveAmplitude = 4;
        const waveLength = 60;

        const topY = bannerFront.y - this.bannerHeight / 2;
        const bottomY = bannerFront.y + this.bannerHeight / 2;

        ctx.moveTo(bannerFront.x, topY);
        for (let i = 0; i <= this.bannerWidth; i++) {
            const x = bannerFront.x - i;
            const wave = Math.sin((i / waveLength) * Math.PI * 2 + this.bannerWaveAngle) * waveAmplitude;
            ctx.lineTo(x, topY + wave);
        }
        const lastX = bannerFront.x - this.bannerWidth;
        const lastWave = Math.sin((this.bannerWidth / waveLength) * Math.PI * 2 + this.bannerWaveAngle) * waveAmplitude;
        ctx.lineTo(lastX, bottomY + lastWave);
        for (let i = this.bannerWidth; i >= 0; i--) {
            const x = bannerFront.x - i;
            const wave = Math.sin((i / waveLength) * Math.PI * 2 + this.bannerWaveAngle) * waveAmplitude;
            ctx.lineTo(x, bottomY + wave);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Texto del cartel
        ctx.save();
        ctx.font = "bold 28px 'Comic Sans MS', cursive, sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';

        const textX = bannerFront.x - this.bannerWidth / 2;
        const textY = bannerFront.y;

        ctx.strokeStyle = '#4a2c2a';
        ctx.lineWidth = 5;
        ctx.strokeText(this.bannerText, textX, textY);

        ctx.fillStyle = '#d9534f';
        ctx.fillText(this.bannerText, textX, textY);
        ctx.restore();
    }
}
