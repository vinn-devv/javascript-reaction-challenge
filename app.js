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

const soundButton = document.querySelector(".sound-btn");
const soundText = document.querySelector(".sound-text");

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
const resultsLabel = document.querySelector("#results-screen .results-label");
const resultBestStat = resultBestScore
  ? resultBestScore.closest(".result-stat")
  : null;
const bestStatBlock = bestScore ? bestScore.closest(".stat-block") : null;

const difficultyEl = document.querySelector(".difficulty");
const difficultyName = document.querySelector(".difficulty-name");
const difficultyBarsEl = document.querySelector(".difficulty-bars");

const pauseButton = document.querySelector(".pause-btn");
const pauseScreen = document.querySelector("#pause-screen");
const resumeButton = document.querySelector("#resume-btn");
const restartButton = document.querySelector("#restart-btn");
const quitButton = document.querySelector("#quit-btn");

const DEFAULT_SETTINGS = { music: true, sfx: true, effects: true };

function loadSettings() {
  try {
    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(localStorage.getItem("settings")),
    };
  } catch (err) {
    return { ...DEFAULT_SETTINGS };
  }
}

let settings = loadSettings();

function applySettings() {
  document.body.classList.toggle("no-effects", !settings.effects);

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

  homeMusic.volume = 0.03;

  homeMusic.play().catch(() => {
    console.log("Autoplay was blocked by the browser.");
  });
}

function updateSoundButton() {
  if (!soundButton || !homeMusic || !soundText) {
    return;
  }

  const isOn = !homeMusic.paused && !homeMusic.muted;

  soundButton.classList.toggle("is-off", !isOn);

  soundText.textContent = isOn ? "ON" : "OFF";

  soundButton.setAttribute(
    "aria-label",
    isOn ? "Turn music off" : "Turn music on",
  );

  soundButton.setAttribute("aria-pressed", String(isOn));
}

if (soundButton && homeMusic) {
  soundButton.addEventListener("click", () => {
    if (homeMusic.paused) {
      homeMusic.muted = false;
      homeMusic.volume = 0.03;

      homeMusic.play().catch(() => {
        console.log("Music playback was blocked.");
      });
    } else {
      homeMusic.muted = !homeMusic.muted;
    }

    saveSetting("music", !homeMusic.paused && !homeMusic.muted);

    updateSoundButton();
  });

  homeMusic.addEventListener("play", updateSoundButton);
  homeMusic.addEventListener("pause", updateSoundButton);
  homeMusic.addEventListener("volumechange", updateSoundButton);

  updateSoundButton();
}

