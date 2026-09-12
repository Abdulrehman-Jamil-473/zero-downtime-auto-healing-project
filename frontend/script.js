// Nginx (port 80) now proxies /api and /health to whichever backend
// slot (blue/green) is currently active — so we call relative paths,
// no port number needed.
const API_BASE = '';

const form = document.getElementById('itemForm');
const input = document.getElementById('itemName');
const list = document.getElementById('itemList');
const statusText = document.getElementById('statusText');

async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    statusText.textContent = data.status === 'healthy' ? '✅ Healthy' : '⚠️ Unhealthy';

    const badge = document.getElementById('versionBadge');
    if (data.version) {
      badge.textContent = data.version;
      badge.className = 'version-badge ' + data.version;
    }
  } catch (err) {
    statusText.textContent = '❌ Unreachable';
  }
}

async function loadItems() {
  try {
    const res = await fetch(`${API_BASE}/api/items`);
    const items = await res.json();
    list.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.name;
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Failed to load items:', err);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = input.value.trim();
  if (!name) return;

  try {
    await fetch(`${API_BASE}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    input.value = '';
    loadItems();
  } catch (err) {
    console.error('Failed to add item:', err);
  }
});

checkHealth();
loadItems();
setInterval(checkHealth, 10000);
