export class ArenaAudio {
    constructor() {
        this.ctx = null;
        this.activeAmbients = []; // holds { osc, lfo, gain, biome }
        this.currentBiome = null;
        this.collapseOsc = null;
        this.collapseGain = null;
        this.isCollapseAlarmPlaying = false;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        console.log("[ArenaAudio] Web Audio API context initialized.");
    }

    startAmbient(biomeType) {
        this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        if (this.currentBiome === biomeType) return;
        this.currentBiome = biomeType;

        const now = this.ctx.currentTime;
        const fadeDuration = 1.5; // seconds crossfade

        // 1. Fade out all current active ambients
        this.activeAmbients.forEach(amb => {
            try {
                amb.gain.gain.setValueAtTime(amb.gain.gain.value, now);
                amb.gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeDuration);
                
                // Stop oscillators after fade completes
                setTimeout(() => {
                    try {
                        amb.osc.stop();
                        amb.osc.disconnect();
                        if (amb.lfo) {
                            amb.lfo.stop();
                            amb.lfo.disconnect();
                        }
                        amb.gain.disconnect();
                    } catch (err) {}
                }, fadeDuration * 1000 + 100);
            } catch (err) {}
        });
        this.activeAmbients = [];

        // 2. Setup the new ambient oscillators
        const newOsc = this.ctx.createOscillator();
        const newGain = this.ctx.createGain();
        let newLfo = null;
        let targetGainVal = 0.02;

        if (biomeType === 'TOXIC_SWAMP') {
            // Sawtooth bass bubbling
            newOsc.type = 'sawtooth';
            newOsc.frequency.setValueAtTime(55.0, now); // A1

            // LFO for bubbling frequency modulation
            newLfo = this.ctx.createOscillator();
            newLfo.type = 'sine';
            newLfo.frequency.setValueAtTime(3, now); // 3 Hz

            const lfoGain = this.ctx.createGain();
            lfoGain.gain.setValueAtTime(15, now);

            newLfo.connect(lfoGain);
            lfoGain.connect(newOsc.frequency);

            targetGainVal = 0.015;
            newLfo.start(now);
        } else if (biomeType === 'GLACIER') {
            // Sine cold wind sweep
            newOsc.type = 'sine';
            newOsc.frequency.setValueAtTime(220.0, now); // A3

            newLfo = this.ctx.createOscillator();
            newLfo.type = 'sine';
            newLfo.frequency.setValueAtTime(0.5, now); // 0.5 Hz wind sweep

            const lfoGain = this.ctx.createGain();
            lfoGain.gain.setValueAtTime(30, now);

            newLfo.connect(lfoGain);
            lfoGain.connect(newOsc.frequency);

            targetGainVal = 0.01;
            newLfo.start(now);
        } else if (biomeType === 'DESERT') {
            // Dusty ambient sweep
            newOsc.type = 'triangle';
            newOsc.frequency.setValueAtTime(82.41, now); // E2

            newLfo = this.ctx.createOscillator();
            newLfo.type = 'sine';
            newLfo.frequency.setValueAtTime(0.2, now); // slow filter wash

            const lfoGain = this.ctx.createGain();
            lfoGain.gain.setValueAtTime(10, now);

            newLfo.connect(lfoGain);
            lfoGain.connect(newOsc.frequency);

            targetGainVal = 0.018;
            newLfo.start(now);
        } else if (biomeType === 'BARRENS') {
            // Low gravel drone
            newOsc.type = 'sawtooth';
            newOsc.frequency.setValueAtTime(41.20, now); // E1
            targetGainVal = 0.012;
        } else {
            // LUSH_FOREST - peaceful triangle tone
            newOsc.type = 'triangle';
            newOsc.frequency.setValueAtTime(110.0, now); // A2
            targetGainVal = 0.02;
        }

        // Initialize gain at 0 for fade-in
        newGain.gain.setValueAtTime(0.0001, now);
        newGain.gain.exponentialRampToValueAtTime(targetGainVal, now + fadeDuration);

        newOsc.connect(newGain);
        newGain.connect(this.ctx.destination);
        newOsc.start(now);

        this.activeAmbients.push({
            osc: newOsc,
            lfo: newLfo,
            gain: newGain,
            biome: biomeType
        });