if (catCanvas && catSource) {
  const ctx = catCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  const cw = catCanvas.width;
  const ch = catCanvas.height;

  const BLACK_CUTOFF = 40;
  const FEATHER_CUTOFF = 75;

  const renderCatFrame = () => {
    if (catSource.readyState >= 2 && !catSource.paused) {
      ctx.drawImage(catSource, 0, 0, cw, ch);

      const frame = ctx.getImageData(0, 0, cw, ch);
      const d = frame.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        const lum = (r + g + b) / 3;

        if (lum <= BLACK_CUTOFF) {
          d[i + 3] = 0;
        } else if (lum < FEATHER_CUTOFF) {
          d[i + 3] = Math.round(
            ((lum - BLACK_CUTOFF) / (FEATHER_CUTOFF - BLACK_CUTOFF)) * 255,
          );
        }
      }

      ctx.putImageData(frame, 0, 0);
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
  if (!settings.sfx) {
    return;
  }

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

let difficultyBars = [];

if (difficultyBarsEl) {
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const bar = document.createElement("span");

    bar.className = "bar";

    difficultyBarsEl.appendChild(bar);

    difficultyBars.push(bar);
  }
}

function updateRoundDots(currentRound) {
  roundDots.forEach((dot, i) => {
    const dotRound = i + 1;

    dot.classList.toggle("is-done", dotRound < currentRound);
    dot.classList.toggle("is-current", dotRound === currentRound);
  });
}

const difficulty = {
  1: {
    label: "EASY",
    rgb: "192, 132, 252",
    minDelay: 1000,
    maxDelay: 3000,
    catSize: 96,
  },

  2: {
    label: "NORMAL",
    rgb: "168, 85, 247",
    minDelay: 800,
    maxDelay: 2500,
    catSize: 92,
  },

  3: {
    label: "TRICKY",
    rgb: "217, 70, 239",
    minDelay: 600,
    maxDelay: 2000,
    catSize: 88,
  },

  4: {
    label: "HARD",
    rgb: "244, 114, 182",
    minDelay: 400,
    maxDelay: 1500,
    catSize: 84,
  },

  5: {
    label: "INSANE",
    rgb: "251, 113, 133",
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

  difficultyBars.forEach((bar, i) => {
    bar.classList.toggle("is-on", i < level);
  });

  difficultyName.textContent = config ? config.label : "READY";

  difficultyEl.classList.remove("is-up");

  if (config) {
    document.body.style.setProperty("--level-color", `rgb(${config.rgb})`);
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
  score = 0;
  combo = 0;
  maxCombo = 0;
  misses = 0;
  roundLive = false;

  renderComboBadge(0);
  renderDifficulty(0);

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

  if (round > 1 && !FULL_COUNTDOWN_EVERY_ROUND) {
    showCountdownStep(`ROUND ${round}\n${difficulty[round].label}`, "is-round");
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
  const scale = Math.max(...reactionTimes, 500);

  reactionTimes.forEach((reaction, i) => {
    const row = document.createElement("div");

    row.className = `breakdown-row is-${getRating(reaction).tier}`;

    if (reaction === fastest) {
      row.classList.add("is-fastest");
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

    row.append(label, track, time);
    roundBreakdown.appendChild(row);
  });
}

function showResults() {
  const total = reactionTimes.reduce((sum, time) => sum + time, 0);

  const average = Math.round(total / reactionTimes.length);

  const fastest = Math.min(...reactionTimes);

  updateRoundDots(TOTAL_ROUNDS + 1);

  const result = updateResultReaction(average);

  if (resultRank) {
    resultRank.className = `result-rank is-${result.tier}`;
    resultRank.textContent = result.rank;
  }

  renderBreakdown();

  if (resultsLabel) {
    resultsLabel.textContent = isNewBest
      ? "NEW BEST!"
      : `GAME COMPLETE - ${getMode().label}`;
    resultsLabel.classList.toggle("is-new-best", isNewBest);
  }

  if (resultBestStat) {
    resultBestStat.classList.toggle("is-new-best", isNewBest);
  }

  if (isNewBest) {
    setTimeout(() => sfx.newBest(), 500);
  }

  const unlockedNow = checkAchievements();

  renderResultAchievements(unlockedNow);

  if (unlockedNow.length > 0) {
    setTimeout(() => sfx.achievement(), 1300);
  }

  resultsScreen.style.display = "flex";

  if (playAgainButton) {
    playAgainButton.focus();
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

  roundCounter.textContent = `Round ${String(round).padStart(2, "0")}`;

  updateRoundDots(round);

  reactionTime.textContent = "---";

  target.classList.remove("is-visible");

  const currentDifficulty = difficulty[round];

  const mode = getMode();

  target.style.width = `${Math.round(currentDifficulty.catSize * mode.sizeScale)}px`;

  const delay =
    (currentDifficulty.minDelay +
      Math.random() *
        (currentDifficulty.maxDelay - currentDifficulty.minDelay)) *
    mode.delayScale;

  startCountdown(() => {
    gameStatus.textContent = "Watch for the cat...";
    roundLive = true;

    schedule(() => {
      const randomX =
        Math.random() * (gameArea.clientWidth - target.offsetWidth);

      const randomY =
        Math.random() * (gameArea.clientHeight - target.offsetHeight);

      target.style.left = `${randomX}px`;
      target.style.top = `${randomY}px`;

      gameStatus.textContent = "CATCH IT!";
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

    stopMeow();

    reactionTimes.push(reaction);

    const previousCombo = combo;

    updateCombo(reaction);

    const rating = getRating(reaction, getMultiplier(combo));

    addScore(rating.points);

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
      gameStatus.textContent = "Round complete! Get ready...";

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

if (playButton) {
  const urlParams = new URLSearchParams(window.location.search);

  const isReturning = urlParams.get("loading") === "true";

  if (isReturning) {
    homeScreen.style.display = "none";
    loadingScreen.style.display = "flex";

    setTimeout(() => {
      loadingScreen.style.display = "none";
      homeScreen.style.display = "block";

      playHomeMusic();
    }, 1200);
  } else {
    playHomeMusic();
  }

  playButton.addEventListener("click", () => {
    if (homeMusic) {
      homeMusic.pause();
      homeMusic.currentTime = 0;
    }

    homeScreen.style.display = "none";
    loadingScreen.style.display = "flex";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
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

if (resultsHomeButton) {
  resultsHomeButton.addEventListener("click", () => {
    resultSound.pause();

    window.location.href = "homescreen.html?loading=true";
  });
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
    desc: "React in under 300ms",
    check: (s) => s.fastest < 300,
  },
  {
    id: "lightning_paws",
    name: "Lightning Paws",
    desc: "React in under 200ms",
    check: (s) => s.fastest < 200,
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

function renderResultAchievements(list) {
  if (!resultAchievements) {
    return;
  }

  resultAchievements.textContent = "";
  resultAchievements.classList.toggle("has-items", list.length > 0);

  if (list.length === 0) {
    return;
  }

  const heading = document.createElement("p");

  heading.className = "result-achievements-title";
  heading.textContent = "ACHIEVEMENT UNLOCKED";

  resultAchievements.appendChild(heading);

  list.forEach((achievement, i) => {
    const chip = document.createElement("div");

    chip.className = "achievement-chip";
    chip.style.setProperty("--i", i);

    const name = document.createElement("strong");
    name.textContent = achievement.name;

    const desc = document.createElement("span");
    desc.textContent = achievement.desc;

    chip.append(name, desc);
    resultAchievements.appendChild(chip);
  });
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
}

if (modeButtons.length > 0) {
  renderModeSelect();

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.mode);
      renderModeSelect();
    });
  });
}

if (modeTag) {
  modeTag.textContent = `MODE: ${getMode().label}`;
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
