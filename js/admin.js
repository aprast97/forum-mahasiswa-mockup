// js/admin.js — Manajemen User (Enhanced)

let currentAdmin = null;
let allUsersCache = [];

document.addEventListener("DOMContentLoaded", function () {
    currentAdmin = initAdminPage();
    if (!currentAdmin) return;
    loadAndRender();
});

// ── Load & Render ──────────────────────────────────────────
function loadAndRender() {
    allUsersCache = getUsers();
    renderStats();
    renderTable(allUsersCache);
}

function renderStats() {
    const visible = allUsersCache.filter(u => !u.banned);
    setEl("stat-total",     visible.length);
    setEl("stat-moderator", visible.filter(u => u.role === "moderator").length);
    setEl("stat-suspended", visible.filter(u => u.suspended).length);
    setEl("stat-banned",    allUsersCache.filter(u => u.banned).length);
}

function renderTable(users) {
    const tbody = document.getElementById("user-table-body");
    const empty = document.getElementById("empty-state");
    if (!tbody) return;

    // Dalam filter default: sembunyikan banned (kecuali filter explicitly "banned")
    const filterStatus = document.getElementById("filter-status")?.value || "all";
    let display = filterStatus === "banned"
        ? users.filter(u => u.banned)
        : users.filter(u => !u.banned);

    if (!display.length) {
        tbody.innerHTML = "";
        if (empty) empty.style.display = "";
        return;
    }
    if (empty) empty.style.display = "none";

    tbody.innerHTML = display.map(u => {
        const isSelf = u.nim === currentAdmin.nim;
        const roleMap = { superadmin: ["pill-blue", "Super Admin"], moderator: ["pill-purple", "Moderator"], user: ["pill-green", "Mahasiswa"] };
        const [roleCls, roleLabel] = roleMap[u.role] || ["pill-gray", u.role];

        const statusBadge = u.banned
            ? `<span class="pill pill-red">Dibanned</span>`
            : u.suspended
                ? `<span class="pill pill-yellow">Ditangguhkan</span>`
                : `<span class="pill pill-green">Aktif</span>`;

        const verBadge = u.verified
            ? `<span title="Terverifikasi" style="color:#059669;font-size:14px;" class="material-symbols-outlined">verified</span>`
            : "";

        // Actions
        const actions = [];
        if (!isSelf) {
            // Verify
            actions.push(`<button class="icon-action ${u.verified ? 'ia-gray' : 'ia-green'}" title="${u.verified ? 'Batalkan Verifikasi' : 'Verifikasi'}" onclick="handleVerify('${u.nim}')"><span class="material-symbols-outlined">${u.verified ? 'unpublished' : 'verified'}</span></button>`);
            // Reset PW
            actions.push(`<button class="icon-action ia-teal" title="Reset Password ke 'reset123'" onclick="handleResetPw('${u.nim}','${esc(u.namaLengkap)}')"><span class="material-symbols-outlined">key</span></button>`);
            if (u.role !== "superadmin") {
                // Promote/Demote
                if (u.role === "user")      actions.push(`<button class="icon-action ia-purple" title="Jadikan Moderator" onclick="promoteUser('${u.nim}')"><span class="material-symbols-outlined">shield_person</span></button>`);
                if (u.role === "moderator") actions.push(`<button class="icon-action ia-yellow" title="Turunkan ke Mahasiswa" onclick="demoteUser('${u.nim}')"><span class="material-symbols-outlined">arrow_downward</span></button>`);
                // Suspend / Activate
                if (!u.banned) {
                    if (!u.suspended) actions.push(`<button class="icon-action ia-orange" title="Tangguhkan Sementara" onclick="handleSuspend('${u.nim}')"><span class="material-symbols-outlined">pause_circle</span></button>`);
                    else             actions.push(`<button class="icon-action ia-green" title="Aktifkan Kembali" onclick="handleActivate('${u.nim}')"><span class="material-symbols-outlined">play_circle</span></button>`);
                }
                // Ban / Unban
                if (!u.banned) actions.push(`<button class="icon-action ia-red" title="Ban Permanen" onclick="openBanModal('${u.nim}','${esc(u.namaLengkap)}')"><span class="material-symbols-outlined">block</span></button>`);
                else           actions.push(`<button class="icon-action ia-green" title="Hapus Ban" onclick="handleUnban('${u.nim}')"><span class="material-symbols-outlined">lock_open</span></button>`);
                // Delete
                actions.push(`<button class="icon-action ia-dark" title="Hapus Akun Permanen" onclick="openDeleteModal('${u.nim}','${esc(u.namaLengkap)}')"><span class="material-symbols-outlined">person_remove</span></button>`);
            }
        }
        // History
        actions.push(`<button class="icon-action ia-gray" title="Riwayat Aktivitas" onclick="showHistory('${u.nim}','${esc(u.namaLengkap)}')"><span class="material-symbols-outlined">history</span></button>`);

        return `<tr>
            <td>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:32px;height:32px;border-radius:50%;background:var(--color-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${(u.namaLengkap||"?").charAt(0).toUpperCase()}</div>
                    <div>
                        <div style="font-size:13px;font-weight:600;color:var(--color-on-surface);display:flex;align-items:center;gap:4px;">${esc(u.namaLengkap)} ${verBadge}</div>
                        <div style="font-size:11px;color:var(--color-on-surface-variant);">${esc(u.programStudi || "—")}</div>
                    </div>
                </div>
            </td>
            <td style="font-family:monospace;font-size:12px;">${esc(u.nim)}</td>
            <td style="font-size:12px;">${esc(u.upbjj)}</td>
            <td><span class="pill ${roleCls}">${roleLabel}</span></td>
            <td>${statusBadge}</td>
            <td style="font-size:11px;color:var(--color-on-surface-variant);">${u.lastLogin ? timeAgo(u.lastLogin) : "—"}</td>
            <td><div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">${actions.join("")}</div></td>
        </tr>`;
    }).join("");
}

