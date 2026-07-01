// js/moderation.js

let modAdmin = null;
let allThreadsCache = [];

document.addEventListener("DOMContentLoaded", function () {
    modAdmin = initAdminPage();
    if (!modAdmin) return;
    loadModerationData();
});

function loadModerationData() {
    allThreadsCache = getThreads();
    renderThreadTable(allThreadsCache);
    renderReportsTable();
    updateReportsBadge();
}

// ── Tab ──────────────────────────────────────────────────────
function switchModTab(tab) {
    document.getElementById("page-threads").style.display = tab === "threads" ? "" : "none";
    document.getElementById("page-reports").style.display = tab === "reports" ? "" : "none";
    document.getElementById("tab-threads").classList.toggle("active", tab === "threads");
    document.getElementById("tab-reports").classList.toggle("active", tab === "reports");
}

function updateReportsBadge() {
    const open = getReports().filter(r => r.status !== "closed").length;
    const el   = document.getElementById("reports-badge");
    if (el) { el.textContent = open > 0 ? open : ""; el.style.display = open > 0 ? "" : "none"; }
}

// ── Threads ──────────────────────────────────────────────────
function renderThreadTable(threads) {
    const tbody = document.getElementById("thread-table-body");
    const empty = document.getElementById("thread-empty");
    const count = document.getElementById("thread-count");
    if (!tbody) return;
    if (count) count.textContent = threads.length + " thread";

    if (!threads.length) {
        tbody.innerHTML = "";
        if (empty) empty.style.display = "";
        return;
    }
    if (empty) empty.style.display = "none";

    tbody.innerHTML = threads.map(t => {
        const badges = [];
        if (t.pinned)   badges.push(`<span class="pill pill-teal">📌 Pin</span>`);
        if (t.locked)   badges.push(`<span class="pill pill-yellow">🔒 Lock</span>`);
        if (t.archived) badges.push(`<span class="pill pill-gray">📦 Arsip</span>`);
        if (!badges.length) badges.push(`<span class="pill pill-green">Normal</span>`);

        const comments = t.commentsCount || (t.comments ? t.comments.length : 0);

        return `<tr>
            <td style="max-width:220px;">
                <div style="font-size:12px;font-weight:600;color:var(--color-on-surface);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(t.title)}</div>
            </td>
            <td style="font-size:12px;">${esc(t.authorName)}</td>
            <td><span class="pill pill-purple">${esc(t.category)}</span></td>
            <td><div style="display:flex;gap:4px;flex-wrap:wrap;">${badges.join("")}</div></td>
            <td style="font-size:12px;text-align:center;">❤️ ${t.likes||0}</td>
            <td style="font-size:12px;text-align:center;">💬 ${comments}</td>
            <td>
                <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">
                    <button class="icon-action ia-teal" title="Lihat Komentar" onclick="viewComments('${t.id}')"><span class="material-symbols-outlined">chat_bubble</span></button>
                    ${t.pinned
                        ? `<button class="icon-action ia-gray" title="Unpin" onclick="handlePin('${t.id}',false)"><span class="material-symbols-outlined">push_pin</span></button>`
                        : `<button class="icon-action ia-teal" title="Pin Thread" onclick="handlePin('${t.id}',true)"><span class="material-symbols-outlined">push_pin</span></button>`}
                    ${t.locked
                        ? `<button class="icon-action ia-green" title="Unlock" onclick="handleLock('${t.id}',false)"><span class="material-symbols-outlined">lock_open</span></button>`
                        : `<button class="icon-action ia-yellow" title="Lock Thread" onclick="handleLock('${t.id}',true)"><span class="material-symbols-outlined">lock</span></button>`}
                    ${t.archived
                        ? `<button class="icon-action ia-green" title="Restore" onclick="handleArchive('${t.id}',false)"><span class="material-symbols-outlined">unarchive</span></button>`
                        : `<button class="icon-action ia-gray" title="Arsip" onclick="handleArchive('${t.id}',true)"><span class="material-symbols-outlined">archive</span></button>`}
                    <button class="icon-action ia-red" title="Hapus Thread" onclick="openDeleteThread('${t.id}','${esc(t.title)}')"><span class="material-symbols-outlined">delete</span></button>
                </div>
            </td>
        </tr>`;
    }).join("");
}

function filterThreads() {
    const q      = (document.getElementById("thread-search")?.value || "").toLowerCase();
    const status = document.getElementById("thread-filter-status")?.value || "all";
    let threads  = allThreadsCache.filter(t => {
        const matchQ = !q || t.title.toLowerCase().includes(q) || (t.authorName||"").toLowerCase().includes(q);
        const matchS = status === "all"      ? true
            : status === "pinned"   ? t.pinned
            : status === "locked"   ? t.locked
            : status === "archived" ? t.archived
            : (!t.pinned && !t.locked && !t.archived);
        return matchQ && matchS;
    });
    renderThreadTable(threads);
}

