// Initialize theme immediately to prevent layout shifts / flashes
(function () {
    const savedTheme = localStorage.getItem("scholarforum_theme") || "light";
    if (savedTheme === "dark") {
        document.documentElement.classList.add("dark-theme");
    } else {
        document.documentElement.classList.remove("dark-theme");
    }
})();

// Global Authentication Logic for ScholarForum
let currentFeedFilter = "all"; // Can be "all", "hot", "saved"

document.addEventListener("DOMContentLoaded", function () {
    const user = getCurrentUser();
    const currentPath = window.location.pathname;
    const pageName = currentPath.split("/").pop();

    // Halaman yang dikecualikan dari pemeriksaan login (halaman auth)
    const isAuthPage = pageName === "login.html" || pageName === "regist.html";
    // Halaman admin yang punya validasi sendiri (tidak perlu redirect ke index.html)
    const isSelfValidatedPage = ["admin.html","stats.html","dashboard.html","moderation.html","categories.html","activity-log.html"].includes(pageName);

    if (!user) {
        // Jika tidak ada user dan tidak sedang di halaman login/registrasi, arahkan ke login.html
        if (!isAuthPage) {
            window.location.href = "login.html";
        }
    } else {
        // Jika user sudah login dan mencoba membuka halaman login/registrasi, arahkan ke index.html
        if (isAuthPage) {
            window.location.href = "index.html";
        } else if (!isSelfValidatedPage) {
            // Perbarui UI dengan data pengguna yang sedang login
            updateUserProfileUI(user);
            renderNotifications();
            
            // Muat utas secara dinamis jika di halaman utama
            if (pageName === "index.html" || pageName === "") {
                renderFeedThreads();
            }
        }
    }

    // Bind event listener untuk tombol logout di sidebar jika ada
    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            logoutUser();
        });
    }

    // Toggle Profile Dropdown Menu (Top-Right corner)
    const avatarBtn = document.getElementById("avatar-btn");
    const profileDropdown = document.getElementById("profile-dropdown");
    
    // Toggle Notification Dropdown Menu
    const notificationBtn = document.getElementById("notification-btn");
    const notificationDropdown = document.getElementById("notification-dropdown");

    if (avatarBtn && profileDropdown) {
        avatarBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            profileDropdown.classList.toggle("show");
            if (notificationDropdown) notificationDropdown.classList.remove("show");
        });
    }

    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle("show");
            if (profileDropdown) profileDropdown.classList.remove("show");
        });
    }

    // Close dropdowns when clicking anywhere else
    document.addEventListener("click", function (e) {
        if (profileDropdown && !profileDropdown.contains(e.target) && avatarBtn && !avatarBtn.contains(e.target)) {
            profileDropdown.classList.remove("show");
        }
        if (notificationDropdown && !notificationDropdown.contains(e.target) && notificationBtn && !notificationBtn.contains(e.target)) {
            notificationDropdown.classList.remove("show");
        }
    });

    // Bind event listeners for notification actions inside dropdown
    const markAllReadBtn = document.getElementById("mark-all-read-btn");
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            const currentUser = getCurrentUser();
            if (currentUser) {
                markAllNotificationsAsRead(currentUser.nim);
                renderNotifications();
            }
        });
    }

    const clearAllNotifsBtn = document.getElementById("clear-all-btn");
    if (clearAllNotifsBtn) {
        clearAllNotifsBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            const currentUser = getCurrentUser();
            if (currentUser) {
                if (confirm("Apakah Anda yakin ingin menghapus semua notifikasi?")) {
                    clearAllNotifications(currentUser.nim);
                    renderNotifications();
                }
            }
        });
    }

    // Handle logout button inside dropdown if exists
    const dropdownLogoutBtn = document.getElementById("btn-dropdown-logout");
    if (dropdownLogoutBtn) {
        dropdownLogoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            logoutUser();
        });
    }

    // Toggle Sidebar visibility (Desktop collapsed, mobile drawer overlay)
    const hamburgerBtn = document.querySelector(".hamburger-menu-btn");
    const sidebar = document.querySelector("aside.sidebar");
    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle("show-mobile");
                const isOpen = document.body.classList.toggle("sidebar-open");
                
                // Toggle hamburger icon
                const iconSpan = hamburgerBtn.querySelector(".material-symbols-outlined");
                if (iconSpan) {
                    iconSpan.textContent = isOpen ? "close" : "menu";
                }
            } else {
                sidebar.classList.toggle("collapsed");
            }
        });

        // Close mobile sidebar drawer when clicking outside on mobile
        document.addEventListener("click", function (e) {
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                sidebar.classList.remove("show-mobile");
                document.body.classList.remove("sidebar-open");
                
                // Reset hamburger icon
                const iconSpan = hamburgerBtn.querySelector(".material-symbols-outlined");
                if (iconSpan) {
                    iconSpan.textContent = "menu";
                }
            }
        });
    }

    // Setup sidebar navigation click listeners for feed filtering
    const homeLink = document.getElementById("sidebar-home-link");
    const hotLink = document.getElementById("sidebar-hot-link");
    const savedLink = document.getElementById("sidebar-saved-link");

    function setActiveSidebarLink(activeEl) {
        document.querySelectorAll(".sidebar-link").forEach(link => {
            link.classList.remove("active");
        });
        if (activeEl) {
            activeEl.classList.add("active");
        }
    }

    if (homeLink) {
        homeLink.addEventListener("click", function (e) {
            e.preventDefault();
            currentFeedFilter = "all";
            setActiveSidebarLink(homeLink);
            renderFeedThreads();
        });
    }

    if (hotLink) {
        hotLink.addEventListener("click", function (e) {
            e.preventDefault();
            currentFeedFilter = "hot";
            setActiveSidebarLink(hotLink);
            renderFeedThreads();
        });
    }

    if (savedLink) {
        savedLink.addEventListener("click", function (e) {
            e.preventDefault();
            currentFeedFilter = "saved";
            setActiveSidebarLink(savedLink);
            renderFeedThreads();
        });
    }

    // Setup profile dropdown header click listener to view own profile
    const dropdownProfileBtn = document.getElementById("dropdown-profile-btn");
    if (dropdownProfileBtn) {
        dropdownProfileBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            // Close dropdown first
            const profileDropdown = document.getElementById("profile-dropdown");
            if (profileDropdown) profileDropdown.classList.remove("show");
            
            const currentUser = getCurrentUser();
            if (currentUser) {
                viewUserProfile(currentUser.nim);
            }
        });
    }

    // ===== INITIALIZE LIGHT/DARK THEME TOGGLE & MOBILE SEARCH ICON =====
    const headerActions = document.querySelector(".header-actions");
    const rankWidget = document.querySelector(".rank-widget");

    if (headerActions) {
        // 1. Create Theme Toggle Switch
        let toggleBtn = document.getElementById("theme-toggle-btn");
        if (!toggleBtn) {
            toggleBtn = document.createElement("button");
            toggleBtn.id = "theme-toggle-btn";
            toggleBtn.className = "theme-toggle-switch";
            toggleBtn.setAttribute("aria-label", "Ubah Tema");
            toggleBtn.innerHTML = `
                <span class="material-symbols-outlined mode-icon sun-icon">wb_sunny</span>
                <span class="material-symbols-outlined mode-icon moon-icon">nights_stay</span>
                <span class="theme-toggle-thumb"></span>
            `;
        }

        // Place toggleBtn: in sidebar if rankWidget exists, otherwise do not display
        if (rankWidget) {
            let sidebarToggleContainer = document.getElementById("sidebar-theme-toggle-container");
            if (!sidebarToggleContainer) {
                sidebarToggleContainer = document.createElement("div");
                sidebarToggleContainer.id = "sidebar-theme-toggle-container";
                sidebarToggleContainer.className = "sidebar-theme-toggle-container";
                sidebarToggleContainer.innerHTML = `
                    <span class="toggle-label">Mode Gelap</span>
                `;
                rankWidget.parentNode.insertBefore(sidebarToggleContainer, rankWidget.nextSibling);
            }
            sidebarToggleContainer.appendChild(toggleBtn);
        }

        // 2. Create Mobile Search Icon (Mirror) next to "Buat Utas"
        let mobileSearchBtn = document.getElementById("mobile-search-btn");
        if (!mobileSearchBtn) {
            mobileSearchBtn = document.createElement("button");
            mobileSearchBtn.id = "mobile-search-btn";
            mobileSearchBtn.className = "mobile-search-btn";
            mobileSearchBtn.setAttribute("aria-label", "Cari");
            mobileSearchBtn.innerHTML = `<span class="material-symbols-outlined">search</span>`;
            
            const buatUtasBtn = headerActions.querySelector(".btn-buat-post");
            if (buatUtasBtn) {
                headerActions.insertBefore(mobileSearchBtn, buatUtasBtn);
            } else {
                headerActions.insertBefore(mobileSearchBtn, headerActions.firstChild);
            }

            mobileSearchBtn.addEventListener("click", function (e) {
                e.preventDefault();
                alert("Fitur Pencarian akan segera hadir!");
            });
        }
        
        // Function to update the button icon and state
        const updateThemeToggleUI = () => {
            const isDark = document.documentElement.classList.contains("dark-theme");
            const labelSpan = rankWidget ? document.querySelector("#sidebar-theme-toggle-container .toggle-label") : null;
            if (labelSpan) {
                labelSpan.textContent = isDark ? "Mode Gelap" : "Mode Terang";
            }
        };

        // Initialize button UI state
        updateThemeToggleUI();

        // Toggle click handler
        toggleBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            const wasDark = document.documentElement.classList.contains("dark-theme");
            if (wasDark) {
                document.documentElement.classList.remove("dark-theme");
                localStorage.setItem("scholarforum_theme", "light");
            } else {
                document.documentElement.classList.add("dark-theme");
                localStorage.setItem("scholarforum_theme", "dark");
            }
            
            updateThemeToggleUI();
        });
    }
});