// ── Filter ─────────────────────────────────────────────────
function filterTable() {
    const q      = (document.getElementById("search-input")?.value || "").toLowerCase();
    const role   = document.getElementById("filter-role")?.value || "all";
    const status = document.getElementById("filter-status")?.value || "all";

    let users = allUsersCache.filter(u => {
        const matchSearch = !q || u.namaLengkap.toLowerCase().includes(q) || u.nim.toLowerCase().includes(q);
        const matchRole   = role === "all" || u.role === role;
        const matchStatus = status === "all"
            ? true
            : status === "banned"    ? u.banned
            : status === "suspended" ? (!u.banned && u.suspended)
            : (!u.banned && !u.suspended);
        return matchSearch && matchRole && matchStatus;
    });
    renderTable(users);
}

// ── Actions ────────────────────────────────────────────────
function promoteUser(nim) {
    const users = getUsers();
    const u = users.find(u => u.nim === nim);
    if (!u) return;
    u.role = "moderator";
    saveUsers(users);
    logActivity("promote_user", currentAdmin.nim, currentAdmin.namaLengkap, "user", nim, u.namaLengkap, "");
    showAdminToast("✅ " + u.namaLengkap + " dijadikan Moderator");
    loadAndRender();
}

function demoteUser(nim) {
    const users = getUsers();
    const u = users.find(u => u.nim === nim);
    if (!u) return;
    u.role = "user";
    saveUsers(users);
    logActivity("demote_user", currentAdmin.nim, currentAdmin.namaLengkap, "user", nim, u.namaLengkap, "");
    showAdminToast("ℹ️ " + u.namaLengkap + " dikembalikan ke Mahasiswa");
    loadAndRender();
}

function handleSuspend(nim) {
    const users = getUsers();
    const u = users.find(u => u.nim === nim);
    if (!u) return;
    u.suspended = true;
    saveUsers(users);
    logActivity("suspend_user", currentAdmin.nim, currentAdmin.namaLengkap, "user", nim, u.namaLengkap, "");
    showAdminToast("⏸️ Akun " + u.namaLengkap + " ditangguhkan");
    loadAndRender();
}

function handleActivate(nim) {
    const users = getUsers();
    const u = users.find(u => u.nim === nim);
    if (!u) return;
    u.suspended = false;
    saveUsers(users);
    logActivity("unsuspend_user", currentAdmin.nim, currentAdmin.namaLengkap, "user", nim, u.namaLengkap, "");
    showAdminToast("✅ Akun " + u.namaLengkap + " diaktifkan kembali");
    loadAndRender();
}

function handleVerify(nim) {
    const result = verifyUser(nim, currentAdmin.nim, currentAdmin.namaLengkap);
    if (result.success) {
        showAdminToast(result.verified ? "✅ Akun berhasil diverifikasi" : "ℹ️ Verifikasi dibatalkan");
        loadAndRender();
    }
}

function handleResetPw(nim, name) {
    if (!confirm("Reset password " + name + " ke 'reset123'?")) return;
    const result = resetUserPassword(nim, currentAdmin.nim, currentAdmin.namaLengkap);
    if (result.success) showAdminToast("🔑 Password " + name + " direset ke 'reset123'", "info");
    else showAdminToast("Gagal reset password", "error");
}

