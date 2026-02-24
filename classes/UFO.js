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
        // OPTIMIZACIÓN: Iterar hacia atrás para eliminar elementos de forma segura y eficiente.
        for (let i = this.laserBeams.length - 1; i >= 0; i--) {
            const b = this.laserBeams[i];
            b.update(deltaTime);
            if (b.life <= 0) this.laserBeams.splice(i, 1);
        }
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
        const pulse = Math.sin(this.enginePulseAngle) * 0.5 + 0.5; // 0 to 1
        const glowRadius = (this.width / 2) * (0.8 + pulse * 0.4);
        const glowOpacity = 0.6 + pulse * 0.4;

        ctx.save();
        // Central engine core
        const coreGradient = ctx.createRadialGradient(0, this.height * 0.5, 0, 0, this.height * 0.5, glowRadius * 0.4);
        coreGradient.addColorStop(0, `rgba(0, 255, 255, ${glowOpacity})`);
        coreGradient.addColorStop(1, 'rgba(0, 200, 255, 0)');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.ellipse(0, this.height * 0.5, glowRadius * 0.6, glowRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main glow
        const glowGradient = ctx.createRadialGradient(0, this.height * 0.5, 5, 0, this.height * 0.5, glowRadius);
        glowGradient.addColorStop(0, `rgba(50, 255, 200, ${glowOpacity * 0.5})`);
        glowGradient.addColorStop(1, 'rgba(50, 255, 200, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, this.height * 0.5, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _drawSaucerBody(ctx) {
        const rx = this.width / 2;
        const ry = this.height * 0.6; // Flatter saucer

        // Bottom chassis (dark)
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.ellipse(0, 4, rx * 0.9, ry * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mid chassis (holds the lights)
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.ellipse(0, 2, rx * 0.95, ry * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();

        // Top saucer hull
        const bodyGrad = ctx.createLinearGradient(0, -ry * 2, 0, ry);
        bodyGrad.addColorStop(0, '#ffffff'); // Shiny highlight
        bodyGrad.addColorStop(0.3, '#bdc3c7'); // Silver
        bodyGrad.addColorStop(1, '#7f8c8d');   // Darker edge
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        // Center ring detailing (inner panel line)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, -1, rx * 0.6, ry * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 1, rx * 0.6, ry * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    _drawRunningLights(ctx) {
        const numLights = 10;
        const rx = this.width / 2 * 0.95;
        const ry = this.height * 0.6 * 0.95;

        ctx.save();
        for (let i = 0; i < numLights; i++) {
            const angle = (this.lightsAngle + (i * Math.PI * 2 / numLights)) % (Math.PI * 2);
            // Draw only lights facing the front (perspective)
            if (Math.sin(angle) >= -0.1) {
                const lx = Math.cos(angle) * rx;
                const ly = 2 + Math.sin(angle) * ry;

                const lightColor = this.lightColors[i % this.lightColors.length];

                // Light glow
                ctx.shadowColor = lightColor;
                ctx.shadowBlur = 12;
                ctx.fillStyle = lightColor;
                ctx.beginPath();
                ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
                ctx.fill();

                // Bright center
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(lx, ly, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    _drawDomeAndPilot(ctx) {
        const domeRadius = this.width * 0.35;
        const domeY = -this.height * 0.3;

        ctx.save();

        // 1. Draw Alien Pilot
        // Alien body/shoulders
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.ellipse(0, domeY + domeRadius * 0.2, domeRadius * 0.4, domeRadius * 0.4, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // Alien head
        ctx.beginPath();
        ctx.ellipse(0, domeY - domeRadius * 0.2, domeRadius * 0.45, domeRadius * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (Large black slanted ovals)
        ctx.fillStyle = '#111';
        // Left eye
        ctx.beginPath();
        ctx.ellipse(-domeRadius * 0.2, domeY - domeRadius * 0.2, domeRadius * 0.1, domeRadius * 0.18, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        // Right eye
        ctx.beginPath();
        ctx.ellipse(domeRadius * 0.2, domeY - domeRadius * 0.2, domeRadius * 0.1, domeRadius * 0.18, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlights
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-domeRadius * 0.23, domeY - domeRadius * 0.25, domeRadius * 0.03, 0, Math.PI * 2);
        ctx.arc(domeRadius * 0.17, domeY - domeRadius * 0.25, domeRadius * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // 2. Glass Dome
        const domeGradient = ctx.createLinearGradient(0, domeY - domeRadius, 0, domeY + domeRadius);
        domeGradient.addColorStop(0, 'rgba(173, 216, 230, 0.7)');
        domeGradient.addColorStop(0.3, 'rgba(173, 216, 230, 0.2)');
        domeGradient.addColorStop(0.8, 'rgba(173, 216, 230, 0.1)');
        domeGradient.addColorStop(1, 'rgba(173, 216, 230, 0.6)');
        ctx.fillStyle = domeGradient;

        ctx.beginPath();
        // Top arc of the dome
        ctx.arc(0, domeY, domeRadius, Math.PI, 0, false);
        // Bottom curve connecting to the saucer
        ctx.ellipse(0, domeY, domeRadius, domeRadius * 0.3, 0, 0, Math.PI, false);
        ctx.fill();

        // 3. Highlight / glare on the glass
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-domeRadius * 0.3, domeY - domeRadius * 0.4, domeRadius * 0.25, domeRadius * 0.15, -Math.PI / 6, 0, Math.PI * 2);
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
