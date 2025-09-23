export default class HUD {
    constructor(radio) {
        this.radio = radio;

        // Obtener referencias a los elementos del DOM
        this.hudPanelElement = document.getElementById('hud-panel');
        this.controlsElement = document.getElementById('hud-controls');
        this.nowPlayingElement = document.getElementById('hud-now-playing');
        this.mobileControlsElement = document.getElementById('mobile-controls');
        this.dayNightIconElement = document.getElementById('hud-day-night-icon');

        // --- Typewriter state ---
        this.typewriterTargetText = '';
        this.typewriterCurrentText = '';
        this.typewriterIndex = 0;
        this.typewriterTimer = 0;
        this.typewriterSpeed = 40; // ms per character
        this.isTyping = false;

        // Poblar el panel de controles estático una sola vez
        if (this.controlsElement) {
            this.controlsElement.innerHTML = `
                <span><strong>← →</strong> Acelerar/Frenar</span>
                <span><strong>R</strong> Radio On/Off</span>
                <span><strong>M</strong> Cambiar Canción</span>
            `;
        }

        // Poblar el icono de día/noche
        if (this.dayNightIconElement) {
            this.dayNightIconElement.innerHTML = `
                <span class="sun">☀️</span>
                <span class="moon">🌙</span>
            `;
            this.sunIcon = this.dayNightIconElement.querySelector('.sun');
            this.moonIcon = this.dayNightIconElement.querySelector('.moon');
        }
    }

    // Este método se llamará en cada frame para actualizar partes dinámicas del HUD
    update(isNight, deltaTime) {
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

        // Actualizar icono día/noche
        if (this.sunIcon && this.moonIcon) {
            this.sunIcon.classList.toggle('visible', !isNight);
            this.moonIcon.classList.toggle('visible', isNight);
        }

        // --- Lógica del efecto máquina de escribir ---
        if (this.nowPlayingElement) {
            const shouldBeVisible = this.radio.isRadioOn || this.radio.isLoading;
            const targetText = this.radio.isLoading ? '♪ Cargando...' : `♪ ${this.radio.getCurrentTrackName()}`;

            // 1. Detectar cambio de texto para iniciar/reiniciar el efecto
            if (shouldBeVisible && targetText !== this.typewriterTargetText) {
                this.typewriterTargetText = targetText;
                this.typewriterCurrentText = '';
                this.typewriterIndex = 0;
                this.typewriterTimer = 0;
                this.isTyping = true;
            }

            // 2. Animar el texto si está en modo "typing"
            if (this.isTyping) {
                this.typewriterTimer += deltaTime;
                if (this.typewriterTimer >= this.typewriterSpeed) {
                    this.typewriterTimer = 0;
                    if (this.typewriterIndex < this.typewriterTargetText.length) {
                        this.typewriterIndex++;
                        this.typewriterCurrentText = this.typewriterTargetText.substring(0, this.typewriterIndex);
                    } else {
                        this.isTyping = false; // Terminar de escribir
                    }
                }
            }
            
            // 3. Actualizar el DOM
            if (shouldBeVisible) {
                this.nowPlayingElement.innerHTML = this.typewriterCurrentText;
                this.nowPlayingElement.classList.add('visible');
                this.nowPlayingElement.classList.toggle('typing', this.isTyping);
            } else {
                // Si no debe ser visible, reseteamos todo
                this.nowPlayingElement.classList.remove('visible');
                this.nowPlayingElement.classList.remove('typing');
                this.typewriterTargetText = '';
                this.isTyping = false;
            }
        }
    }
}