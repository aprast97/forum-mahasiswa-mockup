// Logika Halaman Statistik (Super Admin)

document.addEventListener("DOMContentLoaded", function () {
    // Hanya bisa diakses super admin
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "superadmin") {
        alert("Akses ditolak. Halaman ini hanya untuk Super Admin.");
        window.location.href = "login.html";
        return;
    }

    const adminNameEl = document.getElementById("admin-name");
    if (adminNameEl) adminNameEl.textContent = currentUser.namaLengkap;

    renderAllStats();
});

// ===== RENDER UTAMA =====

function renderAllStats() {
    const users    = getUsers();
    const threads  = getThreads();
    const reports  = getReports();
    const warnings = getWarnings();

    // 1. KPI Cards
    renderKPICards(users, threads, reports, warnings);

    // 2. Donut chart role
    const roleData = [
        { label: "Mahasiswa",   count: users.filter(u => u.role === "user").length,       color: "#059669" },
        { label: "Moderator",   count: users.filter(u => u.role === "moderator").length,  color: "#7c3aed" },
        { label: "Super Admin", count: users.filter(u => u.role === "superadmin").length, color: "#002045" },
    ];
    drawDonutChart("chart-role", roleData, "chart-role-legend");

    // 3. Bar chart UPBJJ
    const nonAdmin = users.filter(u => u.role !== "superadmin");
    const upbjjMap = {};
    nonAdmin.forEach(u => {
        const key = u.upbjj || "Lainnya";
        upbjjMap[key] = (upbjjMap[key] || 0) + 1;
    });
    const upbjjSorted = Object.entries(upbjjMap).sort((a, b) => b[1] - a[1]);
    drawBarChartCanvas("chart-upbjj", upbjjSorted, "#7c3aed");

    // 4. Status akun bars
    const totalNonAdmin = nonAdmin.length || 1;
    renderProgressBars("status-bars", [
        { label: "Aktif",        value: nonAdmin.filter(u => !u.suspended).length,  total: totalNonAdmin, color: "#059669" },
        { label: "Ditangguhkan", value: nonAdmin.filter(u => u.suspended).length,   total: totalNonAdmin, color: "#dc2626" },
        { label: "Moderator",    value: users.filter(u => u.role === "moderator").length, total: totalNonAdmin, color: "#7c3aed" },
        { label: "Mahasiswa",    value: users.filter(u => u.role === "user").length, total: totalNonAdmin, color: "#002045" },
    ]);

    // 5. Kategori thread bars
    const catMap = {};
    threads.forEach(t => {
        const key = t.category || "Umum";
        catMap[key] = (catMap[key] || 0) + 1;
    });
    const catSorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxCat = catSorted[0] ? catSorted[0][1] : 1;
    const catColors = ["#f59e0b", "#7c3aed", "#059669", "#002045", "#dc2626", "#0891b2"];
    renderProgressBars("category-bars", catSorted.map((c, i) => ({
        label: c[0], value: c[1], total: maxCat, color: catColors[i % catColors.length]
    })));

    // 6. Top threads by likes
    renderTopThreads(threads);

    // 7. Aktivitas moderasi
    renderModerationStats(reports, warnings);

    // 8. Tabel laporan terbaru
    renderReportsTable(reports);

    // 9. Tabel peringatan terbaru
    renderWarningsTable(warnings);
}

// ===== KPI CARDS =====

function renderKPICards(users, threads, reports, warnings) {
    const totalComments = threads.reduce((sum, t) => sum + (t.commentsCount || (t.comments ? t.comments.length : 0)), 0);
    const totalLikes    = threads.reduce((sum, t) => sum + (t.likes || 0), 0);

    setEl("kpi-users",    users.length);
    setEl("kpi-threads",  threads.length);
    setEl("kpi-comments", totalComments);
    setEl("kpi-reports",  reports.length);
    setEl("kpi-warnings", warnings.length);
    setEl("kpi-likes",    totalLikes);
}

// ===== TOP THREADS =====

