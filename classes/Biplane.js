import * as Config from '../js/config.js';

export default class Biplane {
    /**
     * @param {HTMLImageElement} pilotImg La imagen para el piloto.
     * @param {string} bannerText El texto que aparecerá en el cartel.
     */
    constructor(pilotImg, bannerText = "Dulce") {
        this.x = -300; // Empezar fuera de la pantalla
        this.pilotImg = pilotImg;
        this.y = 120;
        this.speed = 165; // px/s
        this.scale = 0.75; // Reducimos el tamaño general en un 25%
        this.visible = false;
        this.propellerAngle = 0;
        this.bobbingAngle = Math.random() * Math.PI * 2; // Para un suave balanceo

        // Propiedades del cartel
        this.bannerText = bannerText;
        this.bannerWidth = 150; // Un poco más grande para el texto
        this.bannerHeight = 45;
        this.bannerOffset = { x: -200, y: 10 }; // Ajustado para la nueva escala
        this.bannerWaveAngle = 0;
    }

    update(deltaTime, isNight) {
        this.visible = !isNight;

        if (this.visible) {
            this.x += this.speed * (deltaTime / 1000);
            this.propellerAngle += deltaTime * 0.05;
            this.bobbingAngle += deltaTime * 0.005;
            this.bannerWaveAngle += deltaTime * 0.01; // Actualizar la ondulación del cartel

            // Si el avión sale completamente de la pantalla, lo reiniciamos
            if (this.x > Config.CANVAS_WIDTH + 200) {
                this.x = -300 - (this.bannerWidth * this.scale); // Asegurarse que el cartel también empiece fuera
                this.y = 100 + Math.random() * 50;
            }
        } else {
            // Si es de noche y el avión aún está visible, lo movemos fuera de la pantalla
            if (this.x > -300) {
                this.x = -300;
            }
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

        // --- Cola ---
        // Estabilizador vertical (rojo con franja azul)
        ctx.fillStyle = '#d9252e';
        ctx.beginPath();
        ctx.moveTo(-100, 5);
        ctx.quadraticCurveTo(-115, -30, -80, -25);
        ctx.lineTo(-70, 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#0f64b9';
        ctx.beginPath();
        ctx.moveTo(-100, 5);
        ctx.quadraticCurveTo(-105, -28, -88, -22);
        ctx.lineTo(-80, 5);
        ctx.closePath();
        ctx.fill();

        // Estabilizador horizontal (azul)
        const tailWingGradient = ctx.createLinearGradient(-95, -5, -95, 5);
        tailWingGradient.addColorStop(0, '#1a7ff0');
        tailWingGradient.addColorStop(1, '#0f64b9');
        ctx.fillStyle = tailWingGradient;
        ctx.beginPath();
        ctx.ellipse(-85, 2, 20, 5, 0, 0, Math.PI * 2);
        ctx.fill();


        // --- Cuerpo (Fuselage) ---
        // Parte inferior (amarillo-naranja)
        const lowerBodyGradient = ctx.createLinearGradient(0, 10, 0, 35);
        lowerBodyGradient.addColorStop(0, '#ffc61e');
        lowerBodyGradient.addColorStop(1, '#f7931e');
        ctx.fillStyle = lowerBodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 10, 85, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        // Sombra inferior para más realismo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.ellipse(0, 28, 80, 5, 0, 0, Math.PI * 2);
        ctx.fill();


        // Franja central (azul)
        const midBodyGradient = ctx.createLinearGradient(0, 0, 0, 20);
        midBodyGradient.addColorStop(0, '#1a7ff0');
        midBodyGradient.addColorStop(1, '#0f64b9');
        ctx.fillStyle = midBodyGradient;
        ctx.fillRect(-80, 2, 160, 18);

        // Parte superior (roja)
        const upperBodyGradient = ctx.createLinearGradient(0, -30, 0, 10);
        upperBodyGradient.addColorStop(0, '#f2353b');
        upperBodyGradient.addColorStop(1, '#d9252e');
        ctx.fillStyle = upperBodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, -5, 80, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        // Reflejo superior para más realismo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, -15, 60, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- Ala ---
        const wingGradient = ctx.createLinearGradient(0, 20, 0, 35);
        wingGradient.addColorStop(0, '#1a7ff0');
        wingGradient.addColorStop(1, '#0f64b9');
        ctx.fillStyle = wingGradient;
        ctx.beginPath();
        ctx.ellipse(15, 25, 55, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- Tren de aterrizaje ---
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#aaa';
        // Soporte derecho
        ctx.beginPath();
        ctx.moveTo(-5, 30);
        ctx.lineTo(-10, 45);
        ctx.stroke();
        // Soporte izquierdo
        ctx.beginPath();
        ctx.moveTo(35, 30);
        ctx.lineTo(40, 45);
        ctx.stroke();
        // Rueda derecha
        this.drawWheel(ctx, -10, 50);
        // Rueda izquierda
        this.drawWheel(ctx, 40, 50);
        
        // --- INICIO: MEJORA DE CABINA Y PILOTO ---
        ctx.save();
        
        // 1. Crear una máscara con la forma de la cabina
        const cockpitPath = new Path2D();
        cockpitPath.ellipse(10, -8, 38, 18, 0, 0, Math.PI * 2);
        
        // Dibuja una sombra interior para dar profundidad
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill(cockpitPath);
        
        // Aplica la máscara. Todo lo que se dibuje ahora solo será visible dentro de esta ruta.
        ctx.clip(cockpitPath);

        // 2. Dibujar la imagen del piloto DENTRO de la máscara
        if (this.pilotImg) {
            const pilotWidth = 90;
            const pilotHeight = 90;
            // Centramos y ajustamos al perrito en la cabina
            const pilotX = 10 - (pilotWidth / 2);
            const pilotY = -10 - (pilotHeight / 2) - 5; 
            ctx.drawImage(this.pilotImg, pilotX, pilotY, pilotWidth, pilotHeight);
        }
        ctx.restore(); // Quitamos la máscara para no afectar a los dibujos siguientes

        // 3. Dibujar el borde de la cabina (encima de la imagen y el fuselaje)
        ctx.strokeStyle = '#282c34';
        ctx.lineWidth = 2.5;
        ctx.stroke(cockpitPath);
        // --- FIN: MEJORA DE CABINA Y PILOTO ---


        // --- Morro y Hélice ---
        ctx.fillStyle = '#0f64b9';
        ctx.fillRect(78, -12, 10, 24);

        ctx.save();
        ctx.translate(90, 0);

        // Desenfoque de la hélice mejorado
        const propBlur = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
        propBlur.addColorStop(0, 'rgba(200, 200, 200, 0.6)');
        propBlur.addColorStop(1, 'rgba(200, 200, 200, 0.1)');
        ctx.fillStyle = propBlur;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.propellerAngle);
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(-2, -30, 4, 60);
        ctx.fillRect(-30, -2, 60, 4);
        
        ctx.fillStyle = '#d9252e';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // Restaura el estado antes de la hélice

        ctx.restore(); // Restaura el estado inicial del canvas
    }

    drawWheel(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Neumático
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Llanta
        ctx.fillStyle = '#ccc';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Tapacubos
        ctx.fillStyle = '#aaa';
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
