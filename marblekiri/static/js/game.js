document.addEventListener("DOMContentLoaded", () => {
  const rollButton = document.querySelector(".roll-dice-button");
  const diceNumber = document.querySelector(".dice-number");
  const missionBox = document.querySelector(".mission-box");

  // 🧩 게임 종료 모달 요소 가져오기
  const modal = document.getElementById("endGameModal");
  const endButton = document.querySelector(".end-button");
  const continueButton = document.querySelector(".continue-button");

  // 🧩 게임 종료 버튼 클릭 시 모달 표시
  endButton?.addEventListener("click", (e) => {
    e.preventDefault();
    modal?.classList.remove("hidden");
  });

  // 🧩 이어서 진행 클릭 시 모달 닫기
  continueButton?.addEventListener("click", () => {
    modal?.classList.add("hidden");
  });

  // 페이지 로드시 1번 타일에 말 배치
  moveHorseTo(0);

  // 1. 버튼 비활성화
  rollButton.addEventListener("click", () => {
    rollButton.disabled = true;

    // 2. 가짜 굴림 애니메이션 (랜덤 10번 바꿈)
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

        // 세인 수정 부분, fetch 서버로 주사위 결과 전송
        fetch(`/move_player/?steps=${final}`)
          .then(response => {
            if (!response.ok) throw new Error("서버 응답 오류");
            return response.json();
          })
          .then(data => {
            moveHorseTo(data.index);
            missionBox.innerHTML = `
              <h3>${data.mission ? data.mission : "에러"}</h3>
            `;
          })
          .catch(error => {
            console.error("에러:", error);
            missionBox.innerHTML = `<p>에러</p>`;
          })
          .finally(() => {
            rollButton.disabled = false;
          });
      }
    }, 80);
  });
});

////////////////////////////////////////////////////////////////////////////////////
// 타일 위치 가져오기 & 말 이동 함수
function moveHorseTo(index) {
  console.log("👉 말 이동 함수 실행됨, index:", index);

  const tile = document.querySelector(`.tile[data-index = "${index}"]`);
  const horse = document.getElementById('horse-icon');
  if (!tile || !horse) return;

  const tileRect = tile.getBoundingClientRect();
  const gridRect = document.querySelector('.tiles-grid').getBoundingClientRect();

  const offsetX = tileRect.left - gridRect.left;
  const offsetY = tileRect.top - gridRect.top;
  console.log("📍 offsetX:", offsetX, "offsetY:", offsetY);

  horse.style.left = `${offsetX + 7}px`;
  horse.style.top = `${offsetY - 50}px`;
}
