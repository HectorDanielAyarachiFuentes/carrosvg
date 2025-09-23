export default class HUD {
    constructor(radio) {
        this.radio = radio;

        // Obtener referencias a los elementos del DOM
        this.hudPanelElement = document.getElementById('hud-panel');
        this.controlsElement = document.getElementById('hud-controls');
        this.nowPlayingElement = document.getElementById('hud-now-playing');
        this.mobileControlsElement = document.getElementById('mobile-controls');
        this.timeDisplayElement = document.getElementById('hud-time-display');
        this.speedDisplayElement = document.getElementById('hud-speed-display');

        // --- Typewriter state ---
        this.typewriterTargetText = '';
        this.typewriterCurrentText = '';
        this.typewriterIndex = 0;
        this.typewriterTimer = 0;
        this.typewriterSpeed = 40; // ms per character
        this.isTyping = false;

        // --- Glitch and Pulse state ---
        this.glitchCooldown = 8000; // Time until next possible glitch
        this.glitchTimer = this.glitchCooldown + Math.random() * 5000; // Start with a random delay
        this.isGlitching = false;
        this.glitchDuration = 0;

        // Poblar el panel de controles estático una sola vez
        if (this.controlsElement) {
            this.controlsElement.innerHTML = `
                <span><strong>← →</strong> Acelerar/Frenar</span>
                <span><strong>R</strong> Radio On/Off</span>
                <span><strong>M</strong> Cambiar Canción</span>
            `;
        }

        // Obtener referencias a los iconos de día/noche
        this.sunIcon = document.querySelector('#hud-day-night-icon .sun');
        this.moonIcon = document.querySelector('#hud-day-night-icon .moon');
    }

    // Este método se llamará en cada frame para actualizar partes dinámicas del HUD
    update(isNight, deltaTime, cycleProgress, truckSpeed) {
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

        // Actualizar la hora del ciclo
        if (this.timeDisplayElement && cycleProgress !== undefined) {
            const totalMinutesInDay = 24 * 60;
            const startOffsetMinutes = 6 * 60; // El día empieza a las 06:00
            const elapsedMinutes = cycleProgress * totalMinutesInDay;
            const currentTotalMinutes = (startOffsetMinutes + elapsedMinutes) % totalMinutesInDay;

            const hours = Math.floor(currentTotalMinutes / 60);
            const minutes = Math.floor(currentTotalMinutes % 60);

            const formattedHours = String(hours).padStart(2, '0');
            const formattedMinutes = String(minutes).padStart(2, '0');

            this.timeDisplayElement.textContent = `${formattedHours}:${formattedMinutes}`;
        }

        // Actualizar el indicador de velocidad
        if (this.speedDisplayElement && truckSpeed !== undefined) {
            // Mapear el speedMultiplier (0.2 a 2.5) a un rango de 0 a 180 km/h
            const minSpeed = 0.2;
            const maxSpeed = 2.5;
            const displaySpeed = Math.round(((truckSpeed - minSpeed) / (maxSpeed - minSpeed)) * 180);
            this.speedDisplayElement.innerHTML = `${Math.max(0, displaySpeed)} <span>km/h</span>`;

            // --- NUEVO: Efecto de parpadeo a máxima velocidad ---
            const atMaxSpeed = truckSpeed >= maxSpeed;
            this.speedDisplayElement.classList.toggle('max-speed', atMaxSpeed);
        }

        // --- Rhythm and Glitch Effects ---
        if (this.radio.isRadioOn) {
            // Rhythm Pulse Effect
            const bassLevel = this.radio.getBassLevel();
            const pulseScale = 1 + bassLevel * 0.03; // Subtle pulse
            if (this.hudPanelElement) this.hudPanelElement.style.setProperty('--hud-pulse-scale', pulseScale);
            if (this.mobileControlsElement) this.mobileControlsElement.style.setProperty('--hud-pulse-scale', pulseScale);

            // Glitch Effect Logic
            this.glitchTimer -= deltaTime;
            if (this.glitchTimer <= 0 && !this.isGlitching) {
                this.isGlitching = true;
                this.glitchDuration = Math.random() * 150 + 100; // Glitch for 100-250ms
                if (this.hudPanelElement) this.hudPanelElement.classList.add('glitch-active');
                if (this.mobileControlsElement) this.mobileControlsElement.classList.add('glitch-active');
            }

            if (this.isGlitching) {
                this.glitchDuration -= deltaTime;
                if (this.glitchDuration <= 0) {
                    this.isGlitching = false;
                    this.glitchTimer = this.glitchCooldown + Math.random() * 10000; // Cooldown for 8-18s
                    if (this.hudPanelElement) this.hudPanelElement.classList.remove('glitch-active');
                    if (this.mobileControlsElement) this.mobileControlsElement.classList.remove('glitch-active');
                }
            }
        } else {
            // Reset effects when radio is off
            if (this.isGlitching) {
                this.isGlitching = false;
                if (this.hudPanelElement) this.hudPanelElement.classList.remove('glitch-active');
                if (this.mobileControlsElement) this.mobileControlsElement.classList.remove('glitch-active');
            }
            if (this.hudPanelElement) this.hudPanelElement.style.setProperty('--hud-pulse-scale', 1);
            if (this.mobileControlsElement) this.mobileControlsElement.style.setProperty('--hud-pulse-scale', 1);
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