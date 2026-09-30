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

/* ---------- Home music + sound button ---------- */

function playHomeMusic() {
  if (!homeMusic) {
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

  // "ON" only if music is actually audible (not blocked, paused, or muted)
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

    updateSoundButton();
  });

  // Keep the button in sync with the real playback state
  homeMusic.addEventListener("play", updateSoundButton);
  homeMusic.addEventListener("pause", updateSoundButton);
  homeMusic.addEventListener("volumechange", updateSoundButton);

  updateSoundButton();
}

/* ---------- Cat video -> canvas with black keyed out ---------- */

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

  // Guard so only one render loop ever runs
  let catLoopRunning = false;

  const startCatLoop = () => {
    if (catLoopRunning) {
      return;
    }

    catLoopRunning = true;
    updateCatFrame();
  };

  catSource.addEventListener("playing", startCatLoop);

  // Video may already be playing before this listener was attached
  if (!catSource.paused) {
    startCatLoop();
  }
}

/* ---------- Sounds ---------- */

const meowSound = new Audio("assets/meow.mp3");

meowSound.preload = "auto";
meowSound.loop = true;

const resultSound = new Audio();

resultSound.volume = 0.5;
resultSound.preload = "auto";

function playMeow() {
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

/* ---------- State ---------- */

const savedBest = localStorage.getItem("best");

const homeBest = document.querySelector(".home-best");

if (homeBest) {
  homeBest.textContent = savedBest !== null ? `${savedBest}ms` : "—";
}

let startTime = 0;
let best = null;
let isPlaying = false; // true for the whole 5-round run, not just one round
let targetReady = false;

let round = 0;
const TOTAL_ROUNDS = 5;
let reactionTimes = [];
let score = 0;

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

    dot.classList.toggle("is-done", dotRound < currentRound);
    dot.classList.toggle("is-current", dotRound === currentRound);
  });
}

const difficulty = {
  1: {
    minDelay: 1000,
    maxDelay: 3000,
    catSize: 96,
  },

  2: {
    minDelay: 800,
    maxDelay: 2500,
    catSize: 92,
  },

  3: {
    minDelay: 600,
    maxDelay: 2000,
    catSize: 88,
  },

  4: {
    minDelay: 400,
    maxDelay: 1500,
    catSize: 84,
  },

  5: {
    minDelay: 250,
    maxDelay: 1000,
    catSize: 78,
  },
};

/* ---------- Scoring + performance feedback ---------- */

// Ratings line up with the results-screen thresholds (500ms / 700ms)
const RATINGS = [
  { max: 250, label: "LIGHTNING!", tier: "lightning" },
  { max: 350, label: "FAST!", tier: "fast" },
  { max: 500, label: "GOOD", tier: "good" },
  { max: 700, label: "OKAY", tier: "okay" },
  { max: Infinity, label: "SLOW", tier: "slow" },
];

const MAX_POINTS_PER_ROUND = 200;

function getRating(reaction) {
  const rating = RATINGS.find((r) => reaction < r.max);

  // 1000ms or slower = 0 pts, every 5ms faster = +1 pt
  const points = Math.max(
    0,
    Math.min(MAX_POINTS_PER_ROUND, Math.round((1000 - reaction) / 5)),
  );

  return { ...rating, points };
}

function resetRun() {
  round = 0;
  reactionTimes = [];
  score = 0;

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

  // Keep the popup inside the game area even if the cat is near an edge
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

  // Fallback in case animations are disabled
  setTimeout(() => el.remove(), 1200);
}

/* ---------- Mouse glow ---------- */

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

/* ---------- Game ---------- */

/* ---------- Countdown ---------- */

