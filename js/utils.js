// --- Interpolación Lineal ---
export const lerp = (a, b, t) => a + (b - a) * t;

// --- Carga de Assets ---
export const loadImage = src => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

export const loadAudio = (src, audioCtx) => new Promise((resolve) => {
    if (!audioCtx) {
        resolve(null); // No hay soporte de audio
        return;
    }
    fetch(src)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => resolve(audioBuffer))
        .catch(error => {
            console.warn(`No se pudo cargar el audio: ${src}`, error);
            resolve(null); // Resuelve como nulo para no bloquear la animación
        });
});