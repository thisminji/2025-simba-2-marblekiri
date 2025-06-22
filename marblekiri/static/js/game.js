document.addEventListener("DOMContentLoaded", () => {
  const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

  const rollButton = document.querySelector(".roll-dice-button");
  const diceNumber = document.querySelector(".dice-number");
  const missionBox = document.querySelector(".mission-box");
  const missionList = document.querySelector(".mission-list");
  const passBtn = document.querySelector(".pass-btn");
  const drinkBtn = document.querySelector(".drink-btn");

  
  // 방문한 칸 추적용 Set
  const visitedTiles = new Set();

  //마셔 / 통과
  function handleAction(actionType) {
    fetch("/handle_action/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRFToken": csrfToken,
      },
      body: `action=${actionType}`
    })
    
    .then(res => {
      if (!res.ok) throw new Error("❌ 서버 응답 오류");

      return res.json();
    })
    .then(data => {
      if (data.end_game) {
        window.location.href = "/end_game/";
      } else {
        // ranking
        updateRanking();

        // 말 위치 다시 요청 (index 유지용)
        fetch("/move_player/?steps=0") // 0칸 이동 → 위치 정보만 받아오기
          .then(res => res.json())
          .then(data => {
            moveHorseTo(data.index);
            missionBox.innerHTML = `<h3>${data.mission}</h3>`;
          });
        }
    })
    .catch(error => console.error("에러 발생:", error));
  }

  passBtn?.addEventListener("click", () => handleAction("pass"));
  drinkBtn?.addEventListener("click", () => handleAction("drink"));

  //////////////////////////////////////////////////////////////////
/////----------랭킹------------------
function updateRanking() {
  fetch("/get_ranking/")
    .then((res) => res.json())
    .then((data) => {
      const rankingContainer = document.querySelector(".ranking-list");
      rankingContainer.innerHTML = data.html;
    })
    .catch((err) => console.error("랭킹 갱신 실패:", err));
}

  //////////////////////////////////////////////////////////////////

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
            //다시 주사위 버튼 활성화
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

  const tile = document.querySelector(`.tile[data-index = "${index}"]`)
  const horse = document.getElementById('horse-icon');
  if (!tile || !horse) 
    return;
  
  const rect = tile.getBoundingClientRect();
  console.log("top:", rect.top, "left:", rect.left);

  const tileRect = tile.getBoundingClientRect();
  const gridRect = document.querySelector('.tiles-grid').getBoundingClientRect();

  // 타일 위치를 기준으로 horse 아이콘의 위치 설정
  const offsetX = tileRect.left - gridRect.left;
  const offsetY = tileRect.top - gridRect.top;
  console.log("📍 offsetX:", offsetX, "offsetY:", offsetY);

  horse.style.left = `${offsetX + 10}px`;
  horse.style.top = `${offsetY - 50}px`;
}
