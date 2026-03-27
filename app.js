// --- 1. CONFIGURATION ---
const CLIENT_ID = 'Ov23liJJsDe8t4Amjn8z';
const AUTH_URL = 'https://www.inbondz.com/auth/token'; // Your Cloudflare Route
const FILE_KEY = 'inbondz.json';

const searchInput = document.getElementById('searchInput');
const resultsList = document.getElementById('resultsList');
const loader = document.getElementById('loader');
const authContainer = document.getElementById('authContainer');
let debounceTimer;

// --- 2. AUTHENTICATION & INITIALIZATION ---
async function init() {
    const code = new URLSearchParams(window.location.search).get('code');
    const token = localStorage.getItem('inbondz_token');

    if (code) {
        resultsList.innerHTML = '<div class="status-box" style="color: #9ea3a3; text-align: center;">Authenticating...</div>';
        try {
            const res = await fetch(AUTH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            
            if (res.status === 429 || res.status >= 500) throw new Error('LIMIT');
            if (!res.ok) throw new Error('AUTH_FAILED');
            
            const data = await res.json();
            if (data.access_token) {
                localStorage.setItem('inbondz_token', data.access_token);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (e) {
            if (e.message === 'LIMIT') document.getElementById('limitModal').classList.remove('hidden');
            console.error("Auth error:", e);
        }
        resultsList.innerHTML = ''; // Clear message
    }
    renderUI();
}

function renderUI() {
    const token = localStorage.getItem('inbondz_token');
    if (token) {
        authContainer.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; color:#9ea3a3; font-size:0.85rem; background:var(--card); padding:8px 16px; border-radius:30px; border:1px solid var(--border);">
                <span>🟢 Secured</span>
                <button class="btn-login" style="padding:4px 10px; font-size:0.8rem; cursor:pointer;" onclick="logout()">Log Out</button>
            </div>`;
    } else {
        authContainer.innerHTML = `<a href="https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=public_repo" class="btn-login">Sign in with GitHub</a>`;
    }
}

window.logout = () => { localStorage.removeItem('inbondz_token'); location.reload(); };
window.closeModal = () => document.getElementById('limitModal').classList.add('hidden');

// --- 3. SEARCH LOGIC & DEBOUNCE ---
searchInput.addEventListener('input', e => {
    clearTimeout(debounceTimer);
    const q = e.target.value.trim();
    
    if (q.length < 2) {
        resultsList.innerHTML = '';
        loader.classList.add('hidden');
        return;
    }
    
    loader.classList.remove('hidden');
    resultsList.innerHTML = ''; // Clear previous while searching
    debounceTimer = setTimeout(() => fetchResults(q), 800);
});

// --- 4. FETCHING & RENDERING (WITH HARDCODED 'NO RESULTS') ---
async function fetchResults(q) {
    try {
        const token = localStorage.getItem('inbondz_token');
        const h = { 'Accept': 'application/vnd.github.v3+json' };
        if (token) h['Authorization'] = `Bearer ${token}`;

        const r = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(q)}+filename:${FILE_KEY}`, { headers: h });
        
        if (r.status === 403) {
            renderNoResults("Rate limit hit. " + (token ? "Please wait a minute." : "Sign in to increase limits."));
            loader.classList.add('hidden');
            return;
        }

        const d = await r.json();
        
        // If GitHub finds literally 0 files matching the text
        if (!d.items || d.items.length === 0) {
            renderNoResults(`No indexed nodes found for "${escapeHTML(q)}".`);
            loader.classList.add('hidden');
            return;
        }

        // Fetch the actual raw JSON contents in parallel
        const urls = d.items.map(i => i.html_url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/'));
        const files = await Promise.all(urls.map(u => fetch(u).then(res => res.json()).catch(() => null)));
        
        // Filter out broken files or files without valid URLs
        const validFiles = files.filter(f => f && f.url && f.url.startsWith('http'));

        // If we found files but none of them followed your protocol
        if (validFiles.length === 0) {
            renderNoResults(`Found nodes for "${escapeHTML(q)}", but they were corrupted or missing URLs.`);
            loader.classList.add('hidden');
            return;
        }

        // Render the valid, styled results
        resultsList.innerHTML = validFiles.map(f => `
            <a href="${f.url}" target="_blank" class="result-card">
                <img src="https://s2.googleusercontent.com/s2/favicons?domain=${new URL(f.url).hostname}&sz=64" class="favicon" onerror="this.style.display='none'">
                <div class="meta">
                    <h3>${escapeHTML(f.title || new URL(f.url).hostname)}</h3>
                    <p>${escapeHTML(f.description || f.url)}</p>
                </div>
            </a>
        `).join('');

    } catch (e) { 
        renderNoResults("Network error while searching the decentralized index.");
        console.error(e); 
    }
    loader.classList.add('hidden');
}

// --- 5. THE HARDCODED NO RESULTS UI ---
function renderNoResults(message) {
    // This injects the exact HTML & CSS for the empty state directly into the list container
    resultsList.innerHTML = `
        <div style="width: 100%; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 60px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box;">
            <div style="font-size: 3.5rem; margin-bottom: 20px; opacity: 0.8;">📂🚫</div>
            <h3 style="font-size: 1.4rem; color: #9ea3a3; margin: 0 0 10px 0; font-weight: 600;">No Records Found</h3>
            <p style="color: var(--text); margin: 0 0 15px 0; font-size: 1rem; opacity: 0.9;">${message}</p>
            <span style="color: var(--dim); font-size: 0.85rem; font-style: italic; max-width: 300px; line-height: 1.4;">Try broader keywords or follow the Readme protocol to index your own data.</span>
        </div>
    `;
}

// --- 6. SECURITY UTILITY ---
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// Kick it off
init();
