export default class HUD {
    constructor(radio) {
        this.radio = radio;

        // Obtener referencias a los elementos del DOM
        this.controlsElement = document.getElementById('hud-controls');
        this.nowPlayingElement = document.getElementById('hud-now-playing');

        // Poblar el panel de controles estático una sola vez
        if (this.controlsElement) {
            this.controlsElement.innerHTML = `
                <p>← → : Acelerar/Frenar</p>
                <p>  R : Radio On/Off</p>
                <p>  M : Cambiar Canción</p>
            `;
        }
    }

    // Este método se llamará en cada frame para actualizar partes dinámicas del HUD
    update() {
        if (!this.nowPlayingElement) return;

        if (this.radio.isRadioOn) {
            const trackName = this.radio.getCurrentTrackName();
            this.nowPlayingElement.innerHTML = `♪ ${trackName}`;
            this.nowPlayingElement.style.display = 'block';
        } else {
            this.nowPlayingElement.style.display = 'none';
        }
    }
}