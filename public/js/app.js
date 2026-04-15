// ============================================
// 🔧 পরিবর্তন ১: API_BASE URL আপডেট করুন
// ============================================
const API_BASE = ''; // আপনার Render URL দিলে ভালো হয়: 'https://lost-found-system-2kfy.onrender.com'

// Global state
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let authModal;
let currentApprovalItemId = null;  // 🔧 নতুন: অ্যাডমিন অ্যাপ্রুভালের জন্য
let approvalModal;                  // 🔧 নতুন: অ্যাডমিন অ্যাপ্রুভাল মডাল

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    authModal = new bootstrap.Modal(document.getElementById('authModal'));
    
    // 🔧 নতুন: অ্যাডমিন অ্যাপ্রুভাল মডাল ইনিশিয়ালাইজ
    const approvalModalEl = document.getElementById('approvalModal');
    if (approvalModalEl) {
        approvalModal = new bootstrap.Modal(approvalModalEl);
    }
    
    updateNavigation();
    loadHomePage();
});

// Navigation (কোনো পরিবর্তন নেই)
function updateNavigation() {
    const navMenu = document.getElementById('navMenu');
    
    if (currentUser) {
        navMenu.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="#" onclick="loadHomePage()"><i class="fas fa-home me-1"></i>Home</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="showPostLost()"><i class="fas fa-box-open me-1"></i>Report Lost</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="showPostFound()"><i class="fas fa-gift me-1"></i>Report Found</a></li>
            ${currentUser.role === 'admin' ? `
                <li class="nav-item"><a class="nav-link" href="#" onclick="showAdminPanel()"><i class="fas fa-shield-alt me-1"></i>Admin Panel</a></li>
            ` : ''}
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle text-white" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user-circle me-1"></i>${escapeHtml(currentUser.name)}
                    ${currentUser.role === 'admin' ? '<span class="badge bg-warning ms-1">Admin</span>' : ''}
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="#" onclick="showMyItems()"><i class="fas fa-list me-2"></i>My Items</a></li>
                    <li><a class="dropdown-item" href="#" onclick="showMyClaims()"><i class="fas fa-check-circle me-2"></i>My Claims</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                </ul>
            </li>
        `;
    } else {
        navMenu.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="#" onclick="loadHomePage()"><i class="fas fa-home me-1"></i>Home</a></li>
            <li class="nav-item ms-2">
                <button class="btn btn-light rounded-pill me-2" onclick="showLoginModal()"><i class="fas fa-sign-in-alt me-1"></i>Login</button>
                <button class="btn btn-outline-light rounded-pill" onclick="showRegisterModal()"><i class="fas fa-user-plus me-1"></i>Register</button>
            </li>
        `;
    }
}

function logout() {
    localStorage.removeItem('user');
    currentUser = null;
    updateNavigation();
    loadHomePage();
}

