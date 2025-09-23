import { getAudioContext } from '../js/audio.js';
import { loadAudio } from '../js/utils.js';

export default class Radio {
    constructor(musicTracks, truck) {
        this.musicTracks = musicTracks || [];
        this.truck = truck; // Referencia al camión para obtener su posición

        this.isRadioOn = false;
        this.isLoading = false;
        this.radioAudioSource = null;
        this.visualizerAngle = 0;
        this.rKeyPressed = false; // Para manejar una sola pulsación de tecla
        this.mKeyPressed = false; // Para cambiar de canción
        this.currentTrackIndex = 0;
        this.songJustChanged = false; // Flag for particle effect
    }

    async toggle() {
        const audioCtx = getAudioContext();
        if (!audioCtx || this.musicTracks.length === 0) return;

        // --- APAGAR LA RADIO ---
        if (this.isRadioOn) {
            if (this.radioAudioSource) {
                this.radioAudioSource.stop();
                this.radioAudioSource = null;
            }
            this.isRadioOn = false;
            return;
        }

        // --- ENCENDER LA RADIO ---
        if (this.isLoading) return; // Evitar múltiples cargas simultáneas

        this.isLoading = true;
        
        const currentTrack = this.musicTracks[this.currentTrackIndex];
        if (!currentTrack) {
            this.isLoading = false;
            return;
        }

        // Si el buffer de la canción no está cargado, cargarlo ahora.
        if (!currentTrack.buffer) {
            currentTrack.buffer = await loadAudio(currentTrack.src, audioCtx);
        }

        this.isLoading = false;

        // Si la carga falló, o si el usuario apagó la radio mientras cargaba
        if (!currentTrack.buffer || this.isRadioOn) {
            if (!currentTrack.buffer) console.error(`No se pudo cargar la canción: ${currentTrack.name}`);
            return;
        }

        // Reanudar el contexto de audio si está suspendido (necesario por políticas del navegador)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        this.radioAudioSource = audioCtx.createBufferSource();
        this.radioAudioSource.buffer = currentTrack.buffer;
        this.radioAudioSource.connect(audioCtx.destination);
        this.radioAudioSource.loop = true;
        this.radioAudioSource.start(0);
        this.isRadioOn = true;
    }

    async changeTrack() {
        if (this.musicTracks.length <= 1) return;

        this.songJustChanged = true; // Set flag for particle effect

        const wasOn = this.isRadioOn;
        if (wasOn) {
            // Apaga la música actual de forma síncrona
            if (this.radioAudioSource) {
                this.radioAudioSource.stop();
                this.radioAudioSource = null;
            }
            this.isRadioOn = false;
        }

        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicTracks.length;

        // Si la radio estaba encendida, intenta encenderla con la nueva canción
        if (wasOn) {
            await this.toggle(); // toggle se encargará de cargar y reproducir
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

        if (keys.KeyM && keys.KeyM.pressed) {
            if (!this.mKeyPressed) {
                this.changeTrack();
                this.mKeyPressed = true;
            }
        } else {
            this.mKeyPressed = false;
        }

        if (this.isRadioOn) {
            this.visualizerAngle += deltaTime * 0.01;
        }
    }

    getCurrentTrackName() {
        if (this.musicTracks.length > 0 && this.musicTracks[this.currentTrackIndex]) {
            return this.musicTracks[this.currentTrackIndex].name;
        }
        return 'Silencio';
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