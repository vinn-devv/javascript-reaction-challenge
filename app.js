const startButton = document.querySelector(".start-btn");
const gameArea = document.querySelector(".game-area");
const reactionTime = document.querySelector(".reaction-time");
const bestScore = document.querySelector(".best-score");
const target = document.querySelector(".target");
const gameStatus = document.querySelector(".game-status");
const roundCounter = document.querySelector(".round-counter");

const playButton = document.querySelector(".play-btn");
const homeScreen = document.querySelector(".home-screen");
const loadingScreen = document.querySelector("#game-loading");
const homeButton = document.querySelector(".home-btn");
const resultsScreen = document.querySelector("#results-screen");
const averageScore = document.querySelector("#average-score");
const fastestScore = document.querySelector("#fastest-score");
const resultBestScore = document.querySelector("#result-best-score");

const resultGif = document.querySelector("#result-gif");
const resultTitle = document.querySelector("#result-title");

const playAgainButton = document.querySelector("#play-again-btn");
const resultsHomeButton = document.querySelector("#results-home-btn");
const homeMusic = document.querySelector("#home-music");

const mouseGlow = document.querySelector(".mouse-glow");

const catCanvas = document.querySelector(".cat-gif");
const catSource = document.querySelector(".cat-source");

const scoreValue = document.querySelector(".score-value");
const finalScore = document.querySelector("#final-score");

const comboBadge = document.querySelector(".combo-badge");
const comboCount = document.querySelector(".combo-count");
const comboMultiplier = document.querySelector(".combo-multiplier");
const resultStreak = document.querySelector("#result-streak");
const roundBreakdown = document.querySelector(".round-breakdown");
const accuracyScore = document.querySelector("#accuracy-score");
const resultRank = document.querySelector("#result-rank");
const resultCompare = document.querySelector("#result-compare");
const resultsCard = document.querySelector(".results-card");
const resultsLabel = document.querySelector("#results-screen .results-label");
const resultBestStat = resultBestScore
  ? resultBestScore.closest(".result-stat")
  : null;
const bestStatBlock = bestScore ? bestScore.closest(".stat-block") : null;
const fastestStat = fastestScore ? fastestScore.closest(".result-stat") : null;
const averageStat = averageScore ? averageScore.closest(".result-stat") : null;

const difficultyEl = document.querySelector(".difficulty");
const difficultyName = document.querySelector(".difficulty-name");

const pauseButton = document.querySelector(".pause-btn");
const pauseScreen = document.querySelector("#pause-screen");
const resumeButton = document.querySelector("#resume-btn");
const restartButton = document.querySelector("#restart-btn");
const quitButton = document.querySelector("#quit-btn");

// Respect the OS "reduce motion" preference until the player chooses otherwise
const prefersReducedMotion =
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const DEFAULT_SETTINGS = {
  music: true,
  sfx: true,
  effects: !prefersReducedMotion,
  musicVolume: 0.4,
  sfxVolume: 1,
};

function clampVolume(value, fallback) {
  const number = Number(value);

  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : fallback;
}

function loadSettings() {
  let saved = null;

  try {
    saved = JSON.parse(localStorage.getItem("settings"));
  } catch (err) {
    saved = null;
  }

  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    saved = {};
  }

  return {
    music:
      typeof saved.music === "boolean" ? saved.music : DEFAULT_SETTINGS.music,
    sfx: typeof saved.sfx === "boolean" ? saved.sfx : DEFAULT_SETTINGS.sfx,
    effects:
      typeof saved.effects === "boolean"
        ? saved.effects
        : DEFAULT_SETTINGS.effects,
    musicVolume: clampVolume(saved.musicVolume, DEFAULT_SETTINGS.musicVolume),
    sfxVolume: clampVolume(saved.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
  };
}

let settings = loadSettings();

function applySettings() {
  document.body.classList.toggle("no-effects", !settings.effects);

  meowSound.volume = settings.sfxVolume;
  resultSound.volume = 0.5 * settings.sfxVolume;

  if (homeMusic) {
    homeMusic.volume = settings.musicVolume;
  }

  if (!settings.sfx) {
    meowSound.pause();
    resultSound.pause();
  }
}

function saveSetting(key, value) {
  settings = { ...settings, [key]: value };

  try {
    localStorage.setItem("settings", JSON.stringify(settings));
  } catch (err) {
    console.warn("Could not save settings:", err);
  }

  applySettings();
}

function playHomeMusic() {
  if (!homeMusic || !settings.music) {
    return;
  }

  homeMusic.volume = settings.musicVolume;

  homeMusic.play().catch(() => {
    const retry = () => {
      playHomeMusic();
    };

    document.addEventListener("pointerdown", retry, { once: true });
    document.addEventListener("keydown", retry, { once: true });
  });
}

function isIdle() {
  const state = gameArea.dataset.state;

  return !state || state === "idle";
}

if (catCanvas && catSource) {
  const ctx = catCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  const cw = catCanvas.width;
  const ch = catCanvas.height;

  // idle copy of the cat (shown in the middle of the play area before a round)
  const idleCanvas = document.querySelector(".idle-cat canvas");
  const idleCtx = idleCanvas ? idleCanvas.getContext("2d") : null;

  const BLACK_CUTOFF = 60;
  const FEATHER_CUTOFF = 95;
  const MIN_ALPHA = 60; // anything fainter than this is dropped (kills the box fringe)

  let hasNativeAlpha = null;

  const renderCatFrame = () => {
    if (catSource.readyState >= 2 && !catSource.paused) {
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(catSource, 0, 0, cw, ch);

      const frame = ctx.getImageData(0, 0, cw, ch);
      const d = frame.data;

      // If the corner is already transparent, the webm has real alpha
      // and we must not luminance-key it a second time.
      if (hasNativeAlpha === null) {
        hasNativeAlpha = d[3] < 250 && d[(cw - 1) * 4 + 3] < 250;
      }

      for (let i = 0; i < d.length; i += 4) {
        let a = d[i + 3];

        if (!hasNativeAlpha) {
          const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;

          if (lum <= BLACK_CUTOFF) {
            a = 0;
          } else if (lum < FEATHER_CUTOFF) {
            a = Math.round(
              ((lum - BLACK_CUTOFF) / (FEATHER_CUTOFF - BLACK_CUTOFF)) * 255,
            );
          }
        }

        d[i + 3] = a < MIN_ALPHA ? 0 : a;
      }

      ctx.putImageData(frame, 0, 0);

      if (idleCtx && isIdle()) {
        idleCtx.clearRect(0, 0, cw, ch);
        idleCtx.drawImage(catCanvas, 0, 0);
      }
    }
  };

  const updateCatFrame = () => {
    renderCatFrame();

    if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
      catSource.requestVideoFrameCallback(updateCatFrame);
    } else {
      requestAnimationFrame(updateCatFrame);
    }
  };

  let catLoopRunning = false;

  const startCatLoop = () => {
    if (catLoopRunning) {
      return;
    }

    catLoopRunning = true;
    updateCatFrame();
  };

  catSource.addEventListener("playing", startCatLoop);

  if (!catSource.paused) {
    startCatLoop();
  } else {
    // belt-and-suspenders: don't rely solely on the autoplay attribute
    catSource.play().catch(() => {
      // autoplay blocked (rare, since it's muted) — start on first interaction
      const resumeOnInteract = () => {
        catSource.play().catch(() => {});
      };

      document.addEventListener("pointerdown", resumeOnInteract, {
        once: true,
      });
      document.addEventListener("keydown", resumeOnInteract, { once: true });
    });
  }
}

const meowSound = new Audio("assets/meow.mp3");

