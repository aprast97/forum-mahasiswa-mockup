// Database Dummy dan Helper Autentikasi untuk Forum Mahasiswa UT

// Data Akun Awal (10 Akun Mahasiswa + 1 Akun Moderator + 1 Akun Superadmin)
const initialUsers = [
    {
        namaLengkap: "Super Admin",
        nim: "admin123",
        password: "adminpass",
        upbjj: "UT Jakarta",
        noTelepon: "08123456000",
        role: "superadmin"
    },
    {
        namaLengkap: "Moderator Forum",
        nim: "mod001",
        password: "modpass",
        upbjj: "UT Jakarta",
        noTelepon: "08123456001",
        role: "moderator",
        suspended: false
    },
    {
        namaLengkap: "Budi Santoso",
        nim: "041234561",
        password: "password123",
        upbjj: "UT Surabaya",
        noTelepon: "08123456111",
        role: "user",
        suspended: false
    },
    {
        namaLengkap: "Siti Aminah",
        nim: "041234562",
        password: "password123",
        upbjj: "UT Jakarta",
        noTelepon: "08123456222",
        role: "user"
    },
    {
        namaLengkap: "Ahmad Fauzi",
        nim: "041234563",
        password: "password123",
        upbjj: "UT Bandung",
        noTelepon: "08123456333",
        role: "user"
    },
    {
        namaLengkap: "Rara Anindya",
        nim: "041234564",
        password: "password123",
        upbjj: "UT Makassar",
        noTelepon: "08123456444",
        role: "user"
    },
    {
        namaLengkap: "Dedi Wijaya",
        nim: "041234565",
        password: "password123",
        upbjj: "UT Medan",
        noTelepon: "08123456555",
        role: "user"
    },
    {
        namaLengkap: "Fitriani Lestari",
        nim: "041234566",
        password: "password123",
        upbjj: "UT Surabaya",
        noTelepon: "08123456666",
        role: "user"
    },
    {
        namaLengkap: "Hendra Kusuma",
        nim: "041234567",
        password: "password123",
        upbjj: "UT Jakarta",
        noTelepon: "08123456777",
        role: "user"
    },
    {
        namaLengkap: "Giska Putri",
        nim: "041234568",
        password: "password123",
        upbjj: "UT Bandung",
        noTelepon: "08123456888",
        role: "user"
    },
    {
        namaLengkap: "Joko Susilo",
        nim: "041234569",
        password: "password123",
        upbjj: "UT Makassar",
        noTelepon: "08123456999",
        role: "user"
    },
    {
        namaLengkap: "Laila Sari",
        nim: "041234570",
        password: "password123",
        upbjj: "UT Medan",
        noTelepon: "08123457000",
        role: "user"
    }
];

// Kunci penyimpanan LocalStorage
const USERS_KEY = "scholarforum_users";
const SESSION_KEY = "scholarforum_session";
const THREADS_KEY = "scholarforum_threads";
const REPORTS_KEY = "scholarforum_reports";
const WARNINGS_KEY     = "scholarforum_warnings";
const ACTIVITY_LOG_KEY = "scholarforum_activity_log";
const CATEGORIES_KEY   = "scholarforum_categories";

const defaultCategories = [
    { id: "cat_1", name: "Akademik",          icon: "school",       color: "#002045", order: 1 },
    { id: "cat_2", name: "Tugas",              icon: "assignment",   color: "#7c3aed", order: 2 },
    { id: "cat_3", name: "Organisasi",         icon: "groups",       color: "#059669", order: 3 },
    { id: "cat_4", name: "Magang",             icon: "work",         color: "#0891b2", order: 4 },
    { id: "cat_5", name: "Skripsi",            icon: "description",  color: "#dc2626", order: 5 },
    { id: "cat_6", name: "Informasi Kampus",   icon: "campaign",     color: "#d97706", order: 6 },
    { id: "cat_7", name: "Jual Beli",          icon: "storefront",   color: "#7c3aed", order: 7 },
    { id: "cat_8", name: "Off Topic",          icon: "chat",         color: "#6b7280", order: 8 },
];