        console.log(`[ArenaAudio] Started ambient crossfade for biome: ${biomeType}`);
    }

    playSpellFeedback(current, voltage, isUltimate = false) {
        this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        if (current < 1.0) {
            // Short circuit / fizzle
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
            
            gainNode.gain.setValueAtTime(0.08, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            
            osc.start(now);
            osc.stop(now + 0.13);
            console.log(`[ArenaAudio] Short circuit sound (I=${current.toFixed(2)})`);
        } else {
            // Deep resonant bass hit
            osc.type = isUltimate ? 'sawtooth' : 'sine';
            const baseFreq = isUltimate ? 45.0 : 60.0;
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(120 + voltage * 15, now + 0.35);

            const baseGain = isUltimate ? 0.25 : 0.15;
            gainNode.gain.setValueAtTime(baseGain, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc.start(now);
            osc.stop(now + 0.42);
            console.log(`[ArenaAudio] Successful spell sound (I=${current.toFixed(2)}, V=${voltage.toFixed(1)}, Ult=${isUltimate})`);
        }
    }

    playTurnStart(faction) {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        if (faction === 'crystal') {
            // Pure bell-like synth chime (A4)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
            gainNode.gain.setValueAtTime(0.12, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        } else {
            // Lower triangle D3 chime
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(146.83, now);
            osc.frequency.exponentialRampToValueAtTime(293.66, now + 0.2);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        }

        osc.start(now);
        osc.stop(now + 0.52);
    }

    playCardDraw() {
        this.init();
        const now = this.ctx.currentTime;
        
        // Card snap: low pass filtered white noise pulse
        const bufferSize = this.ctx.sampleRate * 0.08; // 80ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.Q.setValueAtTime(3.0, now);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        noiseNode.start(now);
        noiseNode.stop(now + 0.08);
    }

    startCollapseAlarm() {
        this.init();
        if (this.isCollapseAlarmPlaying) return;
        this.isCollapseAlarmPlaying = true;

        const now = this.ctx.currentTime;
        this.collapseOsc = this.ctx.createOscillator();
        this.collapseGain = this.ctx.createGain();

        // Slow oscillating alarm drone (E1)
        this.collapseOsc.type = 'sine';
        this.collapseOsc.frequency.setValueAtTime(41.20, now);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.25, now); // every 4s

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(6, now); // modulate pitch +/- 6Hz

        lfo.connect(lfoGain);
        lfoGain.connect(this.collapseOsc.frequency);

        this.collapseGain.gain.setValueAtTime(0.015, now);

        this.collapseOsc.connect(this.collapseGain);
        this.collapseGain.connect(this.ctx.destination);

        lfo.start(now);
        this.collapseOsc.start(now);

        console.log("[ArenaAudio] Collapse alarm drone initialized.");
    }

    playEndGame(winner) {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        if (winner && winner.includes('king')) {
            // Triumphant ascending major stinger
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(261.63, now); // C4
            osc.frequency.setValueAtTime(329.63, now + 0.15); // E4
            osc.frequency.setValueAtTime(392.00, now + 0.3); // G4
            osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.6); // C5
            gainNode.gain.setValueAtTime(0.18, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        } else {
            // Descending minor stinger
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220.00, now); // A3
            osc.frequency.setValueAtTime(174.61, now + 0.2); // F3
            osc.frequency.setValueAtTime(130.81, now + 0.4); // C3
            osc.frequency.exponentialRampToValueAtTime(82.41, now + 0.8); // E2
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
        }

        osc.start(now);
        osc.stop(now + 1.5);
    }

    stopAmbient() {
        this.activeAmbients.forEach(amb => {
            try {
                amb.osc.stop();
                amb.osc.disconnect();
                if (amb.lfo) {
                    amb.lfo.stop();
                    amb.lfo.disconnect();
                }
                amb.gain.disconnect();
            } catch (e) {}
        });
        this.activeAmbients = [];
        this.currentBiome = null;

        if (this.collapseOsc) {
            try {
                this.collapseOsc.stop();
                this.collapseOsc.disconnect();
            } catch (e) {}
            this.collapseOsc = null;
        }
        if (this.collapseGain) {
            try {
                this.collapseGain.disconnect();
            } catch (e) {}
            this.collapseGain = null;
        }
        this.isCollapseAlarmPlaying = false;
    }
}

export const arenaAudio = new ArenaAudio();
