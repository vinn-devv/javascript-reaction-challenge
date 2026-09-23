const startButton = document.querySelector(".start-btn");
const gameArea = document.querySelector(".game-area");
const reactionTime = document.querySelector(".reaction-time");
const bestScore = document.querySelector(".best-score");
const target = document.querySelector(".target");
const savedBest = localStorage.getItem("best");

let startTime;
let best = null;
let isPlaying = false;

if (savedBest !== null) {
  best = Number(savedBest);
  bestScore.textContent = `${best}ms`;
}

startButton.addEventListener("click", () => {
  if (isPlaying === true) {
    return;
  }

  isPlaying = true;

  console.log("Game started!");

  target.style.display = "none";

  const delay = Math.random() * 3000;

  setTimeout(() => {
    target.style.display = "block";
    startTime = Date.now();

    const randomX = Math.random() * (gameArea.clientWidth - target.offsetWidth);
    const randomY =
      Math.random() * (gameArea.clientHeight - target.offsetHeight);

    target.style.left = `${randomX}px`;
    target.style.top = `${randomY}px`;
  }, delay);
});

target.addEventListener("click", () => {
  target.style.display = "none";

  const endTime = Date.now();

  const reaction = endTime - startTime;
  reactionTime.textContent = `${reaction}ms`;

  if (best === null || reaction < best) {
    best = reaction;
    bestScore.textContent = best;

    localStorage.setItem("best", best);
  }

  isPlaying = false;
});
