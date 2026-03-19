export function playLevelUpSound() {
    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
  
    if (!AudioCtx) return;
  
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
  
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.9, now);
    master.connect(ctx.destination);
  
    // 가벼운 컴프/리미터 느낌 대체용 마스터 볼륨
    const createVoice = (
      type: OscillatorType,
      freq: number,
      start: number,
      duration: number,
      volume: number,
      attack = 0.01,
      release = 0.18
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
  
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
  
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(6000, start);
  
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + attack);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        start + Math.max(duration, attack + 0.02)
      );
  
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
  
      osc.start(start);
      osc.stop(start + duration + release);
    };
  
    // 1) 바닥 스웰: 레벨업 시작 느낌
    {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
  
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.24);
  
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.25);
  
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
  
      osc.start(now);
      osc.stop(now + 0.36);
    }
  
    // 2) 메인 멜로디 (조금 더 게임스러운 아르페지오)
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5 E5 G5 C6 E6
    notes.forEach((freq, i) => {
      createVoice("triangle", freq, now + 0.08 + i * 0.07, 0.18, 0.14, 0.01, 0.18);
      createVoice("sine", freq * 2, now + 0.08 + i * 0.07, 0.14, 0.05, 0.005, 0.14);
    });
  
    // 3) 마지막 반짝임 (sparkle)
    const sparkleFreqs = [1567.98, 2093.0, 2637.02];
    sparkleFreqs.forEach((freq, i) => {
      createVoice("square", freq, now + 0.34 + i * 0.04, 0.12, 0.04, 0.005, 0.12);
    });
  
    // 4) 약한 에코 느낌
    const delay = ctx.createDelay();
    const feedback = ctx.createGain();
    const echoGain = ctx.createGain();
  
    delay.delayTime.setValueAtTime(0.13, now);
    feedback.gain.setValueAtTime(0.22, now);
    echoGain.gain.setValueAtTime(0.18, now);
  
    master.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(echoGain);
    echoGain.connect(ctx.destination);
  
    // 브라우저 정책 대응
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
  
    window.setTimeout(() => {
      void ctx.close();
    }, 1800);
  }