// Fungsi untuk memperbarui elemen-elemen UI dengan profil pengguna yang login
function updateUserProfileUI(user) {
    // 1. Perbarui nama status/rank di rank widget
    const rankSpans = document.querySelectorAll(".rank-widget-value span");
    if (rankSpans.length > 0) {
        // Cari span yang bukan material-icon
        rankSpans.forEach(span => {
            if (!span.classList.contains("material-symbols-outlined")) {
                span.textContent = getRankName(user.role);
            }
        });
    }

    // 2. Perbarui inisial di logo sidebar jika ada (inisial nama depan)
    const logoInitial = document.querySelector(".logo-icon");
    if (logoInitial && user.namaLengkap) {
        logoInitial.textContent = user.namaLengkap.charAt(0).toUpperCase();
    }

    // 3. Perbarui nama dan subtitle di sidebar
    const sidebarTitle = document.querySelector(".logo-info h2");
    if (sidebarTitle) {
        sidebarTitle.textContent = user.namaLengkap;
    }
    const sidebarSubtitle = document.querySelector(".logo-info p");
    if (sidebarSubtitle) {
        // Tampilkan NIM, UPBJJ, dan Program Studi (jika ada)
        const progStudiStr = user.programStudi ? ` • ${user.programStudi}` : "";
        sidebarSubtitle.textContent = `NIM: ${user.nim} • ${user.upbjj.toUpperCase()}${progStudiStr}`;
    }

    // 4. Ubah status text atau progress rep sesuai dengan status di rank-widget-footer
    const repText = document.querySelector(".rank-widget-footer");
    if (repText) {
        if (user.role === "superadmin") {
            repText.textContent = "Super Power Activated";
        } else {
            repText.textContent = "Mahasiswa • 150 rep";
        }
    }

    // 5. Perbarui nama dan NIM di profile dropdown (pojok kanan atas)
    const dropdownUserName = document.getElementById("dropdown-user-name");
    if (dropdownUserName) {
        dropdownUserName.textContent = user.namaLengkap;
    }
    const dropdownUserNim = document.getElementById("dropdown-user-nim");
    if (dropdownUserNim) {
        dropdownUserNim.textContent = `NIM: ${user.nim}`;
    }

    // 6. Perbarui gambar avatar di header jika ada custom avatar
    if (user.avatarUrl) {
        const dropdownAvatarImg = document.getElementById("dropdown-avatar-img");
        if (dropdownAvatarImg) {
            dropdownAvatarImg.src = user.avatarUrl;
        }
    }

    // 7. Tampilkan Admin Panel Section di sidebar hanya untuk superadmin
    const adminSection = document.getElementById("sidebar-admin-section");
    if (adminSection) {
        adminSection.style.display = user.role === "superadmin" ? "" : "none";
    }
}