function renderTopThreads(threads) {
    const el = document.getElementById("top-threads-list");
    if (!el) return;

    if (!threads || threads.length === 0) {
        el.innerHTML = `<div class="stats-empty">Belum ada thread.</div>`;
        return;
    }

    const sorted = [...threads].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5);

    el.innerHTML = sorted.map((t, i) => {
        const rankClass = i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : "";
        const comments = t.commentsCount || (t.comments ? t.comments.length : 0);
        return `
            <div class="top-thread-item">
                <div class="top-thread-rank ${rankClass}">#${i + 1}</div>
                <div class="top-thread-body">
                    <div class="top-thread-title">${escStat(t.title || "—")}</div>
                    <div class="top-thread-meta">
                        <span>oleh ${escStat(t.authorName || "—")}</span>
                        <span>${escStat(t.category || "Umum")}</span>
                        <span>${comments} komentar</span>
                    </div>
                </div>
                <div class="top-thread-likes">
                    <span class="material-symbols-outlined" style="font-size:16px; font-variation-settings:'FILL' 1; color:#002045;">thumb_up</span>
                    ${t.likes || 0}
                </div>
            </div>
        `;
    }).join("");
}

// ===== AKTIVITAS MODERASI =====

function renderModerationStats(reports, warnings) {
    const total = Math.max(reports.length + warnings.length, 1);
    renderProgressBars("moderation-stats", [
        { label: "Laporan Diterima",  value: reports.length,  total, color: "#dc2626" },
        { label: "Peringatan Terbit", value: warnings.length, total, color: "#f59e0b" },
    ]);
}

// ===== TABEL LAPORAN =====

