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
        
        this.laserBeams = [];
        this.lightning = {
            active: false,
            alpha: 0,
            strikeCooldown: Math.random() * 5000 + 3000,
        };
    }

    update(deltaTime, cycleProgress, trees, cows, mooSoundBuffer) {
        this.visible = cycleProgress > 0.55 && cycleProgress < 0.95;

        if (this.visible) {
            const ufoCycle = (cycleProgress - 0.55) / (0.95 - 0.55);
            this.x = lerp(-100, Config.CANVAS_WIDTH + 50, ufoCycle);
            this.y = lerp(60, 100, ufoCycle);
            this.lightsAngle += deltaTime * 0.01;

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
        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y, this.width / 2, this.height, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y, this.width / 4, Math.PI, 0);
        ctx.fill();
        ctx.restore();
    }

    drawBeams(ctx) {
        this.laserBeams.forEach(b => b.draw(ctx));

        if (this.targetCow) {
            const beamX = this.x + this.width / 2;
            const beamStartY = this.y + this.height / 2;
            
            const currentCowScale = this.targetCow.scale * (1 - this.targetCow.abductionProgress);
            const cowImgWidth = this.targetCow.cowImg.width * currentCowScale;
            const cowDrawX = this.targetCow.x - cowImgWidth / 2;
            const cowCenterY = this.targetCow.y + (this.targetCow.cowImg.height * currentCowScale) / 2;

            const alpha = this.targetCow.abductionProgress * 0.7 * (Math.random() > 0.1 ? 1.0 : 0.8);

            const gradient = ctx.createLinearGradient(beamX, beamStartY, beamX, cowCenterY);
            gradient.addColorStop(0, `rgba(155, 255, 155, ${alpha})`);
            gradient.addColorStop(1, `rgba(200, 255, 200, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(beamX - 15, beamStartY);
            ctx.lineTo(beamX + 15, beamStartY);
            ctx.lineTo(cowDrawX + cowImgWidth, cowCenterY);
            ctx.lineTo(cowDrawX, cowCenterY);
            ctx.closePath();
            ctx.fill();
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