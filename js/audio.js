let audioCtx;
const AudioContext = window.AudioContext || window.webkitAudioContext;
if (AudioContext) {
    audioCtx = new AudioContext();
}

export function getAudioContext() {
    return audioCtx;
}

export function resumeAudio() {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

export function playSound(buffer) {
    if (audioCtx && buffer && audioCtx.state === 'running') {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
    }
}