// Helper untuk menerjemahkan role ke label rank
function getRankName(role) {
    if (role === "superadmin") return "Super Admin Forum";
    if (role === "moderator") return "Moderator Forum";
    return "Mahasiswa Aktif";
}

// Fungsi untuk me-render data utas dari localStorage ke dashboard utama
function renderFeedThreads() {
    const pageName = window.location.pathname.split("/").pop();
    if (pageName === "profile.html") {
        if (typeof window.loadProfileData === "function") {
            window.loadProfileData();
        }
        return;
    }
    const threadListContainer = document.querySelector(".thread-list");
    if (!threadListContainer) return;

    let threads = getThreads();
    const currentUser = getCurrentUser();

    // Filter feed berdasarkan pilihan di sidebar
    if (currentFeedFilter === "saved") {
        const savedIds = currentUser && currentUser.savedThreads ? currentUser.savedThreads : [];
        threads = threads.filter(t => savedIds.includes(t.id));
    } else if (currentFeedFilter === "hot") {
        threads = [...threads].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    threadListContainer.innerHTML = "";

    if (threads.length === 0) {
        let emptyMsg = "Belum ada utas. Jadilah yang pertama membuat utas!";
        let emptyIcon = "forum";
        if (currentFeedFilter === "saved") {
            emptyMsg = "Belum ada utas yang Anda simpan.";
            emptyIcon = "bookmark";
        }
        threadListContainer.innerHTML = `
            <div style="text-align: center; padding: 48px 16px; color: var(--color-on-surface-variant);">
                <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 8px; color: var(--color-outline-variant);">${emptyIcon}</span>
                <p style="font-weight: 500;">${emptyMsg}</p>
            </div>
        `;
        return;
    }

    threads.forEach(thread => {
        const article = document.createElement("article");
        article.className = "thread-card";
        article.id = "thread-card-" + thread.id;

        let tagsHtml = "";
        if (thread.tags && thread.tags.length > 0) {
            tagsHtml = `
                <div class="thread-tags" style="margin-top: 12px;">
                    ${thread.tags.map(tag => `<span class="tag">#${tag}</span>`).join("")}
                </div>
            `;
        }

        // ===== RBAC: Buat menu 3-titik berdasarkan role =====
        const currentUser = getCurrentUser();
        const isOwner = currentUser && (
            (thread.authorNim && currentUser.nim === thread.authorNim) ||
            (thread.authorName === currentUser.namaLengkap ||
             thread.authorName === currentUser.nim ||
             (thread.authorName && thread.authorName.replace(/\s+/g, "").toLowerCase() === currentUser.namaLengkap.replace(/\s+/g, "").toLowerCase()))
        );
        const isAdmin      = currentUser && currentUser.role === "superadmin";
        const isModerator  = currentUser && currentUser.role === "moderator";

        // Kumpulkan item-item menu sesuai hak akses
        let menuItems = [];

        // Pemilik utas sendiri OR admin: bisa Edit
        if (isOwner || isAdmin) {
            menuItems.push(`
                <button class="thread-dropdown-item" onclick="editThread('${thread.id}', event)">
                    <span class="material-symbols-outlined" style="font-size:16px">edit</span>
                    Edit Utas
                </button>`);
        }

        // Pemilik, admin, atau moderator: bisa Hapus
        if (isOwner || isAdmin || isModerator) {
            menuItems.push(`
                <button class="thread-dropdown-item text-error" onclick="deleteThread('${thread.id}', event)">
                    <span class="material-symbols-outlined" style="font-size:16px">delete</span>
                    Hapus Utas
                </button>`);
        }

        // Admin atau moderator (bukan utas sendiri): bisa Beri Peringatan
        if ((isAdmin || isModerator) && !isOwner) {
            menuItems.push(`
                <button class="thread-dropdown-item text-warning" onclick="warnUser('${thread.id}', event)">
                    <span class="material-symbols-outlined" style="font-size:16px">warning</span>
                    Beri Peringatan
                </button>`);
        }

        // User biasa (bukan pemilik, bukan admin/mod): bisa Laporkan
        if (currentUser && !isOwner && !isAdmin && !isModerator) {
            menuItems.push(`
                <button class="thread-dropdown-item text-report" onclick="reportThread('${thread.id}', event)">
                    <span class="material-symbols-outlined" style="font-size:16px">flag</span>
                    Laporkan
                </button>`);
        }

        let menuHtml = "";
        if (menuItems.length > 0) {
            menuHtml = `
                <div class="thread-menu-wrapper">
                    <button class="icon-btn thread-menu-btn" onclick="toggleThreadMenu('${thread.id}', event)">
                        <span class="material-symbols-outlined">more_vert</span>
                    </button>
                    <div class="thread-dropdown-menu" id="menu-${thread.id}">
                        ${menuItems.join("")}
                    </div>
                </div>
            `;
        }

        const hasLiked = currentUser && thread.likedBy && thread.likedBy.includes(currentUser.nim);
        const likeIconStyle = hasLiked ? "font-variation-settings: 'FILL' 1;" : "";
        const likeBtnClass = hasLiked ? "action-btn like-btn active" : "action-btn like-btn";

        const hasSaved = currentUser && currentUser.savedThreads && currentUser.savedThreads.includes(thread.id);
        const saveIconStyle = hasSaved ? "font-variation-settings: 'FILL' 1; color: var(--color-primary);" : "";

        article.innerHTML = `
            ${menuHtml}
            <div class="author-block">
                <div class="author-avatar" style="cursor: pointer;" onclick="viewUserProfile('${thread.authorNim || thread.authorName}', event)">
                    <img alt="Author Avatar" src="${thread.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHIDcAqOwTfUbQIFmRTYv43WaqQI2Txa5V5zqahTfLzAiQx69JH3uYp-y8A9MkRobEyg-0w5OZDE3kYNEBn1GkCK01NhzwyjCA_MTQl666zrMzPpUQa1DnaLdM20qdv5upfcF0Kwm5A_bV4SEJVu9-6ZLXgz2AiwpLlY9ZJ1cPDi2xsRRFzgsfkGycdjso_tHG7HUBYZSoQ9Xg8m8qDAdAfzSUL9BJ_ITPfXhKKezcKU7o0NJLp0ls6Udm5Jjqpo9bI9zmsV4dqSP-'}" />
                </div>
                <div class="author-info">
                    <div class="author-meta">
                        <span class="author-name" style="cursor: pointer;" onclick="viewUserProfile('${thread.authorNim || thread.authorName}', event)">${thread.authorName}</span>
                        <span class="badge-first">
                            <span class="material-symbols-outlined" style="font-size: 14px;">label</span>
                            ${thread.category}
                        </span>
                    </div>
                    <span class="author-sub">${thread.authorSub} • ${thread.postTime}</span>
                </div>
            </div>
            
            <h3 class="thread-title">${thread.title}</h3>
            <div class="thread-preview thread-html-content">${thread.content}</div>
            
            ${thread.threadImage ? `
                <div class="thread-image-preview-container">
                    <img src="${thread.threadImage}" alt="Gambar Pendukung" />
                </div>
            ` : ""}
            
            ${tagsHtml}
            
            <div class="thread-actions">
                <div class="actions-left">
                    <button class="${likeBtnClass}" onclick="likeThread('${thread.id}', event)" style="gap: 6px;">
                        <span class="material-symbols-outlined" style="${likeIconStyle}">thumb_up</span>
                        <span class="like-count" id="likes-${thread.id}">${thread.likes}</span>
                    </button>
                    <button class="action-btn" onclick="focusCommentInput('${thread.id}', event)" style="gap: 6px;">
                        <span class="material-symbols-outlined">chat_bubble</span>
                        <span>${thread.commentsCount || (thread.comments ? thread.comments.length : 0)}</span>
                    </button>
                </div>
                <div class="actions-right">
                    <div class="action-btn action-views" style="gap: 6px; cursor: default;">
                        <span class="material-symbols-outlined">bar_chart</span>
                        <span>${thread.views || 0}</span>
                    </div>
                    <button class="action-btn" onclick="saveThread('${thread.id}', event)" style="gap: 0;" title="Simpan Utas">
                        <span class="material-symbols-outlined" style="${saveIconStyle}">bookmark</span>
                    </button>
                    <button class="action-btn" onclick="shareThread('${thread.id}', event)" style="gap: 0;" title="Bagikan">
                        <span class="material-symbols-outlined">share</span>
                    </button>
                </div>
            </div>

            <!-- Comments Section -->
            <div class="comments-section">
                <div class="comments-list" id="comments-list-${thread.id}">
                    ${renderCommentsList(thread)}
                </div>
                <div class="comment-input-area">
                    <div class="comment-avatar">
                        <img src="${currentUser && currentUser.avatarUrl ? currentUser.avatarUrl : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHIDcAqOwTfUbQIFmRTYv43WaqQI2Txa5V5zqahTfLzAiQx69JH3uYp-y8A9MkRobEyg-0w5OZDE3kYNEBn1GkCK01NhzwyjCA_MTQl666zrMzPpUQa1DnaLdM20qdv5upfcF0Kwm5A_bV4SEJVu9-6ZLXgz2AiwpLlY9ZJ1cPDi2xsRRFzgsfkGycdjso_tHG7HUBYZSoQ9Xg8m8qDAdAfzSUL9BJ_ITPfXhKKezcKU7o0NJLp0ls6Udm5Jjqpo9bI9zmsV4dqSP-'}" alt="User Avatar" />
                    </div>
                    <input type="text" class="comment-input" id="comment-input-${thread.id}" placeholder="Tulis komentar..." onkeydown="handleCommentKey(event, '${thread.id}')" />
                    <button class="btn-send-comment" onclick="submitComment('${thread.id}', event)">
                        <span class="material-symbols-outlined">send</span>
                    </button>
                </div>
            </div>
        `;
        threadListContainer.appendChild(article);
    });

    // Sorot & gulir ke utas jika parameter pencarian '?thread=id' ada di URL
    const urlParams = new URLSearchParams(window.location.search);
    const focusThreadId = urlParams.get("thread");
    if (focusThreadId) {
        setTimeout(() => {
            const card = document.getElementById("thread-card-" + focusThreadId);
            if (card) {
                card.scrollIntoView({ behavior: "smooth", block: "center" });
                card.style.transition = "background-color 0.8s ease, transform 0.3s ease";
                card.style.backgroundColor = "var(--color-surface-container-highest)";
                card.style.borderLeft = "4px solid var(--color-primary)";
                setTimeout(() => {
                    card.style.backgroundColor = "";
                    card.style.borderLeft = "";
                }, 2500);
                // Bersihkan URL query parameter agar saat di-refresh tidak berulang
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }, 400);
    }
}

// Global likes handlers
window.likeThread = function (threadId, event) {
    event.preventDefault();
    event.stopPropagation();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert("Sesi Anda telah berakhir. Harap login kembali.");
        window.location.href = "login.html";
        return;
    }
    
    const threads = getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
        thread.likedBy = thread.likedBy || [];
        const userNim = currentUser.nim;
        
        const likeIndex = thread.likedBy.indexOf(userNim);
        if (likeIndex > -1) {
            // User already liked it -> Unlike
            thread.likedBy.splice(likeIndex, 1);
            thread.likes = Math.max(0, thread.likes - 1);
        } else {
            // User hasn't liked it yet -> Like
            thread.likedBy.push(userNim);
            thread.likes += 1;
            
            // Tampilkan popup notifikasi kecil
            showLikeToast("Anda menyukai utas ini.");
            
            // Kirim notifikasi ke pembuat utas
            let authorNim = thread.authorNim;
            if (!authorNim && thread.authorName) {
                const users = getUsers();
                const matchedUser = users.find(u => u.namaLengkap === thread.authorName || u.namaLengkap.replace(/\s+/g, "").toLowerCase() === thread.authorName.replace(/[\s_0-9]+/g, "").toLowerCase());
                if (matchedUser) authorNim = matchedUser.nim;
            }
            if (authorNim && authorNim !== userNim) {
                addNotification(
                    authorNim,
                    userNim,
                    currentUser.namaLengkap,
                    currentUser.avatarUrl || "",
                    "like",
                    thread.id,
                    thread.title,
                    ""
                );
            }
        }
        
        saveThreads(threads);
        renderFeedThreads();
    }
};

// Global save thread handler
window.saveThread = function (threadId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert("Sesi Anda telah berakhir. Harap login kembali.");
        window.location.href = "login.html";
        return;
    }
    
    const users = getUsers();
    const user = users.find(u => u.nim === currentUser.nim);
    if (user) {
        user.savedThreads = user.savedThreads || [];
        const index = user.savedThreads.indexOf(threadId);
        let saved = false;
        if (index > -1) {
            user.savedThreads.splice(index, 1);
            showLikeToast("Utas dihapus dari simpanan.");
        } else {
            user.savedThreads.push(threadId);
            saved = true;
            showLikeToast("Utas berhasil disimpan.");
        }
        
        saveUsers(users);
        
        // Sync current session
        currentUser.savedThreads = user.savedThreads;
        localStorage.setItem("scholarforum_session", JSON.stringify(currentUser));
        
        renderFeedThreads();
    }
};

// Global share thread handler
window.shareThread = function (threadId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const dummyUrl = window.location.origin + window.location.pathname + "?thread=" + threadId;
    navigator.clipboard.writeText(dummyUrl).then(() => {
        showLikeToast("Tautan utas berhasil disalin!");
    }).catch(err => {
        showLikeToast("Gagal menyalin tautan.");
    });
};

// Fungsi pembantu untuk menampilkan popup kecil (toast notification)
function showLikeToast(message) {
    let existingToast = document.querySelector(".like-toast-container");
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement("div");
    toast.className = "like-toast-container";
    
    // Tentukan icon based on keywords
    let icon = "info";
    if (message.includes("menyukai")) icon = "thumb_up";
    else if (message.includes("disimpan")) icon = "bookmark";
    else if (message.includes("dihapus")) icon = "bookmark_border";
    else if (message.includes("disalin")) icon = "send";
    
    toast.innerHTML = `
        <span class="material-symbols-outlined" style="font-size: 18px; margin-right: 8px; font-variation-settings: 'FILL' 1;">${icon}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("show");
    }, 50);
    
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2000);
}

// Helper to render comments list
function renderCommentsList(thread) {
    const comments = thread.comments || [];
    if (comments.length === 0) {
        return `<div class="no-comments-text" id="no-comments-${thread.id}">Belum ada komentar. Tulis komentar pertama Anda!</div>`;
    }
    return comments.map(c => `
        <div class="comment-item">
            <div class="comment-item-avatar" style="cursor: pointer;" onclick="viewUserProfile('${c.authorNim || c.authorName}', event)">
                <img src="${c.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHIDcAqOwTfUbQIFmRTYv43WaqQI2Txa5V5zqahTfLzAiQx69JH3uYp-y8A9MkRobEyg-0w5OZDE3kYNEBn1GkCK01NhzwyjCA_MTQl666zrMzPpUQa1DnaLdM20qdv5upfcF0Kwm5A_bV4SEJVu9-6ZLXgz2AiwpLlY9ZJ1cPDi2xsRRFzgsfkGycdjso_tHG7HUBYZSoQ9Xg8m8qDAdAfzSUL9BJ_ITPfXhKKezcKU7o0NJLp0ls6Udm5Jjqpo9bI9zmsV4dqSP-'}" alt="Commenter Avatar" />
            </div>
            <div class="comment-item-body">
                <div class="comment-item-header">
                    <span class="comment-item-author" style="cursor: pointer;" onclick="viewUserProfile('${c.authorNim || c.authorName}', event)">${c.authorName}</span>
                    <span class="comment-item-sub">${c.authorSub}</span>
                    <span class="comment-item-time">${c.postTime}</span>
                </div>
                <div class="comment-item-content">${c.content}</div>
            </div>
        </div>
    `).join("");
}

// Global submit comment handler
window.submitComment = function (threadId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const input = document.getElementById(`comment-input-${threadId}`);
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert("Sesi Anda telah berakhir. Harap login kembali.");
        window.location.href = "login.html";
        return;
    }
    
    const threads = getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
        thread.comments = thread.comments || [];
        
        let roleLabel = "";
        if (currentUser.role === "superadmin") {
            roleLabel = "Super Admin";
        } else {
            roleLabel = "Mahasiswa";
        }
        
        const newComment = {
            id: "comment_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
            authorNim: currentUser.nim,
            authorName: currentUser.namaLengkap,
            authorSub: `${(currentUser.upbjj || "lainnya").toUpperCase()}${currentUser.programStudi ? ' • ' + currentUser.programStudi : ''} • ${roleLabel}`,
            avatarUrl: currentUser.avatarUrl || "",
            content: text,
            postTime: "Baru saja"
        };
        
        thread.comments.push(newComment);
        thread.commentsCount = thread.comments.length;
        
        saveThreads(threads);
        
        // Kirim notifikasi ke pembuat utas
        let authorNim = thread.authorNim;
        if (!authorNim && thread.authorName) {
            const users = getUsers();
            const matchedUser = users.find(u => u.namaLengkap === thread.authorName || u.namaLengkap.replace(/\s+/g, "").toLowerCase() === thread.authorName.replace(/[\s_0-9]+/g, "").toLowerCase());
            if (matchedUser) authorNim = matchedUser.nim;
        }
        if (authorNim && authorNim !== currentUser.nim) {
            addNotification(
                authorNim,
                currentUser.nim,
                currentUser.namaLengkap,
                currentUser.avatarUrl || "",
                "comment",
                thread.id,
                thread.title,
                text
            );
        }
        
        // Clear input
        input.value = "";
        
        // Re-render
        renderFeedThreads();
    }
};

