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
    if (avatarBtn && profileDropdown) {
        avatarBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            profileDropdown.classList.toggle("show");
        });

        // Close dropdown when clicking anywhere else
        document.addEventListener("click", function (e) {
            if (!profileDropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
                profileDropdown.classList.remove("show");
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
            } else {
                sidebar.classList.toggle("collapsed");
            }
        });

        // Close mobile sidebar drawer when clicking outside on mobile
        document.addEventListener("click", function (e) {
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                sidebar.classList.remove("show-mobile");
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
            
            ${tagsHtml}
            
            <div class="thread-actions">
                <div class="action-group-likes">
                    <button class="${likeBtnClass}" onclick="likeThread('${thread.id}', event)">
                        <span class="material-symbols-outlined" style="${likeIconStyle}">thumb_up</span>
                    </button>
                    <span class="like-count" id="likes-${thread.id}">${thread.likes}</span>
                </div>
                <button class="action-btn" onclick="focusCommentInput('${thread.id}', event)" style="gap: 6px;">
                    <span class="material-symbols-outlined">chat_bubble</span>
                    <span>${thread.commentsCount || (thread.comments ? thread.comments.length : 0)}</span>
                </button>
                <button class="action-btn" onclick="saveThread('${thread.id}', event)" style="gap: 0;" title="Simpan Utas">
                    <span class="material-symbols-outlined" style="${saveIconStyle}">bookmark</span>
                </button>
                <button class="action-btn" onclick="shareThread('${thread.id}', event)" style="gap: 0;" title="Bagikan">
                    <span class="material-symbols-outlined">send</span>
                </button>
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

window.deleteThread = function (threadId, event) {
    event.preventDefault();
    event.stopPropagation();
    if (confirm("Apakah Anda yakin ingin menghapus utas ini?")) {
        const threads = getThreads();
        const filtered = threads.filter(t => t.id !== threadId);
        saveThreads(filtered);
        renderFeedThreads();
    }
};

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
