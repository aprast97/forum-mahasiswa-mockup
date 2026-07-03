// js/profile.js — Client logic untuk Halaman Profil Pengguna

let profileUser = null;
let isOwner = false;

document.addEventListener("DOMContentLoaded", function () {
    // 1. Ambil target NIM dari URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    let targetNim = urlParams.get("nim");
    
    const currentUser = getCurrentUser();
    
    // Jika tidak ada NIM di parameter, tampilkan profil sendiri
    if (!targetNim && currentUser) {
        targetNim = currentUser.nim;
    }
    
    if (!targetNim) {
        alert("Harap login terlebih dahulu.");
        window.location.href = "login.html";
        return;
    }
    
    // Simpan ke fungsi global agar bisa direfresh saat like/save dipicu
    window.loadProfileData = function () {
        loadUserProfileData(targetNim);
    };
    
    // 2. Load pertama kali
    window.loadProfileData();
});

function loadUserProfileData(targetNim) {
    const currentUser = getCurrentUser();
    const users = getUsers();
    
    // Cari user berdasarkan NIM
    profileUser = users.find(u => u.nim === targetNim);
    
    // Fallback jika profileUser tidak ditemukan di list register (misal data dummy)
    if (!profileUser) {
        const threads = getThreads();
        const thread = threads.find(t => t.authorName === targetNim || t.authorNim === targetNim);
        if (thread) {
            profileUser = {
                namaLengkap: thread.authorName,
                nim: thread.authorNim || "—",
                upbjj: thread.authorSub ? thread.authorSub.split("•")[0].trim() : "UT Jakarta",
                programStudi: thread.authorSub ? (thread.authorSub.split("•")[1] ? thread.authorSub.split("•")[1].trim() : "") : "",
                avatarUrl: thread.avatarUrl || "",
                role: "user",
                verified: false
            };
        } else {
            profileUser = {
                namaLengkap: targetNim,
                nim: "—",
                upbjj: "Lainnya",
                programStudi: "",
                avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHIDcAqOwTfUbQIFmRTYv43WaqQI2Txa5V5zqahTfLzAiQx69JH3uYp-y8A9MkRobEyg-0w5OZDE3kYNEBn1GkCK01NhzwyjCA_MTQl666zrMzPpUQa1DnaLdM20qdv5upfcF0Kwm5A_bV4SEJVu9-6ZLXgz2AiwpLlY9ZJ1cPDi2xsRRFzgsfkGycdjso_tHG7HUBYZSoQ9Xg8m8qDAdAfzSUL9BJ_ITPfXhKKezcKU7o0NJLp0ls6Udm5Jjqpo9bI9zmsV4dqSP-",
                role: "user",
                verified: false
            };
        }
    }
    
    isOwner = currentUser && currentUser.nim === profileUser.nim;
    
    // 3. Render Profile Card info
    renderProfileHeaderCard();
    
    // 4. Render lists
    renderProfileThreads();
    
    if (isOwner) {
        document.getElementById("tab-btn-saved").style.display = "inline-block";
        renderProfileSavedThreads();
    } else {
        document.getElementById("tab-btn-saved").style.display = "none";
    }
}

function renderProfileHeaderCard() {
    if (!profileUser) return;
    
    const avatarImg = document.getElementById("user-profile-avatar");
    if (avatarImg) {
        avatarImg.src = profileUser.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCHIDcAqOwTfUbQIFmRTYv43WaqQI2Txa5V5zqahTfLzAiQx69JH3uYp-y8A9MkRobEyg-0w5OZDE3kYNEBn1GkCK01NhzwyjCA_MTQl666zrMzPpUQa1DnaLdM20qdv5upfcF0Kwm5A_bV4SEJVu9-6ZLXgz2AiwpLlY9ZJ1cPDi2xsRRFzgsfkGycdjso_tHG7HUBYZSoQ9Xg8m8qDAdAfzSUL9BJ_ITPfXhKKezcKU7o0NJLp0ls6Udm5Jjqpo9bI9zmsV4dqSP-";
    }
    
    const nameEl = document.getElementById("user-profile-name");
    if (nameEl) {
        const verBadge = profileUser.verified 
            ? `<span title="Terverifikasi" style="color:#059669; font-size:22px; display:inline-flex; align-items:center;" class="material-symbols-outlined">verified</span>` 
            : "";
        nameEl.innerHTML = `${escapeHtml(profileUser.namaLengkap)} ${verBadge}`;
    }
    
    const roleEl = document.getElementById("user-profile-role");
    if (roleEl) {
        let roleCls = "pill-blue";
        let roleLabel = "Mahasiswa";
        if (profileUser.role === "superadmin") {
            roleCls = "pill-purple";
            roleLabel = "Super Admin";
        } else if (profileUser.role === "moderator") {
            roleCls = "pill-teal";
            roleLabel = "Moderator";
        }
        roleEl.className = `pill ${roleCls}`;
        roleEl.textContent = roleLabel;
    }
    
    const upbjjBadge = document.getElementById("user-profile-upbjj-badge");
    if (upbjjBadge) {
        upbjjBadge.textContent = (profileUser.upbjj || "Lainnya").toUpperCase();
    }
    
    // Meta fields
    setElVal("meta-val-nim", profileUser.nim || "—");
    setElVal("meta-val-program", profileUser.programStudi || "—");
    setElVal("meta-val-upbjj", profileUser.upbjj || "Lainnya");
    
    const aboutRow = document.getElementById("meta-row-about");
    if (aboutRow) {
        const aboutText = profileUser.tentangSaya || "Halo! Saya adalah mahasiswa Universitas Terbuka yang aktif berdiskusi di forum ini.";
        setElVal("meta-val-about", aboutText);
    }
    
    // Calculate Stats
    const threads = getThreads();
    const userThreads = threads.filter(t => t.authorNim === profileUser.nim || t.authorName === profileUser.namaLengkap);
    
    let totalComments = 0;
    threads.forEach(t => {
        if (t.comments) {
            totalComments += t.comments.filter(c => c.authorNim === profileUser.nim || c.authorName === profileUser.namaLengkap).length;
        }
    });
    
    const totalLikes = userThreads.reduce((sum, t) => sum + (t.likes || 0), 0);
    
    setElVal("stat-val-threads", userThreads.length);
    setElVal("stat-val-comments", totalComments);
    setElVal("stat-val-likes", totalLikes);
    
    // Action buttons
    const actionContainer = document.getElementById("profile-action-container");
    if (actionContainer) {
        if (isOwner) {
            actionContainer.innerHTML = `
                <a class="btn btn-primary" href="settings.html" style="display: flex; align-items: center; justify-content: center; text-decoration: none;">
                    <span class="material-symbols-outlined" style="font-size: 18px; margin-right: 6px;">edit</span>
                    Edit Profil
                </a>
            `;
        } else {
            actionContainer.innerHTML = `
                <button class="btn btn-secondary" onclick="alert('Anda mengikuti ${escapeHtml(profileUser.namaLengkap)}')" style="background-color: var(--color-surface-variant); color: var(--color-on-surface-variant); box-shadow: none;">
                    <span class="material-symbols-outlined" style="font-size: 18px; margin-right: 6px;">person_add</span>
                    Ikuti
                </button>
                <button class="btn btn-primary" onclick="alert('Fitur Kirim Pesan ke ${escapeHtml(profileUser.namaLengkap)} akan segera hadir!')">
                    <span class="material-symbols-outlined" style="font-size: 18px; margin-right: 6px;">mail</span>
                    Kirim Pesan
                </button>
            `;
        }
    }
}

