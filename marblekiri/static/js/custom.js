// ready 버튼이 눌린 구역 개수를 추적하는 set
const readySet = new Set();

  document.querySelectorAll(".question-form").forEach(form => {

    const questionList = form.querySelector(".question-list");
    const addBtn = form.querySelector(".add-btn");
    const readyBtn = form.querySelector(".ready-btn");
    const player = form.dataset.player;

     // 질문 번호 재정렬 함수 (추가/삭제 후 호출)
    const updateQuestionNumbers = () => {
      const boxes = questionList.querySelectorAll(".question-box");
      boxes.forEach((box, index) => {
        const number = box.querySelector(".question-number");
        number.textContent = `#${index + 1}.`;
      });
    };

    // 삭제 버튼 이벤트 연결 함수 (초기 항목 포함)
    const attachRemoveHandlers = () => {
      questionList.querySelectorAll(".remove-btn").forEach(btn => {
        btn.onclick = () => {
          btn.closest(".question-box").remove();
          updateQuestionNumbers();
          updateReadyButtonState();
        };
      });
    };

    // 작성된 질문 개수가 5개 미만이면 readyBtn 비활성화
    const updateReadyButtonState = () => {
      const filledQuestions = [...form.querySelectorAll('input[name="questions[]"]')]
        .map(input => input.value.trim())
        .filter(q => q.length > 0); // 공백 제거 후 입력된 질문만 필터

      if (filledQuestions.length >= 5) {
        readyBtn.disabled = false;
        readyBtn.classList.add('enabled');
      } else {
        readyBtn.disabled = true;
        readyBtn.classList.remove('enabled');
        readyBtn.classList.remove('active');
        readySet.delete(player);
      }
    };

    // input에 입력될 때마다 ready 상태 확인
    form.addEventListener("input", updateReadyButtonState);

    // addBtn 클릭 시 질문 추가 함수
    addBtn.addEventListener("click", () => {
      const count = questionList.children.length + 1; // 현재 개수 + 1
      const box = document.createElement("div");
      box.className = "question-box";
      box.innerHTML = `
        <div class="question-number">#${count}.</div>
        <input type="text" name="questions[]" maxlength="60" placeholder="질문 입력" required />
        <button type="button" class="remove-btn" id="remove-btn-${player}">
          <span class="custom-remove-line"></span>
        </button>
      `;
      // 질문 추가 버튼 위에 삽입
      questionList.insertBefore(box, addBtn);
      attachRemoveHandlers();
      updateQuestionNumbers();
      updateReadyButtonState();
    });

    // 삭제 버튼 클릭 시 질문 삭제 + 번호 재정렬 + ready 상태 확인
    questionList.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-btn")) {
        e.target.closest(".question-box").remove();
        updateQuestionNumbers();
        updateReadyButtonState();
      }
    });

    // 질문이 5개 이상 입력되면 버튼 활성화
    readyBtn.addEventListener("click", () => { 
      const filledQuestions = [...form.querySelectorAll('input[name="questions[]"]')]
        .map(input => input.value.trim())
        .filter(q => q.length > 0);

      if (filledQuestions.length < 5) return;

      const isActivating = !readyBtn.classList.contains("active");

      if (isActivating) {
        readyBtn.classList.add("active");
        readySet.add(player);
      } else {
        readyBtn.classList.remove("active");
        readySet.delete(player);
      }

      // 구역 4개 모두 ready 되면 서버에 저장 + 이동
      if (readySet.size === 4) {
        document.querySelectorAll(".question-form").forEach(async form => {
          const inputs = form.querySelectorAll('input[name="questions[]"]');

          // input 값이 공백이면 db에 저장하지 않음
          inputs.forEach(input => {
            if (input.value.trim() === "") {
              input.remove();  // 실제 DOM에서도 제거됨
            }
          });

          const formData = new FormData(form);
          const player = form.dataset.player;
          const csrfToken = form.querySelector('[name=csrfmiddlewaretoken]').value;

          const res = await fetch(`/submit_ready/${player}/`, {
            method: "POST",
            headers: {
              "X-CSRFToken": csrfToken,
            },
            body: formData,
          });

          if (!res.ok) {
            alert(`${player} 구역 질문 저장 실패`);
          }
        });

        setTimeout(() => {
          document.getElementById("gameForm").submit();
        }, 500); //저장 딜레이 감안 
      }
    });

    // ✅ 폼 초기화 시점에 번호 정렬 + 삭제 기능 부여
    updateQuestionNumbers();
    attachRemoveHandlers();
    updateReadyButtonState();
  });