window.handleCommentKey = function (event, threadId) {
    if (event.key === "Enter") {
        event.preventDefault();
        submitComment(threadId);
    }
};

window.focusCommentInput = function (threadId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const input = document.getElementById(`comment-input-${threadId}`);
    if (input) {
        input.focus();
    }
};

// Thread options menu and editing handlers
window.toggleThreadMenu = function (threadId, event) {
    event.preventDefault();
    event.stopPropagation();
    const menu = document.getElementById(`menu-${threadId}`);
    if (menu) {
        // Hide all other dropdowns
        document.querySelectorAll(".thread-dropdown-menu").forEach(m => {
            if (m.id !== `menu-${threadId}`) {
                m.classList.remove("show");
            }
        });
        menu.classList.toggle("show");
    }
};

// Auto close dropdown menus when clicking outside
document.addEventListener("click", function () {
    document.querySelectorAll(".thread-dropdown-menu").forEach(menu => {
        menu.classList.remove("show");
    });
});

// ===== FITUR HAPUS UTAS DENGAN UNDO =====
let recentlyDeletedThread = null;
let recentlyDeletedIndex = -1;
let deleteThreadTimeout = null;
let deleteCountdownInterval = null;

window.deleteThread = function (threadId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Jika ada penghapusan yang tertunda sebelumnya, jalankan secara permanen terlebih dahulu
    if (deleteThreadTimeout) {
        clearTimeout(deleteThreadTimeout);
        if (deleteCountdownInterval) clearInterval(deleteCountdownInterval);
        executeDeleteThreadPermanently();
    }
    
    const threads = getThreads();
    const index = threads.findIndex(t => t.id === threadId);
    if (index === -1) return;
    
    // Berikan efek transisi menghapus pada DOM
    const card = document.getElementById("thread-card-" + threadId);
    if (card) {
        card.classList.add("deleting");
    }
    
    // Tunggu animasi transisi CSS fade-out (400ms)
    setTimeout(() => {
        recentlyDeletedThread = threads[index];
        recentlyDeletedIndex = index;
        
        // Hapus sementara dari list LocalStorage
        threads.splice(index, 1);
        saveThreads(threads);
        
        // Render ulang tampilan utama / profil
        renderFeedThreads();
        
        // Tampilkan Toast dengan opsi Batal (Undo)
        showUndoToast(threadId);
    }, 400);
};

