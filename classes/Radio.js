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
                this.radioAudioSource.disconnect();
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

        // --- NUEVO: Configurar Analyser para el ritmo ---
        this.analyser = audioCtx.createAnalyser();
        this.analyser.fftSize = 256; // Tamaño pequeño para buen rendimiento
        const bufferLength = this.analyser.frequencyBinCount;
        this.frequencyData = new Uint8Array(bufferLength);

        this.radioAudioSource = audioCtx.createBufferSource();
        this.radioAudioSource.buffer = currentTrack.buffer;
        this.radioAudioSource.loop = true;
        this.radioAudioSource.connect(this.analyser);
        this.analyser.connect(audioCtx.destination);
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
                this.radioAudioSource.disconnect();
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
        // Asumiendo que input.js provee un estado 'justPressed'
        if (keys.KeyR?.justPressed) {
            this.toggle();
        }

        // Asumiendo que input.js provee un estado 'justPressed'
        if (keys.KeyM?.justPressed) {
            this.changeTrack();
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

    getBassLevel() {
        if (!this.isRadioOn || !this.analyser) {
            return 0;
        }
        this.analyser.getByteFrequencyData(this.frequencyData);

        // Las frecuencias bajas están en los primeros bins del array.
        // Tomamos un promedio de los primeros 4 bins (aprox. 0-172Hz con fftSize 256 y 44.1kHz)
        const bassBins = this.frequencyData.slice(0, 4);
        const average = bassBins.reduce((sum, value) => sum + value, 0) / bassBins.length;

        // Normalizar el valor (0-255) a un rango de 0-1 para usarlo fácilmente.
        return average / 255;
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