import { resumeAudio } from './audio.js';

export const keys = {
    ArrowRight: false,
    ArrowLeft: false,
    // La radio usa un objeto para detectar la pulsación inicial
    KeyR: { pressed: false },
    KeyM: { pressed: false },
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
        if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
            keys[e.code] = true;
        } else if (keys[e.code] !== undefined) {
            keys[e.code].pressed = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
            keys[e.code] = false;
        } else if (keys[e.code] !== undefined) {
            keys[e.code].pressed = false;
        }
    });
}