function showUndoToast(threadId) {
    // Hapus toast jika sudah ada sebelumnya
    let existingToast = document.getElementById("undo-toast");
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement("div");
    toast.id = "undo-toast";
    toast.className = "undo-toast-container";
    
    let timeLeft = 5;
    toast.innerHTML = `
        <div class="undo-toast-content">
            <span class="material-symbols-outlined" style="color:var(--color-secondary-container); font-variation-settings:'FILL' 1;">delete</span>
            <span>Utas dihapus. <strong>(${timeLeft}s)</strong></span>
        </div>
        <button class="undo-btn" id="btn-undo-delete">Batal</button>
    `;
    
    document.body.appendChild(toast);
    
    // Pemicu animasi CSS transition masuk
    setTimeout(() => {
        toast.classList.add("show");
    }, 50);
    
    // Tombol Batal diklik
    const undoBtn = document.getElementById("btn-undo-delete");
    if (undoBtn) {
        undoBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            undoDeleteThread();
        });
    }
    
    // Update countdown setiap detik
    deleteCountdownInterval = setInterval(() => {
        timeLeft -= 1;
        const textSpan = toast.querySelector(".undo-toast-content span strong");
        if (textSpan) {
            textSpan.textContent = `(${timeLeft}s)`;
        }
        if (timeLeft <= 0) {
            clearInterval(deleteCountdownInterval);
        }
    }, 1000);
    
    // Hapus permanen setelah 5 detik
    deleteThreadTimeout = setTimeout(() => {
        executeDeleteThreadPermanently();
    }, 5000);
}

