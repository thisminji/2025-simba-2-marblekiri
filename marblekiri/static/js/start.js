document.addEventListener("DOMContentLoaded", () => {
  // 배경 음악 설정
  const bgMusic = new Audio("/static/assets/sounds/gamebackground.mp3");
  bgMusic.loop = true;          // 반복 재생 설정
  bgMusic.volume = 0.5;         // 볼륨 설정 (0.0 ~ 1.0)

  // '시작하기' 버튼 클릭 시 배경 음악 정지 및 초기화
  const startButton = document.querySelector(".start_button");
  startButton.addEventListener("click", () => {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  });

  // 사용자 최초 클릭 시 배경 음악 재생 (브라우저 자동 재생 제한 대응)
  document.body.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic.play()
        .then(() => console.log("배경음 재생 시작"))
        .catch((e) => console.warn("배경음 재생 실패:", e));
    }
  }, { once: true }); // 최초 클릭 한 번만 적용
});
