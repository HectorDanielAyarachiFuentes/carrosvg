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

        // --- NUEVO: Estado para manejar pulsaciones de teclas únicas ---
        this.rKeyPressed = false;
        this.mKeyPressed = false;
    }

    // --- REESTRUCTURADO: Lógica más clara y robusta ---

    /** Detiene la reproducción actual y limpia los recursos de audio. */
    stopPlayback() {
        if (this.radioAudioSource) {
            this.radioAudioSource.stop();
            this.radioAudioSource.disconnect();
            if (this.analyser) this.analyser.disconnect();
            this.radioAudioSource = null;
        }
        this.isRadioOn = false;
    }

    /** Inicia la reproducción de la pista actual. */
    startPlayback() {
        const audioCtx = getAudioContext();
        const currentTrack = this.musicTracks[this.currentTrackIndex];

        // Asegurarse de que el contexto de audio esté activo
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Configurar Analyser para el ritmo
        this.analyser = audioCtx.createAnalyser();
        this.analyser.fftSize = 256; // Tamaño pequeño para buen rendimiento
        const bufferLength = this.analyser.frequencyBinCount;
        this.frequencyData = new Uint8Array(bufferLength);

        // Crear y conectar la fuente de audio
        this.radioAudioSource = audioCtx.createBufferSource();
        this.radioAudioSource.buffer = currentTrack.buffer;
        this.radioAudioSource.loop = true;
        this.radioAudioSource.connect(this.analyser);
        this.analyser.connect(audioCtx.destination);
        this.radioAudioSource.start(0);

        this.isRadioOn = true;
    }

    async toggle() {
        if (this.isLoading) return; // No hacer nada si ya se está procesando una acción

        // Si la radio está encendida, simplemente la apagamos.
        if (this.isRadioOn) {
            this.stopPlayback();
            return;
        }

        // Si está apagada, intentamos encenderla.
        this.isLoading = true;

        const audioCtx = getAudioContext();
        const currentTrack = this.musicTracks[this.currentTrackIndex];

        if (!currentTrack) {
            this.isLoading = false;
            return;
        }

        // Cargar el audio si no está ya en el buffer
        if (!currentTrack.buffer) {
            try {
                currentTrack.buffer = await loadAudio(currentTrack.src, audioCtx);
            } catch (error) {
                console.error(`Error al cargar la canción: ${currentTrack.name}`, error);
                currentTrack.buffer = null; // Marcar como fallido
            }
        }

        this.isLoading = false;

        // Si el buffer existe (la carga fue exitosa), iniciar la reproducción.
        if (currentTrack.buffer) {
            this.startPlayback();
        }
    }

    async changeTrack() {
        if (this.musicTracks.length <= 1) return;

        this.songJustChanged = true; // Set flag for particle effect

        // Detener la reproducción actual antes de cambiar de pista.
        this.stopPlayback();

        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicTracks.length;

        // --- MODIFICADO: Siempre enciende la radio al cambiar de canción ---
        // Esto hace que la tecla 'M' sea más útil: siempre resulta en música sonando.
        await this.toggle(); // Llama a toggle para cargar (si es necesario) y reproducir la nueva pista.
    }

    update(deltaTime, keys) {
        // --- MODIFICADO: Lógica para detectar una sola pulsación de tecla ---
        // Tecla 'R' o 'r' para encender/apagar la radio
        if ((keys.r || keys.R) && !this.rKeyPressed) {
            this.toggle(); // Llama a la función de encendido/apagado
            this.rKeyPressed = true; // Marcar como presionada
        } else if (!keys.r && !keys.R) {
            this.rKeyPressed = false; // Resetear cuando se suelta
        }

        // Tecla 'M' o 'm' para cambiar de canción
        if ((keys.m || keys.M) && !this.mKeyPressed) {
            this.changeTrack();
            this.mKeyPressed = true; // Marcar como presionada
        } else if (!keys.m && !keys.M) {
            this.mKeyPressed = false; // Resetear cuando se suelta
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