function undoDeleteThread() {
    if (deleteThreadTimeout) {
        clearTimeout(deleteThreadTimeout);
        deleteThreadTimeout = null;
    }
    if (deleteCountdownInterval) {
        clearInterval(deleteCountdownInterval);
        deleteCountdownInterval = null;
    }
    
    if (recentlyDeletedThread && recentlyDeletedIndex !== -1) {
        const threads = getThreads();
        // Kembalikan ke posisi indeks aslinya
        threads.splice(recentlyDeletedIndex, 0, recentlyDeletedThread);
        saveThreads(threads);
        
        recentlyDeletedThread = null;
        recentlyDeletedIndex = -1;
        
        renderFeedThreads();
        
        // Hapus elemen toast dengan efek keluar
        const toast = document.getElementById("undo-toast");
        if (toast) {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 400);
        }
        
        showToast("Penghapusan utas dibatalkan.", "info");
    }
}

function executeDeleteThreadPermanently() {
    if (deleteThreadTimeout) {
        clearTimeout(deleteThreadTimeout);
        deleteThreadTimeout = null;
    }
    if (deleteCountdownInterval) {
        clearInterval(deleteCountdownInterval);
        deleteCountdownInterval = null;
    }
    
    if (recentlyDeletedThread) {
        const currentUser = getCurrentUser();
        const actorNim = currentUser ? currentUser.nim : "unknown";
        const actorName = currentUser ? currentUser.namaLengkap : "unknown";
        
        // Log aktivitas permanen
        logActivity(
            "delete_thread", 
            actorNim, 
            actorName, 
            "thread", 
            recentlyDeletedThread.id, 
            recentlyDeletedThread.title, 
            "Dihapus permanen oleh pemilik/admin"
        );
        
        recentlyDeletedThread = null;
        recentlyDeletedIndex = -1;
    }
    
    const toast = document.getElementById("undo-toast");
    if (toast) {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }
}