meowSound.preload = "auto";
meowSound.loop = true;

const resultSound = new Audio();

resultSound.volume = 0.5;
resultSound.preload = "auto";

function playMeow() {
  if (!settings.sfx) {
    return;
  }

  try {
    meowSound.currentTime = 0;

    meowSound
      .play()
      .catch((err) => console.warn("Meow sound unavailable:", err));
  } catch (err) {
    console.warn("Meow sound unavailable:", err);
  }
}

// The idle scuba cat dances in the middle, with its sound playing along.
function playIdleSound() {
  if (!isIdle() || isPlaying) {
    return;
  }

  playMeow();

  if (meowSound.paused) {
    // autoplay blocked: start on the first tap / key press instead
    const retry = () => playIdleSound();

    document.addEventListener("pointerdown", retry, { once: true });
    document.addEventListener("keydown", retry, { once: true });
  }
}

function stopMeow() {
  try {
    meowSound.pause();
    meowSound.currentTime = 0;
  } catch (err) {
    console.warn("Meow sound unavailable:", err);
  }
}

const SFX_VOLUME = 0.08;

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    audioCtx = new AudioContextClass();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  return audioCtx;
}

function playTone({
  freq,
  duration = 0.12,
  type = "square",
  volume = SFX_VOLUME,
  delay = 0,
  slideTo = null,
}) {
  if (!settings.sfx || settings.sfxVolume <= 0) {
    return;
  }

  volume *= settings.sfxVolume;

  const ctx = getAudioCtx();

  if (!ctx) {
    return;
  }

  const start = ctx.currentTime + delay;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playNotes(
  notes,
  { step = 0.07, duration = 0.1, type = "square", volume = SFX_VOLUME } = {},
) {
  notes.forEach((freq, i) => {
    playTone({ freq, duration, type, volume, delay: i * step });
  });
}

const HIT_NOTES = {
  lightning: [784, 1047, 1319],
  fast: [698, 932],
  good: [587, 784],
  okay: [494],
};

const sfx = {
  click() {
    playTone({ freq: 660, duration: 0.05, type: "triangle", volume: 0.06 });
  },

  countdown() {
    playTone({ freq: 440, duration: 0.12 });
  },

  go() {
    playNotes([523, 784, 1047], { step: 0.08, duration: 0.14 });
  },

  roundIntro() {
    playNotes([392, 523], { step: 0.09, duration: 0.1, type: "triangle" });
  },

  hit(tier) {
    if (tier === "slow") {
      playTone({
        freq: 247,
        slideTo: 165,
        duration: 0.2,
        type: "sawtooth",
        volume: 0.06,
      });

      return;
    }

    playNotes(HIT_NOTES[tier] || HIT_NOTES.good, {
      step: 0.06,
      duration: 0.09,
    });
  },

  combo(streak) {
    playTone({
      freq: 520 + streak * 90,
      duration: 0.12,
      type: "triangle",
      delay: 0.2,
    });
  },

  comboLost() {
    playTone({
      freq: 420,
      slideTo: 140,
      duration: 0.3,
      type: "sawtooth",
      volume: 0.06,
      delay: 0.15,
    });
  },

  miss() {
    playTone({
      freq: 210,
      slideTo: 120,
      duration: 0.16,
      type: "sawtooth",
      volume: 0.05,
    });
  },

  achievement() {
    playNotes([659, 880, 1319], {
      step: 0.1,
      duration: 0.16,
      type: "triangle",
    });
  },

  newBest() {
    playNotes([784, 988, 1175, 1568], {
      step: 0.09,
      duration: 0.14,
      type: "triangle",
    });
  },
};

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (button && !button.matches(".target, .start-btn, #play-again-btn")) {
    sfx.click();
  }
});

const savedBest = localStorage.getItem("best");

const homeBest = document.querySelector(".home-best");

if (homeBest) {
  homeBest.textContent = savedBest !== null ? `${savedBest}ms` : "—";
}

let startTime = 0;
let best = null;
let isPlaying = false;
let targetReady = false;

let round = 0;
const TOTAL_ROUNDS = 5;
let reactionTimes = [];
let roundScores = [];
let score = 0;
let combo = 0;
let maxCombo = 0;
let isNewBest = false;
let hadBestBefore = false;
let misses = 0;
let roundLive = false;
let comboHideTimer = null;

let isPaused = false;
let pausedAt = 0;
let pendingTimers = [];

function schedule(callback, ms) {
  const timer = {
    remaining: ms,
    startedAt: performance.now(),
    id: null,
  };

  timer.run = () => {
    pendingTimers = pendingTimers.filter((item) => item !== timer);
    callback();
  };

  timer.id = setTimeout(timer.run, ms);
  pendingTimers.push(timer);

  return timer;
}

function clearScheduled() {
  pendingTimers.forEach((timer) => clearTimeout(timer.id));
  pendingTimers = [];
}

function freezeScheduled() {
  const now = performance.now();

  pendingTimers.forEach((timer) => {
    clearTimeout(timer.id);
    timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
  });
}

function unfreezeScheduled() {
  const now = performance.now();

  pendingTimers.forEach((timer) => {
    timer.startedAt = now;
    timer.id = setTimeout(timer.run, timer.remaining);
  });
}

function updatePauseButton() {
  if (pauseButton) {
    pauseButton.disabled = !isPlaying;
  }
}

const roundDotsEl = document.querySelector(".round-dots");
let roundDots = [];

if (roundDotsEl) {
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const dot = document.createElement("span");

    dot.className = "dot";

    roundDotsEl.appendChild(dot);

    roundDots.push(dot);
  }
}

function updateRoundDots(currentRound) {
  roundDots.forEach((dot, i) => {
    const dotRound = i + 1;

    dot.classList.remove("is-complete");
    dot.classList.toggle("is-done", dotRound < currentRound);
    dot.classList.toggle("is-current", dotRound === currentRound);
  });
}

// ready state: round 1 is lit, matching the "Round 1 / N" label
updateRoundDots(1);

const difficulty = {
  1: {
    label: "EASY",
    rgb: "255, 255, 255",
    glow: "3px",
    minDelay: 1000,
    maxDelay: 3000,
    catSize: 96,
  },

  2: {
    label: "NORMAL",
    rgb: "255, 221, 189",
    glow: "6px",
    minDelay: 800,
    maxDelay: 2500,
    catSize: 92,
  },

  3: {
    label: "TRICKY",
    rgb: "255, 164, 120",
    glow: "10px",
    minDelay: 600,
    maxDelay: 2000,
    catSize: 88,
  },

  4: {
    label: "HARD",
    rgb: "255, 94, 74",
    glow: "14px",
    minDelay: 400,
    maxDelay: 1500,
    catSize: 84,
  },

  5: {
    label: "INSANE",
    rgb: "255, 32, 32",
    glow: "20px",
    minDelay: 250,
    maxDelay: 1000,
    catSize: 78,
  },
};

const RATINGS = [
  { max: 250, label: "LIGHTNING!", tier: "lightning" },
  { max: 350, label: "FAST!", tier: "fast" },
  { max: 500, label: "GOOD", tier: "good" },
  { max: 700, label: "OKAY", tier: "okay" },
  { max: Infinity, label: "SLOW", tier: "slow" },
];

function renderDifficulty(level) {
  if (!difficultyEl) {
    return;
  }

  const config = difficulty[level];

  difficultyName.textContent = config ? config.label : "READY";

  difficultyEl.classList.toggle("is-ready", !config);

  difficultyEl.classList.remove("is-up");

  if (config) {
    document.body.style.setProperty("--level-color", `rgb(${config.rgb})`);
    document.body.style.setProperty("--level-glow", config.glow);
    document.body.style.setProperty(
      "--level-border",
      `rgba(${config.rgb}, 0.4)`,
    );

    if (level > 1) {
      void difficultyEl.offsetWidth;

      difficultyEl.classList.add("is-up");
    }
  } else {
    document.body.style.removeProperty("--level-color");
    document.body.style.removeProperty("--level-border");
  }
}