function handleUnban(nim) {
    const result = unbanUser(nim, currentAdmin.nim, currentAdmin.namaLengkap);
    if (result.success) { showAdminToast("✅ Ban dihapus"); loadAndRender(); }
}

// Modal Ban
function openBanModal(nim, name) {
    document.getElementById("ban-target-nim").value = nim;
    document.getElementById("ban-target-name").textContent = name;
    document.getElementById("ban-reason").value = "";
    document.getElementById("ban-modal").classList.add("show");
}
function confirmBan() {
    const nim    = document.getElementById("ban-target-nim").value;
    const reason = document.getElementById("ban-reason").value.trim();
    if (!reason) { alert("Alasan ban wajib diisi!"); return; }
    const result = banUser(nim, reason, currentAdmin.nim, currentAdmin.namaLengkap);
    if (result.success) {
        document.getElementById("ban-modal").classList.remove("show");
        showAdminToast("🚫 User berhasil dibanned", "warning");
        loadAndRender();
    }
}

// Modal Delete
function openDeleteModal(nim, name) {
    document.getElementById("delete-user-nim").value = nim;
    document.getElementById("delete-user-name").textContent = name;
    document.getElementById("delete-user-modal").classList.add("show");
}
function confirmDeleteUser() {
    const nim = document.getElementById("delete-user-nim").value;
    const result = deleteUser(nim, currentAdmin.nim, currentAdmin.namaLengkap);
    if (result.success) {
        document.getElementById("delete-user-modal").classList.remove("show");
        showAdminToast("🗑️ Akun berhasil dihapus", "info");
        loadAndRender();
    }
}

// Modal History
function showHistory(nim, name) {
    document.getElementById("history-user-name").textContent = name;
    document.getElementById("history-modal").classList.add("show");
    const logs = getActivityLog().filter(l => l.targetId === nim || l.actorNim === nim);
    const el = document.getElementById("history-content");
    if (!logs.length) {
        el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">history</span><p>Belum ada riwayat aktivitas</p></div>`;
        return;
    }
    el.innerHTML = `<table class="a-table"><thead><tr><th>Waktu</th><th>Aksi</th><th>Pelaku</th><th>Detail</th></tr></thead><tbody>
        ${logs.slice(0,20).map(l => {
            const info = ACTION_LABELS[l.action] || { label: l.action, icon: "info", color: "#6b7280" };
            return `<tr>
                <td style="font-size:11px;color:var(--color-outline);white-space:nowrap;">${fmtDt(l.timestamp)}</td>
                <td><span style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:${info.color};white-space:nowrap;">
                    <span class="material-symbols-outlined" style="font-size:13px;font-variation-settings:'FILL' 1;">${info.icon}</span>${info.label}
                </span></td>
                <td style="font-size:12px;">${esc(l.actorName)}</td>
                <td style="font-size:12px;color:var(--color-on-surface-variant);">${esc(l.detail||l.targetName)}</td>
            </tr>`;
        }).join("")}
    </tbody></table>`;
}

// ── Add Moderator ───────────────────────────────────────────
function handleAddModerator() {
    const nama    = document.getElementById("mod-nama").value.trim();
    const nim     = document.getElementById("mod-nim").value.trim();
    const pw      = document.getElementById("mod-password").value.trim();
    const upbjj   = document.getElementById("mod-upbjj").value;
    const alertEl = document.getElementById("add-mod-alert");

    if (!nama || !nim || !pw) {
        alertEl.style.display = "";
        alertEl.style.background = "#fee2e2"; alertEl.style.color = "#991b1b";
        alertEl.textContent = "Nama, NIM/ID, dan password wajib diisi!";
        return;
    }
    const users = getUsers();
    if (users.find(u => u.nim === nim)) {
        alertEl.style.display = "";
        alertEl.style.background = "#fee2e2"; alertEl.style.color = "#991b1b";
        alertEl.textContent = "NIM/ID sudah digunakan!";
        return;
    }
    users.push({ namaLengkap: nama, nim, password: pw, upbjj, programStudi: "", noTelepon: "", avatarUrl: "", role: "moderator", banned: false, verified: false, lastLogin: null });
    saveUsers(users);
    logActivity("promote_user", currentAdmin.nim, currentAdmin.namaLengkap, "user", nim, nama, "Ditambahkan sebagai moderator baru");
    alertEl.style.display = "";
    alertEl.style.background = "#d1fae5"; alertEl.style.color = "#065f46";
    alertEl.textContent = "✅ Moderator " + nama + " berhasil ditambahkan!";
    document.getElementById("mod-nama").value = "";
    document.getElementById("mod-nim").value  = "";
    document.getElementById("mod-password").value = "";
    loadAndRender();
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
