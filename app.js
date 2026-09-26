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

const playAgainButton = document.querySelector("#play-again-btn");
const resultsHomeButton = document.querySelector("#results-home-btn");
const homeMusic = document.querySelector("#home-music");

const mouseGlow = document.querySelector(".mouse-glow");

const catCanvas = document.querySelector(".cat-gif");
const catSource = document.querySelector(".cat-source");

function playHomeMusic() {
  if (!homeMusic) {
    return;
  }

  homeMusic.volume = 0.01;

  homeMusic.play().catch(() => {
    console.log("Autoplay was blocked by the browser.");
  });
}

if (catCanvas && catSource) {
  const ctx = catCanvas.getContext("2d", { willReadFrequently: true });
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

  catSource.addEventListener("playing", () => {
    updateCatFrame();
  });
}

const meowSound = new Audio("meow.mp3");
meowSound.preload = "auto";
meowSound.loop = true;

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

const savedBest = localStorage.getItem("best");

const homeBest = document.querySelector(".home-best");

if (homeBest) {
  homeBest.textContent = savedBest !== null ? `${savedBest}ms` : "—";
}

let startTime;
let best = null;
let isPlaying = false;
let targetReady = false;

let round = 0;
const TOTAL_ROUNDS = 5;
let reactionTimes = [];

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

if (startButton) {
  if (savedBest !== null) {
    best = Number(savedBest);
    bestScore.textContent = `${best}ms`;
  }

  startButton.addEventListener("click", () => {
    if (isPlaying === true) {
      return;
    }

    if (round >= TOTAL_ROUNDS) {
      round = 0;
    }

    round++;
    roundCounter.textContent = `Round ${String(round).padStart(2, "0")}`;
    updateRoundDots(round);

    reactionTime.textContent = "---";

    gameStatus.textContent =
      round === 1
        ? "Warm up your paws..."
        : `Difficulty ${round}/5 — stay sharp...`;

    isPlaying = true;

    console.log("Game started!");

    target.classList.remove("is-visible");

    const currentDifficulty = difficulty[round];

    target.style.width = `${currentDifficulty.catSize}px`;

    const delay =
      currentDifficulty.minDelay +
      Math.random() * (currentDifficulty.maxDelay - currentDifficulty.minDelay);

    setTimeout(() => {
      gameStatus.textContent = "POUNCE!";

      targetReady = true;

      target.classList.add("is-visible");

      playMeow();

      startTime = Date.now();

      const randomX =
        Math.random() * (gameArea.clientWidth - target.offsetWidth);

      const randomY =
        Math.random() * (gameArea.clientHeight - target.offsetHeight);

      target.style.left = `${randomX}px`;

      target.style.top = `${randomY}px`;
    }, delay);
  });

  target.addEventListener("click", () => {
    if (!targetReady) {
      return;
    }

    const hitX = target.offsetLeft + target.offsetWidth / 2;
    const hitY = target.offsetTop + target.offsetHeight / 2;

    gameArea.style.setProperty("--hit-x", `${hitX}px`);
    gameArea.style.setProperty("--hit-y", `${hitY}px`);

    gameArea.classList.remove("is-hit");
    void gameArea.offsetWidth;
    gameArea.classList.add("is-hit");

    target.classList.remove("is-visible");

    stopMeow();

    const endTime = Date.now();

    const reaction = endTime - startTime;

    reactionTimes.push(reaction);

    reactionTime.textContent = `${reaction}ms`;

    if (best === null || reaction < best) {
      best = reaction;

      bestScore.textContent = `${best}ms`;

      localStorage.setItem("best", best);
    }

    isPlaying = false;
    targetReady = false;

    if (round < TOTAL_ROUNDS) {
      gameStatus.textContent = "Round complete! Get ready...";

      setTimeout(() => {
        startButton.click();
      }, 800);
    } else {
      gameStatus.textContent = "5 rounds complete!";

      setTimeout(() => {
        showResults();
      }, 700);
    }
  });
}

function countUpTo(el, endValue, duration = 600) {
  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(endValue * eased);

    el.textContent = `${value}ms`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = `${endValue}ms`;
    }
  };

  requestAnimationFrame(tick);
}

function showResults() {
  const total = reactionTimes.reduce((sum, time) => sum + time, 0);

  const average = Math.round(total / reactionTimes.length);
  const fastest = Math.min(...reactionTimes);

  resultsScreen.style.display = "flex";

  countUpTo(averageScore, average);
  countUpTo(fastestScore, fastest);
  countUpTo(resultBestScore, best);
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
    reactionTimes = [];
    round = 0;

    resultsScreen.style.display = "none";

    reactionTime.textContent = "---";
    gameStatus.textContent = "Ready to pounce?";

    startButton.click();
  });
}

if (resultsHomeButton) {
  resultsHomeButton.addEventListener("click", () => {
    window.location.href = "homescreen.html?loading=true";
  });
}
