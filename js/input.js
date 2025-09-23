import { resumeAudio } from './audio.js';

export const keys = {
    ArrowRight: false,
    ArrowLeft: false,
};

export function setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
        // Reanudar audio en la primera interacción
        resumeAudio();

        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
        }
    });
    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = false;
        }
    });
}