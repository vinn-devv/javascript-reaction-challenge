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
const savedBest = localStorage.getItem("best");

let startTime;
let best = null;
let isPlaying = false;
let targetReady = false;
let round = 0;

if (startButton) {
  if (savedBest !== null) {
    best = Number(savedBest);
    bestScore.textContent = `${best}ms`;
  }

  startButton.addEventListener("click", () => {
    if (isPlaying === true) {
      return;
    }

    roundCounter.textContent = `Round: ${++round}`;

    reactionTime.textContent = "---";

    gameStatus.textContent = "Wait for it...";

    isPlaying = true;

    console.log("Game started!");

    target.style.display = "none";

    const delay = Math.random() * 3000;

    setTimeout(() => {
      gameStatus.textContent = "CLICK!";
      targetReady = true;
      target.style.display = "block";
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
    target.style.display = "none";

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
    gameStatus.textContent = "Ready?";
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
    }, 1000);
  }

  playButton.addEventListener("click", () => {
    homeScreen.style.display = "none";

    loadingScreen.style.display = "flex";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  });
}