const MAX_POINTS_PER_ROUND = 200;

function getRating(reaction, multiplier = 1) {
  const rating = RATINGS.find((r) => reaction < r.max);

  const basePoints = Math.max(
    0,
    Math.min(MAX_POINTS_PER_ROUND, Math.round((1000 - reaction) / 5)),
  );

  return {
    ...rating,
    multiplier,
    points: Math.round(basePoints * multiplier * getMode().scoreMult),
  };
}

const COMBO_THRESHOLD_MS = 500;
const COMBO_STEP = 0.5;
const MAX_MULTIPLIER = 3;
const COMBO_LOST_MS = 900;

function getMultiplier(streak) {
  return Math.min(1 + Math.max(streak - 1, 0) * COMBO_STEP, MAX_MULTIPLIER);
}

function renderComboBadge(previous) {
  if (!comboBadge) {
    return;
  }

  clearTimeout(comboHideTimer);

  comboBadge.classList.remove("is-lost", "is-bump");

  if (combo >= 2) {
    comboCount.textContent = `COMBO ${combo}`;
    comboMultiplier.textContent = `x${getMultiplier(combo)}`;

    void comboBadge.offsetWidth;

    comboBadge.classList.add("is-active", "is-bump");

    return;
  }

  if (previous >= 2) {
    comboCount.textContent = "COMBO LOST";
    comboMultiplier.textContent = "";

    comboBadge.classList.add("is-active", "is-lost");

    comboHideTimer = setTimeout(() => {
      comboBadge.classList.remove("is-active", "is-lost");
    }, COMBO_LOST_MS);

    return;
  }

  comboBadge.classList.remove("is-active");
}

function updateCombo(reaction) {
  const previous = combo;

  if (reaction < COMBO_THRESHOLD_MS) {
    combo++;
    maxCombo = Math.max(maxCombo, combo);
  } else {
    combo = 0;
  }

  renderComboBadge(previous);
}

function resetRun() {
  round = 0;
  reactionTimes = [];
  roundScores = [];
  score = 0;
  combo = 0;
  maxCombo = 0;
  misses = 0;
  roundLive = false;

  renderComboBadge(0);
  renderDifficulty(1);

  if (scoreValue) {
    scoreValue.textContent = "0";
  }
}

function addScore(points) {
  const from = score;

  score += points;

  if (!scoreValue) {
    return;
  }

  countUpTo(scoreValue, score, 400, "", from);

  scoreValue.classList.remove("is-bump");

  void scoreValue.offsetWidth;

  scoreValue.classList.add("is-bump");
}

function showHitFeedback(rating, x, y) {
  const el = document.createElement("div");

  el.className = `hit-feedback is-${rating.tier}`;

  const label = document.createElement("span");
  label.className = "hit-feedback-label";
  label.textContent = rating.label;

  const points = document.createElement("span");
  points.className = "hit-feedback-points";
  points.textContent = `+${rating.points}`;

  el.append(label, points);

  if (rating.multiplier > 1) {
    const bonus = document.createElement("span");
    bonus.className = "hit-feedback-bonus";
    bonus.textContent = `x${rating.multiplier} COMBO`;

    el.append(bonus);
  }

  const marginX = 70;
  const marginY = 50;

  const clampedX = Math.min(
    Math.max(x, marginX),
    gameArea.clientWidth - marginX,
  );

  const clampedY = Math.min(
    Math.max(y, marginY),
    gameArea.clientHeight - marginY,
  );

  el.style.left = `${clampedX}px`;
  el.style.top = `${clampedY}px`;

  gameArea.appendChild(el);

  el.addEventListener("animationend", () => el.remove());

  setTimeout(() => el.remove(), 1200);
}

if (mouseGlow) {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;

  let glowX = targetX;
  let glowY = targetY;

  document.addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  });

  const easeFactor = 0.22;

  const followCursor = () => {
    glowX += (targetX - glowX) * easeFactor;
    glowY += (targetY - glowY) * easeFactor;

    mouseGlow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;

    requestAnimationFrame(followCursor);
  };

  requestAnimationFrame(followCursor);
}

const COUNTDOWN_STEP_MS = 900;
const COUNTDOWN_GO_MS = 700;
const ROUND_INTRO_MS = 800;
const FULL_COUNTDOWN_EVERY_ROUND = false;

let countdownText = null;

if (gameArea) {
  const countdownOverlay = document.createElement("div");

  countdownOverlay.className = "countdown-overlay";
  countdownOverlay.setAttribute("aria-hidden", "true");

  countdownText = document.createElement("span");
  countdownText.className = "countdown-text";

  countdownOverlay.appendChild(countdownText);
  gameArea.appendChild(countdownOverlay);
}

function setGameState(state) {
  gameArea.dataset.state = state;
}

function showCountdownStep(text, variant = "") {
  countdownText.className = "countdown-text";
  countdownText.textContent = text;

  void countdownText.offsetWidth;

  countdownText.classList.add("is-pop");

  if (variant) {
    countdownText.classList.add(variant);
  }
}

function hideCountdown() {
  gameArea.classList.remove("is-counting");

  countdownText.className = "countdown-text";
  countdownText.textContent = "";
}

function startCountdown(callback) {
  gameArea.classList.add("is-counting");
  setGameState("counting");

  if (round > 1 && !FULL_COUNTDOWN_EVERY_ROUND) {
    showCountdownStep(
      `ROUND ${round}/${TOTAL_ROUNDS}\n${difficulty[round].label}`,
      "is-round",
    );
    sfx.roundIntro();

    schedule(() => {
      hideCountdown();
      callback();
    }, ROUND_INTRO_MS);

    return;
  }

  let count = 3;

  showCountdownStep(count);
  sfx.countdown();

  const tick = () => {
    count--;

    if (count > 0) {
      showCountdownStep(count);
      sfx.countdown();
      schedule(tick, COUNTDOWN_STEP_MS);
      return;
    }

    showCountdownStep("GO!", "is-go");
    sfx.go();

    schedule(() => {
      hideCountdown();
      callback();
    }, COUNTDOWN_GO_MS);
  };

  schedule(tick, COUNTDOWN_STEP_MS);
}

