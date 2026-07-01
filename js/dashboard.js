// js/dashboard.js

document.addEventListener("DOMContentLoaded", function () {
    const admin = initAdminPage();
    if (!admin) return;
    renderDashboard();
});

function renderDashboard() {
    const users    = getUsers();
    const threads  = getThreads();
    const reports  = getReports();
    const warnings = getWarnings();
    const logs     = getActivityLog();

    const visibleUsers = users.filter(u => !u.banned);
    const totalComments = threads.reduce((s, t) => s + (t.commentsCount || (t.comments ? t.comments.length : 0)), 0);

    // Aktif hari ini: lastLogin dalam 24 jam
    const dayAgo = Date.now() - 86400000;
    const activeToday = users.filter(u => u.lastLogin && new Date(u.lastLogin).getTime() > dayAgo).length;

    // Thread menunggu moderasi = open reports
    const pendingReports = reports.filter(r => r.status !== "closed").length;

    // Suspended
    const suspended = visibleUsers.filter(u => u.suspended).length;

    // Set KPIs
    setEl("kpi-total-users",  visibleUsers.length);
    setEl("kpi-active-today", activeToday);
    setEl("kpi-threads",      threads.length);
    setEl("kpi-comments",     totalComments);
    setEl("kpi-reports",      reports.length);
    setEl("kpi-pending-mod",  pendingReports);
    setEl("kpi-suspended",    suspended);
    setEl("kpi-warnings",     warnings.length);

    // Laporan terbaru
    renderDashReports(reports);

    // Thread terbaru
    renderDashThreads(threads);

    // Aktivitas terbaru
    renderDashActivity(logs);
}

function renderDashReports(reports) {
    const el = document.getElementById("dash-reports");
    if (!el) return;
    const recent = [...reports].reverse().slice(0, 5);
    if (!recent.length) {
        el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">flag</span><p>Belum ada laporan</p></div>`;
        return;
    }
    el.innerHTML = recent.map(r => `
        <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--color-outline-variant);align-items:flex-start;">
            <span class="material-symbols-outlined" style="color:#dc2626;font-size:18px;margin-top:2px;font-variation-settings:'FILL' 1;">flag</span>
            <div style="flex:1;min-width:0;">
                <div style="font-size:12px;font-weight:600;color:var(--color-on-surface);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.threadTitle || r.threadId)}</div>
                <div style="font-size:11px;color:var(--color-on-surface-variant);">${esc(r.reportedBy)} · <span style="color:#dc2626;">${esc(r.reason)}</span></div>
            </div>
            <span class="pill ${r.status === 'closed' ? 'pill-gray' : 'pill-red'}" style="font-size:10px;">${r.status === 'closed' ? 'Tutup' : 'Baru'}</span>
        </div>
    `).join("");
}

function renderDashThreads(threads) {
    const el = document.getElementById("dash-threads");
    if (!el) return;
    const recent = [...threads].slice(0, 5);
    if (!recent.length) {
        el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">forum</span><p>Belum ada thread</p></div>`;
        return;
    }
    el.innerHTML = recent.map(t => {
        const badges = [];
        if (t.pinned)   badges.push(`<span class="pill pill-teal" style="font-size:10px;">📌 Pin</span>`);
        if (t.locked)   badges.push(`<span class="pill pill-yellow" style="font-size:10px;">🔒 Lock</span>`);
        if (t.archived) badges.push(`<span class="pill pill-gray" style="font-size:10px;">📦 Arsip</span>`);
        return `
            <div style="padding:10px 0;border-bottom:1px solid var(--color-outline-variant);">
                <div style="font-size:12px;font-weight:600;color:var(--color-on-surface);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(t.title)}</div>
                <div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap;">
                    <span style="font-size:11px;color:var(--color-on-surface-variant);">${esc(t.authorName)}</span>
                    <span class="pill pill-purple" style="font-size:10px;">${esc(t.category)}</span>
                    ${badges.join("")}
                </div>
            </div>
        `;
    }).join("");
}

function renderDashActivity(logs) {
    const el = document.getElementById("dash-activity");
    if (!el) return;
    const recent = logs.slice(0, 6);
    if (!recent.length) {
        el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">history</span><p>Belum ada aktivitas</p></div>`;
        return;
    }
    el.innerHTML = recent.map(log => {
        const info = ACTION_LABELS[log.action] || { label: log.action, icon: "info", color: "#6b7280" };
        return `
            <div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--color-outline-variant);align-items:flex-start;">
                <span class="material-symbols-outlined" style="font-size:16px;color:${info.color};margin-top:2px;font-variation-settings:'FILL' 1;">${info.icon}</span>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:12px;font-weight:600;color:var(--color-on-surface);">${info.label}</div>
                    <div style="font-size:11px;color:var(--color-on-surface-variant);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                        ${esc(log.actorName)} → ${esc(log.targetName)}
                    </div>
                    <div style="font-size:10px;color:var(--color-outline);">${timeAgo(log.timestamp)}</div>
                </div>
            </div>
        `;
    }).join("");
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