// Thread actions
function handlePin(id, pin) {
    pinThread(id, pin, modAdmin.nim, modAdmin.namaLengkap);
    showAdminToast(pin ? "📌 Thread di-pin" : "ℹ️ Pin dihapus", "info");
    allThreadsCache = getThreads();
    filterThreads();
}
function handleLock(id, lock) {
    lockThread(id, lock, modAdmin.nim, modAdmin.namaLengkap);
    showAdminToast(lock ? "🔒 Thread dikunci" : "🔓 Thread dibuka", "info");
    allThreadsCache = getThreads();
    filterThreads();
}
function handleArchive(id, archive) {
    archiveThread(id, archive, modAdmin.nim, modAdmin.namaLengkap);
    showAdminToast(archive ? "📦 Thread diarsipkan" : "✅ Thread dipulihkan", "info");
    allThreadsCache = getThreads();
    filterThreads();
}

function openDeleteThread(id, title) {
    document.getElementById("del-thread-id").value = id;
    document.getElementById("del-thread-title").textContent = title;
    document.getElementById("del-thread-modal").classList.add("show");
}
function confirmDeleteThread() {
    const id = document.getElementById("del-thread-id").value;
    deleteAdminThread(id, modAdmin.nim, modAdmin.namaLengkap);
    document.getElementById("del-thread-modal").classList.remove("show");
    showAdminToast("🗑️ Thread dihapus");
    allThreadsCache = getThreads();
    filterThreads();
}

// View Comments
function viewComments(threadId) {
    const threads = getThreads();
    const t = threads.find(t => t.id === threadId);
    if (!t) return;
    document.getElementById("comments-thread-title").textContent = t.title;
    document.getElementById("comments-modal").classList.add("show");
    const el = document.getElementById("comments-list-content");
    const comments = t.comments || [];
    if (!comments.length) {
        el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">chat_bubble</span><p>Belum ada komentar</p></div>`;
        return;
    }
    el.innerHTML = `<table class="a-table"><thead><tr><th>Penulis</th><th>Komentar</th><th>Waktu</th><th style="text-align:center;">Hapus</th></tr></thead><tbody>
        ${comments.map(c => `<tr>
            <td style="font-size:12px;font-weight:600;white-space:nowrap;">${esc(c.authorName)}</td>
            <td style="font-size:12px;">${esc(c.content)}</td>
            <td style="font-size:11px;color:var(--color-outline);white-space:nowrap;">${esc(c.postTime||"—")}</td>
            <td style="text-align:center;">
                <button class="icon-action ia-red" title="Hapus Komentar" onclick="handleDeleteComment('${threadId}','${c.id}',this)"><span class="material-symbols-outlined">delete</span></button>
            </td>
        </tr>`).join("")}
    </tbody></table>`;
}

function handleDeleteComment(threadId, commentId, btn) {
    if (!confirm("Hapus komentar ini?")) return;
    deleteComment(threadId, commentId, modAdmin.nim, modAdmin.namaLengkap);
    showAdminToast("🗑️ Komentar dihapus");
    viewComments(threadId); // refresh
}

// ── Reports ──────────────────────────────────────────────────
function renderReportsTable() {
    const reports = getReports();
    const tbody   = document.getElementById("reports-table-body");
    const empty   = document.getElementById("reports-empty");
    if (!tbody) return;
    if (!reports.length) {
        tbody.innerHTML = "";
        if (empty) empty.style.display = "";
        return;
    }
    if (empty) empty.style.display = "none";
    tbody.innerHTML = [...reports].reverse().map(r => `<tr>
        <td style="font-size:12px;font-weight:600;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.threadTitle||r.threadId)}</td>
        <td style="font-size:12px;">${esc(r.reportedBy)}</td>
        <td style="font-size:12px;color:#dc2626;">${esc(r.reason)}</td>
        <td><span class="pill ${r.status==='closed'?'pill-gray':'pill-red'}">${r.status==='closed'?'Ditutup':'Terbuka'}</span></td>
        <td style="font-size:11px;color:var(--color-outline);white-space:nowrap;">${fmtDt(r.timestamp)}</td>
        <td>
            <div style="display:flex;gap:4px;justify-content:center;">
                ${r.status !== "closed"
                    ? `<button class="icon-action ia-gray" title="Tutup Laporan" onclick="handleCloseReport('${r.id}')"><span class="material-symbols-outlined">done</span></button>`
                    : `<span style="font-size:11px;color:var(--color-outline);">Selesai</span>`}
                <button class="icon-action ia-red" title="Hapus Thread Terlaporkan" onclick="openDeleteThread('${r.threadId}','${esc(r.threadTitle||r.threadId)}')"><span class="material-symbols-outlined">delete</span></button>
            </div>
        </td>
    </tr>`).join("");
}

function handleCloseReport(reportId) {
    closeReport(reportId, modAdmin.nim, modAdmin.namaLengkap);
    showAdminToast("✅ Laporan ditutup", "info");
    renderReportsTable();
    updateReportsBadge();
}
