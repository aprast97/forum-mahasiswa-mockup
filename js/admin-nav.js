// js/admin-nav.js — Shared helpers untuk semua halaman Admin Panel

/**
 * Inisialisasi halaman admin: cek role superadmin, tampilkan nama.
 * Returns current user atau null jika tidak authorized.
 */
function initAdminPage() {
    const user = getCurrentUser();
    if (!user || user.role !== "superadmin") {
        alert("Akses ditolak. Halaman ini hanya untuk Super Admin.");
        window.location.href = "login.html";
        return null;
    }
    const nameEl = document.getElementById("admin-name");
    if (nameEl) nameEl.textContent = user.namaLengkap;

    const logoutBtn = document.getElementById("admin-logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => logoutUser());
    }
    return user;
}

/* ── Escape HTML ── */
function esc(str) {
    if (str === null || str === undefined) return "—";
    return String(str)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ── Format datetime ── */
function fmtDt(iso) {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
             + " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch(e) { return iso; }
}

/* ── Format date only ── */
function fmtDate(iso) {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    } catch(e) { return iso; }
}

/* ── Time ago ── */
function timeAgo(iso) {
    if (!iso) return "—";
    try {
        const diff = (Date.now() - new Date(iso)) / 1000;
        if (diff < 60)   return "Baru saja";
        if (diff < 3600) return Math.floor(diff / 60) + " menit lalu";
        if (diff < 86400) return Math.floor(diff / 3600) + " jam lalu";
        return Math.floor(diff / 86400) + " hari lalu";
    } catch(e) { return "—"; }
}

/* ── Toast notification ── */
function showAdminToast(message, type = "success") {
    let toast = document.getElementById("admin-global-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "admin-global-toast";
        document.body.appendChild(toast);
    }
    const colors = {
        success: { bg: "#065f46", text: "#d1fae5" },
        error:   { bg: "#991b1b", text: "#fee2e2" },
        warning: { bg: "#92400e", text: "#fef3c7" },
        info:    { bg: "#1e40af", text: "#dbeafe" },
    };
    const c = colors[type] || colors.info;
    toast.textContent = message;
    toast.style.cssText = `
        position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
        padding:12px 22px;border-radius:10px;font-size:14px;font-weight:500;
        color:${c.text};background:${c.bg};
        box-shadow:0 4px 20px rgba(0,0,0,0.25);
        z-index:9999;opacity:1;transition:opacity 0.3s;
        font-family:var(--font-family);white-space:nowrap;
    `;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.opacity = "0"; }, 3200);
}

/* ── Action label mapping ── */
const ACTION_LABELS = {
    ban_user:        { label: "Ban User",          icon: "block",            color: "#dc2626" },
    unban_user:      { label: "Unban User",         icon: "lock_open",        color: "#059669" },
    delete_user:     { label: "Hapus User",         icon: "person_remove",    color: "#1e293b" },
    reset_password:  { label: "Reset Password",     icon: "key",              color: "#0891b2" },
    verify_user:     { label: "Verifikasi User",    icon: "verified",         color: "#059669" },
    unverify_user:   { label: "Batalkan Verifikasi",icon: "unpublished",      color: "#d97706" },
    suspend_user:    { label: "Suspend User",       icon: "pause_circle",     color: "#d97706" },
    unsuspend_user:  { label: "Aktifkan User",      icon: "play_circle",      color: "#059669" },
    promote_user:    { label: "Jadikan Moderator",  icon: "shield_person",    color: "#7c3aed" },
    demote_user:     { label: "Turunkan Role",      icon: "arrow_downward",   color: "#d97706" },
    delete_thread:   { label: "Hapus Thread",       icon: "delete",           color: "#dc2626" },
    lock_thread:     { label: "Lock Thread",        icon: "lock",             color: "#d97706" },
    unlock_thread:   { label: "Unlock Thread",      icon: "lock_open",        color: "#059669" },
    pin_thread:      { label: "Pin Thread",         icon: "push_pin",         color: "#0891b2" },
    unpin_thread:    { label: "Unpin Thread",       icon: "push_pin",         color: "#6b7280" },
    archive_thread:  { label: "Arsip Thread",       icon: "archive",          color: "#6b7280" },
    restore_thread:  { label: "Restore Thread",     icon: "unarchive",        color: "#059669" },
    delete_comment:  { label: "Hapus Komentar",     icon: "comment",          color: "#dc2626" },
    close_report:    { label: "Tutup Laporan",      icon: "flag",             color: "#6b7280" },
    add_category:    { label: "Tambah Kategori",    icon: "add_circle",       color: "#059669" },
    delete_category: { label: "Hapus Kategori",     icon: "remove_circle",    color: "#dc2626" },
    reorder_category:{ label: "Ubah Urutan Kategori",icon: "reorder",         color: "#0891b2" },
};
