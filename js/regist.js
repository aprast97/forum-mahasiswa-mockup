// Logika Khusus Halaman Registrasi

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    
    // File upload elements
    let avatarBase64 = "";
    const avatarPreviewContainer = document.getElementById("avatar-preview-container");
    const avatarFileInput = document.getElementById("avatar-file-input");
    const btnSelectAvatar = document.getElementById("btn-select-avatar");
    const avatarImgPreview = document.getElementById("avatar-img-preview");
    const avatarPlaceholderIcon = document.getElementById("avatar-placeholder-icon");

    if (avatarPreviewContainer && avatarFileInput) {
        const triggerSelect = (e) => {
            e.preventDefault();
            avatarFileInput.click();
        };

        avatarPreviewContainer.addEventListener("click", triggerSelect);
        if (btnSelectAvatar) {
            btnSelectAvatar.addEventListener("click", triggerSelect);
        }

        avatarFileInput.addEventListener("change", function () {
            const file = this.files[0];
            if (file) {
                if (!file.type.startsWith("image/")) {
                    alert("Harap pilih berkas gambar!");
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    avatarBase64 = e.target.result;
                    avatarImgPreview.src = avatarBase64;
                    avatarImgPreview.style.display = "block";
                    if (avatarPlaceholderIcon) {
                        avatarPlaceholderIcon.style.display = "none";
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Custom Select Dropdown logic for UPBJJ
    const customSelectWrapper = document.getElementById("custom-upbjj-select");
    if (customSelectWrapper) {
        const trigger = customSelectWrapper.querySelector(".custom-select-trigger");
        const optionsContainer = customSelectWrapper.querySelector(".custom-select-options");
        const options = customSelectWrapper.querySelectorAll(".custom-option");
        const hiddenInput = document.getElementById("upbjj");
        const selectedValueSpan = customSelectWrapper.querySelector(".selected-value");

        trigger.addEventListener("click", function (e) {
            e.stopPropagation();
            optionsContainer.style.display = optionsContainer.style.display === "block" ? "none" : "block";
        });

        options.forEach(opt => {
            opt.addEventListener("click", function (e) {
                e.stopPropagation();
                const val = this.getAttribute("data-value");
                if (val !== null && val !== "") {
                    hiddenInput.value = val;
                    selectedValueSpan.textContent = this.textContent;
                    selectedValueSpan.style.color = "var(--color-on-surface)";
                } else {
                    hiddenInput.value = "";
                    selectedValueSpan.textContent = "Pilih UT Daerah Anda";
                    selectedValueSpan.style.color = "var(--color-outline)";
                }
                optionsContainer.style.display = "none";
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", function () {
            optionsContainer.style.display = "none";
        });
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        
        const namaLengkap = document.getElementById("namaLengkap").value.trim();
        const nim = document.getElementById("nim").value.trim();
        const upbjj = document.getElementById("upbjj").value;
        const programStudi = document.getElementById("programStudi").value.trim();
        const noTelepon = document.getElementById("noTelepon").value.trim();
        

        // Ambil password dari input
        const passwordInput = document.getElementById("password");
        const password = passwordInput ? passwordInput.value : "password123";

        // Bersihkan error banner sebelumnya
        removeStatusMessage();

        const userData = {
            namaLengkap,
            nim,
            password,
            upbjj,
            programStudi,
            noTelepon,
            avatarUrl: avatarBase64
        };

        // Daftarkan user ke database dummy
        const result = registerUser(userData);

        if (result.success) {
            // Tampilkan pesan sukses dan redirect ke login setelah 2 detik
            showStatusMessage(result.message, "success");
            setTimeout(function () {
                window.location.href = "login.html";
            }, 2000);
        } else {
            // Tampilkan pesan error
            showStatusMessage(result.message, "error");
        }
    });

    // Helper untuk menampilkan banner sukses atau error
    function showStatusMessage(message, type) {
        const messageDiv = document.createElement("div");
        messageDiv.id = "status-banner";
        messageDiv.className = type; // success atau error
        
        if (type === "success") {
            messageDiv.innerHTML = `
                <span class="material-symbols-outlined text-[20px]" style="color: var(--color-primary);">check_circle</span>
                <span>${message}</span>
            `;
        } else {
            messageDiv.innerHTML = `
                <span class="material-symbols-outlined text-[20px]" style="color: var(--color-error)">error</span>
                <span>Registrasi gagal: ${message}</span>
            `;
        }
        
        form.parentNode.insertBefore(messageDiv, form);
    }

    // Helper untuk menghapus banner status lama
    function removeStatusMessage() {
        const banner = document.getElementById("status-banner");
        if (banner) {
            banner.remove();
        }
    }
});
