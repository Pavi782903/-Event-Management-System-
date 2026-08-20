// ── Utilities ────────────────────────────────────────────
function showAlert(message, type = 'success') {
  const container = document.getElementById('alert-container');
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.innerHTML = `${type === 'success' ? '✅' : '❌'} ${message}`;
  container.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

// ── Load Participants ────────────────────────────────────
async function loadParticipants() {
  const tbody = document.getElementById('participants-table-body');
  tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="icon">⏳</div><p>Loading…</p></div></td></tr>';
  try {
    const res = await fetch('/participants/');
    const data = await res.json();
    document.getElementById('p-count').textContent = `${data.length} participants`;
    renderParticipants(data);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="icon">❌</div><p>Failed to load.</p></div></td></tr>';
  }
}

function renderParticipants(participants) {
  const tbody = document.getElementById('participants-table-body');
  if (!participants.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="icon">📭</div><p>No participants found.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = participants.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${p.name}</strong></td>
      <td>📧 ${p.email}</td>
      <td>${p.phone || '—'}</td>
      <td>${p.address ? p.address.substring(0, 40) + (p.address.length > 40 ? '…' : '') : '—'}</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-warning btn-sm btn-icon" onclick="openEditModal(${p.participant_id})" title="Edit">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteParticipant(${p.participant_id}, '${p.name.replace(/'/g,"\\'")}') " title="Delete">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
}

// ── Add Participant ──────────────────────────────────────
async function addParticipant() {
  const name = document.getElementById('p-name').value.trim();
  const email = document.getElementById('p-email').value.trim();
  const phone = document.getElementById('p-phone').value.trim();
  const address = document.getElementById('p-address').value.trim();

  if (!name || !email) { showAlert('Name and Email are required.', 'error'); return; }

  try {
    const res = await fetch('/participants/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, address })
    });
    const data = await res.json();
    if (res.ok) {
      showAlert('Participant added successfully!');
      clearParticipantForm();
      loadParticipants();
    } else {
      showAlert(data.detail || 'Failed to add participant.', 'error');
    }
  } catch (e) { showAlert('Server error.', 'error'); }
}

function clearParticipantForm() {
  ['p-name', 'p-email', 'p-phone', 'p-address'].forEach(id => document.getElementById(id).value = '');
}

// ── Search ───────────────────────────────────────────────
async function searchParticipants() {
  const name = document.getElementById('search-p-name').value.trim();
  const email = document.getElementById('search-p-email').value.trim();
  let url = '/participants/';
  if (email) url = `/participants/search?email=${encodeURIComponent(email)}`;
  else if (name) url = `/participants/search?name=${encodeURIComponent(name)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    document.getElementById('p-count').textContent = `${data.length} found`;
    renderParticipants(data);
  } catch (e) { showAlert('Search failed.', 'error'); }
}

// ── Edit Modal ───────────────────────────────────────────
async function openEditModal(id) {
  try {
    const res = await fetch(`/participants/${id}`);
    const p = await res.json();
    document.getElementById('edit-p-id').value = p.participant_id;
    document.getElementById('edit-p-name').value = p.name;
    document.getElementById('edit-p-email').value = p.email;
    document.getElementById('edit-p-phone').value = p.phone || '';
    document.getElementById('edit-p-address').value = p.address || '';
    document.getElementById('edit-modal').classList.add('active');
  } catch (e) { showAlert('Failed to load participant data.', 'error'); }
}

function closeModal() {
  document.getElementById('edit-modal').classList.remove('active');
}

async function updateParticipant() {
  const id = document.getElementById('edit-p-id').value;
  const payload = {
    name: document.getElementById('edit-p-name').value.trim(),
    email: document.getElementById('edit-p-email').value.trim(),
    phone: document.getElementById('edit-p-phone').value.trim(),
    address: document.getElementById('edit-p-address').value.trim()
  };
  try {
    const res = await fetch(`/participants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      showAlert('Participant updated successfully!');
      closeModal();
      loadParticipants();
    } else {
      showAlert(data.detail || 'Update failed.', 'error');
    }
  } catch (e) { showAlert('Server error.', 'error'); }
}

// ── Delete ───────────────────────────────────────────────
async function deleteParticipant(id, name) {
  if (!confirm(`Delete participant "${name}"?\nTheir registrations will also be removed.`)) return;
  try {
    const res = await fetch(`/participants/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showAlert('Participant deleted.');
      loadParticipants();
    } else {
      showAlert(data.detail || 'Delete failed.', 'error');
    }
  } catch (e) { showAlert('Server error.', 'error'); }
}

document.getElementById('edit-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

loadParticipants();
