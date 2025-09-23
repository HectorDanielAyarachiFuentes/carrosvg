import { getAudioContext } from '../js/audio.js';

export default class Radio {
    constructor(radioMusicBuffer, truck) {
        this.radioMusicBuffer = radioMusicBuffer;
        this.truck = truck; // Referencia al camión para obtener su posición

        this.isRadioOn = false;
        this.radioAudioSource = null;
        this.visualizerAngle = 0;
        this.rKeyPressed = false; // Para manejar una sola pulsación de tecla
    }

    toggle() {
        const audioCtx = getAudioContext();
        if (!audioCtx || !this.radioMusicBuffer) return;

        if (this.isRadioOn) {
            if (this.radioAudioSource) {
                this.radioAudioSource.stop();
                this.radioAudioSource = null;
            }
            this.isRadioOn = false;
        } else {
            // Reanudar el contexto de audio si está suspendido
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            this.radioAudioSource = audioCtx.createBufferSource();
            this.radioAudioSource.buffer = this.radioMusicBuffer;
            this.radioAudioSource.connect(audioCtx.destination);
            this.radioAudioSource.loop = true;
            this.radioAudioSource.start(0);
            this.isRadioOn = true;
        }
    }

    update(deltaTime, keys) {
        if (keys.KeyR && keys.KeyR.pressed) {
            if (!this.rKeyPressed) {
                this.toggle();
                this.rKeyPressed = true;
            }
        } else {
            this.rKeyPressed = false;
        }

        if (this.isRadioOn) {
            this.visualizerAngle += deltaTime * 0.01;
        }
    }

    draw(ctx) {
        if (!this.isRadioOn) return;

        // Posicionar el visualizador relativo a la cabina del camión
        const cabinX = this.truck.x + 75;
        const cabinY = this.truck.y - 15;

        ctx.save();
        ctx.font = "bold 22px 'Comic Sans MS', cursive, sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = '#ff69b4';
        ctx.shadowBlur = 5;

        // Primera nota
        const alpha1 = 0.6 + Math.sin(this.visualizerAngle * 1.2) * 0.4;
        const note1Y = cabinY - 10 + Math.sin(this.visualizerAngle) * 6;
        ctx.fillStyle = `rgba(255, 105, 180, ${alpha1})`;
        ctx.fillText("♪", cabinX, note1Y);

        // Segunda nota
        const alpha2 = 0.6 + Math.sin(this.visualizerAngle * 1.2 + Math.PI) * 0.4;
        const note2Y = cabinY - 5 + Math.sin(this.visualizerAngle + Math.PI / 1.5) * 6;
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha2})`;
        ctx.fillText("♫", cabinX + 20, note2Y);
        
        ctx.restore();
    }
}