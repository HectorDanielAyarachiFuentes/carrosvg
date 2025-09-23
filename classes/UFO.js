import * as Config from '../js/config.js';
import { lerp } from '../js/utils.js';
import { playSound } from '../js/audio.js';
import LaserBeam from './LaserBeam.js';

export default class UFO {
    constructor() {
        this.x = -100;
        this.y = 60;
        this.width = 70; // Ligeramente más grande
        this.height = 22;
        this.lightsAngle = 0;
        this.visible = false;
        this.targetCow = null;
        this.shootCooldown = 0;
        this.abductionBeamAngle = 0;
        
        // --- NUEVAS PROPIEDADES ---
        this.bobbingAngle = Math.random() * Math.PI * 2; // Para el balanceo
        this.enginePulseAngle = 0; // Para el brillo del motor

        this.laserBeams = [];
        this.lightning = {
            active: false,
            alpha: 0,
            strikeCooldown: Math.random() * 5000 + 3000,
        };
        this.lightColors = ['#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', '#ff9933', '#cc66ff'];
    }

    update(deltaTime, cycleProgress, trees, cows, mooSoundBuffer) {
        this.visible = cycleProgress > 0.55 && cycleProgress < 0.95;

        if (this.visible) {
            const dtSeconds = deltaTime / 1000;
            const ufoCycle = (cycleProgress - 0.55) / (0.95 - 0.55);
            this.x = lerp(-100, Config.CANVAS_WIDTH + 50, ufoCycle);
            this.y = lerp(60, 100, ufoCycle);
            
            // --- ACTUALIZACIÓN DE NUEVAS ANIMACIONES ---
            this.lightsAngle += dtSeconds * 3;
            this.bobbingAngle += dtSeconds * 1.2;
            this.enginePulseAngle += dtSeconds * 2.5;

            this.updateShooting(deltaTime, trees);
            this.updateAbduction(deltaTime, cycleProgress, cows, mooSoundBuffer);
            this.updateLightning(deltaTime);

        } else {
            if (this.targetCow) {
                this.targetCow.isAbducted = false;
                this.targetCow = null;
            }
            this.lightning.active = false;
        }

        // Actualizar láseres
        this.laserBeams.forEach((b, i) => {
            b.update(deltaTime);
            if (b.life <= 0) this.laserBeams.splice(i, 1);
        });
    }

    // --- LÓGICA DE HABILIDADES (sin cambios) ---
    updateShooting(deltaTime, trees) {
        this.shootCooldown -= deltaTime;
        if (this.shootCooldown <= 0) {
            this.shootCooldown = Math.random() * 3000 + 2000;
            if (Math.random() < 0.4 && !this.targetCow) {
                const targetTree = trees.find(t => 
                    !t.isBurning &&
                    t.x + (t.treeImg.width * t.scale) / 2 > this.x &&
                    t.x + (t.treeImg.width * t.scale) / 2 < this.x + this.width
                );
                if (targetTree) {
                    targetTree.isBurning = true;
                    const treeTopY = Config.CANVAS_HEIGHT - (targetTree.treeImg.height * targetTree.scale);
                    const treeCenterX = targetTree.x + (targetTree.treeImg.width * targetTree.scale) / 2;
                    this.laserBeams.push(new LaserBeam(treeCenterX, this.y + this.height / 2, treeTopY));
                }
            }
        }
    }
    updateAbduction(deltaTime, cycleProgress, cows, mooSoundBuffer) {
        const abductionWindowStart = 0.72;
        const abductionWindowEnd = 0.82;

        if (!this.targetCow && cycleProgress > abductionWindowStart && cycleProgress < abductionWindowEnd) {
            const potentialTarget = cows.find(cow => cow.visible && !cow.isAbducted && cow.x > this.x && cow.x < this.x + this.width);
            if (potentialTarget && Math.random() < 0.5) {
                this.targetCow = potentialTarget;
                this.targetCow.isAbducted = true;
                playSound(mooSoundBuffer);
            }
        }

        if (this.targetCow) {
            this.abductionBeamAngle += (deltaTime / 1000) * 1.5;
            this.targetCow.abductionProgress += (deltaTime / 1000) / 2.0;
            const targetX = this.x + this.width / 2;
            const targetY = this.y + this.height;
            this.targetCow.x = lerp(this.targetCow.x, targetX, 0.1);
            this.targetCow.y = lerp(this.targetCow.y, targetY, 0.1);

            if (this.targetCow.abductionProgress >= 1) {
                this.targetCow.visible = false;
                this.targetCow = null;
            }
        }
    }
    updateLightning(deltaTime) {
        this.lightning.strikeCooldown -= deltaTime;
        if (this.lightning.strikeCooldown <= 0) {
            this.lightning.active = true;
            this.lightning.alpha = 1.0;
            this.lightning.strikeCooldown = Math.random() * 8000 + 5000;
        }
        if (this.lightning.active) {
            this.lightning.alpha -= (deltaTime / 1000) * 4;
            if (this.lightning.alpha <= 0) this.lightning.active = false;
        }
    }

