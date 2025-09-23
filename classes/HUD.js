export default class HUD {
    constructor(radio) {
        this.radio = radio;

        // Obtener referencias a los elementos del DOM
        this.hudPanelElement = document.getElementById('hud-panel');
        this.controlsElement = document.getElementById('hud-controls');
        this.nowPlayingElement = document.getElementById('hud-now-playing');

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
        if (!this.nowPlayingElement || !this.hudPanelElement) return;

        // Cambiar el tema del HUD según la hora del día
        this.hudPanelElement.classList.toggle('night-mode', isNight);

        // Añadir clase para el efecto arcoiris si la radio está encendida
        this.hudPanelElement.classList.toggle('radio-on', this.radio.isRadioOn);

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