function renderReportsTable(reports) {
    const badge = document.getElementById("reports-count-badge");
    if (badge) badge.textContent = `${reports.length} laporan`;

    const wrap = document.getElementById("reports-table-wrap");
    if (!wrap) return;

    if (!reports || reports.length === 0) {
        wrap.innerHTML = `<div class="stats-empty">Belum ada laporan masuk.</div>`;
        return;
    }

    const recent = [...reports].reverse().slice(0, 15);
    wrap.innerHTML = `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Judul Thread</th>
                    <th>Dilaporkan Oleh</th>
                    <th>Alasan</th>
                    <th>Waktu</th>
                </tr>
            </thead>
            <tbody>
                ${recent.map((r, i) => `
                    <tr>
                        <td style="color:var(--color-outline); font-weight:700;">${i + 1}</td>
                        <td style="font-weight:600; max-width:220px;">${escStat(r.threadTitle || r.threadId)}</td>
                        <td>
                            <span style="display:inline-flex; align-items:center; gap:6px;">
                                <span style="width:26px; height:26px; border-radius:50%; background:#002045; color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0;">
                                    ${(r.reportedBy || "?").charAt(0).toUpperCase()}
                                </span>
                                ${escStat(r.reportedBy)}
                            </span>
                        </td>
                        <td><span style="color:#dc2626; font-weight:500;">${escStat(r.reason)}</span></td>
                        <td style="color:var(--color-outline); white-space:nowrap; font-size:12px;">${fmtDate(r.timestamp)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

// ===== TABEL PERINGATAN =====

function renderWarningsTable(warnings) {
    const badge = document.getElementById("warnings-count-badge");
    if (badge) badge.textContent = `${warnings.length} peringatan`;

    const wrap = document.getElementById("warnings-table-wrap");
    if (!wrap) return;

    if (!warnings || warnings.length === 0) {
        wrap.innerHTML = `<div class="stats-empty">Belum ada peringatan diterbitkan.</div>`;
        return;
    }

    const recent = [...warnings].reverse().slice(0, 15);
    wrap.innerHTML = `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Judul Thread</th>
                    <th>Ditujukan Ke</th>
                    <th>Diterbitkan Oleh</th>
                    <th>Alasan</th>
                    <th>Waktu</th>
                </tr>
            </thead>
            <tbody>
                ${recent.map((w, i) => `
                    <tr>
                        <td style="color:var(--color-outline); font-weight:700;">${i + 1}</td>
                        <td style="font-weight:600; max-width:180px;">${escStat(w.threadTitle || w.threadId)}</td>
                        <td style="font-weight:600; color:#7c3aed;">${escStat(w.targetUser)}</td>
                        <td>${escStat(w.issuedBy)}</td>
                        <td><span style="color:#f59e0b; font-weight:500;">${escStat(w.reason)}</span></td>
                        <td style="color:var(--color-outline); white-space:nowrap; font-size:12px;">${fmtDate(w.timestamp)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

// ===== CHART: DONUT =====

function drawDonutChart(canvasId, data, legendId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) / 2 - 8;
    const innerR = R * 0.58;

    ctx.clearRect(0, 0, w, h);

    const total = data.reduce((s, d) => s + d.count, 0) || 1;
    let startAngle = -Math.PI / 2;
    const gap = 0.04;

    data.forEach(d => {
        const slice = (d.count / total) * (2 * Math.PI - data.length * gap);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, startAngle, startAngle + slice);
        ctx.closePath();
        ctx.fillStyle = d.color;
        ctx.fill();
        startAngle += slice + gap;
    });

    // Donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Center text
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#111c2c";
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillText(total, cx, cy - 7);
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "#74777f";
    ctx.fillText("pengguna", cx, cy + 12);

    // Legend
    const legendEl = document.getElementById(legendId);
    if (legendEl) {
        legendEl.innerHTML = data.map(d => `
            <div class="legend-item">
                <div class="legend-dot" style="background:${d.color};"></div>
                <span class="legend-label">${d.label}</span>
                <span class="legend-count" style="color:${d.color};">${d.count}</span>
            </div>
        `).join("");
    }
}

// ===== CHART: BAR (Canvas) =====

function drawBarChartCanvas(canvasId, entries, barColor) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const parent = canvas.parentElement;
    const parentW = parent ? (parent.clientWidth || 420) : 420;
    canvas.width  = parentW;

    if (!entries.length) { canvas.height = 40; return; }

    const barH   = 24;
    const gap    = 14;
    const labelW = 110;
    const padTop = 8, padBot = 8, padRight = 50;
    const chartW = parentW - labelW - 12 - padRight;

    canvas.height = entries.length * (barH + gap) + padTop + padBot;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const maxVal = Math.max(...entries.map(e => e[1]));

    entries.forEach(([label, val], i) => {
        const y    = padTop + i * (barH + gap);
        const barW = maxVal ? (val / maxVal) * chartW : 0;
        const x0   = labelW + 12;

        // Label
        ctx.fillStyle = "#43474e";
        ctx.font = "12px Inter, sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        const short = label.length > 14 ? label.slice(0, 13) + "…" : label;
        ctx.fillText(short, labelW + 4, y + barH / 2);

        // Track
        ctx.fillStyle = "#e7eeff";
        roundFill(ctx, x0, y, chartW, barH, 5);

        // Bar
        if (barW > 4) {
            const grad = ctx.createLinearGradient(x0, 0, x0 + barW, 0);
            grad.addColorStop(0, barColor);
            grad.addColorStop(1, barColor + "99");
            ctx.fillStyle = grad;
            roundFill(ctx, x0, y, barW, barH, 5);
        }

        // Value
        ctx.fillStyle = "#002045";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(val, x0 + barW + 6, y + barH / 2);
    });
}

function roundFill(ctx, x, y, w, h, r) {
    if (w <= 0) return;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
}

// ===== PROGRESS BARS (HTML) =====

function renderProgressBars(containerId, items) {
    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = items.map(item => {
        const pct = item.total ? Math.round((item.value / item.total) * 100) : 0;
        return `
            <div class="bar-row">
                <div class="bar-meta">
                    <span class="bar-label">${item.label}</span>
                    <span class="bar-value">${item.value} <span style="font-weight:400; color:var(--color-outline);">(${pct}%)</span></span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" style="background:${item.color};" data-pct="${pct}"></div>
                </div>
            </div>
        `;
    }).join("");

    // Animate setelah repaint
    requestAnimationFrame(() => {
        el.querySelectorAll(".bar-fill").forEach(bar => {
            bar.style.width = bar.dataset.pct + "%";
        });
    });
}

// ===== HELPERS =====

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function escStat(str) {
    if (!str) return "—";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function fmtDate(iso) {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
             + " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
}
