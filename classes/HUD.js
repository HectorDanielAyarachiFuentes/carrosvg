export default class HUD {
    constructor(radio) {
        this.radio = radio;

        // Obtener referencias a los elementos del DOM
        this.hudPanelElement = document.getElementById('hud-panel');
        this.controlsElement = document.getElementById('hud-controls');
        this.nowPlayingElement = document.getElementById('hud-now-playing');
        this.mobileControlsElement = document.getElementById('mobile-controls');

        // Poblar el panel de controles estático una sola vez
        if (this.controlsElement) {
            this.controlsElement.innerHTML = `
                <span><strong>← →</strong> Acelerar/Frenar</span>
                <span><strong>R</strong> Radio On/Off</span>
                <span><strong>M</strong> Cambiar Canción</span>
            `;
        }
    }

    // Este método se llamará en cada frame para actualizar partes dinámicas del HUD
    update(isNight) {
        // Aplicar clases de tema al HUD de escritorio
        if (this.hudPanelElement) {
            this.hudPanelElement.classList.toggle('night-mode', isNight);
            this.hudPanelElement.classList.toggle('radio-on', this.radio.isRadioOn);
        }

        // Aplicar clases de tema al HUD móvil
        if (this.mobileControlsElement) {
            this.mobileControlsElement.classList.toggle('night-mode', isNight);
            this.mobileControlsElement.classList.toggle('radio-on', this.radio.isRadioOn);
        }

        // Actualizar el texto "Now Playing" en el HUD de escritorio
        if (this.nowPlayingElement) {
            if (this.radio.isLoading) {
                this.nowPlayingElement.innerHTML = `♪ Cargando...`;
                this.nowPlayingElement.classList.add('visible');
            } else if (this.radio.isRadioOn) {
                const trackName = this.radio.getCurrentTrackName();
                this.nowPlayingElement.innerHTML = `♪ ${trackName}`;
                this.nowPlayingElement.classList.add('visible');
            } else {
                this.nowPlayingElement.classList.remove('visible');
            }
        }
    }
}