const initialThreads = [
    {
        id: "thread_1",
        authorName: "BudiSantoso_99",
        authorSub: "Universitas Brawijaya • Teknik Informatika",
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCSEtwVKPYRyPHQ98nExrQBsJDgTzPNNMqJLXGXjgzWenu5FtwpK0lsgyosIJqSYBUT_w1ftRCyvkvbR1xW80WGfJ_Y-_RJrVoocJKPh8uPSm6ukV7cNiLT6WBwMbsB1eIITbuqebGA2KkxEuYZ6ZTOVVphLibJgq3hOW_NOoQiVE3mg0GJF6lUiMaA7vlgiOMVR82ls2QsF1-nAQlTHNyDuR5NHbaPAsXSzIoMp4ghB4Y75pBpfcubdssYQpMTMOpFKuAAD2kXLTdU",
        title: "Review Jujur Mata Kuliah Machine Learning Semester 5",
        content: "Halo semua, mau share pengalaman ngambil matkul ML semester ini. Jujur berat banget di awal karena butuh math foundation yang kuat (linear algebra & calc). Buat yang mau ngambil, mending persiapin...",
        tags: ["MachineLearning", "ReviewMatkul"],
        category: "Teknologi & Informasi",
        likes: 45,
        commentsCount: 12,
        postTime: "2 jam yang lalu"
    }
];