// API Calls
async function apiCall(endpoint, method = 'GET', body = null, isFormData = false) {
    const url = API_BASE + endpoint;
    const options = { method };
    
    if (body) {
        if (isFormData) {
            options.body = body;
        } else {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(body);
        }
    }
    
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// Auth Modals
function showLoginModal() {
    document.getElementById('modalTitle').textContent = 'Welcome Back';
    document.getElementById('modalBody').innerHTML = `
        <form onsubmit="login(event)">
            <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" id="loginEmail" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Password</label>
                <input type="password" class="form-control" id="loginPassword" required>
            </div>
            <div class="mb-3 text-muted small">
                <i class="fas fa-info-circle me-1"></i>Demo Admin: admin@lostfound.com / admin123
            </div>
            <button type="submit" class="btn btn-gradient w-100">Login</button>
            <p class="text-center mt-3 mb-0">
                Don't have an account? <a href="#" onclick="showRegisterModal(); return false;">Register</a>
            </p>
        </form>
    `;
    authModal.show();
}

function showRegisterModal() {
    document.getElementById('modalTitle').textContent = 'Create Account';
    document.getElementById('modalBody').innerHTML = `
        <form onsubmit="register(event)">
            <div class="mb-3">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" id="regName" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" id="regEmail" required>
            </div>
            <!-- 🔧 নতুন: ফোন নম্বর ফিল্ড যোগ করা হয়েছে -->
            <div class="mb-3">
                <label class="form-label">Phone (Optional)</label>
                <input type="tel" class="form-control" id="regPhone" placeholder="01XXXXXXXXX">
                <small class="text-muted">We'll use this to contact you about claims</small>
            </div>
            <div class="mb-3">
                <label class="form-label">Password</label>
                <input type="password" class="form-control" id="regPassword" required minlength="6">
            </div>
            <button type="submit" class="btn btn-gradient w-100">Register</button>
            <p class="text-center mt-3 mb-0">
                Already have an account? <a href="#" onclick="showLoginModal(); return false;">Login</a>
            </p>
        </form>
    `;
    authModal.show();
}

async function login(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const user = await apiCall('/api/auth/login', 'POST', { email, password });
        currentUser = user;
        localStorage.setItem('user', JSON.stringify(user));
        authModal.hide();
        updateNavigation();
        loadHomePage();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function register(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;  // 🔧 নতুন: ফোন নাম্বার সংগ্রহ
    const password = document.getElementById('regPassword').value;
    
    try {
        // 🔧 পরিবর্তন: ফোন নাম্বার সহ রেজিস্টার
        const user = await apiCall('/api/auth/register', 'POST', { name, email, phone, password });
        currentUser = user;
        localStorage.setItem('user', JSON.stringify(user));
        authModal.hide();
        updateNavigation();
        alert('✅ Registration successful! Check your email for welcome message.');  // 🔧 নতুন: ইমেইল কনফার্মেশন
        loadHomePage();
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

// ============================================
// 🔧 পরিবর্তন ২: হোম পেজে সার্চ বার যোগ
// ============================================
async function loadHomePage() {
    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <div class="hero-section">
            <div class="text-center mb-5">
                <h1 class="display-4 fw-bold mb-3">
                    <i class="fas fa-hand-holding-heart me-3" style="color: var(--primary);"></i>
                    Lost & Found
                </h1>
                <p class="lead text-muted">Search, post, and claim items - with email notifications</p>
            </div>
            
            <!-- 🔧 নতুন: সার্চ সেকশন -->
            <div class="search-section mb-5">
                <div class="card border-0 shadow-sm">
                    <div class="card-body p-4">
                        <h5 class="mb-3"><i class="fas fa-search me-2"></i>Search Items</h5>
                        <div class="row g-2">
                            <div class="col-md-4">
                                <input type="text" class="form-control" id="searchInput" placeholder="🔍 Search by name or description...">
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="categoryFilter">
                                    <option value="all">All Categories</option>
                                    <option value="lost">Lost Items</option>
                                    <option value="found">Found Items</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <input type="text" class="form-control" id="locationFilter" placeholder="📍 Filter by location">
                            </div>
                            <div class="col-md-2">
                                <input type="date" class="form-control" id="dateFromFilter" placeholder="From date">
                            </div>
                            <div class="col-md-1">
                                <button class="btn btn-primary w-100" onclick="applyAdvancedSearch()">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                        <div class="mt-2 text-end">
                            <button class="btn btn-link btn-sm" onclick="clearSearch()">
                                <i class="fas fa-times me-1"></i>Clear Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row g-4 mb-5" id="statsContainer">
                <div class="col-md-4"><div class="stat-card"><div class="stat-icon text-primary"><i class="fas fa-box-open"></i></div><h3 id="lostCount">-</h3><p class="text-muted mb-0">Lost Items</p></div></div>
                <div class="col-md-4"><div class="stat-card"><div class="stat-icon text-success"><i class="fas fa-gift"></i></div><h3 id="foundCount">-</h3><p class="text-muted mb-0">Found Items</p></div></div>
                <div class="col-md-4"><div class="stat-card"><div class="stat-icon text-warning"><i class="fas fa-check-circle"></i></div><h3 id="claimedCount">-</h3><p class="text-muted mb-0">Items Returned</p></div></div>
            </div>
            
            ${currentUser && currentUser.role === 'admin' ? `
                <div class="alert alert-warning mb-4">
                    <i class="fas fa-shield-alt me-2"></i>
                    <strong>Admin Notice:</strong> There are items waiting for your approval. 
                    <a href="#" onclick="showAdminPanel()" class="alert-link">Go to Admin Panel</a>
                </div>
            ` : ''}
            
            <div class="row">
                <div class="col-md-6"><h4 class="mb-3"><i class="fas fa-box-open text-primary me-2"></i>Recent Lost Items</h4><div id="recentLost"></div></div>
                <div class="col-md-6"><h4 class="mb-3"><i class="fas fa-gift text-success me-2"></i>Recent Found Items</h4><div id="recentFound"></div></div>
            </div>
        </div>
    `;
    
    await loadStats();
    await loadRecentItems();
}

// ============================================
// 🔧 নতুন ফাংশন ৩: অ্যাডভান্সড সার্চ
// ============================================
async function applyAdvancedSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    const category = document.getElementById('categoryFilter').value;
    const location = document.getElementById('locationFilter').value.trim();
    const dateFrom = document.getElementById('dateFromFilter').value;
    
    const role = currentUser?.role || 'user';
    
    try {
        let queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append('q', searchTerm);
        if (category && category !== 'all') queryParams.append('category', category);
        if (location) queryParams.append('location', location);
        if (dateFrom) queryParams.append('dateFrom', dateFrom);
        queryParams.append('role', role);
        
        const items = await apiCall(`/api/items/search?${queryParams.toString()}`);
        
        // Display results
        const container = document.getElementById('mainContent');
        container.innerHTML = `
            <div class="hero-section">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2><i class="fas fa-search me-2"></i>Search Results</h2>
                    <button class="btn btn-outline-secondary" onclick="loadHomePage()">
                        <i class="fas fa-arrow-left me-1"></i>Back to Home
                    </button>
                </div>
                
                <p class="mb-3">
                    <span class="badge bg-primary me-2">${items.length} items found</span>
                    ${searchTerm ? `<span class="badge bg-secondary me-2">🔍 "${escapeHtml(searchTerm)}"</span>` : ''}
                    ${category !== 'all' ? `<span class="badge bg-secondary me-2">📁 ${category}</span>` : ''}
                    ${location ? `<span class="badge bg-secondary me-2">📍 ${escapeHtml(location)}</span>` : ''}
                    ${dateFrom ? `<span class="badge bg-secondary">📅 From ${dateFrom}</span>` : ''}
                </p>
                
                <div id="searchResults" class="row"></div>
            </div>
        `;
        
        const resultsContainer = document.getElementById('searchResults');
        
        if (items.length === 0) {
            resultsContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center py-5">
                        <i class="fas fa-search fa-3x mb-3 opacity-50"></i>
                        <h5>No items found</h5>
                        <p>Try different search terms or filters</p>
                        <button class="btn btn-primary mt-2" onclick="loadHomePage()">
                            <i class="fas fa-home me-1"></i>Go Back Home
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        resultsContainer.innerHTML = items.map(item => `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="item-card position-relative">
                    ${item.image ? `<img src="${item.image}" class="item-image" alt="${escapeHtml(item.item_name)}">` : 
                    `<div class="item-image d-flex align-items-center justify-content-center bg-light">
                        <i class="fas fa-image fa-3x text-muted"></i>
                    </div>`}
                    <div class="p-3">
                        <span class="badge bg-${item.category === 'lost' ? 'primary' : 'success'} mb-2">
                            ${item.category}
                        </span>
                        <h5 class="fw-bold">${escapeHtml(item.item_name)}</h5>
                        <p class="text-muted small mb-2">${escapeHtml(item.description?.substring(0, 80) || '')}...</p>
                        <div class="mb-2">
                            <span class="badge bg-light text-dark me-2">
                                <i class="fas fa-map-pin me-1"></i>${escapeHtml(item.location)}
                            </span>
                            <span class="badge bg-light text-dark">
                                <i class="fas fa-calendar me-1"></i>${new Date(item.date).toLocaleDateString()}
                            </span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="fas fa-user me-1"></i>${escapeHtml(item.user_id?.name || 'Anonymous')}
                            </small>
                            ${canClaimItem(item) ? 
                                `<button class="btn btn-sm btn-primary rounded-pill" onclick="openClaimModal('${item._id}', '${escapeHtml(item.item_name)}', '${escapeHtml(item.description?.substring(0, 50))}')">
                                    <i class="fas fa-hand-paper me-1"></i>Claim
                                </button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Search error:', error);
        alert('Search failed: ' + error.message);
    }
}

// 🔧 নতুন ফাংশন: ক্লিয়ার সার্চ
function clearSearch() {
    if (document.getElementById('searchInput')) {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('locationFilter').value = '';
        document.getElementById('dateFromFilter').value = '';
        loadHomePage();
    }
}

// 🔧 নতুন ফাংশন: ক্লেইম করা যায় কিনা চেক
function canClaimItem(item) {
    if (!currentUser) return false;
    if (item.user_id?._id === currentUser._id) return false;
    if (item.status === 'claimed') return false;
    return true;
}

async function loadStats() {
    try {
        const stats = await apiCall('/api/items/stats/data');
        document.getElementById('lostCount').textContent = stats.lostCount || 0;
        document.getElementById('foundCount').textContent = stats.foundCount || 0;
        document.getElementById('claimedCount').textContent = stats.claimedCount || 0;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadRecentItems() {
    try {
        const role = currentUser?.role || 'user';
        const lostItems = await apiCall(`/api/items/lost?role=${role}`);
        const foundItems = await apiCall(`/api/items/found?role=${role}`);
        
        renderItemGrid('recentLost', lostItems.slice(0, 4), 'lost');
        renderItemGrid('recentFound', foundItems.slice(0, 4), 'found');
    } catch (error) {
        console.error('Failed to load items:', error);
    }
}

function renderItemGrid(containerId, items, type) {
    const container = document.getElementById(containerId);
    if (!items || items.length === 0) {
        container.innerHTML = `<p class="text-muted text-center py-4">No ${type} items yet.</p>`;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="item-card mb-3 position-relative">
            ${item.image ? `<img src="${item.image}" class="item-image" alt="${escapeHtml(item.item_name)}">` : 
            `<div class="item-image d-flex align-items-center justify-content-center bg-light"><i class="fas fa-image fa-3x text-muted"></i></div>`}
            <div class="p-3">
                <h5 class="fw-bold">${escapeHtml(item.item_name)}</h5>
                <p class="text-muted small mb-2">${escapeHtml(item.description?.substring(0, 80) || '')}...</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-light text-dark"><i class="fas fa-map-pin me-1"></i>${escapeHtml(item.location)}</span>
                    ${canClaimItem(item) ? 
                        `<button class="btn btn-sm btn-outline-primary rounded-pill" onclick="openClaimModal('${item._id}', '${escapeHtml(item.item_name)}', '${escapeHtml(item.description?.substring(0, 50))}')">
                            <i class="fas fa-hand-paper me-1"></i>Claim
                        </button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Post Item Pages (কোনো পরিবর্তন নেই)
function showPostLost() {
    if (!currentUser) { showLoginModal(); return; }
    
    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <div class="hero-section">
            <h2 class="mb-4"><i class="fas fa-box-open text-primary me-2"></i>Report Lost Item</h2>
            <form id="postItemForm" onsubmit="submitItem(event, 'lost')">
                <div class="row">
                    <div class="col-md-8">
                        <div class="mb-3"><label class="form-label">Item Name *</label><input type="text" class="form-control" id="itemName" required></div>
                        <div class="mb-3"><label class="form-label">Description *</label><textarea class="form-control" id="itemDesc" rows="4" required></textarea></div>
                        <div class="row">
                            <div class="col-md-6 mb-3"><label class="form-label">Location *</label><input type="text" class="form-control" id="itemLocation" required></div>
                            <div class="col-md-6 mb-3"><label class="form-label">Date Lost *</label><input type="date" class="form-control" id="itemDate" required></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="mb-3"><label class="form-label">Upload Image</label><input type="file" class="form-control" id="itemImage" accept="image/*" onchange="previewImage(this)"><img id="imagePreview" class="image-preview" style="display:none;"></div>
                    </div>
                </div>
                <button type="submit" class="btn btn-gradient"><i class="fas fa-paper-plane me-2"></i>Submit for Approval</button>
                <p class="text-muted mt-3 small"><i class="fas fa-info-circle me-1"></i>Your item will be reviewed by an admin.</p>
            </form>
        </div>
    `;
    document.getElementById('itemDate').value = new Date().toISOString().split('T')[0];
}

function showPostFound() {
    if (!currentUser) { showLoginModal(); return; }
    
    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <div class="hero-section">
            <h2 class="mb-4"><i class="fas fa-gift text-success me-2"></i>Report Found Item</h2>
            <form id="postItemForm" onsubmit="submitItem(event, 'found')">
                <div class="row">
                    <div class="col-md-8">
                        <div class="mb-3"><label class="form-label">Item Name *</label><input type="text" class="form-control" id="itemName" required></div>
                        <div class="mb-3"><label class="form-label">Description *</label><textarea class="form-control" id="itemDesc" rows="4" required></textarea></div>
                        <div class="row">
                            <div class="col-md-6 mb-3"><label class="form-label">Location Found *</label><input type="text" class="form-control" id="itemLocation" required></div>
                            <div class="col-md-6 mb-3"><label class="form-label">Date Found *</label><input type="date" class="form-control" id="itemDate" required></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="mb-3"><label class="form-label">Upload Image</label><input type="file" class="form-control" id="itemImage" accept="image/*" onchange="previewImage(this)"><img id="imagePreview" class="image-preview" style="display:none;"></div>
                    </div>
                </div>
                <button type="submit" class="btn btn-gradient"><i class="fas fa-paper-plane me-2"></i>Submit for Approval</button>
                <p class="text-muted mt-3 small"><i class="fas fa-info-circle me-1"></i>Your item will be reviewed by an admin.</p>
            </form>
        </div>
    `;
    document.getElementById('itemDate').value = new Date().toISOString().split('T')[0];
}

function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => { preview.src = e.target.result; preview.style.display = 'block'; };
        reader.readAsDataURL(input.files[0]);
    }
}

async function submitItem(e, type) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('item_name', document.getElementById('itemName').value);
    formData.append('description', document.getElementById('itemDesc').value);
    formData.append('location', document.getElementById('itemLocation').value);
    formData.append('date', document.getElementById('itemDate').value);
    formData.append('user_id', currentUser._id);
    
    const imageFile = document.getElementById('itemImage').files[0];
    if (imageFile) formData.append('image', imageFile);
    
    try {
        const endpoint = type === 'lost' ? '/api/items/lost' : '/api/items/found';
        await apiCall(endpoint, 'POST', formData, true);
        alert('✅ Item submitted! Waiting for admin approval. You will receive an email when approved.');
        loadHomePage();
    } catch (error) {
        alert('Failed: ' + error.message);
    }
}

// ============================================
// 🔧 পরিবর্তন ৪: ক্লেইম মডাল আপডেট (আইটেম নাম দেখাবে)
// ============================================
function openClaimModal(itemId, itemName, itemDesc) {
    if (!currentUser) { showLoginModal(); return; }
    
    // 🔧 নতুন: ক্লেইম মডালে আইটেমের তথ্য দেখানো
    const infoDiv = document.getElementById('claimItemInfo');
    if (infoDiv) {
        infoDiv.innerHTML = `
            <h5 class="mb-2"><i class="fas fa-tag me-2"></i>${escapeHtml(itemName)}</h5>
            <p class="mb-0 text-muted small">${escapeHtml(itemDesc)}...</p>
        `;
    }
    
    document.getElementById('claimItemId').value = itemId;
    document.getElementById('claimProof').value = '';
    
    new bootstrap.Modal(document.getElementById('claimModal')).show();
}

async function submitClaim() {
    const itemId = document.getElementById('claimItemId').value;
    const proof = document.getElementById('claimProof').value;
    if (!proof) { alert('Please provide proof of ownership'); return; }
    
    try {
        await apiCall('/api/claims', 'POST', { 
            item_id: itemId, 
            claimant_id: currentUser._id, 
            proof_description: proof 
        });
        bootstrap.Modal.getInstance(document.getElementById('claimModal')).hide();
        alert('✅ Claim submitted! You will receive email notifications about your claim status.');
        loadHomePage();
    } catch (error) {
        alert('Failed: ' + error.message);
    }
}

// ============================================
// 🔧 পরিবর্তন ৫: অ্যাডমিন প্যানেল আপডেট (পেন্ডিং কাউন্ট সহ)
// ============================================
async function showAdminPanel() {
    if (!currentUser || currentUser.role !== 'admin') { loadHomePage(); return; }
    
    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <div class="hero-section">
            <h2 class="mb-4"><i class="fas fa-shield-alt me-2"></i>Admin Dashboard</h2>
            
            <ul class="nav nav-pills mb-4">
                <li class="nav-item">
                    <button class="nav-link active" onclick="loadPendingItems()">
                        <i class="fas fa-clock me-1"></i>Pending Approval
                        <span class="badge bg-danger ms-1" id="pendingCount">0</span>
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" onclick="loadAllItemsAdmin()">
                        <i class="fas fa-list me-1"></i>All Items
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" onclick="loadClaimsAdmin()">
                        <i class="fas fa-check-circle me-1"></i>Claims
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" onclick="loadUsersAdmin()">
                        <i class="fas fa-users me-1"></i>Users
                    </button>
                </li>
            </ul>
            
            <div id="adminContent"></div>
        </div>
    `;
    
    loadPendingItems();
    updatePendingCount();
}

// 🔧 নতুন ফাংশন: পেন্ডিং কাউন্ট আপডেট
async function updatePendingCount() {
    try {
        const items = await apiCall('/api/admin/pending');
        const badge = document.getElementById('pendingCount');
        if (badge) badge.textContent = items.length;
    } catch (e) {
        console.error('Failed to update pending count:', e);
    }
}

// 🔧 নতুন ফাংশন: ইউজার লিস্ট
async function loadUsersAdmin() {
    try {
        const users = await apiCall('/api/admin/users');
        const container = document.getElementById('adminContent');
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${escapeHtml(user.name)}</td>
                                <td>${escapeHtml(user.email)}</td>
                                <td>${escapeHtml(user.phone || '—')}</td>
                                <td><span class="badge bg-${user.role === 'admin' ? 'warning' : 'secondary'}">${user.role}</span></td>
                                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function loadPendingItems() {
    const items = await apiCall('/api/admin/pending');
    const container = document.getElementById('adminContent');
    
    if (!items.length) {
        container.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle me-2"></i>No pending items for approval!</div>`;
        return;
    }
    
    container.innerHTML = `
        <div class="alert alert-warning">
            <i class="fas fa-info-circle me-2"></i>
            ${items.length} item(s) waiting for your approval
        </div>
        ${items.map(item => `
            <div class="item-card mb-3">
                <div class="row g-0">
                    <div class="col-md-3">
                        ${item.image ? `<img src="${item.image}" class="img-fluid rounded-start h-100" style="object-fit: cover;">` : 
                        `<div class="bg-light h-100 d-flex align-items-center justify-content-center p-4">
                            <i class="fas fa-image fa-3x text-muted"></i>
                        </div>`}
                    </div>
                    <div class="col-md-6">
                        <div class="p-3">
                            <span class="badge bg-${item.category === 'lost' ? 'primary' : 'success'} mb-2">
                                ${item.category.toUpperCase()}
                            </span>
                            <h5>${escapeHtml(item.item_name)}</h5>
                            <p>${escapeHtml(item.description)}</p>
                            <small class="text-muted">
                                <i class="fas fa-user me-1"></i>Posted by: ${escapeHtml(item.user_id?.name || 'Unknown')}<br>
                                <i class="fas fa-envelope me-1"></i>${escapeHtml(item.user_id?.email || 'No email')}<br>
                                <i class="fas fa-phone me-1"></i>${escapeHtml(item.user_id?.phone || 'No phone')}<br>
                                <i class="fas fa-map-pin me-1"></i>${escapeHtml(item.location)}<br>
                                <i class="fas fa-calendar me-1"></i>${new Date(item.date).toLocaleDateString()}
                            </small>
                        </div>
                    </div>
                    <div class="col-md-3 d-flex flex-column justify-content-center p-3">
                        <button class="btn btn-success mb-2" onclick="openApprovalModal('${item._id}', '${escapeHtml(item.item_name)}', '${escapeHtml(item.category)}')">
                            <i class="fas fa-check me-1"></i>Review & Approve
                        </button>
                        <button class="btn btn-danger" onclick="rejectItem('${item._id}')">
                            <i class="fas fa-times me-1"></i>Reject
                        </button>
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

// 🔧 নতুন ফাংশন: অ্যাপ্রুভাল মডাল
function openApprovalModal(itemId, itemName, category) {
    currentApprovalItemId = itemId;
    const modalBody = document.getElementById('approvalModalBody');
    if (modalBody) {
        modalBody.innerHTML = `
            <h5>${escapeHtml(itemName)}</h5>
            <p class="text-muted">Category: ${category}</p>
            <p>Are you sure you want to approve this item? It will become visible to all users and the owner will receive an email notification.</p>
        `;
    }
    if (approvalModal) approvalModal.show();
}

async function approveItemFromModal() {
    if (!currentApprovalItemId) return;
    
    try {
        await apiCall(`/api/admin/item/${currentApprovalItemId}`, 'PUT', { status: 'approved' });
        if (approvalModal) approvalModal.hide();
        alert('✅ Item approved! Email notification sent to owner.');
        loadPendingItems();
        updatePendingCount();
    } catch (error) {
        alert('Failed to approve: ' + error.message);
    }
}

async function rejectItemFromModal() {
    if (!currentApprovalItemId) return;
    if (approvalModal) approvalModal.hide();
    rejectItem(currentApprovalItemId);
}

async function approveItem(id) {
    await apiCall(`/api/admin/item/${id}`, 'PUT', { status: 'approved' });
    alert('✅ Approved! Email sent to owner.');
    loadPendingItems();
    updatePendingCount();
}

async function rejectItem(id) {
    if (!confirm('Reject and delete this item? Owner will receive an email notification.')) return;
    await apiCall(`/api/admin/item/${id}`, 'DELETE');
    alert('❌ Item rejected. Email sent to owner.');
    loadPendingItems();
    updatePendingCount();
}

async function loadAllItemsAdmin() {
    const [lost, found] = await Promise.all([apiCall('/api/items/lost?role=admin'), apiCall('/api/items/found?role=admin')]);
    const all = [...lost, ...found];
    const container = document.getElementById('adminContent');
    
    container.innerHTML = `
        <div class="table-responsive"><table class="table table-hover"><thead><tr><th>Item</th><th>Type</th><th>Status</th><th>Posted By</th><th>Date</th><th>Action</th></tr></thead>
        <tbody>${all.map(item => `<tr><td>${escapeHtml(item.item_name)}</td><td><span class="badge bg-${item.category==='lost'?'primary':'success'}">${item.category}</span></td><td><span class="badge bg-${getStatusColor(item.status)}">${item.status}</span></td><td>${escapeHtml(item.user_id?.name)}</td><td>${new Date(item.createdAt).toLocaleDateString()}</td><td><button class="btn btn-sm btn-danger" onclick="deleteItemAdmin('${item._id}')"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div>
    `;
}

function getStatusColor(s) {
    return {pending:'warning',approved:'success',claimed:'info',rejected:'danger'}[s] || 'secondary';
}

async function deleteItemAdmin(id) {
    if (!confirm('Delete permanently?')) return;
    await apiCall(`/api/admin/item/${id}`, 'DELETE');
    loadAllItemsAdmin();
}

async function loadClaimsAdmin() {
    const claims = await apiCall('/api/admin/claims');
    const container = document.getElementById('adminContent');
    
    if (!claims.length) {
        container.innerHTML = `<div class="alert alert-info">No claims to review.</div>`;
        return;
    }
    
    container.innerHTML = claims.map(c => `
        <div class="item-card mb-3 p-3">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h5>${escapeHtml(c.item_id?.item_name || 'Unknown Item')}</h5>
                    <p class="mb-1"><strong>Claimant:</strong> ${escapeHtml(c.claimant_id?.name || 'Unknown')} (${escapeHtml(c.claimant_id?.email || '')})</p>
                    <p class="mb-2"><strong>Proof:</strong> ${escapeHtml(c.proof_description || 'No proof provided')}</p>
                    <span class="badge bg-${getStatusColor(c.status)}">${c.status}</span>
                    <small class="text-muted d-block mt-2">Claimed on ${new Date(c.createdAt).toLocaleString()}</small>
                </div>
                <div>
                    ${c.status === 'pending' ? `
                        <button class="btn btn-success btn-sm me-2" onclick="updateClaimStatus('${c._id}', 'approved')">
                            <i class="fas fa-check"></i> Approve Claim
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="updateClaimStatus('${c._id}', 'rejected')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

async function updateClaimStatus(id, status) {
    await apiCall(`/api/admin/claim/${id}`, 'PUT', { status });
    alert(`✅ Claim ${status}! Email notifications sent.`);
    loadClaimsAdmin();
}

async function showMyItems() {
    const items = await apiCall(`/api/items/user/${currentUser._id}`);
    const container = document.getElementById('mainContent');
    container.innerHTML = `<div class="hero-section"><h2 class="mb-4">My Items</h2><div id="myItemsList"></div></div>`;
    
    const list = document.getElementById('myItemsList');
    if (!items.length) { list.innerHTML = `<p class="text-muted text-center py-4">No items posted.</p>`; return; }
    
    list.innerHTML = items.map(i => `
        <div class="item-card mb-3 p-3">
            <div class="d-flex justify-content-between">
                <div>
                    <span class="badge bg-${i.category==='lost'?'primary':'success'} mb-2">${i.category}</span>
                    <h5>${escapeHtml(i.item_name)}</h5>
                    <p>${escapeHtml(i.description)}</p>
                    <span class="badge bg-${getStatusColor(i.status)}">${i.status}</span>
                    ${i.status === 'pending' ? '<p class="text-warning small mt-2"><i class="fas fa-clock me-1"></i>Waiting for admin approval</p>' : ''}
                    ${i.status === 'approved' ? '<p class="text-success small mt-2"><i class="fas fa-check-circle me-1"></i>Publicly visible</p>' : ''}
                </div>
                <div class="text-end">
                    <small>${new Date(i.createdAt).toLocaleDateString()}</small>
                </div>
            </div>
        </div>
    `).join('');
}

async function showMyClaims() {
    const claims = await apiCall(`/api/claims/user/${currentUser._id}`);
    const container = document.getElementById('mainContent');
    container.innerHTML = `<div class="hero-section"><h2 class="mb-4">My Claims</h2><div id="myClaimsList"></div></div>`;
    
    const list = document.getElementById('myClaimsList');
    if (!claims.length) { list.innerHTML = `<p class="text-muted text-center py-4">No claims made.</p>`; return; }
    
    list.innerHTML = claims.map(c => `
        <div class="item-card mb-3 p-3">
            <h5>${escapeHtml(c.item_id?.item_name || 'Unknown Item')}</h5>
            <p class="mb-1"><strong>Your Proof:</strong> ${escapeHtml(c.proof_description || 'No proof provided')}</p>
            <span class="badge bg-${getStatusColor(c.status)}">${c.status}</span>
            <small class="text-muted d-block mt-2">Claimed on ${new Date(c.createdAt).toLocaleString()}</small>
            ${c.status === 'approved' ? '<p class="text-success mt-2"><i class="fas fa-check-circle me-1"></i>Your claim has been approved!</p>' : ''}
            ${c.status === 'rejected' ? '<p class="text-danger mt-2"><i class="fas fa-times-circle me-1"></i>Your claim was not approved.</p>' : ''}
        </div>
    `).join('');
}