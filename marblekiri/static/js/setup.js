// 테마 선택 처리
document.querySelectorAll(".theme-category-container").forEach((el) => {
  el.addEventListener("click", () => {
    document.querySelectorAll(".theme-category-container").forEach((e) => {
      e.classList.remove("selected");
    });
    el.classList.add("selected");
    document.getElementById("selected-theme").value = el.dataset.value;
  });
});

// 커스텀 테마 이동
document
  .getElementById("gameForm")
  .addEventListener("submit", function (event) {
    const theme = document.getElementById("selected-theme").value;
    if (theme === "custom") {
      event.preventDefault();
      window.location.href = "/custom_questions/";
    }
  });

// 슬라이더 및 턴 수 토글
document.addEventListener("DOMContentLoaded", function () {
  const unlimitedRadio = document.getElementById("unlimited");
  const limitedRadio = document.getElementById("limited");
  const sliderContainer = document.getElementById("slider-container");
  const slider = document.getElementById("turn-slider");
  const turnCount = document.getElementById("turn-count");

  unlimitedRadio.addEventListener("change", () => {
    if (unlimitedRadio.checked) sliderContainer.style.display = "none";
  });

  limitedRadio.addEventListener("change", () => {
    if (limitedRadio.checked) sliderContainer.style.display = "block";
  });

  slider.addEventListener("input", () => {
    turnCount.textContent = slider.value;
  });
});

// 인원 추가/삭제 로직
function addPlayer() {
  const list = document.getElementById("player-list");
  const count = list.children.length + 1;

  const div = document.createElement("div");
  div.className = "player-entry";
  div.innerHTML = `
      <span class="player-number">${count}.</span>
      <input type="text" name="players[]" placeholder="성이름" required />
      <button type="button" class="remove-btn" onclick="removePlayer(this)">-</button>
    `;
  list.appendChild(div);
}

function removePlayer(button) {
  const list = document.getElementById("player-list");
  button.parentElement.remove();
  Array.from(list.children).forEach((entry, index) => {
    entry.querySelector(".player-number").textContent = `${index + 1}.`;
  });
}
