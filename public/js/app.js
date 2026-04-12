// Configuration
const API_BASE = '';

// Global state
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let authModal;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    authModal = new bootstrap.Modal(document.getElementById('authModal'));
    updateNavigation();
    loadHomePage();
});

// Navigation
function updateNavigation() {
    const navMenu = document.getElementById('navMenu');
    
    if (currentUser) {
        navMenu.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="#" onclick="loadHomePage()"><i class="fas fa-home me-1"></i>Home</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="showPostLost()"><i class="fas fa-box-open me-1"></i>Report Lost</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="showPostFound()"><i class="fas fa-gift me-1"></i>Report Found</a></li>
            ${currentUser.role === 'admin' ? `
                <li class="nav-item"><a class="nav-link" href="#" onclick="showAdminPanel()"><i class="fas fa-shield-alt me-1"></i>Admin</a></li>
            ` : ''}
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle text-white" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user-circle me-1"></i>${currentUser.name}
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
                <i class="fas fa-info-circle me-1"></i>Demo: admin@lostfound.com / admin123
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
    const password = document.getElementById('regPassword').value;
    
    try {
        const user = await apiCall('/api/auth/register', 'POST', { name, email, password });
        currentUser = user;
        localStorage.setItem('user', JSON.stringify(user));
        authModal.hide();
        updateNavigation();
        loadHomePage();
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

// Home Page
async function loadHomePage() {
    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <div class="hero-section">
            <div class="text-center mb-5">
                <h1 class="display-4 fw-bold mb-3">
                    <i class="fas fa-hand-holding-heart me-3" style="color: var(--primary);"></i>
                    Lost & Found
                </h1>
                <p class="lead text-muted">Connecting people. Returning what matters.</p>
            </div>
            
            <div class="row g-4 mb-5" id="statsContainer">
                <div class="col-md-4"><div class="stat-card"><div class="stat-icon text-primary"><i class="fas fa-box-open"></i></div><h3 id="lostCount">-</h3><p class="text-muted mb-0">Lost Items</p></div></div>
                <div class="col-md-4"><div class="stat-card"><div class="stat-icon text-success"><i class="fas fa-gift"></i></div><h3 id="foundCount">-</h3><p class="text-muted mb-0">Found Items</p></div></div>
                <div class="col-md-4"><div class="stat-card"><div class="stat-icon text-warning"><i class="fas fa-check-circle"></i></div><h3 id="claimedCount">-</h3><p class="text-muted mb-0">Items Returned</p></div></div>
            </div>
            
            <div class="row">
                <div class="col-md-6"><h4 class="mb-3"><i class="fas fa-box-open text-primary me-2"></i>Recent Lost Items</h4><div id="recentLost"></div></div>
                <div class="col-md-6"><h4 class="mb-3"><i class="fas fa-gift text-success me-2"></i>Recent Found Items</h4><div id="recentFound"></div></div>
            </div>
        </div>
    `;
    
    await loadStats();
    await loadRecentItems();
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
            ${item.image ? `<img src="${item.image}" class="item-image" alt="${item.item_name}">` : 
            `<div class="item-image d-flex align-items-center justify-content-center bg-light"><i class="fas fa-image fa-3x text-muted"></i></div>`}
            <div class="p-3">
                <h5 class="fw-bold">${escapeHtml(item.item_name)}</h5>
                <p class="text-muted small mb-2">${escapeHtml(item.description?.substring(0, 80) || '')}...</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-light text-dark"><i class="fas fa-map-pin me-1"></i>${escapeHtml(item.location)}</span>
                    ${currentUser && currentUser._id !== item.user_id?._id ? 
                        `<button class="btn btn-sm btn-outline-primary rounded-pill" onclick="openClaimModal('${item._id}')"><i class="fas fa-hand-paper me-1"></i>Claim</button>` : ''}
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

// Post Item Pages
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
        alert('Item submitted! Waiting for admin approval.');
        loadHomePage();
    } catch (error) {
        alert('Failed: ' + error.message);
    }
}

// Claims
function openClaimModal(itemId) {
    if (!currentUser) { showLoginModal(); return; }
    document.getElementById('claimItemId').value = itemId;
    new bootstrap.Modal(document.getElementById('claimModal')).show();
}

async function submitClaim() {
    const itemId = document.getElementById('claimItemId').value;
    const proof = document.getElementById('claimProof').value;
    if (!proof) { alert('Please provide proof'); return; }
    
    try {
        await apiCall('/api/claims', 'POST', { item_id: itemId, claimant_id: currentUser._id, proof_description: proof });
        bootstrap.Modal.getInstance(document.getElementById('claimModal')).hide();
        alert('Claim submitted!');
    } catch (error) {
        alert('Failed: ' + error.message);
    }
}

// Admin Panel
async function showAdminPanel() {
    if (!currentUser || currentUser.role !== 'admin') { loadHomePage(); return; }
    
    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <div class="hero-section">
            <h2 class="mb-4"><i class="fas fa-shield-alt me-2"></i>Admin Dashboard</h2>
            <ul class="nav nav-pills mb-4">
                <li class="nav-item"><button class="nav-link active" onclick="loadPendingItems()"><i class="fas fa-clock me-1"></i>Pending</button></li>
                <li class="nav-item"><button class="nav-link" onclick="loadAllItemsAdmin()"><i class="fas fa-list me-1"></i>All Items</button></li>
                <li class="nav-item"><button class="nav-link" onclick="loadClaimsAdmin()"><i class="fas fa-check-circle me-1"></i>Claims</button></li>
            </ul>
            <div id="adminContent"></div>
        </div>
    `;
    loadPendingItems();
}

async function loadPendingItems() {
    const items = await apiCall('/api/admin/pending');
    const container = document.getElementById('adminContent');
    
    if (!items.length) {
        container.innerHTML = `<p class="text-muted text-center py-4">No pending items.</p>`;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="item-card mb-3">
            <div class="row g-0">
                <div class="col-md-3">${item.image ? `<img src="${item.image}" class="img-fluid rounded-start h-100" style="object-fit: cover;">` : `<div class="bg-light h-100 d-flex align-items-center justify-content-center"><i class="fas fa-image fa-3x text-muted"></i></div>`}</div>
                <div class="col-md-6"><div class="p-3"><span class="badge bg-${item.category === 'lost' ? 'primary' : 'success'} mb-2">${item.category}</span><h5>${escapeHtml(item.item_name)}</h5><p>${escapeHtml(item.description)}</p><small class="text-muted"><i class="fas fa-user me-1"></i>${escapeHtml(item.user_id?.name)}<br><i class="fas fa-map-pin me-1"></i>${escapeHtml(item.location)}</small></div></div>
                <div class="col-md-3 d-flex flex-column justify-content-center p-3">
                    <button class="btn btn-success mb-2" onclick="approveItem('${item._id}')"><i class="fas fa-check"></i> Approve</button>
                    <button class="btn btn-danger" onclick="rejectItem('${item._id}')"><i class="fas fa-times"></i> Reject</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function approveItem(id) {
    await apiCall(`/api/admin/item/${id}`, 'PUT', { status: 'approved' });
    alert('Approved!');
    loadPendingItems();
}

async function rejectItem(id) {
    if (!confirm('Reject and delete?')) return;
    await apiCall(`/api/admin/item/${id}`, 'DELETE');
    alert('Rejected');
    loadPendingItems();
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
        container.innerHTML = `<p class="text-muted text-center py-4">No claims.</p>`;
        return;
    }
    
    container.innerHTML = claims.map(c => `
        <div class="item-card mb-3 p-3"><div class="d-flex justify-content-between"><div><h5>${escapeHtml(c.item_id?.item_name)}</h5><p><strong>Claimant:</strong> ${escapeHtml(c.claimant_id?.name)}</p><p>${escapeHtml(c.proof_description)}</p><span class="badge bg-${getStatusColor(c.status)}">${c.status}</span></div>
        ${c.status==='pending'?`<div><button class="btn btn-success btn-sm me-2" onclick="updateClaimStatus('${c._id}','approved')">Approve</button><button class="btn btn-danger btn-sm" onclick="updateClaimStatus('${c._id}','rejected')">Reject</button></div>`:''}</div></div>
    `).join('');
}

async function updateClaimStatus(id, status) {
    await apiCall(`/api/admin/claim/${id}`, 'PUT', { status });
    alert(`Claim ${status}`);
    loadClaimsAdmin();
}

async function showMyItems() {
    const items = await apiCall(`/api/items/user/${currentUser._id}`);
    const container = document.getElementById('mainContent');
    container.innerHTML = `<div class="hero-section"><h2 class="mb-4">My Items</h2><div id="myItemsList"></div></div>`;
    
    const list = document.getElementById('myItemsList');
    if (!items.length) { list.innerHTML = `<p class="text-muted text-center py-4">No items posted.</p>`; return; }
    
    list.innerHTML = items.map(i => `
        <div class="item-card mb-3 p-3"><div class="d-flex justify-content-between"><div><span class="badge bg-${i.category==='lost'?'primary':'success'} mb-2">${i.category}</span><h5>${escapeHtml(i.item_name)}</h5><p>${escapeHtml(i.description)}</p><span class="badge bg-${getStatusColor(i.status)}">${i.status}</span></div><div class="text-end"><small>${new Date(i.createdAt).toLocaleDateString()}</small></div></div></div>
    `).join('');
}

async function showMyClaims() {
    const claims = await apiCall(`/api/claims/user/${currentUser._id}`);
    const container = document.getElementById('mainContent');
    container.innerHTML = `<div class="hero-section"><h2 class="mb-4">My Claims</h2><div id="myClaimsList"></div></div>`;
    
    const list = document.getElementById('myClaimsList');
    if (!claims.length) { list.innerHTML = `<p class="text-muted text-center py-4">No claims made.</p>`; return; }
    
    list.innerHTML = claims.map(c => `
        <div class="item-card mb-3 p-3"><h5>${escapeHtml(c.item_id?.item_name)}</h5><p>${escapeHtml(c.proof_description)}</p><span class="badge bg-${getStatusColor(c.status)}">${c.status}</span><small class="d-block mt-2">Claimed on ${new Date(c.createdAt).toLocaleDateString()}</small></div>
    `).join('');
}