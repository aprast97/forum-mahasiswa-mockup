// Logika untuk halaman Buat Utas Baru

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("create-thread-form");
    const categorySelect = document.getElementById("category");
    const customCategoryGroup = document.getElementById("custom-category-group");
    const customCategoryInput = document.getElementById("custom-category");
    
    const titleInput = document.getElementById("title");
    const tagsInput = document.getElementById("tags");
    
    // Elements for Rich Editor
    const editorBody = document.getElementById("editor-body");
    const hiddenContentInput = document.getElementById("content");
    const imageUploadInput = document.getElementById("image-upload-input");
    const btnInsertImage = document.getElementById("btn-insert-image");

    // 1. Logika Tampilkan/Sembunyikan Kolom Kategori Manual
    if (categorySelect) {
        categorySelect.addEventListener("change", function () {
            if (this.value === "lainnya") {
                customCategoryGroup.style.display = "block";
                customCategoryInput.setAttribute("required", "required");
            } else {
                customCategoryGroup.style.display = "none";
                customCategoryInput.removeAttribute("required");
                customCategoryInput.value = ""; // Clear input
            }
        });
    }

    // 2. Logika Toolbar Rich Text Editor (Format bold, italic, dll.)
    const toolbarButtons = document.querySelectorAll(".toolbar-btn[data-command]");
    toolbarButtons.forEach(btn => {
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            const command = this.getAttribute("data-command");
            
            // Jalankan formatting command bawaan browser
            document.execCommand(command, false, null);
            
            // Kembalikan fokus ke editor
            editorBody.focus();
        });
    });

    // 3. Logika Memasukkan Gambar di caret / Baris yang sedang aktif (seperti MS Word)
    if (btnInsertImage && imageUploadInput) {
        btnInsertImage.addEventListener("click", function (e) {
            e.preventDefault();
            imageUploadInput.click(); // Trigger dialog file chooser
        });

        imageUploadInput.addEventListener("change", function () {
            const file = this.files[0];
            if (file) {
                // Pastikan file adalah gambar
                if (!file.type.startsWith("image/")) {
                    alert("Harap pilih berkas gambar!");
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    const dataUrl = e.target.result;
                    
                    // Kembalikan fokus ke editor sebelum menyisipkan gambar
                    editorBody.focus();
                    
                    // Sisipkan gambar di posisi caret
                    document.execCommand("insertImage", false, dataUrl);
                };
                reader.readAsDataURL(file);
            }
            
            // Reset value input file agar file yang sama bisa diupload ulang jika perlu
            this.value = "";
        });
    }

    // 4. Submit Form logic
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            // Salin isi div contenteditable ke hidden input untuk validasi HTML & submit
            const rawContentHtml = editorBody.innerHTML.trim();
            
            // Validasi: Editor tidak boleh kosong (atau hanya berisi spasi/break)
            if (rawContentHtml === "" || rawContentHtml === "<br>") {
                alert("Isi utas tidak boleh kosong!");
                return;
            }
            
            hiddenContentInput.value = rawContentHtml;

            // Dapatkan user yang sedang login
            const user = getCurrentUser();
            if (!user) {
                alert("Sesi Anda telah berakhir. Harap login kembali.");
                window.location.href = "login.html";
                return;
            }

            // Tentukan nama kategori
            const isLainnya = categorySelect.value === "lainnya";
            const finalCategory = isLainnya ? customCategoryInput.value.trim() : categorySelect.value;

            // Parsing tags
            const tagsArray = tagsInput.value.split(",")
                .map(t => t.trim())
                .filter(t => t !== "");

            // Buat objek utas baru
            const newThread = {
                id: "thread_" + Date.now(),
                authorName: user.namaLengkap,
                authorNim: user.nim,
                authorSub: `${(user.upbjj || "lainnya").toUpperCase()}${user.programStudi ? ' • ' + user.programStudi : ''} • ${getRoleLabel(user.role)}`,
                avatarUrl: user.avatarUrl || "",
                title: titleInput.value.trim(),
                content: rawContentHtml,
                tags: tagsArray,
                category: finalCategory,
                likes: 0,
                commentsCount: 0,
                postTime: "Baru saja"
            };

            // Simpan ke database local storage
            addThread(newThread);

            // Tampilkan notifikasi sukses, lalu kembali ke dashboard
            alert("Utas berhasil diterbitkan!");
            window.location.href = "index.html";
        });
    }

    // Helper label untuk user
    function getRoleLabel(role) {
        if (role === "superadmin") return "Super Admin";
        return "Mahasiswa";
    }
});
