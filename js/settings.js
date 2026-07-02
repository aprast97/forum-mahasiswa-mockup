// js/settings.js - Logika Halaman Pengaturan Profil & Akun

document.addEventListener("DOMContentLoaded", function () {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert("Sesi Anda telah berakhir. Harap login kembali.");
        window.location.href = "login.html";
        return;
    }

    const form = document.getElementById("settings-form");
    const nameInput = document.getElementById("settings-name");
    const upbjjSelect = document.getElementById("settings-upbjj");
    const programInput = document.getElementById("settings-program");
    const phoneInput = document.getElementById("settings-phone");
    const avatarPreview = document.getElementById("settings-avatar-preview");
    const avatarInput = document.getElementById("settings-avatar-input");
    const btnUploadAvatar = document.getElementById("btn-settings-upload-avatar");
    const btnRemoveAvatar = document.getElementById("btn-settings-remove-avatar");

    const passwordInput = document.getElementById("settings-password");
    const passwordConfirmInput = document.getElementById("settings-password-confirm");

    const users = getUsers();
    const userDetail = users.find(u => u.nim === currentUser.nim) || currentUser;

    let updatedAvatarBase64 = userDetail.avatarUrl || "";

    // 1. Populate UPBJJ UT Select Options
    const upbjjOptions = [
        "UT Jakarta", 
        "UT Surabaya", 
        "UT Bandung", 
        "UT Makassar", 
        "UT Medan", 
        "UT Yogyakarta", 
        "UT Semarang", 
        "UT Denpasar", 
        "Lainnya"
    ];
    
    if (upbjjSelect) {
        upbjjSelect.innerHTML = upbjjOptions.map(opt => {
            const selected = (userDetail.upbjj || "").toLowerCase() === opt.toLowerCase() ? "selected" : "";
            return `<option value="${opt}" ${selected}>${opt}</option>`;
        }).join("");
    }

    // 2. Pre-fill Form Fields
    if (nameInput) nameInput.value = userDetail.namaLengkap || "";
    if (programInput) programInput.value = userDetail.programStudi || "";
    if (phoneInput) phoneInput.value = userDetail.noTelepon || "";
    
    const defaultAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuCHIDcAqOwTfUbQIFmRTYv43WaqQI2Txa5V5zqahTfLzAiQx69JH3uYp-y8A9MkRobEyg-0w5OZDE3kYNEBn1GkCK01NhzwyjCA_MTQl666zrMzPpUQa1DnaLdM20qdv5upfcF0Kwm5A_bV4SEJVu9-6ZLXgz2AiwpLlY9ZJ1cPDi2xsRRFzgsfkGycdjso_tHG7HUBYZSoQ9Xg8m8qDAdAfzSUL9BJ_ITPfXhKKezcKU7o0NJLp0ls6Udm5Jjqpo9bI9zmsV4dqSP-";
    
    if (avatarPreview) {
        avatarPreview.src = updatedAvatarBase64 || defaultAvatar;
    }

    if (btnRemoveAvatar) {
        btnRemoveAvatar.style.display = updatedAvatarBase64 ? "inline-flex" : "none";
    }

    // 3. Avatar Upload Handlers
    if (btnUploadAvatar && avatarInput) {
        btnUploadAvatar.addEventListener("click", function (e) {
            e.preventDefault();
            avatarInput.click();
        });
    }

    if (avatarInput) {
        avatarInput.addEventListener("change", function () {
            const file = this.files[0];
            if (file) {
                if (!file.type.startsWith("image/")) {
                    alert("Harap pilih berkas gambar!");
                    return;
                }
                if (file.size > 1 * 1024 * 1024) {
                    alert("Ukuran gambar maksimal adalah 1MB!");
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    updatedAvatarBase64 = e.target.result;
                    if (avatarPreview) avatarPreview.src = updatedAvatarBase64;
                    if (btnRemoveAvatar) btnRemoveAvatar.style.display = "inline-flex";
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (btnRemoveAvatar) {
        btnRemoveAvatar.addEventListener("click", function (e) {
            e.preventDefault();
            updatedAvatarBase64 = "";
            if (avatarPreview) avatarPreview.src = defaultAvatar;
            btnRemoveAvatar.style.display = "none";
            if (avatarInput) avatarInput.value = "";
        });
    }

    // 4. Form Submit Handler
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const newName = nameInput.value.trim();
            const newUpbjj = upbjjSelect.value;
            const newProgram = programInput.value.trim();
            const newPhone = phoneInput.value.trim();
            const newPassword = passwordInput.value;
            const newPasswordConfirm = passwordConfirmInput.value;

            if (!newName) {
                alert("Nama tidak boleh kosong!");
                return;
            }

            // Validasi Password Baru
            if (newPassword) {
                if (newPassword.length < 6) {
                    alert("Password baru minimal 6 karakter!");
                    return;
                }
                if (newPassword !== newPasswordConfirm) {
                    alert("Konfirmasi password baru tidak cocok!");
                    return;
                }
            }

            // Update database list user
            const allUsers = getUsers();
            const dbUser = allUsers.find(u => u.nim === currentUser.nim);
            if (dbUser) {
                dbUser.namaLengkap = newName;
                dbUser.upbjj = newUpbjj;
                dbUser.programStudi = newProgram;
                dbUser.noTelepon = newPhone;
                dbUser.avatarUrl = updatedAvatarBase64;
                if (newPassword) {
                    dbUser.password = newPassword;
                }
                saveUsers(allUsers);
            }

            // Update current active session info
            currentUser.namaLengkap = newName;
            currentUser.upbjj = newUpbjj;
            currentUser.programStudi = newProgram;
            currentUser.noTelepon = newPhone;
            currentUser.avatarUrl = updatedAvatarBase64;
            localStorage.setItem("scholarforum_session", JSON.stringify(currentUser));

            // Sinkronisasi data user ke seluruh Utas & Komentar di forum
            const allThreads = getThreads();
            allThreads.forEach(t => {
                if (t.authorNim === currentUser.nim) {
                    t.authorName = newName;
                    t.avatarUrl = updatedAvatarBase64;
                    
                    // Format authorSub label
                    const roleLabel = t.authorSub.split(" • ").pop();
                    const upbjjPart = newUpbjj.toUpperCase();
                    const progStudiPart = newProgram ? ' • ' + newProgram : '';
                    t.authorSub = `${upbjjPart}${progStudiPart} • ${roleLabel}`;
                }
                
                if (t.comments) {
                    t.comments.forEach(c => {
                        if (c.authorNim === currentUser.nim) {
                            c.authorName = newName;
                            c.avatarUrl = updatedAvatarBase64;
                        }
                    });
                }
            });
            saveThreads(allThreads);

            // Tampilkan toast notifikasi dan arahkan kembali ke profile
            if (typeof showToast === "function") {
                showToast("✅ Pengaturan profil berhasil disimpan!", "info");
            } else {
                alert("Pengaturan profil berhasil disimpan!");
            }
            
            setTimeout(() => {
                window.location.href = "profile.html";
            }, 1000);
        });
    }
});