// Render User's Threads
function renderProfileThreads() {
    const container = document.getElementById("profile-threads-container");
    if (!container) return;
    
    const threads = getThreads();
    const userThreads = threads.filter(t => t.authorNim === profileUser.nim || t.authorName === profileUser.namaLengkap);
    
    if (userThreads.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 48px 16px; color: var(--color-on-surface-variant); background-color: var(--color-surface-container-lowest); border: 1px solid var(--color-outline-variant); border-radius: var(--radius-xl);">
                <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 8px; color: var(--color-outline-variant);">forum</span>
                <p style="font-weight: 500;">User ini belum pernah memposting utas.</p>
            </div>
        `;
        return;
    }
    
    renderThreadCardsToContainer(userThreads, container);
}

// Render User's Saved Threads (Bookmarks)
function renderProfileSavedThreads() {
    const container = document.getElementById("profile-saved-container");
    if (!container) return;
    
    const currentUser = getCurrentUser();
    const savedIds = currentUser && currentUser.savedThreads ? currentUser.savedThreads : [];
    
    const threads = getThreads();
    const savedThreads = threads.filter(t => savedIds.includes(t.id));
    
    if (savedThreads.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 48px 16px; color: var(--color-on-surface-variant); background-color: var(--color-surface-container-lowest); border: 1px solid var(--color-outline-variant); border-radius: var(--radius-xl);">
                <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 8px; color: var(--color-outline-variant);">bookmark</span>
                <p style="font-weight: 500;">Belum ada utas yang Anda simpan.</p>
            </div>
        `;
        return;
    }
    
    renderThreadCardsToContainer(savedThreads, container);
}

// Helper to generate thread card markup (mirroring js/auth.js feed rendering)
function renderThreadCardsToContainer(threadsList, container) {
    container.innerHTML = "";
    const currentUser = getCurrentUser();
    
    threadsList.forEach(thread => {
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
        
        // RBAC dropdown menu
        const isOwnerCard = currentUser && (
            (thread.authorNim && currentUser.nim === thread.authorNim) ||
            (thread.authorName === currentUser.namaLengkap || thread.authorName === currentUser.nim)
        );
        const isAdmin = currentUser && currentUser.role === "superadmin";
        const isModerator = currentUser && currentUser.role === "moderator";
        
        let menuItems = [];
        if (isOwnerCard || isAdmin) {
            menuItems.push(`
                <button class="thread-dropdown-item" onclick="editThread('${thread.id}', event)">
                    <span class="material-symbols-outlined" style="font-size:16px">edit</span>
                    Edit Utas
                </button>`);
        }
        if (isOwnerCard || isAdmin || isModerator) {
            menuItems.push(`
                <button class="thread-dropdown-item text-error" onclick="deleteThread('${thread.id}', event)">
                    <span class="material-symbols-outlined" style="font-size:16px">delete</span>
                    Hapus Utas
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
        
        container.appendChild(article);
    });
}

// Switch between Threads and Bookmarks tabs
window.switchProfileTab = function (tabName) {
    document.querySelectorAll(".profile-tab-content").forEach(c => {
        c.classList.remove("active");
    });
    document.querySelectorAll(".profile-tab-btn").forEach(b => {
        b.classList.remove("active");
    });
    
    if (tabName === "threads") {
        document.getElementById("tab-content-threads").classList.add("active");
        document.getElementById("tab-btn-threads").classList.add("active");
    } else if (tabName === "saved") {
        document.getElementById("tab-content-saved").classList.add("active");
        document.getElementById("tab-btn-saved").classList.add("active");
    }
};

function setElVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
