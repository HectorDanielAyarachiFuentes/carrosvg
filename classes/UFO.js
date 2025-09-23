import * as Config from '../js/config.js';
import { lerp } from '../js/utils.js';
import { playSound } from '../js/audio.js';
import LaserBeam from './LaserBeam.js';

export default class UFO {
    constructor() {
        this.x = -100;
        this.y = 60;
        this.width = 60;
        this.height = 18;
        this.lightsAngle = 0;
        this.visible = false;
        this.targetCow = null;
        this.shootCooldown = 0;
        this.abductionBeamAngle = 0;
        
        this.laserBeams = [];
        this.lightning = {
            active: false,
            alpha: 0,
            strikeCooldown: Math.random() * 5000 + 3000,
        };
        this.lightColors = ['#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', '#ff9933'];
    }

    update(deltaTime, cycleProgress, trees, cows, mooSoundBuffer) {
        this.visible = cycleProgress > 0.55 && cycleProgress < 0.95;

        if (this.visible) {
            const ufoCycle = (cycleProgress - 0.55) / (0.95 - 0.55);
            this.x = lerp(-100, Config.CANVAS_WIDTH + 50, ufoCycle);
            this.y = lerp(60, 100, ufoCycle);
            this.lightsAngle += deltaTime * 0.003;

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

        if (!this.targetCow && cycleProgress > abductionWindowStart &&
            cycleProgress < abductionWindowEnd) {
            const potentialTarget = cows.find(cow =>
                cow.visible &&
                !cow.isAbducted &&
                cow.x > this.x &&
                cow.x < this.x + this.width
            );

            if (potentialTarget && Math.random() < 0.5) {
                this.targetCow = potentialTarget;
                this.targetCow.isAbducted = true;
                playSound(mooSoundBuffer);
            }
        }

        if (this.targetCow) {
            this.abductionBeamAngle += (deltaTime / 1000) * 1.5; // Velocidad de la animación del vórtice
            this.targetCow.abductionProgress += (deltaTime / 1000) / 2.0; // 2 seconds to abduct

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
            if (this.lightning.alpha <= 0) {
                this.lightning.active = false;
            }
        }
    }

    draw(ctx) {
        if (!this.visible) return;

        ctx.save();
        const centerX = this.x + this.width / 2;
        const centerY = this.y;

        // 1. Underside shadow/dark part to give depth
        ctx.fillStyle = '#505a5b'; // Dark metallic grey
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 2, this.width / 2, this.height, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Main saucer body with a metallic gradient
        const bodyGradient = ctx.createLinearGradient(centerX, centerY - this.height, centerX, centerY + this.height);
        bodyGradient.addColorStop(0, '#b0c4de'); // Light steel blue on top
        bodyGradient.addColorStop(0.5, '#778899'); // Light slate gray in middle
        bodyGradient.addColorStop(1, '#505a5b');   // Darker at the bottom
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, this.width / 2, this.height, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Animated running lights along the rim
        const numLights = 7;
        const lightRadius = this.width / 2 * 0.95;
        const lightYScale = this.height * 0.6;
        for (let i = 0; i < numLights; i++) {
            // Animate lights moving along the front rim
            const angle = (this.lightsAngle + (i * Math.PI / numLights)) % Math.PI;
            const lx = centerX - Math.cos(angle) * lightRadius;
            const ly = centerY + Math.sin(angle) * lightYScale;

            const lightColor = this.lightColors[i % this.lightColors.length];
            ctx.fillStyle = lightColor;
            ctx.shadowColor = lightColor;
            ctx.shadowBlur = 7;
            ctx.beginPath();
            ctx.arc(lx, ly, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0; // Reset shadow for other elements

        // 4. Glass dome with a highlight for a 3D effect
        const domeRadius = this.width / 4;
        const domeHeight = this.height * 0.8;
        const domeY = centerY - domeHeight * 0.6;

        const domeGradient = ctx.createRadialGradient(
            centerX - domeRadius * 0.3, domeY - domeHeight * 0.3, 1, 
            centerX, domeY, domeRadius
        );
        domeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)'); // Specular highlight
        domeGradient.addColorStop(1, 'rgba(173, 216, 230, 0.4)'); // Light blue, semi-transparent

        ctx.fillStyle = domeGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, domeRadius, Math.PI, 0); // Draw a semicircle for the dome
        ctx.fill();

        ctx.restore();
    }
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

            // Alpha pulsante para un efecto de fluctuación de energía
            const alpha = this.targetCow.abductionProgress * 0.8 * (Math.sin(this.abductionBeamAngle * 10) * 0.1 + 0.9);

            // 1. Cono exterior de luz suave
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

            // 2. Anillos de energía en espiral para crear el vórtice
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