window.editThread = function (threadId, event) {
    event.preventDefault();
    event.stopPropagation();
    const threads = getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
        document.getElementById("edit-thread-id").value = thread.id;
        document.getElementById("edit-thread-title").value = thread.title;
        document.getElementById("edit-editor-body").innerHTML = thread.content;
        document.getElementById("edit-thread-modal").classList.add("show");
    }
};

window.closeEditModal = function () {
    document.getElementById("edit-thread-modal").classList.remove("show");
};

window.formatEditDoc = function (command) {
    document.execCommand(command, false, null);
    document.getElementById("edit-editor-body").focus();
};

window.saveEditedThread = function () {
    const threadId = document.getElementById("edit-thread-id").value;
    const title = document.getElementById("edit-thread-title").value.trim();
    const content = document.getElementById("edit-editor-body").innerHTML.trim();

    if (!title) {
        alert("Judul utas tidak boleh kosong!");
        return;
    }
    if (!content || content === "<br>") {
        alert("Isi utas tidak boleh kosong!");
        return;
    }

    const threads = getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
        thread.title = title;
        thread.content = content;
        saveThreads(threads);
        closeEditModal();
        renderFeedThreads();
    }
};

// ===== FUNGSI BERI PERINGATAN (Moderator / Admin) =====
window.warnUser = function (threadId, event) {
    event.preventDefault();
    event.stopPropagation();

    const threads = getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;

    // Isi data modal peringatan
    const modal = document.getElementById("warn-modal");
    if (!modal) return;
    document.getElementById("warn-thread-id").value = threadId;
    document.getElementById("warn-thread-title").textContent = thread.title || thread.id;
    document.getElementById("warn-target-user").textContent = thread.authorName || "Pengguna";
    document.getElementById("warn-reason").value = "";
    modal.classList.add("show");
    // Tutup dropdown
    const menu = document.getElementById("menu-" + threadId);
    if (menu) menu.classList.remove("open");
};

window.closeWarnModal = function () {
    const modal = document.getElementById("warn-modal");
    if (modal) modal.classList.remove("show");
};

window.submitWarning = function () {
    const currentUser = getCurrentUser();
    const threadId = document.getElementById("warn-thread-id").value;
    const reason = document.getElementById("warn-reason").value.trim();
    const targetUser = document.getElementById("warn-target-user").textContent;

    if (!reason) {
        alert("Alasan peringatan tidak boleh kosong!");
        return;
    }

    const threads = getThreads();
    const thread = threads.find(t => t.id === threadId);

    saveWarning({
        threadId,
        threadTitle: thread ? thread.title : threadId,
        targetUser,
        issuedBy: currentUser ? currentUser.namaLengkap : "Moderator",
        reason
    });

    // Kirim notifikasi ke pembuat utas (targetUser)
    let targetNim = thread ? thread.authorNim : null;
    if (!targetNim && targetUser) {
        const users = getUsers();
        const matchedUser = users.find(u => u.namaLengkap === targetUser || u.namaLengkap.replace(/\s+/g, "").toLowerCase() === targetUser.replace(/[\s_0-9]+/g, "").toLowerCase());
        if (matchedUser) targetNim = matchedUser.nim;
    }
    if (targetNim) {
        addNotification(
            targetNim,
            currentUser ? currentUser.nim : "mod001",
            currentUser ? currentUser.namaLengkap : "Moderator Forum",
            currentUser ? currentUser.avatarUrl || "" : "",
            "warning",
            threadId,
            thread ? thread.title : threadId,
            reason
        );
    }

    closeWarnModal();
    // Tampilkan konfirmasi di pojok layar
    showToast("⚠️ Peringatan berhasil dikirim ke " + targetUser, "warning");
};

// ===== FUNGSI LAPORAN (User Biasa) =====
window.reportThread = function (threadId, event) {
    event.preventDefault();
    event.stopPropagation();

    const threads = getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;

    const modal = document.getElementById("report-modal");
    if (!modal) return;
    document.getElementById("report-thread-id").value = threadId;
    document.getElementById("report-thread-title").textContent = thread.title || thread.id;
    document.getElementById("report-reason").value = "";
    modal.classList.add("show");
    // Tutup dropdown
    const menu = document.getElementById("menu-" + threadId);
    if (menu) menu.classList.remove("open");
};

