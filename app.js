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

const mouseGlow = document.querySelector(".mouse-glow");

/* Chroma-key the cat video onto a canvas so the black background is
   really transparent, in every browser, regardless of codec alpha support. */

const catCanvas = document.querySelector(".cat-gif");
const catSource = document.querySelector(".cat-source");

if (catCanvas && catSource) {
  const ctx = catCanvas.getContext("2d", { willReadFrequently: true });
  const cw = catCanvas.width;
  const ch = catCanvas.height;

  const BLACK_CUTOFF = 40; // fully transparent below this brightness
  const FEATHER_CUTOFF = 75; // soft edge up to this brightness

  const renderCatFrame = () => {
    if (catSource.readyState >= 2) {
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

    requestAnimationFrame(renderCatFrame);
  };

  requestAnimationFrame(renderCatFrame);
}

/* Meow sound */

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

/* Mouse Glow */

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

/* Game */

if (startButton) {
  if (savedBest !== null) {
    best = Number(savedBest);
    bestScore.textContent = `${best}ms`;
  }

  startButton.addEventListener("click", () => {
    if (isPlaying === true) {
      return;
    }

    roundCounter.textContent = `Round ${String(++round).padStart(2, "0")}`;

    reactionTime.textContent = "---";

    gameStatus.textContent = "Waiting for kitty...";

    isPlaying = true;

    console.log("Game started!");

    target.classList.remove("is-visible");

    const delay = Math.random() * 3000;

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

    target.classList.remove("is-visible");

    stopMeow();

    const endTime = Date.now();

    const reaction = endTime - startTime;

    reactionTime.textContent = `${reaction}ms`;

    if (best === null || reaction < best) {
      best = reaction;

      bestScore.textContent = `${best}ms`;

      localStorage.setItem("best", best);
    }

    isPlaying = false;

    targetReady = false;

    gameStatus.textContent = "Ready to pounce?";
  });
}

/* Home Button */

if (homeButton) {
  homeButton.addEventListener("click", () => {
    window.location.href = "homescreen.html?loading=true";
  });
}

/* Home Screen / Loading */

if (playButton) {
  const urlParams = new URLSearchParams(window.location.search);

  const isReturning = urlParams.get("loading") === "true";

  if (isReturning) {
    homeScreen.style.display = "none";

    loadingScreen.style.display = "flex";

    setTimeout(() => {
      loadingScreen.style.display = "none";

      homeScreen.style.display = "block";
    }, 1200);
  }

  playButton.addEventListener("click", () => {
    homeScreen.style.display = "none";

    loadingScreen.style.display = "flex";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
  });
}
