const CLIENT_ID = 'Ov23liJJsDe8t4Amjn8z';
const AUTH_URL = 'https://www.inbondz.com/auth/token';
const FILE_KEY = 'inbondz.json';

const searchInput = document.getElementById('searchInput');
const resultsList = document.getElementById('resultsList');
const loader = document.getElementById('loader');
const authContainer = document.getElementById('authContainer');

async function init() {
    const code = new URLSearchParams(window.location.search).get('code');
    const token = localStorage.getItem('inbondz_token');

    if (code) {
        try {
            const res = await fetch(AUTH_URL, {
                method: 'POST',
                body: JSON.stringify({ code })
            });
            if (res.status === 429) throw new Error('LIMIT');
            const data = await res.json();
            if (data.access_token) {
                localStorage.setItem('inbondz_token', data.access_token);
                window.history.replaceState({}, '', '/');
            }
        } catch (e) {
            if (e.message === 'LIMIT') document.getElementById('limitModal').classList.remove('hidden');
        }
    }
    renderUI();
}

function renderUI() {
    const token = localStorage.getItem('inbondz_token');
    authContainer.innerHTML = token ? 
        `<button class="btn-login" style="background:#444" onclick="logout()">Logout</button>` : 
        `<a href="https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}" class="btn-login">Login</a>`;
}

window.logout = () => { localStorage.removeItem('inbondz_token'); location.reload(); };
window.closeModal = () => document.getElementById('limitModal').classList.add('hidden');

searchInput.addEventListener('input', e => {
    clearTimeout(window.t);
    const q = e.target.value.trim();
    if (q.length < 2) return resultsList.innerHTML = '';
    loader.classList.remove('hidden');
    window.t = setTimeout(() => fetchResults(q), 800);
});

async function fetchResults(q) {
    try {
        const token = localStorage.getItem('inbondz_token');
        const h = { 'Accept': 'application/vnd.github.v3+json' };
        if (token) h['Authorization'] = `Bearer ${token}`;

        const r = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(q)}+filename:${FILE_KEY}`, { headers: h });
        const d = await r.json();
        
        const urls = d.items.map(i => i.html_url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/'));
        const files = await Promise.all(urls.map(u => fetch(u).then(res => res.json()).catch(() => null)));
        
        resultsList.innerHTML = files.filter(f => f && f.url).map(f => `
            <a href="${f.url}" target="_blank" class="result-card">
                <img src="https://s2.googleusercontent.com/s2/favicons?domain=${new URL(f.url).hostname}&sz=64" class="favicon">
                <div class="meta">
                    <h3>${f.title || 'Source'}</h3>
                    <p>${f.description || f.url}</p>
                </div>
            </a>
        `).join('');
    } catch (e) { console.error(e); }
    loader.classList.add('hidden');
}
init();