    // --- MÉTODO DE DIBUJO COMPLETAMENTE NUEVO ---
    draw(ctx) {
        if (!this.visible) return;

        ctx.save();
        const centerX = this.x + this.width / 2;
        const centerY = this.y;

        // Movimiento de balanceo natural
        const bobbing = Math.sin(this.bobbingAngle) * 4;
        ctx.translate(centerX, centerY + bobbing);

        // --- DIBUJAR COMPONENTES DEL OVNI ---
        this._drawEngineGlow(ctx);
        this._drawSaucerBody(ctx);
        this._drawRunningLights(ctx);
        this._drawDomeAndPilot(ctx);
        
        ctx.restore();
    }

    _drawEngineGlow(ctx) {
        const pulse = Math.sin(this.enginePulseAngle) * 0.5 + 0.5; // 0 a 1
        const glowRadius = (this.width / 2) * (1 + pulse * 0.3);
        const glowOpacity = 0.5 + pulse * 0.4;
        
        const glowGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, glowRadius);
        glowGradient.addColorStop(0, `rgba(127, 255, 212, ${glowOpacity})`); // Aguamarina
        glowGradient.addColorStop(0.5, `rgba(127, 255, 212, ${glowOpacity * 0.5})`);
        glowGradient.addColorStop(1, 'rgba(127, 255, 212, 0)');

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, this.height / 2, glowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawSaucerBody(ctx) {
        // 1. Anillo inferior oscuro (alberga las luces)
        ctx.fillStyle = '#454a4d';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Cuerpo principal del platillo con gradiente metálico
        const bodyGradient = ctx.createLinearGradient(0, -this.height, 0, this.height);
        bodyGradient.addColorStop(0, '#d0d3d4'); // Plata claro
        bodyGradient.addColorStop(0.5, '#aab1b5'); // Gris medio
        bodyGradient.addColorStop(1, '#808b96'); // Gris oscuro
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, -2, this.width / 2 * 0.95, this.height * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawRunningLights(ctx) {
        const numLights = 8;
        const lightRadius = this.width / 2 * 0.9;
        const lightYScale = this.height * 0.6;
        for (let i = 0; i < numLights; i++) {
            const angle = (this.lightsAngle + (i * Math.PI * 2 / numLights)) % (Math.PI * 2);
            // Solo dibujar las luces en la mitad frontal
            if (Math.sin(angle) > 0) {
                const lx = -Math.cos(angle) * lightRadius;
                const ly = Math.sin(angle) * lightYScale;
                const lightColor = this.lightColors[i % this.lightColors.length];
                
                ctx.save();
                ctx.translate(lx, ly);
                
                // Brillo de la luz
                const lightGradient = ctx.createRadialGradient(0,0,0,0,0,5);
                lightGradient.addColorStop(0, lightColor);
                lightGradient.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = lightGradient;
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();

                // Punto central de la luz
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        }
    }

    _drawDomeAndPilot(ctx) {
        const domeRadius = this.width / 3.5;
        const domeY = -this.height * 0.2;

        ctx.save();
        
        // Cúpula base
        const domeGradient = ctx.createLinearGradient(0, domeY - domeRadius, 0, domeY);
        domeGradient.addColorStop(0, 'rgba(173, 216, 230, 0.2)');
        domeGradient.addColorStop(1, 'rgba(173, 216, 230, 0.6)');
        ctx.fillStyle = domeGradient;
        ctx.beginPath();
        ctx.arc(0, domeY, domeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Silueta del piloto alienígena (dibujada dentro de la cúpula)
        ctx.fillStyle = 'rgba(20, 25, 30, 0.6)';
        ctx.beginPath();
        ctx.moveTo(0, domeY + domeRadius * 0.5); // base del cuello
        ctx.ellipse(0, domeY, domeRadius * 0.4, domeRadius * 0.7, 0, Math.PI, Math.PI * 2); // Cabeza
        ctx.fill();

        // Reflejo de la cúpula
        const highlightY = domeY - domeRadius * 0.5;
        const highlightX = -domeRadius * 0.3;
        const highlightGradient = ctx.createRadialGradient(highlightX, highlightY, 1, highlightX, highlightY, domeRadius * 0.8);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(0, domeY, domeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
    
    // --- MÉTODOS DE DIBUJO DE HABILIDADES (sin cambios) ---
    drawBeams(ctx) {
        this.laserBeams.forEach(b => b.draw(ctx));
        if (this.targetCow) {
            ctx.save();
            const beamCenterX = this.x + this.width / 2;
            const beamStartY = this.y + this.height / 2;
            const currentCowScale = this.targetCow.scale * (1 - this.targetCow.abductionProgress);
            const cowImgHeight = this.targetCow.cowImg.height * currentCowScale;
            const cowImgWidth = this.targetCow.cowImg.width * currentCowScale;
            const cowCenterX = this.targetCow.x;
            const cowCenterY = this.targetCow.y + cowImgHeight / 2;
            const beamWidthAtBase = 20;
            const beamWidthAtCow = cowImgWidth * 1.2;
            const alpha = this.targetCow.abductionProgress * 0.8 * (Math.sin(this.abductionBeamAngle * 10) * 0.1 + 0.9);
            const coneGradient = ctx.createLinearGradient(0, beamStartY, 0, cowCenterY);
            coneGradient.addColorStop(0, `rgba(180, 255, 180, ${alpha * 0.2})`);
            coneGradient.addColorStop(1, `rgba(180, 255, 180, 0)`);
            ctx.fillStyle = coneGradient;
            ctx.beginPath();
            ctx.moveTo(beamCenterX - beamWidthAtBase / 2, beamStartY);
            ctx.lineTo(beamCenterX + beamWidthAtBase / 2, beamStartY);
            ctx.lineTo(cowCenterX + beamWidthAtCow / 2, cowCenterY);
            ctx.lineTo(cowCenterX - beamWidthAtCow / 2, cowCenterY);
            ctx.closePath();
            ctx.fill();
            const numWraps = 4;
            for (let i = 0; i < numWraps; i++) {
                const wrapProgress = (this.abductionBeamAngle + i / numWraps) % 1;
                const y = lerp(beamStartY, cowCenterY, wrapProgress);
                const widthAtY = lerp(beamWidthAtBase, beamWidthAtCow, wrapProgress);
                const x = lerp(beamCenterX, cowCenterX, wrapProgress);
                const strandAlpha = (1 - wrapProgress) * alpha * 0.8;
                ctx.strokeStyle = `rgba(220, 255, 220, ${strandAlpha})`;
                ctx.lineWidth = 1.5;
                ctx.shadowColor = 'rgba(180, 255, 180, 1)';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                const ellipseHeight = Math.max(2, 12 * (1 - wrapProgress));
                ctx.ellipse(x, y, widthAtY / 2, ellipseHeight / 2, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }
    drawLightning(ctx) {
        if (this.lightning.active && this.lightning.alpha > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${this.lightning.alpha * 0.8})`;
            ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
            ctx.restore();
        }
    }
}

