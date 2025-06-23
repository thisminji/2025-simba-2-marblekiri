document.addEventListener("DOMContentLoaded", () => {
  //===================1⃣ 빛수 설정==========================
  const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

  //<<주사위 >> //
  const rollButton = document.querySelector(".roll-dice-button");
  const diceNumber = document.querySelector(".dice-number");

  // 버튼 연결 확인
  if (!rollButton) {
    console.error("❌ 버튼 요소를 찾을 수 없습니다.");
    return;
  }

  //<<미션 >> //
  const missionBox = document.querySelector(".mission-box");
  const missionList = document.querySelector(".mission-list");

  //<<마셔 / 통과 >> //
  const passBtn = document.querySelector(".pass-btn");
  const drinkBtn = document.querySelector(".drink-btn");

  // 방문한 칸 추적용 Set
  const visitedTiles = new Set();

  //<< 모달 >> //
  const modal = document.getElementById("endGameModal");
  const endButton = document.querySelector(".end-button");              // 상단의 "게임 종료" 버튼
  const continueButton = document.querySelector(".continue-button");    // 모달의 "이어서 진행" 버튼
  const endGameConfirmButton = document.querySelector(".end-button-modal"); // 모달의 "게임 종료" 버튼

  //<< 말 위치 조정 >>
  moveHorseStepByStep(0, 0)

  //===================⏩ 모달 ===============================

  // 🧙 상단 "게임 종료" 버튼 클릭 시 → 모달 열기
  endButton?.addEventListener("click", (e) => {
    e.preventDefault();
    modal?.classList.remove("hidden");
  });

  // 🧙 모달에서 "이어서 진행" 클릭 시 → 모달 닫기
  continueButton?.addEventListener("click", () => {
    modal?.classList.add("hidden");
  });

  // ✅ 모달에서 "게임 종료" 버튼 클릭 시 → 페이지 이동
  const endGameURL = endGameConfirmButton?.dataset.url;
  endGameConfirmButton?.addEventListener("click", () => {
    console.log("종료 버튼 클릭 된")
    if (endGameURL) {
      window.location.href = endGameURL;
    }
  });

  //===================⏩ 마셔 / 통과 ==========================
  passBtn?.addEventListener("click", () => handleAction("pass"));
  drinkBtn?.addEventListener("click", () => handleAction("drink"));

  /////----------drink 카운트------------------
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
        const show_ranking = document.getElementById("show-ranking-hidden")?.value === "true";
        if (show_ranking){
          updateRanking(data.ranking);
        }
        updateRound(data.round);
        updatePlayers(data.prev_player, data.current_player, data.next_player);

        fetch("/move_player/?steps=0")
          .then(res => res.json())
          .then(data => { 
            moveHorseStepByStep(data.prev_index, data.index); 
            missionBox.innerHTML = `<h3>${data.mission}</h3>`;
          });

        passBtn.disabled = true;
        drinkBtn.disabled = true;
        rollButton.disabled = false;
      }
    })
    .catch(error => console.error("에러 발생:", error));
  }

  //===================⏩ 최종 로딩시 라링 표시 ==========================
  const show_ranking = document.getElementById("show-ranking-hidden")?.value === "true";
  if (show_ranking) {
    fetch("/move_player/?steps=0")
      .then(res => res.json())
      .then(data => {
        if (data.ranking) {
          updateRanking(data.ranking);
        }
      })
      .catch(error => {
        console.error("최고 라링 로딩 실패:", error);
      });
  }

  //===================⏩ 랭킹 / 라운드 / 터널 ==========================
  function updateRanking(ranking) {
    const list = document.getElementById("ranking-list");
    list.innerHTML = "";

    ranking.forEach((player, i) => {
      const li = document.createElement("li");
      li.classList.add("rank-card");
      if (i === 0) li.classList.add("first");
      else if (i === 1) li.classList.add("second");
      else if (i === 2) li.classList.add("third");

      const img = document.createElement("img");
      img.src = `/static/assets/icons/noto_${i + 1}-place-medal.svg`;
      img.alt = `${i + 1}등 메달`;

      const span = document.createElement("span");
      span.textContent = `${player.nickname} (${player.drink_count}잔)`;

      li.appendChild(img);
      li.appendChild(span);
      list.appendChild(li);
    });
  }

  function updateRound(round) {
    document.getElementById("turn-number").textContent = round;
  }

  function updatePlayers(prev, current, next) {
    document.getElementById("prev-player").textContent = prev;
    document.getElementById("current-player").textContent = current;
    document.getElementById("next-player").textContent = next;
  }

  //===================⏩ 주사위==========================
  let isRolling = false;

  rollButton.addEventListener("click", () => {
    if (isRolling) return;
    if (rollButton.disabled) return;

    isRolling = true;
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

        fetch(`/move_player/?steps=${final}`)
          .then(response => {
            if (!response.ok) throw new Error("서버 응답 오류");
            return response.json();
          })
          .then(data => { 
            moveHorseStepByStep(data.prev_index, data.index);

            missionBox.innerHTML = `
              <h3>${data.mission ? data.mission : "에러"}</h3>
            `;

            if (data.mission && !visitedTiles.has(data.index)) {
              visitedTiles.add(data.index);
              const li = document.createElement("li");
              li.textContent = `${data.index + 1}. ${data.mission}`;
              missionList.appendChild(li);
            }

            passBtn.disabled = false;
            drinkBtn.disabled = false;

            const show_ranking = document.getElementById("show-ranking-hidden")?.value === "true";
            if (show_ranking && data.ranking) {
              updateRanking(data.ranking);
            }
          })
          .catch(error => {
            console.error("에러:", error);
            missionBox.innerHTML = `<p>에러</p>`;
          })
          .finally(() => {
            isRolling = false;
          });
      }
    }, 80);
  });

  //===================⏩ 마루 이동 ==========================
  function moveHorseStepByStep(startIndex, endIndex) {
    console.log("🐴 말 이동 시작");
    const totalTiles = 20;
    const steps = [];
    let current = startIndex;

    while (current !== endIndex) {
      current = (current + 1) % totalTiles;
      steps.push(current);
    }

    let i = 0;
    const horse = document.getElementById("horse-icon");

    function moveStep() {
      if (i >= steps.length) return;
      const tile = document.querySelector(`.tile[data-index="${steps[i]}"]`);
      const tileRect = tile.getBoundingClientRect();
      const gridRect = document.querySelector(".tiles-grid").getBoundingClientRect();

      const offsetX = tileRect.left - gridRect.left;
      const offsetY = tileRect.top - gridRect.top;

      horse.style.left = `${offsetX + 10}px`;
      horse.style.top = `${offsetY - 50}px`;

      i++;
      setTimeout(moveStep, 180);
    }

    moveStep();
  }
});