// --- Interpolación Lineal ---
export const lerp = (a, b, t) => a + (b - a) * t;

export const lerpColor = (colorA, colorB, t) => {
    // Asume formato #RRGGBB
    const r1 = parseInt(colorA.substring(1, 3), 16);
    const g1 = parseInt(colorA.substring(3, 5), 16);
    const b1 = parseInt(colorA.substring(5, 7), 16);

    const r2 = parseInt(colorB.substring(1, 3), 16);
    const g2 = parseInt(colorB.substring(3, 5), 16);
    const b2 = parseInt(colorB.substring(5, 7), 16);

    const r = Math.round(lerp(r1, r2, t));
    const g = Math.round(lerp(g1, g2, t));
    const b = Math.round(lerp(b1, b2, t));

    return `rgb(${r}, ${g}, ${b})`;
};

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