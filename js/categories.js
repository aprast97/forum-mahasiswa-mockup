// js/categories.js

let catAdmin = null;

document.addEventListener("DOMContentLoaded", function () {
    catAdmin = initAdminPage();
    if (!catAdmin) return;
    renderCategories();
});

function renderCategories() {
    const cats = getCategories();
    const el   = document.getElementById("categories-list");
    const cntEl = document.getElementById("cat-count");
    if (cntEl) cntEl.textContent = cats.length + " kategori";
    if (!el) return;
    const threads = getThreads();

    el.innerHTML = cats.map((cat, idx) => {
        const threadCount = threads.filter(t => t.category === cat.name).length;
        return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--color-outline-variant);" id="cat-row-${cat.id}">
            <!-- Reorder buttons -->
            <div style="display:flex;flex-direction:column;gap:2px;">
                <button onclick="moveCategory(${idx},-1)" ${idx===0?'disabled':''} style="background:none;border:none;cursor:pointer;color:var(--color-outline);padding:2px;line-height:1;${idx===0?'opacity:0.3;':''}" title="Naikkan">
                    <span class="material-symbols-outlined" style="font-size:16px;">expand_less</span>
                </button>
                <button onclick="moveCategory(${idx},1)" ${idx===cats.length-1?'disabled':''} style="background:none;border:none;cursor:pointer;color:var(--color-outline);padding:2px;line-height:1;${idx===cats.length-1?'opacity:0.3;':''}" title="Turunkan">
                    <span class="material-symbols-outlined" style="font-size:16px;">expand_more</span>
                </button>
            </div>
            <!-- Icon -->
            <div style="width:40px;height:40px;border-radius:10px;background:${cat.color}18;display:flex;align-items:center;justify-content:center;border:2px solid ${cat.color}40;flex-shrink:0;">
                <span class="material-symbols-outlined" style="color:${cat.color};font-size:20px;font-variation-settings:'FILL' 1;">${cat.icon}</span>
            </div>
            <!-- Info -->
            <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:600;color:var(--color-on-surface);">${esc(cat.name)}</div>
                <div style="font-size:11px;color:var(--color-on-surface-variant);">${threadCount} thread</div>
            </div>
            <!-- Order badge -->
            <span class="pill pill-gray" style="font-size:10px;">#${idx+1}</span>
            <!-- Delete -->
            <button class="icon-action ia-red" title="Hapus Kategori" onclick="openDeleteCat('${cat.id}','${esc(cat.name)}')">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </div>
        `;
    }).join("");
}

// ── Reorder ──────────────────────────────────────────────────
function moveCategory(idx, dir) {
    const cats = getCategories();
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= cats.length) return;
    [cats[idx], cats[newIdx]] = [cats[newIdx], cats[idx]];
    // Update order field
    cats.forEach((c, i) => { c.order = i + 1; });
    saveCategories(cats);
    logActivity("reorder_category", catAdmin.nim, catAdmin.namaLengkap, "category", cats[newIdx].id, cats[newIdx].name, "");
    renderCategories();
}

// ── Add Category ─────────────────────────────────────────────
function addCategory() {
    const name  = document.getElementById("new-cat-name").value.trim();
    const icon  = document.getElementById("new-cat-icon").value.trim() || "category";
    const color = document.getElementById("new-cat-color").value;
    const alertEl = document.getElementById("cat-add-alert");

    if (!name) {
        alertEl.style.display = "";
        alertEl.style.background = "#fee2e2"; alertEl.style.color = "#991b1b";
        alertEl.textContent = "Nama kategori wajib diisi!";
        return;
    }
    const cats = getCategories();
    if (cats.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        alertEl.style.display = "";
        alertEl.style.background = "#fee2e2"; alertEl.style.color = "#991b1b";
        alertEl.textContent = "Kategori dengan nama itu sudah ada!";
        return;
    }
    const newCat = {
        id:    "cat_" + Date.now(),
        name,
        icon,
        color,
        order: cats.length + 1
    };
    cats.push(newCat);
    saveCategories(cats);
    logActivity("add_category", catAdmin.nim, catAdmin.namaLengkap, "category", newCat.id, name, "");
    alertEl.style.display = "";
    alertEl.style.background = "#d1fae5"; alertEl.style.color = "#065f46";
    alertEl.textContent = "✅ Kategori '" + name + "' berhasil ditambahkan!";
    document.getElementById("new-cat-name").value = "";
    document.getElementById("new-cat-icon").value = "";
    renderCategories();
}

// ── Delete Category ──────────────────────────────────────────
function openDeleteCat(id, name) {
    document.getElementById("del-cat-id").value = id;
    document.getElementById("del-cat-name").textContent = name;
    document.getElementById("del-cat-modal").classList.add("show");
}
function confirmDeleteCategory() {
    const id   = document.getElementById("del-cat-id").value;
    const cats = getCategories();
    const cat  = cats.find(c => c.id === id);
    if (!cat) return;
    const threads = getThreads();
    const inUse = threads.filter(t => t.category === cat.name).length;
    if (inUse > 0) {
        document.getElementById("del-cat-modal").classList.remove("show");
        showAdminToast("⚠️ Tidak bisa hapus: masih ada " + inUse + " thread di kategori ini", "warning");
        return;
    }
    const filtered = cats.filter(c => c.id !== id);
    filtered.forEach((c, i) => { c.order = i + 1; });
    saveCategories(filtered);
    logActivity("delete_category", catAdmin.nim, catAdmin.namaLengkap, "category", id, cat.name, "");
    document.getElementById("del-cat-modal").classList.remove("show");
    showAdminToast("🗑️ Kategori dihapus");
    renderCategories();
}

// Icon preview
function previewIcon() {
    const val = document.getElementById("new-cat-icon").value.trim();
    const prev = document.getElementById("icon-preview");
    if (prev) prev.textContent = val || "category";
}
