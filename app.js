const startButton = document.querySelector(".start-btn");
const gameArea = document.querySelector(".game-area");
const reactionTime = document.querySelector(".reaction-time");
const bestScore = document.querySelector(".best-score");
const target = document.querySelector(".target");

startButton.addEventListener("click", () => {
  console.log("Game started!");

  target.style.display = "none";

  setTimeout(() => {
    target.style.display = "block";
  }, 2000);
});
