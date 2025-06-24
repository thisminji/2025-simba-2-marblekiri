document.addEventListener("DOMContentLoaded", () => {
  //===================1⃣ 빛수 설정==========================
  const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;

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
  const endButton = document.querySelector(".end-button"); // 상단의 "게임 종료" 버튼
  const continueButton = document.querySelector(".continue-button"); // 모달의 "이어서 진행" 버튼
  const endGameConfirmButton = document.querySelector(".end-button-modal"); // 모달의 "게임 종료" 버튼

  //<< 말 위치 조정 >>
  moveHorseStepByStep(0, 0);

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

  // ✅ 모달에서 "게임 종료" 버튼 클릭 시 → 사운드 재생 후 페이지 이동
  const endGameURL = endGameConfirmButton?.dataset.url;
  endGameConfirmButton?.addEventListener("click", () => {
    console.log("🛑 게임 종료 버튼 클릭");

    const gameoverSound = new Audio("/static/assets/sounds/gameover.mp3");
    gameoverSound.volume = 0.3;

    try {
      gameoverSound
        .play()
        .then(() => {
          console.log("🔊 gameover.mp3 재생 시작");

          // ✅ 사운드 끝나면 페이지 이동
          gameoverSound.addEventListener("ended", () => {
            console.log("✅ 사운드 재생 완료 → 페이지 이동");
            if (endGameURL) {
              window.location.href = endGameURL;
            }
          });
        })
        .catch((err) => {
          console.warn("❌ gameover.mp3 재생 실패:", err);
          if (endGameURL) {
            window.location.href = endGameURL; // 실패 시 그냥 이동
          }
        });
    } catch (e) {
      console.warn("🎵 예외로 인한 재생 실패:", e);
      if (endGameURL) {
        window.location.href = endGameURL;
      }
    }
  });

  //===================⏩ 마셔 / 통과 ==========================
  passBtn?.addEventListener("click", () => handleAction("pass"));
  drinkBtn?.addEventListener("click", () => handleAction("drink"));

  // 🔊 버튼 클릭 사운드 (통과/마셔 공용)
  const clickSound = new Audio("/static/assets/sounds/click.mp3");
  clickSound.volume = 1; // 필요하면 0.5 등으로 조정

  function handleAction(actionType) {
    // ✅ 클릭 소리 먼저 재생
    try {
      clickSound.currentTime = 0;
      clickSound
        .play()
        .then(() => console.log("🔊 click.mp3 재생 성공"))
        .catch((err) => console.warn("❌ click.mp3 재생 실패:", err));
    } catch (e) {
      console.warn("🎵 예외로 인한 클릭 사운드 실패:", e);
    }

    // 원래의 fetch 처리
    fetch("/handle_action/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRFToken": csrfToken,
      },
      body: `action=${actionType}`,
    })
      .then((res) => {
        if (!res.ok) throw new Error("❌ 서버 응답 오류");
        return res.json();
      })
      .then((data) => {
        if (data.end_game) {
          window.location.href = "/end_game/";
        } else {
          const show_ranking =
            document.getElementById("show-ranking-hidden")?.value === "true";
          if (show_ranking) {
            updateRanking(data.ranking);
          }
          updateRound(data.round);
          updatePlayers(
            data.prev_player,
            data.current_player,
            data.next_player
          );

          fetch("/move_player/?steps=0")
            .then((res) => res.json())
            .then((data) => {
              moveHorseStepByStep(data.prev_index, data.index);
              missionBox.innerHTML = `<h3>${data.mission}</h3>`;
            });

          passBtn.disabled = true;
          drinkBtn.disabled = true;
          rollButton.disabled = false;
        }
      })
      .catch((error) => console.error("에러 발생:", error));
  }

  //===================⏩ 최종 로딩시 라링 표시 ==========================
  const show_ranking =
    document.getElementById("show-ranking-hidden")?.value === "true";
  if (show_ranking) {
    fetch("/move_player/?steps=0")
      .then((res) => res.json())
      .then((data) => {
        if (data.ranking) {
          updateRanking(data.ranking);
        }
      })
      .catch((error) => {
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
          .then((response) => {
            if (!response.ok) throw new Error("서버 응답 오류");
            return response.json();
          })
          .then((data) => {
            moveHorseStepByStep(data.prev_index, data.index);

            missionBox.innerHTML = `
              <h3>${data.mission ? data.mission : "에러"}</h3>
            `;

            // 민지 수정
            if (data.mission && !visitedTiles.has(data.index)) {
              visitedTiles.add(data.index);

              const targetLi = document.querySelector(
                `.mission-item[data-index="${data.index}"]`
              );
              if (targetLi) {
                targetLi.textContent = `${data.index + 1}. ${data.mission}`;
              }
            }

            passBtn.disabled = false;
            drinkBtn.disabled = false;

            const show_ranking =
              document.getElementById("show-ranking-hidden")?.value === "true";
            if (show_ranking && data.ranking) {
              updateRanking(data.ranking);
            }
          })
          .catch((error) => {
            console.error("에러:", error);
            missionBox.innerHTML = `<p>에러</p>`;
          })
          .finally(() => {
            isRolling = false;
          });
      }
    }, 80);
  });

  //===================⏩ 말 이동 ==========================
  // 전역 또는 상단에서 템플릿 사운드 객체 생성 
  const moveSoundTemplate = new Audio("/static/assets/sounds/move.mp3");
  moveSoundTemplate.volume = 0.7;

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
      const gridRect = document
        .querySelector(".tiles-grid")
        .getBoundingClientRect();

      const offsetX = tileRect.left - gridRect.left;
      const offsetY = tileRect.top - gridRect.top;

      horse.style.left = `${offsetX + 10}px`;
      horse.style.top = `${offsetY - 50}px`;

      // ✅ cloneNode()로 빠르게 재생
      try {
        const moveSound = moveSoundTemplate.cloneNode();
        moveSound.volume = 0.7; // 복제에도 볼륨 설정 필요
        moveSound.play().catch((err) => {
          console.warn("❌ move.mp3 재생 실패:", err);
        });
      } catch (e) {
        console.warn("🎵 예외로 인한 사운드 실패:", e);
      }

      i++;
      setTimeout(moveStep, 180);
    }

    moveStep();
  }

  const showRanking =
    document.getElementById("show-ranking-hidden")?.value === "true";
  const missionsBox = document.querySelector(".missions");

  if (!showRanking && missionsBox) {
    missionsBox.classList.add("expanded");
  }
});
