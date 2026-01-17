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

// --- NUEVO: Optimización con OffscreenCanvas ---

/**
 * Pre-renderiza una imagen en un OffscreenCanvas para evitar conversiones
 * repetidas de SVG a canvas en cada frame.
 * @param {HTMLImageElement} image La imagen a pre-renderizar
 * @param {number} scale Factor de escala opcional (default: 1)
 * @returns {OffscreenCanvas|HTMLCanvasElement} El canvas pre-renderizado
 */
export const createOffscreenFromImage = (image, scale = 1) => {
    const width = image.width * scale;
    const height = image.height * scale;

    // Usar OffscreenCanvas si está disponible, sino fallback a HTMLCanvasElement
    const canvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(width, height)
        : document.createElement('canvas');

    if (!(canvas instanceof OffscreenCanvas)) {
        canvas.width = width;
        canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);

    return canvas;
};

/**
 * Pre-renderiza las estrellas en un OffscreenCanvas.
 * Las estrellas base se dibujan una vez y solo se aplica la opacidad
 * del parpadeo en tiempo de ejecución.
 * @param {number} canvasWidth Ancho del canvas
 * @param {number} canvasHeight Alto del canvas
 * @param {Array} stars Array de estrellas con posiciones y radios
 * @returns {OffscreenCanvas|HTMLCanvasElement} Canvas con las estrellas pre-renderizadas
 */
export const createStarsCanvas = (canvasWidth, canvasHeight, stars) => {
    const canvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(canvasWidth, canvasHeight)
        : document.createElement('canvas');

    if (!(canvas instanceof OffscreenCanvas)) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';

    // Dibujar todas las estrellas en el canvas offscreen
    stars.forEach(star => {
        ctx.globalAlpha = 0.8; // Opacidad base alta
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.globalAlpha = 1;
    return canvas;
};