// audio.js - Handles Tone.js synthesis and mapping

let isInitialized = false;
let baseSynth;
let tremoloSynth;
let effectInputNode;
let effectChain = {};
let loop;
let noodlesData = []; // Array of { path: [], length: number, baseColor: string }
let currentStep = 0;
let isPlaying = false;

// Topping effects
let toppings = {
    negi: { active: false, node: null },
    wakame: { active: false, node: null },
    gobo: { active: false, node: null },
    maru: { active: false, node: null },
    niku: { active: false, node: null }
};

export async function initAudio() {
    if (isInitialized) return;
    
    await Tone.start();
    console.log('Audio is ready');
    
    // Set global BPM and volume
    Tone.Transport.bpm.value = 120;
    Tone.Destination.volume.value = -10; // Prevent it from being too loud
    
    setupSynthsAndEffects();
    setupLoop();
    
    Tone.Transport.start();
    isInitialized = true;
}

function setupSynthsAndEffects() {
    // Master limiter to prevent clipping
    const limiter = new Tone.Limiter(-2).toDestination();
    
    // Shared Input Node for effects chain
    effectInputNode = new Tone.Gain(1);

    const synthOptions = {
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: { type: "sine" },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 0.5 },
        modulation: { type: "square" },
        modulationEnvelope: { attack: 0.05, decay: 0.01, sustain: 1, release: 0.5 }
    };
    
    // Base Synth (Above soup)
    baseSynth = new Tone.PolySynth(Tone.FMSynth, synthOptions);
    baseSynth.connect(effectInputNode);

    // Tremolo Synth (Inside soup)
    tremoloSynth = new Tone.PolySynth(Tone.FMSynth, synthOptions);
    const tremolo = new Tone.Tremolo(9, 0.9).start(); // Fast 9Hz tremolo
    tremoloSynth.chain(tremolo, effectInputNode);

    // Effects
    // Negi: Sparkle / High Feedback Delay
    toppings.negi.node = new Tone.FeedbackDelay("8n", 0.6).connect(limiter);
    
    // Wakame: Reverb / Phaser (watery)
    toppings.wakame.node = new Tone.Chorus(4, 2.5, 0.5).connect(limiter);
    toppings.wakame.node.start();
    const reverb = new Tone.Reverb(4).connect(toppings.wakame.node);
    
    // Gobo: Distort / Bitcrush (crunchy, low)
    toppings.gobo.node = new Tone.BitCrusher(4).connect(limiter);
    
    // Maru: Filter / Soft (warm)
    toppings.maru.node = new Tone.Filter(800, "lowpass").connect(limiter);
    
    // Niku: Drone / Sub / Overdrive (heavy)
    toppings.niku.node = new Tone.Distortion(0.8).connect(limiter);

    // Initial connection
    updateRouting();
}

export function toggleTopping(toppingName, isActive) {
    if (toppings[toppingName]) {
        toppings[toppingName].active = isActive;
        updateRouting();
    }
}

function updateRouting() {
    effectInputNode.disconnect();
    
    // Chain active effects
    let currentOut = effectInputNode;
    
    // If no effects, just go to destination (limiter)
    let hasEffects = false;
    
    if (toppings.niku.active) { currentOut.connect(toppings.niku.node); currentOut = toppings.niku.node; hasEffects = true; }
    if (toppings.gobo.active) { currentOut.connect(toppings.gobo.node); currentOut = toppings.gobo.node; hasEffects = true; }
    if (toppings.maru.active) { currentOut.connect(toppings.maru.node); currentOut = toppings.maru.node; hasEffects = true; }
    if (toppings.wakame.active) { currentOut.connect(toppings.wakame.node); currentOut = toppings.wakame.node; hasEffects = true; }
    if (toppings.negi.active) { currentOut.connect(toppings.negi.node); currentOut = toppings.negi.node; hasEffects = true; }
    
    currentOut.connect(Tone.Destination);
}

function setupLoop() {
    // Loop every 16th note
    loop = new Tone.Loop((time) => {
        if (noodlesData.length === 0) return;
        
        // Play sounds based on noodles at the current step
        noodlesData.forEach(noodle => {
            // Find where we are in the noodle path based on time
            // Noodle path has many points. We map current step to a point.
            // Using a simple sequence: step loops over the length of the noodle
            const pathLength = noodle.path.length;
            if (pathLength < 10) return; // Too short
            
            const stepIndex = currentStep % pathLength;
            // Only trigger every N points to avoid machine-gun effect
            if (stepIndex % 10 === 0) {
                const point = noodle.path[stepIndex];
                playNoteFromPoint(point, time, pathLength);
            }
        });
        
        currentStep++;
    }, "16n").start(0);
}

function playNoteFromPoint(point, time, pathLength) {
    // Map Y position to pitch (Pentatonic scale for Japanese vibe)
    // Canvas Y: 0 (top) to window.innerHeight (bottom)
    const yRatio = 1 - (point.y / window.innerHeight); // Invert so up is higher pitch
    const scale = ["C3", "D3", "F3", "G3", "A3", "C4", "D4", "F4", "G4", "A4", "C5", "D5", "F5", "G5", "A5", "C6"];
    const noteIndex = Math.floor(yRatio * scale.length);
    const clampedIndex = Math.max(0, Math.min(scale.length - 1, noteIndex));
    const note = scale[clampedIndex];
    
    // Map X position to panning or velocity
    const xRatio = point.x / window.innerWidth;
    const velocity = 0.5 + (0.5 * xRatio); // 0.5 to 1.0
    
    // Map path length to duration
    let duration = "16n";
    if (pathLength > 200) duration = "8n";
    if (pathLength > 500) duration = "4n";

    // Determine if the point is in the soup (Y > soupLevel)
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    const soupLevel = (window.innerHeight / 2) + minDim * 0.35 * 0.3; // bowl.y + radiusOuter * 0.3
    
    const synthToUse = point.y > soupLevel ? tremoloSynth : baseSynth;

    synthToUse.triggerAttackRelease(note, duration, time, velocity);
}

// Update the audio engine with new noodle data
export function updateNoodles(newNoodles) {
    noodlesData = newNoodles;
}

export function clearNoodles() {
    noodlesData = [];
    currentStep = 0;
}