// Inisialisasi Database jika belum ada
function initDatabase() {
    if (!localStorage.getItem(USERS_KEY)) {
        localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
    } else {
        // Migrasi: hapus field 'status' dari data lama jika masih ada
        // Migrasi: tambahkan field 'suspended' jika belum ada
        const existingUsers = JSON.parse(localStorage.getItem(USERS_KEY));
        let migrated = false;
        existingUsers.forEach(u => {
            if (u.hasOwnProperty("status")) { delete u.status; migrated = true; }
            if (!u.hasOwnProperty("suspended")) { u.suspended = false; migrated = true; }
        });
        if (migrated) localStorage.setItem(USERS_KEY, JSON.stringify(existingUsers));
    }
    if (!localStorage.getItem(THREADS_KEY)) {
        localStorage.setItem(THREADS_KEY, JSON.stringify(initialThreads));
    }
    if (!localStorage.getItem(REPORTS_KEY)) {
        localStorage.setItem(REPORTS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(WARNINGS_KEY)) {
        localStorage.setItem(WARNINGS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(ACTIVITY_LOG_KEY)) {
        localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(CATEGORIES_KEY)) {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
    }
    // Migrasi: tambah field baru pada users (banned, verified, lastLogin)
    try {
        const _users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
        let _uMig = false;
        _users.forEach(u => {
            if (!u.hasOwnProperty("banned"))    { u.banned    = false; _uMig = true; }
            if (!u.hasOwnProperty("verified"))  { u.verified  = false; _uMig = true; }
            if (!u.hasOwnProperty("lastLogin")) { u.lastLogin = null;  _uMig = true; }
        });
        if (_uMig) localStorage.setItem(USERS_KEY, JSON.stringify(_users));
        // Migrasi: tambah field baru pada threads (locked, pinned, archived)
        const _threads = JSON.parse(localStorage.getItem(THREADS_KEY) || "[]");
        let _tMig = false;
        _threads.forEach(t => {
            if (!t.hasOwnProperty("locked"))   { t.locked   = false; _tMig = true; }
            if (!t.hasOwnProperty("pinned"))   { t.pinned   = false; _tMig = true; }
            if (!t.hasOwnProperty("archived")) { t.archived = false; _tMig = true; }
        });
        if (_tMig) localStorage.setItem(THREADS_KEY, JSON.stringify(_threads));
        // Migrasi: tambah status field pada reports
        const _reports = JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]");
        let _rMig = false;
        _reports.forEach(r => {
            if (!r.hasOwnProperty("status")) { r.status = "open"; _rMig = true; }
        });
        if (_rMig) localStorage.setItem(REPORTS_KEY, JSON.stringify(_reports));
    } catch(e) { /* silent */ }
}

// Mendapatkan semua pengguna
function getUsers() {
    initDatabase();
    return JSON.parse(localStorage.getItem(USERS_KEY));
}

// Menyimpan daftar pengguna
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Mendapatkan semua utas (threads)
function getThreads() {
    initDatabase();
    return JSON.parse(localStorage.getItem(THREADS_KEY));
}

// Menyimpan daftar utas
function saveThreads(threads) {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
}

// Menambahkan utas baru
function addThread(threadData) {
    const threads = getThreads();
    threads.unshift(threadData);
    saveThreads(threads);
}

// Mencari pengguna berdasarkan NIM
function findUserByNim(nim) {
    const users = getUsers();
    return users.find(u => u.nim === nim);
}

// Mendaftarkan pengguna baru
function registerUser(userData) {
    const users = getUsers();
    
    // Periksa apakah NIM sudah terdaftar
    if (findUserByNim(userData.nim)) {
        return { success: false, message: "NIM sudah terdaftar!" };
    }
    
    // Tambahkan user baru ke database
    const newUser = {
        namaLengkap: userData.namaLengkap,
        nim: userData.nim,
        password: userData.password,
        upbjj: userData.upbjj || "lainnya",
        programStudi: userData.programStudi || "",
        noTelepon: userData.noTelepon || "",
        avatarUrl: userData.avatarUrl || "",
        role: "user" // Semua registrasi baru adalah user biasa
    };
    
    users.push(newUser);
    saveUsers(users);
    
    return { success: true, message: "Registrasi berhasil! Silakan login." };
}

// Fungsi Login
function loginUser(nim, password) {
    const users = getUsers();
    const user  = users.find(u => u.nim === nim);
    
    if (!user)                  return { success: false, message: "NIM tidak ditemukan!" };
    if (user.password !== password) return { success: false, message: "Password salah!" };
    if (user.banned === true)   return { success: false, message: "Akun Anda telah diblokir permanen. Hubungi administrator forum." };
    if (user.suspended === true) return { success: false, message: "Akun Anda sedang ditangguhkan oleh moderator." };
    
    // Catat lastLogin
    user.lastLogin = new Date().toISOString();
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Simpan sesi (tanpa password)
    const sessionData = {
        namaLengkap: user.namaLengkap,
        nim: user.nim,
        upbjj: user.upbjj,
        programStudi: user.programStudi || "",
        noTelepon: user.noTelepon,
        avatarUrl: user.avatarUrl || "",
        role: user.role
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    return { success: true, message: "Login berhasil!" };
}

// Mendapatkan data user yang sedang login
function getCurrentUser() {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

// Fungsi Logout
function logoutUser() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
}

// ===== MANAJEMEN USER (Super Admin) =====

// Menangguhkan akun user
function suspendUser(nim) {
    const users = getUsers();
    const user = users.find(u => u.nim === nim);
    if (user && user.role !== "superadmin") {
        user.suspended = true;
        saveUsers(users);
        return true;
    }
    return false;
}

// Mengaktifkan kembali akun user yang ditangguhkan
function unsuspendUser(nim) {
    const users = getUsers();
    const user = users.find(u => u.nim === nim);
    if (user) {
        user.suspended = false;
        saveUsers(users);
        return true;
    }
    return false;
}

// Mengubah role user
function changeUserRole(nim, newRole) {
    const users = getUsers();
    const user = users.find(u => u.nim === nim);
    if (user && user.role !== "superadmin" && ["user", "moderator"].includes(newRole)) {
        user.role = newRole;
        saveUsers(users);
        return true;
    }
    return false;
}

// Menambahkan moderator baru (oleh Super Admin)
function addNewModerator(userData) {
    const users = getUsers();
    if (users.find(u => u.nim === userData.nim)) {
        return { success: false, message: "NIM sudah terdaftar!" };
    }
    users.push({
        namaLengkap: userData.namaLengkap,
        nim: userData.nim,
        password: userData.password,
        upbjj: userData.upbjj || "UT Jakarta",
        noTelepon: userData.noTelepon || "",
        role: "moderator",
        suspended: false
    });
    saveUsers(users);
    return { success: true, message: "Moderator baru berhasil ditambahkan!" };
}

// ===== LAPORAN (REPORTS) =====
function getReports() {
    const data = localStorage.getItem(REPORTS_KEY);
    return data ? JSON.parse(data) : [];
}

function saveReport(reportData) {
    const reports = getReports();
    reports.push({
        id: "report_" + Date.now(),
        threadId: reportData.threadId,
        threadTitle: reportData.threadTitle,
        reportedBy: reportData.reportedBy,
        reason: reportData.reason,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

// ===== PERINGATAN (WARNINGS) =====
function getWarnings() {
    const data = localStorage.getItem(WARNINGS_KEY);
    return data ? JSON.parse(data) : [];
}

function saveWarning(warningData) {
    const warnings = getWarnings();
    warnings.push({
        id: "warn_" + Date.now(),
        threadId: warningData.threadId,
        threadTitle: warningData.threadTitle,
        targetUser: warningData.targetUser,
        issuedBy: warningData.issuedBy,
        reason: warningData.reason,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(WARNINGS_KEY, JSON.stringify(warnings));
}

// ===== KATEGORI =====
function getCategories() {
    const data = localStorage.getItem(CATEGORIES_KEY);
    return data ? JSON.parse(data) : defaultCategories;
}
function saveCategories(cats) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
}

// ===== LOG AKTIVITAS =====
function getActivityLog() {
    const data = localStorage.getItem(ACTIVITY_LOG_KEY);
    return data ? JSON.parse(data) : [];
}
function logActivity(action, actorNim, actorName, targetType, targetId, targetName, detail = "") {
    const logs = getActivityLog();
    logs.unshift({
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        timestamp: new Date().toISOString(),
        action, actorNim, actorName, targetType, targetId, targetName, detail
    });
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(logs.slice(0, 500)));
}

// ===== MANAJEMEN USER LANJUTAN =====
function banUser(nim, reason, actorNim, actorName) {
    const users = getUsers();
    const user  = users.find(u => u.nim === nim);
    if (!user || user.role === "superadmin") return { success: false };
    user.banned       = true;
    user.bannedReason = reason || "Pelanggaran aturan forum";
    user.bannedAt     = new Date().toISOString();
    user.suspended    = false;
    saveUsers(users);
    logActivity("ban_user", actorNim, actorName, "user", nim, user.namaLengkap, reason);
    return { success: true };
}
function unbanUser(nim, actorNim, actorName) {
    const users = getUsers();
    const user  = users.find(u => u.nim === nim);
    if (!user) return { success: false };
    user.banned = false; user.bannedReason = ""; user.bannedAt = null;
    saveUsers(users);
    logActivity("unban_user", actorNim, actorName, "user", nim, user.namaLengkap, "");
    return { success: true };
}
function deleteUser(nim, actorNim, actorName) {
    const users = getUsers();
    const idx   = users.findIndex(u => u.nim === nim);
    if (idx === -1 || users[idx].role === "superadmin") return { success: false };
    const name = users[idx].namaLengkap;
    users.splice(idx, 1);
    saveUsers(users);
    logActivity("delete_user", actorNim, actorName, "user", nim, name, "");
    return { success: true };
}
function resetUserPassword(nim, actorNim, actorName) {
    const users = getUsers();
    const user  = users.find(u => u.nim === nim);
    if (!user || user.role === "superadmin") return { success: false };
    user.password = "reset123";
    saveUsers(users);
    logActivity("reset_password", actorNim, actorName, "user", nim, user.namaLengkap, "");
    return { success: true };
}
function verifyUser(nim, actorNim, actorName) {
    const users = getUsers();
    const user  = users.find(u => u.nim === nim);
    if (!user) return { success: false };
    user.verified   = !user.verified;
    user.verifiedAt = user.verified ? new Date().toISOString() : null;
    saveUsers(users);
    const action = user.verified ? "verify_user" : "unverify_user";
    logActivity(action, actorNim, actorName, "user", nim, user.namaLengkap, "");
    return { success: true, verified: user.verified };
}

// ===== MODERASI THREAD =====
function lockThread(id, lock, actorNim, actorName) {
    const threads = getThreads();
    const t = threads.find(t => t.id === id);
    if (!t) return false;
    t.locked   = lock;
    t.lockedAt = lock ? new Date().toISOString() : null;
    saveThreads(threads);
    logActivity(lock ? "lock_thread" : "unlock_thread", actorNim, actorName, "thread", id, t.title, "");
    return true;
}
function pinThread(id, pin, actorNim, actorName) {
    const threads = getThreads();
    const t = threads.find(t => t.id === id);
    if (!t) return false;
    t.pinned   = pin;
    t.pinnedAt = pin ? new Date().toISOString() : null;
    saveThreads(threads);
    logActivity(pin ? "pin_thread" : "unpin_thread", actorNim, actorName, "thread", id, t.title, "");
    return true;
}
function archiveThread(id, archive, actorNim, actorName) {
    const threads = getThreads();
    const t = threads.find(t => t.id === id);
    if (!t) return false;
    t.archived   = archive;
    t.archivedAt = archive ? new Date().toISOString() : null;
    saveThreads(threads);
    logActivity(archive ? "archive_thread" : "restore_thread", actorNim, actorName, "thread", id, t.title, "");
    return true;
}
function deleteAdminThread(id, actorNim, actorName) {
    const threads = getThreads();
    const t = threads.find(t => t.id === id);
    if (!t) return false;
    const title = t.title;
    saveThreads(threads.filter(th => th.id !== id));
    logActivity("delete_thread", actorNim, actorName, "thread", id, title, "");
    return true;
}
function deleteComment(threadId, commentId, actorNim, actorName) {
    const threads = getThreads();
    const t = threads.find(t => t.id === threadId);
    if (!t || !t.comments) return false;
    const c = t.comments.find(c => c.id === commentId);
    const cContent = c ? c.content : commentId;
    t.comments     = t.comments.filter(c => c.id !== commentId);
    t.commentsCount = t.comments.length;
    saveThreads(threads);
    logActivity("delete_comment", actorNim, actorName, "comment", commentId, cContent.slice(0,50), "Thread: " + t.title);
    return true;
}
function closeReport(reportId, actorNim, actorName) {
    const reports = getReports();
    const r = reports.find(r => r.id === reportId);
    if (!r) return false;
    r.status   = "closed";
    r.closedAt = new Date().toISOString();
    r.closedBy = actorNim;
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    logActivity("close_report", actorNim, actorName, "report", reportId, r.threadTitle, r.reason);
    return true;
}

// Jalankan inisialisasi awal saat script dimuat
initDatabase();