function countUpTo(el, endValue, duration = 600, suffix = "ms", from = 0) {
  const t0 = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - t0) / duration, 1);

    const eased = 1 - Math.pow(1 - progress, 3);

    const value = Math.round(from + (endValue - from) * eased);

    el.textContent = `${value}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = `${endValue}${suffix}`;
    }
  };

  requestAnimationFrame(tick);
}

const RESULT_TIERS = [
  {
    test: (average) => average < 500,
    rank: "FAST",
    tier: "fast",
    gif: "assets/Cat Meme GIF.gif",
    title: "I see, you have fast hands.",
    sound: "assets/dexter-meme.mp3",
  },
  {
    test: (average) => average <= 700,
    rank: "NORMAL",
    tier: "normal",
    gif: "assets/Happy Cat GIF.gif",
    title: "Absolute nyan! Nice!",
    sound: "assets/happy-cat.mp3",
  },
  {
    test: () => true,
    rank: "SLOW",
    tier: "slow",
    gif: "assets/Lemme Think GIF.gif",
    title: "Is this you?",
    sound: "assets/loading-meme.mp3",
  },
];

function getResultTier(average) {
  return RESULT_TIERS.find((item) => item.test(average));
}

function updateResultReaction(average) {
  const result = getResultTier(average);

  if (!resultGif || !resultTitle) {
    return result;
  }

  resultSound.pause();
  resultSound.currentTime = 0;

  resultGif.src = result.gif;
  resultGif.onerror = () => {
    resultGif.style.display = "none";
  };
  resultGif.onload = () => {
    resultGif.style.display = "";
  };
  resultTitle.textContent = result.title;
  resultSound.src = result.sound;

  if (settings.sfx) {
    resultSound.play().catch((error) => {
      console.log("Result sound failed:", error);
    });
  }

  return result;
}

function renderBreakdown() {
  if (!roundBreakdown) {
    return;
  }

  roundBreakdown.textContent = "";

  const fastest = Math.min(...reactionTimes);
  const slowest = Math.max(...reactionTimes);
  const scale = Math.max(...reactionTimes, 500);

  reactionTimes.forEach((reaction, i) => {
    const row = document.createElement("div");

    row.className = `breakdown-row is-${getRating(reaction).tier}`;

    if (reaction === fastest) {
      row.classList.add("is-fastest");
    }

    if (
      reactionTimes.length > 1 &&
      reaction === slowest &&
      slowest !== fastest
    ) {
      row.classList.add("is-slowest");
    }

    row.style.setProperty("--i", i);

    const label = document.createElement("span");
    label.className = "breakdown-label";
    label.textContent = `R${i + 1}`;

    const track = document.createElement("div");
    track.className = "breakdown-track";

    const bar = document.createElement("div");
    bar.className = "breakdown-bar";
    bar.style.setProperty("--w", `${Math.max((reaction / scale) * 100, 6)}%`);

    track.appendChild(bar);

    const time = document.createElement("span");
    time.className = "breakdown-time";
    time.textContent = `${reaction}ms`;

    const points = document.createElement("span");
    points.className = "breakdown-points";
    points.textContent = `+${roundScores[i] || 0}`;

    row.append(label, track, time, points);
    roundBreakdown.appendChild(row);
  });
}

function renderScoreComparison(previous) {
  if (!resultCompare) {
    return;
  }

  const label = getMode().label;

  resultCompare.className = "result-compare";

  if (previous === null) {
    resultCompare.textContent = `FIRST ${label} GAME - SCORE TO BEAT SET`;
    return;
  }

  const diff = score - previous;

  if (diff > 0) {
    resultCompare.classList.add("is-up");
    resultCompare.textContent = `+${diff} VS ${label} BEST (${previous})`;
  } else if (diff === 0) {
    resultCompare.textContent = `TIED ${label} BEST (${previous})`;
  } else {
    resultCompare.classList.add("is-down");
    resultCompare.textContent = `${diff} VS ${label} BEST (${previous})`;
  }
}

function showResults() {
  const total = reactionTimes.reduce((sum, time) => sum + time, 0);

  const average = Math.round(total / reactionTimes.length);

  const fastest = Math.min(...reactionTimes);

  updateRoundDots(TOTAL_ROUNDS + 1);

  const previousHighScore = loadRecords()[getMode().id].highScore;

  const newRecords = recordGame({
    fastest,
    bestAverage: average,
    highScore: score,
    bestCombo: maxCombo,
  });

  const result = updateResultReaction(average);

  if (resultsCard) {
    resultsCard.classList.remove(
      "is-tier-fast",
      "is-tier-normal",
      "is-tier-slow",
    );
    resultsCard.classList.add(`is-tier-${result.tier}`);
  }

  renderScoreComparison(previousHighScore);

  const brokenKeys = newRecords.map((item) => item.field.key);

  if (fastestStat) {
    fastestStat.classList.toggle("is-new-best", brokenKeys.includes("fastest"));
  }

  if (averageStat) {
    averageStat.classList.toggle(
      "is-new-best",
      brokenKeys.includes("bestAverage"),
    );
  }

  if (resultRank) {
    resultRank.className = `result-rank is-${result.tier}`;
    resultRank.textContent = result.rank;
  }

  renderBreakdown();

  if (resultsLabel) {
    let labelText = `GAME COMPLETE - ${getMode().label}`;

    if (isNewBest) {
      labelText = "NEW BEST!";
    } else if (newRecords.length > 0) {
      labelText = "NEW RECORD!";
    }

    resultsLabel.textContent = labelText;
    resultsLabel.classList.toggle(
      "is-new-best",
      isNewBest || newRecords.length > 0,
    );
  }

  if (resultBestStat) {
    resultBestStat.classList.toggle("is-new-best", isNewBest);
  }

  if (isNewBest || newRecords.length > 0) {
    setTimeout(() => sfx.newBest(), 500);
  }

  const unlockedNow = checkAchievements();

  renderResultAchievements(unlockedNow, newRecords);

  if (unlockedNow.length > 0) {
    setTimeout(() => sfx.achievement(), 1300);
  }

  resultsScreen.style.display = "flex";

  // Always open at the top: reset scroll before and after layout, and
  // focus without letting the browser scroll down to the bottom buttons.
  const resultsCardEl = resultsScreen.querySelector(".results-card");
  const scrollResultsToTop = () => {
    resultsScreen.scrollTop = 0;

    if (resultsCardEl) {
      resultsCardEl.scrollTop = 0;
    }
  };

  scrollResultsToTop();
  requestAnimationFrame(scrollResultsToTop);

  if (playAgainButton) {
    playAgainButton.focus({ preventScroll: true });
  }

  if (resultStreak) {
    resultStreak.textContent = maxCombo;
  }

  if (finalScore) {
    countUpTo(finalScore, score, 900, "");
  }

  if (accuracyScore) {
    const accuracy = Math.round(
      (reactionTimes.length / (reactionTimes.length + misses)) * 100,
    );

    accuracyScore.classList.toggle("is-perfect", accuracy === 100);

    countUpTo(accuracyScore, accuracy, 700, "%");
  }

  countUpTo(averageScore, average);
  countUpTo(fastestScore, fastest);
  countUpTo(resultBestScore, best);
}

function startRound() {
  stopMeow();

  if (round >= TOTAL_ROUNDS) {
    resetRun();
  }

  round++;

  if (round === 1) {
    isNewBest = false;
    hadBestBefore = best !== null;
  }

  renderDifficulty(round);

  isPlaying = true;
  targetReady = false;

  updatePauseButton();

  roundCounter.textContent = `Round ${round} / ${TOTAL_ROUNDS}`;

  updateRoundDots(round);

  reactionTime.textContent = "---";

  target.classList.remove("is-visible");

  const currentDifficulty = difficulty[round];

  const mode = getMode();

  // Cap the cat to the play area so it always fits, even on short screens
  const maxCatWidth = Math.floor(((gameArea.clientHeight - 32) * 222) / 288);

  target.style.width = `${Math.max(
    44,
    Math.min(
      Math.round(currentDifficulty.catSize * mode.sizeScale),
      maxCatWidth,
    ),
  )}px`;

  const delay =
    (currentDifficulty.minDelay +
      Math.random() *
        (currentDifficulty.maxDelay - currentDifficulty.minDelay)) *
    mode.delayScale;

  startCountdown(() => {
    gameStatus.textContent = "Watch for the cat...";
    roundLive = true;
    setGameState("waiting");

    schedule(() => {
      // keep the cat (and its glow) away from the edges so the
      // game area's overflow:hidden never cuts the shadow off
      const EDGE_PAD = 16;

      const randomX =
        EDGE_PAD +
        Math.random() *
          (gameArea.clientWidth - target.offsetWidth - EDGE_PAD * 2);

      const randomY =
        EDGE_PAD +
        Math.random() *
          (gameArea.clientHeight - target.offsetHeight - EDGE_PAD * 2);

      target.style.left = `${randomX}px`;
      target.style.top = `${randomY}px`;

      gameStatus.textContent = "CATCH IT!";
      setGameState("go");
      targetReady = true;
      target.classList.add("is-visible");

      playMeow();

      startTime = performance.now();
    }, delay);
  });
}

if (startButton) {
  if (savedBest !== null) {
    best = Number(savedBest);
    bestScore.textContent = `${best}ms`;
  }

  startButton.addEventListener("click", () => {
    if (isPlaying) {
      return;
    }

    startRound();
  });

  target.addEventListener("click", () => {
    if (!targetReady || isPaused) {
      return;
    }

    const reaction = Math.round(performance.now() - startTime);

    targetReady = false;
    roundLive = false;

    const hitX = target.offsetLeft + target.offsetWidth / 2;
    const hitY = target.offsetTop + target.offsetHeight / 2;

    gameArea.style.setProperty("--hit-x", `${hitX}px`);
    gameArea.style.setProperty("--hit-y", `${hitY}px`);

    gameArea.classList.remove("is-hit");

    void gameArea.offsetWidth;

    gameArea.classList.add("is-hit");

    target.classList.remove("is-visible");

    setGameState("cleared");

    if (roundDots[round - 1]) {
      roundDots[round - 1].classList.add("is-complete");
    }

    stopMeow();

    reactionTimes.push(reaction);

    const previousCombo = combo;

    updateCombo(reaction);

    const rating = getRating(reaction, getMultiplier(combo));

    addScore(rating.points);

    roundScores.push(rating.points);

    showHitFeedback(rating, hitX, hitY);

    sfx.hit(rating.tier);

    if (rating.multiplier > 1) {
      sfx.combo(combo);
    } else if (previousCombo >= 2) {
      sfx.comboLost();
    }

    reactionTime.textContent = `${reaction}ms`;

    if (best === null || reaction < best) {
      best = reaction;
      isNewBest = true;

      bestScore.textContent = `${best}ms`;

      if (bestStatBlock) {
        bestStatBlock.classList.remove("is-new");

        void bestStatBlock.offsetWidth;

        bestStatBlock.classList.add("is-new");
      }

      localStorage.setItem("best", best);
    }

    if (round < TOTAL_ROUNDS) {
      gameStatus.textContent = `Round ${round} clear! Next: ${difficulty[round + 1].label}`;

      schedule(startRound, 800);
    } else {
      isPlaying = false;

      updatePauseButton();

      gameStatus.textContent = "5 rounds complete!";

      showResults();
    }
  });
}

if (homeButton) {
  homeButton.addEventListener("click", () => {
    window.location.href = "homescreen.html?loading=true";
  });
}

const LOADING_FADE_MS = 250;
const LOADING_HOLD_MS = 2700;

function showLoading() {
  document.documentElement.classList.add("is-loading");
  loadingScreen.style.display = "flex";

  // next frame, so the fade-in transition actually runs
  requestAnimationFrame(() => {
    requestAnimationFrame(() => loadingScreen.classList.add("is-visible"));
  });
}

function hideLoading(onDone) {
  loadingScreen.classList.remove("is-visible");
  document.documentElement.classList.remove("is-loading", "is-returning");

  setTimeout(() => {
    loadingScreen.style.display = "none";

    if (onDone) {
      onDone();
    }
  }, LOADING_FADE_MS);
}

if (playButton) {
  const urlParams = new URLSearchParams(window.location.search);

  const isReturning = urlParams.get("loading") === "true";

  if (isReturning) {
    homeScreen.style.display = "none";
    showLoading();

    setTimeout(() => {
      homeScreen.style.display = "block";

      hideLoading(() => {
        playHomeMusic();
      });
    }, LOADING_HOLD_MS);
  } else {
    playHomeMusic();
  }

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) {
      return;
    }

    loadingScreen.classList.remove("is-visible");
    loadingScreen.style.display = "none";
    document.documentElement.classList.remove("is-loading", "is-returning");
    homeScreen.style.display = "block";

    playHomeMusic();
  });

  playButton.addEventListener("click", () => {
    if (homeMusic) {
      homeMusic.pause();
      homeMusic.currentTime = 0;
    }

    homeScreen.style.display = "none";
    showLoading();

    // fade out just before leaving so the page change isn't abrupt
    setTimeout(
      () => loadingScreen.classList.remove("is-visible"),
      LOADING_HOLD_MS,
    );

    setTimeout(() => {
      window.location.href = "index.html";
    }, LOADING_HOLD_MS + LOADING_FADE_MS);
  });
}

if (playAgainButton) {
  playAgainButton.addEventListener("click", () => {
    resultSound.pause();
    resultSound.currentTime = 0;

    resetRun();
    isPlaying = false;

    resultsScreen.style.display = "none";

    reactionTime.textContent = "---";
    gameStatus.textContent = "Ready to pounce?";

    startRound();
  });
}

function returnToIdle() {
  clearScheduled();
  stopMeow();
  closePauseScreen();

  resultSound.pause();
  resultSound.currentTime = 0;

  isPaused = false;
  isPlaying = false;
  targetReady = false;

  target.classList.remove("is-visible");
  hideCountdown();
  setGameState("idle");
  resetRun();
  updateRoundDots(1);
  updatePauseButton();

  resultsScreen.style.display = "none";

  roundCounter.textContent = `Round 1 / ${TOTAL_ROUNDS}`;
  reactionTime.textContent = "\u2014";
  gameStatus.textContent = "Ready?";

  playIdleSound();
}

if (resultsHomeButton) {
  resultsHomeButton.addEventListener("click", returnToIdle);
}

function openPauseScreen() {
  pauseScreen.classList.add("is-open");
  pauseScreen.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-paused");
}

function closePauseScreen() {
  pauseScreen.classList.remove("is-open");
  pauseScreen.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-paused");
}

function pauseGame() {
  if (!isPlaying || isPaused) {
    return;
  }

  isPaused = true;
  pausedAt = performance.now();

  freezeScheduled();

  if (targetReady) {
    meowSound.pause();
  }

  openPauseScreen();

  if (resumeButton) {
    resumeButton.focus();
  }
}

function resumeGame() {
  if (!isPaused) {
    return;
  }

  isPaused = false;

  if (targetReady) {
    startTime += performance.now() - pausedAt;

    meowSound.play().catch(() => {
      console.warn("Meow sound unavailable.");
    });
  }

  closePauseScreen();
  unfreezeScheduled();
}

function restartGame() {
  clearScheduled();
  stopMeow();
  closePauseScreen();

  isPaused = false;
  isPlaying = false;
  targetReady = false;

  target.classList.remove("is-visible");
  hideCountdown();
  setGameState("idle");
  resetRun();

  reactionTime.textContent = "---";
  gameStatus.textContent = "Ready to pounce?";

  startRound();
}

function quitGame() {
  clearScheduled();
  stopMeow();

  window.location.href = "homescreen.html?loading=true";
}

if (pauseButton && pauseScreen) {
  updatePauseButton();

  pauseButton.addEventListener("click", pauseGame);

  if (resumeButton) {
    resumeButton.addEventListener("click", resumeGame);
  }

  if (restartButton) {
    restartButton.addEventListener("click", restartGame);
  }

  if (quitButton) {
    quitButton.addEventListener("click", quitGame);
  }

  document.addEventListener("keydown", (event) => {
    if (event.repeat) {
      return;
    }

    if (settingsScreen && settingsScreen.classList.contains("is-open")) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === "escape" || key === "p") {
      if (isPaused) {
        resumeGame();
      } else {
        pauseGame();
      }
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseGame();
    }
  });
}

function showMissFeedback(x, y, label) {
  const el = document.createElement("div");

  el.className = "miss-feedback";
  el.textContent = label;

  const marginX = 50;
  const marginY = 30;

  el.style.left = `${Math.min(Math.max(x, marginX), gameArea.clientWidth - marginX)}px`;
  el.style.top = `${Math.min(Math.max(y, marginY), gameArea.clientHeight - marginY)}px`;

  gameArea.appendChild(el);

  el.addEventListener("animationend", () => el.remove());

  setTimeout(() => el.remove(), 1000);
}

if (gameArea) {
  gameArea.addEventListener(
    "click",
    (event) => {
      if (!roundLive || isPaused) {
        return;
      }

      if (targetReady && event.target.closest(".target")) {
        return;
      }

      misses++;

      const rect = gameArea.getBoundingClientRect();

      showMissFeedback(
        event.clientX - rect.left,
        event.clientY - rect.top,
        targetReady ? "MISS" : "TOO EARLY",
      );

      sfx.miss();
    },
    true,
  );
}

const ACHIEVEMENTS = [
  {
    id: "first_pounce",
    name: "First Pounce",
    desc: "Finish your first game",
    check: (s) => s.gamesPlayed >= 1,
  },
  {
    id: "quick_paws",
    name: "Quick Paws",
    desc: "React in under 500ms",
    check: (s) => s.fastest < 500,
  },
  {
    id: "lightning_paws",
    name: "Lightning Paws",
    desc: "React in under 450ms",
    check: (s) => s.fastest < 450,
  },
  {
    id: "purrfect_streak",
    name: "Purrfect Streak",
    desc: "Land a 5 combo",
    check: (s) => s.maxCombo >= 5,
  },
  {
    id: "sharp_claws",
    name: "Sharp Claws",
    desc: "Finish with 100% accuracy",
    check: (s) => s.accuracy === 100,
  },
  {
    id: "score_hunter",
    name: "Score Hunter",
    desc: "Score 700 or more in one game",
    check: (s) => s.score >= 700,
  },
  {
    id: "record_breaker",
    name: "Record Breaker",
    desc: "Beat your personal best",
    check: (s) => s.brokeRecord,
  },
  {
    id: "regular_kitty",
    name: "Regular Kitty",
    desc: "Finish 10 games",
    check: (s) => s.gamesPlayed >= 10,
  },
];

const resultAchievements = document.querySelector("#result-achievements");
const achievementsBtn = document.querySelector(".achievements-btn");
const achievementsCount = document.querySelector(".achievements-count");
const achievementsScreen = document.querySelector("#achievements-screen");
const achievementsList = document.querySelector(".achievements-list");
const achievementsCloseBtn = document.querySelector("#achievements-close-btn");

function loadUnlocked() {
  try {
    const stored = JSON.parse(localStorage.getItem("achievements"));

    return Array.isArray(stored) ? stored : [];
  } catch (err) {
    return [];
  }
}

function saveUnlocked(list) {
  try {
    localStorage.setItem("achievements", JSON.stringify(list));
  } catch (err) {
    console.warn("Could not save achievements:", err);
  }
}

function checkAchievements() {
  const gamesPlayed = Number(localStorage.getItem("gamesPlayed") || 0) + 1;

  try {
    localStorage.setItem("gamesPlayed", gamesPlayed);
  } catch (err) {
    console.warn("Could not save games played:", err);
  }

  const hits = reactionTimes.length;

  const stats = {
    gamesPlayed,
    fastest: Math.min(...reactionTimes),
    maxCombo,
    score,
    accuracy: Math.round((hits / (hits + misses)) * 100),
    brokeRecord: isNewBest && hadBestBefore,
  };

  const unlocked = loadUnlocked();

  const earned = ACHIEVEMENTS.filter(
    (achievement) =>
      !unlocked.includes(achievement.id) && achievement.check(stats),
  );

  if (earned.length > 0) {
    saveUnlocked([...unlocked, ...earned.map((achievement) => achievement.id)]);
  }

  return earned;
}

function createResultHeading(text) {
  const heading = document.createElement("p");

  heading.className = "result-achievements-title";
  heading.textContent = text;

  return heading;
}

function createResultChip(name, desc, index) {
  const chip = document.createElement("div");

  chip.className = "achievement-chip";
  chip.style.setProperty("--i", index);

  const title = document.createElement("strong");
  title.textContent = name;

  const detail = document.createElement("span");
  detail.textContent = desc;

  chip.append(title, detail);

  return chip;
}

function renderResultAchievements(list, newRecords = []) {
  if (!resultAchievements) {
    return;
  }

  const hasItems = list.length > 0 || newRecords.length > 0;

  resultAchievements.textContent = "";
  resultAchievements.classList.toggle("has-items", hasItems);

  if (!hasItems) {
    return;
  }

  let index = 0;

  if (newRecords.length > 0) {
    resultAchievements.appendChild(
      createResultHeading(`NEW RECORD - ${getMode().label}`),
    );

    newRecords.forEach(({ field, previous, value }) => {
      resultAchievements.appendChild(
        createResultChip(
          field.label,
          `${field.format(value)} (was ${field.format(previous)})`,
          index++,
        ),
      );
    });
  }

  if (list.length > 0) {
    resultAchievements.appendChild(createResultHeading("ACHIEVEMENT UNLOCKED"));

    list.forEach((achievement) => {
      resultAchievements.appendChild(
        createResultChip(achievement.name, achievement.desc, index++),
      );
    });
  }
}

function renderAchievementsList() {
  const unlocked = loadUnlocked();

  if (achievementsCount) {
    achievementsCount.textContent = `${unlocked.length}/${ACHIEVEMENTS.length}`;
  }

  if (!achievementsList) {
    return;
  }

  achievementsList.textContent = "";

  ACHIEVEMENTS.forEach((achievement) => {
    const isUnlocked = unlocked.includes(achievement.id);

    const item = document.createElement("li");
    item.className = "achievement-item";
    item.classList.toggle("is-unlocked", isUnlocked);

    const text = document.createElement("div");

    const name = document.createElement("strong");
    name.textContent = achievement.name;

    const desc = document.createElement("span");
    desc.textContent = achievement.desc;

    text.append(name, desc);

    const status = document.createElement("em");
    status.textContent = isUnlocked ? "UNLOCKED" : "LOCKED";

    item.append(text, status);
    achievementsList.appendChild(item);
  });
}

function openAchievements() {
  renderAchievementsList();

  achievementsScreen.classList.add("is-open");
  achievementsScreen.setAttribute("aria-hidden", "false");

  if (achievementsCloseBtn) {
    achievementsCloseBtn.focus();
  }
}

function closeAchievements() {
  achievementsScreen.classList.remove("is-open");
  achievementsScreen.setAttribute("aria-hidden", "true");
}

if (achievementsBtn && achievementsScreen) {
  renderAchievementsList();

  achievementsBtn.addEventListener("click", openAchievements);

  if (achievementsCloseBtn) {
    achievementsCloseBtn.addEventListener("click", closeAchievements);
  }

  achievementsScreen.addEventListener("click", (event) => {
    if (event.target === achievementsScreen) {
      closeAchievements();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAchievements();
    }
  });
}

const MODES = {
  easy: {
    id: "easy",
    label: "EASY",
    sizeScale: 1.25,
    delayScale: 1.3,
    scoreMult: 0.8,
    hint: "Bigger cat, longer waits, x0.8 points",
  },
  normal: {
    id: "normal",
    label: "NORMAL",
    sizeScale: 1,
    delayScale: 1,
    scoreMult: 1,
    hint: "The classic run, x1 points",
  },
  hard: {
    id: "hard",
    label: "HARD",
    sizeScale: 0.8,
    delayScale: 0.75,
    scoreMult: 1.25,
    hint: "Tiny cat, quick spawns, x1.25 points",
  },
};

function getMode() {
  let key = "normal";

  try {
    key = localStorage.getItem("mode") || "normal";
  } catch (err) {
    key = "normal";
  }

  return MODES[key] || MODES.normal;
}

function setMode(key) {
  try {
    localStorage.setItem("mode", key);
  } catch (err) {
    console.warn("Could not save mode:", err);
  }
}

const modeButtons = document.querySelectorAll(".mode-btn");
const modeHint = document.querySelector(".mode-hint");
const modeTag = document.querySelector(".mode-tag");

function renderModeSelect() {
  const current = getMode();

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === current.id;

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-checked", String(isActive));
  });

  if (modeHint) {
    modeHint.textContent = current.hint;
  }

  // CSS hooks: accent colour on the picker, mascot mood per mode
  const modeSelectEl = document.querySelector(".mode-select");
  const mascotWrapEl = document.querySelector(".mascot-wrap");

  if (modeSelectEl) {
    modeSelectEl.dataset.mode = current.id;
  }

  if (mascotWrapEl) {
    mascotWrapEl.dataset.mode = current.id;
  }
}

if (modeButtons.length > 0) {
  renderModeSelect();

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.mode);
      renderModeSelect();
      renderHomeStats();

      replayAnimation(button, "is-picked");
      replayAnimation(document.querySelector(".mascot-wrap"), "is-hop");
      replayAnimation(modeHint, "is-changing");
      replayAnimation(homeStats, "is-changing");
    });
  });
}

if (modeTag) {
  modeTag.textContent = `MODE: ${getMode().label}`;
}

const RECORDS_KEY = "records";
const HISTORY_KEY = "history";
const HISTORY_LIMIT = 20;
const RECENT_GAMES_SHOWN = 5;

const RECORD_FIELDS = [
  {
    key: "fastest",
    label: "Fastest reaction",
    short: "Fastest",
    lowerIsBetter: true,
    format: (value) => `${value}ms`,
  },
  {
    key: "bestAverage",
    label: "Best average",
    short: "Best avg",
    lowerIsBetter: true,
    format: (value) => `${value}ms`,
  },
  {
    key: "highScore",
    label: "High score",
    short: "High score",
    lowerIsBetter: false,
    format: (value) => String(value),
  },
  {
    key: "bestCombo",
    label: "Best combo",
    short: "Best combo",
    lowerIsBetter: false,
    format: (value) => String(value),
  },
];

function toNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function loadRecords() {
  let stored = null;

  try {
    stored = JSON.parse(localStorage.getItem(RECORDS_KEY));
  } catch (err) {
    stored = null;
  }

  const records = {};

  Object.keys(MODES).forEach((id) => {
    const saved =
      stored && typeof stored[id] === "object" && stored[id] !== null
        ? stored[id]
        : {};

    const record = { games: toNumber(saved.games) || 0 };

    RECORD_FIELDS.forEach((field) => {
      record[field.key] = toNumber(saved[field.key]);
    });

    records[id] = record;
  });

  return records;
}

function saveRecords(records) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn("Could not save records:", err);
  }
}

function loadHistory() {
  let stored = null;

  try {
    stored = JSON.parse(localStorage.getItem(HISTORY_KEY));
  } catch (err) {
    stored = null;
  }

  if (!Array.isArray(stored)) {
    return [];
  }

  return stored.filter(
    (entry) =>
      entry &&
      MODES[entry.mode] &&
      RECORD_FIELDS.every((field) => toNumber(entry[field.key]) !== null),
  );
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn("Could not save game history:", err);
  }
}

function recordGame(result) {
  const modeId = getMode().id;
  const records = loadRecords();
  const record = records[modeId];
  const broken = [];

  record.games += 1;

  RECORD_FIELDS.forEach((field) => {
    const value = result[field.key];
    const previous = record[field.key];

    const isBetter =
      previous === null ||
      (field.lowerIsBetter ? value < previous : value > previous);

    if (!isBetter) {
      return;
    }

    record[field.key] = value;

    if (previous !== null && previous > 0) {
      broken.push({ field, previous, value });
    }
  });

  saveRecords(records);

  const history = loadHistory();

  history.push({ mode: modeId, ...result, at: Date.now() });
  saveHistory(history.slice(-HISTORY_LIMIT));

  return broken;
}

function getTotalGames() {
  try {
    return Number(localStorage.getItem("gamesPlayed")) || 0;
  } catch (err) {
    return 0;
  }
}

const homeStats = document.querySelector(".home-stats");

function replayAnimation(el, className) {
  if (!el) {
    return;
  }

  el.classList.remove(className);

  void el.offsetWidth;

  el.classList.add(className);
}

function renderHomeStats() {
  if (!homeStats) {
    return;
  }

  const mode = getMode();
  const record = loadRecords()[mode.id];

  const caption = homeStats.querySelector(".home-stats-mode");
  const games = homeStats.querySelector(".home-stat-games");
  const fastest = homeStats.querySelector(".home-stat-fastest");
  const highScore = homeStats.querySelector(".home-stat-score");

  if (caption) {
    caption.textContent =
      record.games > 0
        ? `${mode.label} RECORDS`
        : `${mode.label} - NO GAMES YET`;
  }

  if (games) {
    games.textContent = String(record.games);
  }

  if (fastest) {
    fastest.textContent = record.fastest === null ? "—" : `${record.fastest}ms`;
  }

  if (highScore) {
    highScore.textContent =
      record.highScore === null ? "—" : String(record.highScore);
  }
}

renderHomeStats();

const recordsBtn = document.querySelector(".records-btn");
const recordsScreen = document.querySelector("#records-screen");
const recordsBody = document.querySelector(".records-body");
const recordsCloseBtn = document.querySelector("#records-close-btn");

function createRecordsRow(label, cells) {
  const row = document.createElement("tr");

  const head = document.createElement("th");
  head.scope = "row";
  head.textContent = label;

  row.appendChild(head);

  cells.forEach((text) => {
    const cell = document.createElement("td");

    cell.textContent = text;
    cell.classList.toggle("is-empty", text === "—");

    row.appendChild(cell);
  });

  return row;
}

function renderRecords() {
  if (!recordsBody) {
    return;
  }

  const records = loadRecords();
  const history = loadHistory();
  const modes = Object.values(MODES);

  recordsBody.textContent = "";

  const total = document.createElement("p");
  total.className = "records-total";
  total.textContent = `TOTAL GAMES ${getTotalGames()}`;

  recordsBody.appendChild(total);

  const table = document.createElement("table");
  table.className = "records-table";

  const headRow = table.createTHead().insertRow();

  headRow.appendChild(document.createElement("th"));

  modes.forEach((mode) => {
    const th = document.createElement("th");

    th.scope = "col";
    th.textContent = mode.label;

    headRow.appendChild(th);
  });

  const body = table.createTBody();

  body.appendChild(
    createRecordsRow(
      "Games",
      modes.map((mode) => String(records[mode.id].games)),
    ),
  );

  RECORD_FIELDS.forEach((field) => {
    body.appendChild(
      createRecordsRow(
        field.short,
        modes.map((mode) => {
          const value = records[mode.id][field.key];

          return value === null ? "—" : field.format(value);
        }),
      ),
    );
  });

  recordsBody.appendChild(table);

  if (history.length === 0) {
    return;
  }

  const subtitle = document.createElement("p");
  subtitle.className = "records-subtitle";
  subtitle.textContent = "RECENT GAMES";

  recordsBody.appendChild(subtitle);

  const list = document.createElement("ul");
  list.className = "records-history";

  history
    .slice(-RECENT_GAMES_SHOWN)
    .reverse()
    .forEach((entry) => {
      const item = document.createElement("li");

      const mode = document.createElement("strong");
      mode.textContent = MODES[entry.mode].label;

      const detail = document.createElement("span");
      detail.textContent = `${entry.highScore} pts - ${entry.bestAverage}ms avg - ${entry.fastest}ms best`;

      item.append(mode, detail);
      list.appendChild(item);
    });

  recordsBody.appendChild(list);
}

function openRecords() {
  renderRecords();

  recordsScreen.classList.add("is-open");
  recordsScreen.setAttribute("aria-hidden", "false");

  if (recordsCloseBtn) {
    recordsCloseBtn.focus();
  }
}

function closeRecords() {
  recordsScreen.classList.remove("is-open");
  recordsScreen.setAttribute("aria-hidden", "true");
}

if (recordsBtn && recordsScreen) {
  recordsBtn.addEventListener("click", openRecords);

  if (recordsCloseBtn) {
    recordsCloseBtn.addEventListener("click", closeRecords);
  }

  recordsScreen.addEventListener("click", (event) => {
    if (event.target === recordsScreen) {
      closeRecords();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeRecords();
    }
  });
}

const settingsScreen = document.querySelector("#settings-screen");
const settingsBtn = document.querySelector(".settings-btn");
const pauseSettingsBtn = document.querySelector("#pause-settings-btn");
const settingsCloseBtn = document.querySelector("#settings-close-btn");
const settingToggles = document.querySelectorAll(".toggle[data-setting]");

function renderSettings() {
  settingToggles.forEach((toggle) => {
    const isOn = settings[toggle.dataset.setting];

    toggle.classList.toggle("is-on", isOn);
    toggle.setAttribute("aria-checked", String(isOn));
  });

  document.querySelectorAll(".volume-slider[data-volume]").forEach((slider) => {
    const percent = Math.round(settings[slider.dataset.volume] * 100);

    slider.value = String(percent);
    slider.style.setProperty("--fill", `${percent}%`);
  });
}

function openSettings() {
  renderSettings();

  settingsScreen.classList.add("is-open");
  settingsScreen.setAttribute("aria-hidden", "false");

  if (settingsCloseBtn) {
    settingsCloseBtn.focus();
  }
}

function closeSettings() {
  settingsScreen.classList.remove("is-open");
  settingsScreen.setAttribute("aria-hidden", "true");
}

function applyMusicSetting(isOn) {
  if (!homeMusic) {
    return;
  }

  if (isOn) {
    homeMusic.muted = false;
    playHomeMusic();
  } else {
    homeMusic.pause();
  }
}

if (settingsScreen) {
  if (settingsBtn) {
    settingsBtn.addEventListener("click", openSettings);
  }

  if (pauseSettingsBtn) {
    pauseSettingsBtn.addEventListener("click", openSettings);
  }

  if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener("click", closeSettings);
  }

  settingsScreen.addEventListener("click", (event) => {
    if (event.target === settingsScreen) {
      closeSettings();
    }
  });

  settingToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const key = toggle.dataset.setting;
      const value = !settings[key];

      // the switch moves its slider too: off = empty bar, on = full bar
      const volumeKey = { music: "musicVolume", sfx: "sfxVolume" }[key];

      if (volumeKey) {
        saveSetting(volumeKey, value ? 1 : 0);
      }

      saveSetting(key, value);

      if (key === "music") {
        applyMusicSetting(value);
      }

      renderSettings();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      settingsScreen.classList.contains("is-open")
    ) {
      closeSettings();
    }
  });
}

applySettings();

/* ===== Feature 5: settings & accessibility ===== */

// Volume sliders (music and sound effects are independent)
document.querySelectorAll(".volume-slider[data-volume]").forEach((slider) => {
  slider.addEventListener("input", () => {
    const key = slider.dataset.volume;
    const percent = Number(slider.value);

    // each slider drives its own switch: 0 turns it off, any sound turns it on
    const switchKey = key === "musicVolume" ? "music" : "sfx";
    const shouldBeOn = percent > 0;

    slider.style.setProperty("--fill", `${percent}%`);
    saveSetting(key, percent / 100);

    if (settings[switchKey] !== shouldBeOn) {
      saveSetting(switchKey, shouldBeOn);

      if (switchKey === "music") {
        applyMusicSetting(shouldBeOn);
      }

      renderSettings();
    }
  });

  // a short blip lets the player hear the new sound-effect level
  slider.addEventListener("change", () => {
    if (slider.dataset.volume === "sfxVolume") {
      sfx.click();
    }
  });
});

renderSettings();

// Keyboard: Space starts a round when idle and catches the cat when it shows
(() => {
  if (!document.body.classList.contains("game-page")) {
    return;
  }

  let spaceHandled = false;

  const dialogOpen = () =>
    document.querySelector(
      "#pause-screen.is-open, #settings-screen.is-open",
    ) !== null || resultsScreen.style.display === "flex";

  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space" || event.repeat || dialogOpen() || isPaused) {
      return;
    }

    if (event.target.closest && event.target.closest(".home-btn, .pause-btn")) {
      return;
    }

    event.preventDefault();
    spaceHandled = true;

    if (targetReady) {
      target.click();
    } else if (!isPlaying) {
      startButton.click();
    }
  });

  // stop a focused button from also firing its own click on key release
  document.addEventListener("keyup", (event) => {
    if (event.code === "Space" && spaceHandled) {
      event.preventDefault();
      spaceHandled = false;
    }
  });
})();

// Dialogs: block the page behind, trap Tab, and give focus back on close
(() => {
  const dialogs = [
    document.querySelector("#pause-screen"),
    document.querySelector("#settings-screen"),
    document.querySelector("#achievements-screen"),
    document.querySelector("#records-screen"),
    document.querySelector("#results-screen"),
  ].filter(Boolean);

  const page = document.querySelector(".game-container");

  const isOpen = (dialog) =>
    dialog.classList.contains("is-open") || dialog.style.display === "flex";

  const FOCUSABLE =
    'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

  let lastFocus = null;
  let hadOpen = false;

  // remember what had focus while no dialog was open
  document.addEventListener("focusin", (event) => {
    if (!dialogs.some(isOpen)) {
      lastFocus = event.target;
    }
  });

  function syncDialogs() {
    const open = dialogs.filter(isOpen);
    const top = open[open.length - 1];

    if (page) {
      page.inert = open.length > 0;
    }

    // a dialog under another dialog (settings over pause) is inert too
    dialogs.forEach((dialog) => {
      dialog.inert = open.length > 1 && dialog !== top;
    });

    if (hadOpen && open.length === 0 && lastFocus && lastFocus.isConnected) {
      lastFocus.focus({ preventScroll: true });
    }

    hadOpen = open.length > 0;
  }

  const observer = new MutationObserver(syncDialogs);

  dialogs.forEach((dialog) => {
    observer.observe(dialog, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") {
      return;
    }

    const open = dialogs.filter(isOpen);
    const top = open[open.length - 1];

    if (!top) {
      return;
    }

    const items = [...top.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null,
    );

    if (items.length === 0) {
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];

    if (!top.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();

// first load: the idle scuba cat is already dancing, so start its sound
playIdleSound();
