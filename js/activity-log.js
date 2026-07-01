// js/activity-log.js

let logAdmin = null;
let allLogsCache = [];

document.addEventListener("DOMContentLoaded", function () {
    logAdmin = initAdminPage();
    if (!logAdmin) return;
    allLogsCache = getActivityLog();
    filterLog();
});

function filterLog() {
    const q      = (document.getElementById("log-search")?.value || "").toLowerCase();
    const action = document.getElementById("log-filter-action")?.value || "all";
    const type   = document.getElementById("log-filter-type")?.value || "all";

    const filtered = allLogsCache.filter(l => {
        const matchQ = !q
            || (l.actorName||"").toLowerCase().includes(q)
            || (l.targetName||"").toLowerCase().includes(q)
            || (l.actorNim||"").toLowerCase().includes(q);
        const matchA = action === "all" || l.action === action;
        const matchT = type   === "all" || l.targetType === type;
        return matchQ && matchA && matchT;
    });

    renderLogTable(filtered);
}

function renderLogTable(logs) {
    const tbody = document.getElementById("log-table-body");
    const empty = document.getElementById("log-empty");
    const count = document.getElementById("log-count");
    if (!tbody) return;

    if (count) count.textContent = logs.length + " entri";

    if (!logs.length) {
        tbody.innerHTML = "";
        if (empty) empty.style.display = "";
        return;
    }
    if (empty) empty.style.display = "none";

    tbody.innerHTML = logs.map(l => {
        const info = ACTION_LABELS[l.action] || { label: l.action, icon: "info", color: "#6b7280" };
        const typeColors = { user: "pill-blue", thread: "pill-purple", comment: "pill-yellow", report: "pill-red", category: "pill-green" };
        const typePill = `<span class="pill ${typeColors[l.targetType]||'pill-gray'}" style="font-size:10px;">${l.targetType}</span>`;

        return `<tr>
            <td style="font-size:11px;color:var(--color-outline);white-space:nowrap;">
                <div>${fmtDate(l.timestamp)}</div>
                <div style="font-size:10px;">${new Date(l.timestamp).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}</div>
            </td>
            <td>
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:28px;height:28px;border-radius:50%;background:${info.color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <span class="material-symbols-outlined" style="font-size:14px;color:${info.color};font-variation-settings:'FILL' 1;">${info.icon}</span>
                    </div>
                    <span style="font-size:12px;font-weight:600;color:${info.color};white-space:nowrap;">${info.label}</span>
                </div>
            </td>
            <td>
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:24px;height:24px;border-radius:50%;background:var(--color-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;">${(l.actorName||"?").charAt(0).toUpperCase()}</div>
                    <div>
                        <div style="font-size:12px;font-weight:600;color:var(--color-on-surface);">${esc(l.actorName)}</div>
                        <div style="font-size:10px;color:var(--color-outline);font-family:monospace;">${esc(l.actorNim)}</div>
                    </div>
                </div>
            </td>
            <td>
                <div style="display:flex;align-items:center;gap:6px;">
                    ${typePill}
                    <span style="font-size:12px;color:var(--color-on-surface);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(l.targetName)}</span>
                </div>
            </td>
            <td style="font-size:12px;color:var(--color-on-surface-variant);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(l.detail||"—")}</td>
        </tr>`;
    }).join("");
}

function clearLog() {
    if (!confirm("Hapus semua log aktivitas? Tindakan ini tidak dapat dibatalkan.")) return;
    localStorage.setItem("scholarforum_activity_log", JSON.stringify([]));
    allLogsCache = [];
    filterLog();
    showAdminToast("🗑️ Log aktivitas dihapus", "info");
}
