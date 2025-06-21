function previewImage(event) {
    const input = event.target;
    const preview = document.getElementById("preview");
    const placeholder = document.getElementById("placeholder-text");
    const removeBtn = document.getElementById("remove-image");

    if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
        if (placeholder) placeholder.style.display = "none";
        if (removeBtn) removeBtn.style.display = "inline-block";
    };
    reader.readAsDataURL(input.files[0]);
    }
}

function removeImage() {
    const input = document.getElementById("image-upload");
    const preview = document.getElementById("preview");
    const placeholder = document.getElementById("placeholder-text");
    const removeBtn = document.getElementById("remove-image");

    input.value = ""; // 선택된 파일 제거
    preview.src = "";
    preview.style.display =  "none";
    if (placeholder) placeholder.style.display = "block";
    if (removeBtn) removeBtn.style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("image-upload");
    const removeBtn = document.getElementById("remove-image");

    if (input) input.addEventListener("change", previewImage);
    if (removeBtn) removeBtn.addEventListener("click", removeImage);
});

