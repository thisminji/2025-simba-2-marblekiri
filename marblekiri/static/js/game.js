document.addEventListener("DOMContentLoaded", () => {
  const rollButton = document.querySelector(".roll-dice-button");
  const diceNumber = document.querySelector(".dice-number");

  rollButton.addEventListener("click", () => {
    rollButton.disabled = true;

    let count = 0;
    const max = 10;
    const interval = setInterval(() => {
      const temp = Math.floor(Math.random() * 6) + 1;
      diceNumber.textContent = temp;
      count++;
      if (count >= max) {
        clearInterval(interval);
        const final = Math.floor(Math.random() * 6) + 1;
        diceNumber.textContent = final;
        rollButton.disabled = false;
      }
    }, 80);
  });
});
