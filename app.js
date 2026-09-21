const startButton = document.querySelector(".start-btn");
const gameArea = document.querySelector(".game-area");
const reactionTime = document.querySelector(".reaction-time");
const bestScore = document.querySelector(".best-score");
const target = document.querySelector(".target");
let startTime;

startButton.addEventListener("click", () => {
  console.log("Game started!");

  target.style.display = "none";

  const delay = Math.random() * 3000;

  setTimeout(() => {
    target.style.display = "block";
    startTime = Date.now();
  }, delay);
});

target.addEventListener("click", () => {
  target.style.display = "none";

  const endTime = Date.now();

  const reaction = endTime - startTime;
  reactionTime.textContent = reaction;
});