const COUNTDOWN_STEP_MS = 900; // how long each of 3 / 2 / 1 stays on screen
const COUNTDOWN_GO_MS = 700; // how long "GO!" stays on screen
const ROUND_INTRO_MS = 800; // "ROUND N" flash for rounds 2-5
const FULL_COUNTDOWN_EVERY_ROUND = false; // true = 3-2-1-GO! before every round

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
  // Reset classes and force a reflow so the pop animation restarts each step
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

  // Rounds 2-5 get a quick "ROUND N" beat instead of a full 3-2-1
  if (round > 1 && !FULL_COUNTDOWN_EVERY_ROUND) {
    showCountdownStep(`ROUND ${round}`, "is-round");

    setTimeout(() => {
      hideCountdown();
      callback();
    }, ROUND_INTRO_MS);

    return;
  }

  let count = 3;

  showCountdownStep(count);

  const countdown = setInterval(() => {
    count--;

    if (count > 0) {
      showCountdownStep(count);
      return;
    }

    clearInterval(countdown);

    showCountdownStep("GO!", "is-go");

    setTimeout(() => {
      hideCountdown();
      callback();
    }, COUNTDOWN_GO_MS);
  }, COUNTDOWN_STEP_MS);
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

function updateResultReaction(average) {
  if (!resultGif || !resultTitle) {
    return;
  }

  resultSound.pause();
  resultSound.currentTime = 0;

  if (average < 500) {
    resultGif.src = "assets/Cat Meme GIF.gif";

    resultTitle.textContent = "I see, you have fast hands.";

    resultSound.src = "assets/dexter-meme.mp3";
  } else if (average <= 700) {
    resultGif.src = "assets/Happy Cat GIF.gif";

    resultTitle.textContent = "Absolute nyan! Nice!";

    resultSound.src = "assets/happy-cat.mp3";
  } else {
    resultGif.src = "assets/Lemme Think GIF.gif";

    resultTitle.textContent = "Is this you?";

    resultSound.src = "assets/loading-meme.mp3";
  }

  resultSound.play().catch((error) => {
    console.log("Result sound failed:", error);
  });
}

function showResults() {
  const total = reactionTimes.reduce((sum, time) => sum + time, 0);

  const average = Math.round(total / reactionTimes.length);

  const fastest = Math.min(...reactionTimes);

  // Mark all five dots as done
  updateRoundDots(TOTAL_ROUNDS + 1);

  updateResultReaction(average);

  resultsScreen.style.display = "flex";

  if (finalScore) {
    countUpTo(finalScore, score, 900, "");
  }

  countUpTo(averageScore, average);
  countUpTo(fastestScore, fastest);
  countUpTo(resultBestScore, best);
}

function startRound() {
  // Starting a fresh run
  if (round >= TOTAL_ROUNDS) {
    resetRun();
  }

  round++;

  isPlaying = true;
  targetReady = false;

  roundCounter.textContent = `Round ${String(round).padStart(2, "0")}`;

  updateRoundDots(round);

  reactionTime.textContent = "---";

  target.classList.remove("is-visible");

  const currentDifficulty = difficulty[round];

  target.style.width = `${currentDifficulty.catSize}px`;

  const delay =
    currentDifficulty.minDelay +
    Math.random() * (currentDifficulty.maxDelay - currentDifficulty.minDelay);

  startCountdown(() => {
    gameStatus.textContent = "Watch for the cat...";

    setTimeout(() => {
      // Position first, then reveal
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

  // Registered once, not once per round
  target.addEventListener("click", () => {
    if (!targetReady) {
      return;
    }

    const reaction = Math.round(performance.now() - startTime);

    targetReady = false;

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

    const rating = getRating(reaction);

    addScore(rating.points);

    showHitFeedback(rating, hitX, hitY);

    reactionTime.textContent = `${reaction}ms`;

    if (best === null || reaction < best) {
      best = reaction;

      bestScore.textContent = `${best}ms`;

      localStorage.setItem("best", best);
    }

    if (round < TOTAL_ROUNDS) {
      // isPlaying stays true so a manual Start click can't skip a round
      gameStatus.textContent = "Round complete! Get ready...";

      setTimeout(startRound, 800);
    } else {
      isPlaying = false;

      gameStatus.textContent = "5 rounds complete!";

      showResults();
    }
  });
}

/* ---------- Navigation / results buttons ---------- */

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
