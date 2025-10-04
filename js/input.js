import { resumeAudio } from './audio.js';

export const keys = {
    // Teclas de movimiento
    ArrowRight: false,
    ArrowLeft: false,
    // Teclas de la radio (se usarán para detectar una sola pulsación)
    r: false, R: false,
    m: false, M: false,
};

export function setupInputHandlers() {
    // Reanudar audio en la primera interacción del usuario (teclado o clic/táctil)
    const resumeOnce = () => {
        resumeAudio();
        window.removeEventListener('keydown', resumeOnce);
        window.removeEventListener('mousedown', resumeOnce);
        window.removeEventListener('touchstart', resumeOnce);
    };
    window.addEventListener('keydown', resumeOnce);
    window.addEventListener('mousedown', resumeOnce);
    window.addEventListener('touchstart', resumeOnce);

    window.addEventListener('keydown', (e) => {
        if (e.key in keys) keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
        if (e.key in keys) keys[e.key] = false;
    });
}