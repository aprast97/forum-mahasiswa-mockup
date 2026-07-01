// Logika Khusus Halaman Login

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    const nimInput = document.getElementById("nim");
    const passwordInput = document.getElementById("password");
    
    // Toggle password visibility
    const togglePasswordBtn = document.querySelector("button[type='button']");
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener("click", function () {
            const icon = this.querySelector(".material-symbols-outlined");
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                icon.textContent = "visibility";
            } else {
                passwordInput.type = "password";
                icon.textContent = "visibility_off";
            }
        });
    }

    // Handle Form Submit
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        
        const nim = nimInput.value.trim();
        const password = passwordInput.value;

        // Clear existing error message if any
        removeErrorMessage();

        // Cek apakah akun ditangguhkan sebelum login
        const foundUser = findUserByNim(nim);
        if (foundUser && foundUser.suspended === true) {
            showErrorMessage("Akun Anda telah ditangguhkan. Hubungi administrator.");
            return;
        }

        // Call login function from database.js
        const result = loginUser(nim, password);

        if (result.success) {
            // Redirect to dashboard
            window.location.href = "index.html";
        } else {
            // Show error message on the page
            showErrorMessage(result.message);
        }
    });

    // Helper untuk menampilkan pesan error di atas form
    function showErrorMessage(message) {
        // Buat alert banner
        const errorDiv = document.createElement("div");
        errorDiv.id = "error-banner";
        
        errorDiv.innerHTML = `
            <span class="material-symbols-outlined text-[20px]" style="color: var(--color-error)">error</span>
            <span>NIM atau Password salah! ${message}</span>
        `;
        
        // Sisipkan sebelum form
        form.parentNode.insertBefore(errorDiv, form);
    }

    // Helper untuk menghapus pesan error yang lama
    function removeErrorMessage() {
        const errorBanner = document.getElementById("error-banner");
        if (errorBanner) {
            errorBanner.remove();
        }
    }
});
