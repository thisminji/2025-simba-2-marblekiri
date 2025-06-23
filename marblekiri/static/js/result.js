function previewImage(event) {
    const input = event.target;
    const preview = document.getElementById("preview");
    const placeholder = document.getElementById("placeholder-box");
    const removeBtn = document.getElementById("remove-image");
    const imageLabel = document.getElementById("image-label");

    if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block"; // 이미지 보이기
        if (placeholder) placeholder.style.display = "none"; // 텍스트 숨기기
        if (removeBtn) removeBtn.style.display = "block"; // 삭제 버튼 보이기
        if (imageLabel) imageLabel.style.pointerEvents = "none"; // 더 이상 업로드 못하게
    };
    reader.readAsDataURL(input.files[0]);
    }
}

function removeImage() {
    const input = document.getElementById("image-upload");
    const preview = document.getElementById("preview");
    const placeholder = document.getElementById("placeholder-box");
    const removeBtn = document.getElementById("remove-image");
    const imageLabel = document.getElementById("image-label");

    input.value = ""; // 선택된 파일 제거
    preview.src = "";
    preview.style.display =  "none";
    if (placeholder) placeholder.style.display = "flex";
    if (removeBtn) removeBtn.style.display = "none";
    if (imageLabel) imageLabel.style.pointerEvents = "auto";
}
/////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("image-upload");
    const removeBtn = document.getElementById("remove-image");

    if (input) input.addEventListener("change", previewImage);
    if (removeBtn) removeBtn.addEventListener("click", removeImage);

});