window.closeReportModal = function () {
    const modal = document.getElementById("report-modal");
    if (modal) modal.classList.remove("show");
};

window.submitReport = function () {
    const currentUser = getCurrentUser();
    const threadId = document.getElementById("report-thread-id").value;
    const reason = document.getElementById("report-reason").value.trim();

    if (!reason) {
        alert("Alasan laporan tidak boleh kosong!");
        return;
    }

    const threads = getThreads();
    const thread = threads.find(t => t.id === threadId);

    // Cek apakah sudah pernah melaporkan utas ini
    const existingReports = getReports();
    const alreadyReported = existingReports.some(
        r => r.threadId === threadId && r.reportedBy === (currentUser ? currentUser.nim : "")
    );
    if (alreadyReported) {
        alert("Anda sudah pernah melaporkan utas ini sebelumnya.");
        closeReportModal();
        return;
    }

    saveReport({
        threadId,
        threadTitle: thread ? thread.title : threadId,
        reportedBy: currentUser ? currentUser.nim : "unknown",
        reason
    });

    closeReportModal();
    showToast("🚩 Laporan berhasil dikirim. Terima kasih!", "report");
};

// ===== TOAST NOTIFIKASI =====
function showToast(message, type = "info") {
    let toast = document.getElementById("rbac-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "rbac-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = "rbac-toast rbac-toast--" + type + " rbac-toast--visible";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove("rbac-toast--visible");
    }, 3500);
}

// ===== DETAIL PROFIL USER REDIRECT LOGIC =====
window.viewUserProfile = function (identifier, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    window.location.href = `profile.html?nim=${identifier}`;
};

// Helper to escape HTML characters safely
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ===== INTEGRASI NOTIFIKASI UI & RENDERING =====
window.renderNotifications = function() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const notifications = getNotifications(currentUser.nim);
    const badge = document.getElementById("notification-badge");
    const listContainer = document.getElementById("notification-list");

    if (!listContainer) return;

    // Hitung jumlah notifikasi belum dibaca untuk memperbarui lencana (badge)
    const unreadCount = notifications.filter(n => !n.isRead).length;
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = "flex";
        } else {
            badge.style.display = "none";
        }
    }

    // Render list notifikasi
    if (notifications.length === 0) {
        listContainer.innerHTML = `
            <div class="no-notifications">
                <span class="material-symbols-outlined">notifications_off</span>
                <p>Tidak ada notifikasi baru</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = notifications.map(n => {
        const unreadClass = n.isRead ? "" : "unread";
        let icon = "notifications";
        let contentHtml = "";
        
        const safeSenderName = escapeHtml(n.senderName);
        const safeThreadTitle = escapeHtml(n.threadTitle);
        const safeDetailText = escapeHtml(n.detailText);

        if (n.actionType === "like") {
            icon = "thumb_up";
            contentHtml = `<strong>${safeSenderName}</strong> menyukai utas Anda: "<em>${safeThreadTitle}</em>"`;
        } else if (n.actionType === "comment") {
            icon = "chat_bubble";
            contentHtml = `<strong>${safeSenderName}</strong> mengomentari utas Anda: "<em>${safeThreadTitle}</em>" <span style="display:block; font-size:12px; color:var(--color-on-surface-variant); font-style:italic; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">"${safeDetailText}"</span>`;
        } else if (n.actionType === "verify") {
            icon = "verified";
            contentHtml = `Profil Anda telah <strong>diverifikasi</strong> oleh Moderator Forum.`;
        } else if (n.actionType === "warning") {
            icon = "warning";
            contentHtml = `<strong style="color:var(--color-error)">Peringatan!</strong> Anda menerima peringatan: "<em>${safeDetailText}</em>" di utas "${safeThreadTitle}"`;
        } else {
            contentHtml = `${n.detailText || ('Notifikasi dari ' + safeSenderName)}`;
        }

        const avatarHtml = n.senderAvatar 
            ? `<div class="notification-item-avatar"><img src="${n.senderAvatar}" alt="Avatar" /></div>`
            : `<div class="notification-item-avatar-icon"><span class="material-symbols-outlined">${icon}</span></div>`;

        return `
            <div class="notification-item ${unreadClass}" onclick="window.handleNotificationClick('${n.id}', '${n.threadId}')">
                ${avatarHtml}
                <div class="notification-item-content">
                    <span class="notification-item-text">${contentHtml}</span>
                    <span class="notification-item-time">${formatRelativeTime(n.timestamp)}</span>
                </div>
            </div>
        `;
    }).join("");
};

window.handleNotificationClick = function(id, threadId) {
    markNotificationAsRead(id);
    renderNotifications();
    
    // Tutup dropdown notifikasi setelah diklik
    const notificationDropdown = document.getElementById("notification-dropdown");
    if (notificationDropdown) {
        notificationDropdown.classList.remove("show");
    }

    if (threadId) {
        // Cek halaman saat ini
        const pageName = window.location.pathname.split("/").pop();
        if (pageName === "index.html" || pageName === "") {
            const card = document.getElementById("thread-card-" + threadId);
            if (card) {
                card.scrollIntoView({ behavior: "smooth", block: "center" });
                card.style.transition = "background-color 0.8s ease, transform 0.3s ease";
                card.style.backgroundColor = "var(--color-surface-container-highest)";
                card.style.borderLeft = "4px solid var(--color-primary)";
                setTimeout(() => {
                    card.style.backgroundColor = "";
                    card.style.borderLeft = "";
                }, 2500);
            } else {
                window.location.href = "index.html?thread=" + threadId;
            }
        } else {
            window.location.href = "index.html?thread=" + threadId;
        }
    }
};

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
        return "Baru saja";
    } else if (diffMin < 60) {
        return `${diffMin} menit yang lalu`;
    } else if (diffHour < 24) {
        return `${diffHour} jam yang lalu`;
    } else {
        return `${diffDay} hari yang lalu`;
    }
}


