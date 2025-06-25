document.addEventListener("DOMContentLoaded", () => {
  // 1. 오디오 객체 생성
  const bgMusic = new Audio("/static/assets/sounds/gamebackground.mp3");

  // 2. 자동 재생을 위한 조건: muted 먼저 설정!
  bgMusic.loop = true;
  bgMusic.volume = 0.5;
  bgMusic.muted = true;

  // 3. muted 상태로 재생 시도
  bgMusic.play()
    .then(() => {
      console.log("✅ 자동재생 성공 (muted 상태)");

      // 4. 소리 켜기 (지연 후 우회)
      setTimeout(() => {
        bgMusic.muted = false;
        console.log("🔊 소리 켜짐");
      }, 300); // 1초 후 unmute
    })
    .catch((e) => {
      console.warn("❌ 자동재생 실패:", e);
    });
});
