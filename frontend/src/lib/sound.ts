// Simple sound synthesizer using Web Audio API

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime + startTime);

    gain.gain.setValueAtTime(0.1, audioContext.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(audioContext.currentTime + startTime);
    osc.stop(audioContext.currentTime + startTime + duration);
};

export const playCompletionSound = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    // Resume context if suspended (browser policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    switch (priority) {
        case 'HIGH':
            // Fanfare / Major Chord Arpeggio (C5 - E5 - G5 - C6)
            playTone(523.25, 'sine', 0.4, 0);       // C5
            playTone(659.25, 'sine', 0.4, 0.1);     // E5
            playTone(783.99, 'sine', 0.4, 0.2);     // G5
            playTone(1046.50, 'sine', 0.8, 0.3);    // C6
            // Add a "sparkle" layer
            playTone(1046.50, 'triangle', 0.8, 0.3);
            break;

        case 'MEDIUM':
            // Success "Ding" (Two tones ascending)
            playTone(523.25, 'sine', 0.2, 0);       // C5
            playTone(783.99, 'sine', 0.6, 0.15);    // G5
            break;

        case 'LOW':
            // Simple "Pop" / "Blip"
            playTone(880, 'sine', 0.1, 0);
            break;

        default:
            playTone(523.25, 'sine', 0.2, 0);
            break;
    }
};
