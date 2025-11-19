// ZzFX - Zuper Zmall Zound Zynth v1.3.1 by Frank Force
// https://github.com/KilledByAPixel/ZzFX
// License: MIT

// zzfx() - the universal entry point
zzfx=(...z)=>zzfxP(zzfxG(...z))

// zzfxP() - the sound player
zzfxP=(...samples)=>
{
    let buffer = zzfxX.createBuffer(samples.length, samples[0].length, zzfxR), 
        source = zzfxX.createBufferSource();
    samples.map((d,i)=> buffer.getChannelData(i).set(d));
    source.buffer = buffer;
    source.connect(zzfxX.destination);
    source.start();
    return source;
}

// zzfxG() - the sound generator
zzfxG=
(
    volume = 1, 
    randomness = .05, 
    frequency = 220, 
    attack = 0, 
    sustain = 0,
    release = .1, 
    shape = 0, 
    shapeCurve = 1, 
    slide = 0, 
    deltaSlide = 0, 
    pitchJump = 0, 
    pitchJumpTime = 0, 
    repeatTime = 0, 
    noise = 0, 
    modulation = 0, 
    bitCrush = 0, 
    delay = 0, 
    sustainVolume = 1, 
    decay = 0, 
    tremolo = 0
)=>
{
    // init parameters
    let PI2 = Math.PI*2,
    sign = v => v>0?1:-1,
    startSlide = slide *= 500 * PI2 / zzfxR / zzfxR,
    startFrequency = frequency *= 
        (1 + randomness*2*Math.random() - randomness) 
        * PI2 / zzfxR,
    b = [], t = 0, tm = 0, i = 0, j = 1, r = 0, c = 0, s = 0, f, length,

    // biquad LP/HP filter
    quality = 2, w = PI2 * Math.abs(modulation) * 2 / zzfxR, 
    cos = Math.cos(w), sin = Math.sin(w),
    a = sin/(2*quality),
    A = 1 + a, B = 1 - a, C = -2*cos,
    D = sign(modulation),
    bi0 = D == 1 ? (1 - cos) / 2 : a,
    bi1 = D == 1 ? 1 - cos : -2*a,
    ai1 = C / A, ai2 = B / A;

    // scale by sample rate
    attack = attack * zzfxR + 9; // minimum attack to prevent pop
    decay *= zzfxR;
    sustain *= zzfxR;
    release *= zzfxR;
    delay *= zzfxR;
    deltaSlide *= 500 * PI2 / zzfxR**3;
    modulation *= PI2 / zzfxR;
    pitchJump *= PI2 / zzfxR;
    pitchJumpTime *= zzfxR;
    repeatTime = repeatTime * zzfxR | 0;

    // generate waveform
    for(length = attack + decay + sustain + release + delay | 0;
        i < length; b[i++] = s)
    {
        if (!(++c%(bitCrush*100|0)))                      // bit crush
        {
            s = shape? shape>1? shape>2? shape>3?         // wave shape
                Math.sin((t%PI2)**3) :                    // 4 noise
                Math.max(Math.min(Math.tan(t),1),-1):     // 3 tan
                1-(2*t/PI2%2+2)%2:                        // 2 saw
                1-4*Math.abs(Math.round(t/PI2)-t/PI2):    // 1 triangle
                Math.sin(t);                              // 0 sin

            s = (repeatTime ?
                    1 - tremolo + tremolo*Math.sin(PI2*i/repeatTime) // tremolo
                    : 1) *
                sign(s)*(Math.abs(s)**shapeCurve) *       // curve
                volume * zzfxV * (                        // envelope
                i < attack ? i/attack :                   // attack
                i < attack + decay ?                      // decay
                1-((i-attack)/decay)*(1-sustainVolume) :  // decay falloff
                i < attack  + decay + sustain ?           // sustain
                sustainVolume :                           // sustain volume
                i < length - delay ?                      // release
                (length - i - delay)/release *            // release falloff
                sustainVolume :                           // release volume
                0);                                       // post release

            s = delay ? s/2 + (delay > i ? 0 :            // delay
                (i<length-delay? 1 : (length-i)/delay) *  // release delay 
                b[i-delay|0]/2) : s;                      // sample delay
        }

        f = (frequency += slide += deltaSlide) *          // frequency
            Math.cos(modulation*tm++);                    // modulation
        t += f - f*noise*(1 - (Math.sin(i)+1)*1e9%2);     // noise

        if (j && ++j > pitchJumpTime)       // pitch jump
        { 
            frequency += pitchJump;         // apply pitch jump
            startFrequency += pitchJump;    // also apply to start
            j = 0;                          // reset pitch jump time
        } 

        if (repeatTime && !(++r % repeatTime)) // repeat
        { 
            frequency = startFrequency;     // reset frequency
            slide = startSlide;             // reset slide
            j = j || 1;                     // reset pitch jump time
        }
    }

    return b;
}

// zzfxV - global volume
zzfxV = .3;

// zzfxR - global sample rate
zzfxR = 44100;

// zzfxX - the audio context
zzfxX = new (window.AudioContext || window.webkitAudioContext);

// SoundEffects - Pre-defined sound effects for the game
const SoundEffects = {
    // Movement
    move: [.5,.05,200,,,0.05,,,,,,,,,,,,,0.1],
    
    // Interactions
    interact: [.5,.05,600,,,0.1,,,,,,,,,,,,,0.1],
    openChest: [1,.1,1000,.02,.3,.3,1,1.5,,,,,.15,,,,,1,.02],
    
    // Combat
    attack: [.5,.05,400,,,0.1,1,,,,,,,,,,,,],
    hit: [.5,.05,250,,,0.15,1,,,,,,,,,,,,],
    skillCast: [1,.1,800,.01,.1,.2,1,2.5,,,,,,,,,1,.5,.01],
    defend: [.5,.05,300,,,0.1,0,,,,,,,,,,,,],
    
    // Success/Failure
    victory: [1.5,.2,1200,.03,.3,.4,1,2,,,,,,,,,1,.7,.02],
    levelUp: [1.5,.1,1500,.02,.4,.5,1,2.5,,,,,,.1,,,1,.8,.03],
    defeat: [1,.3,100,.05,,.5,4,.1,,,,,,,,,,.5,.1],
    
    // Items
    usePotion: [.8,.1,800,.01,.1,.2,1,1.8,,,,,,,,,,.7,.02],
    pickupItem: [.5,.05,1300,.01,.04,.1,1,1.92,,-21,,,,,,,,.55,.01],
    
    // UI
    menuSelect: [.3,.05,500,,,0.05,,,,,,,,,,,,,],
    notification: [.5,.05,700,,,0.1,,,,,,,,,,,,,],
    error: [.5,.05,200,,,0.1,1,,,,,,,,,,,,]
};
