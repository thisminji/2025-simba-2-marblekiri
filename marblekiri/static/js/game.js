document.addEventListener("DOMContentLoaded", () => {
  const rollButton = document.querySelector(".roll-dice-button");
  const diceNumber = document.querySelector(".dice-number");
  const missionBox = document.querySelector(".mission-box");

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
          .then(data => { //미션 내용 화면에 표시
            missionBox.innerHTML = `
              <h3>${data.index + 1}번 칸</h3>
              <h3>${data.mission ? data.mission : "에러"}</p>
            `;
          })
          .catch(error => {
            console.error("에러:", error);
            missionBox.innerHTML = `<p>에러</p>`;
          })
          .finally(() => {
            //다시 주사위 버튼 활성화
            rollButton.disabled = false;
          });
      }
    }, 80);
  });
});
