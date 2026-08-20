// ── Utilities ────────────────────────────────────────────
function showAlert(message, type = 'success') {
  const container = document.getElementById('alert-container');
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.innerHTML = `${type === 'success' ? '✅' : '❌'} ${message}`;
  container.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

function statusBadge(status) {
  const map = {
    'Registered': 'badge-info',
    'Confirmed': 'badge-success',
    'Waitlisted': 'badge-warning',
    'Attended': 'badge-secondary',
    'Cancelled': 'badge-danger'
  };
  return `<span class="badge ${map[status] || 'badge-secondary'}">${status}</span>`;
}

// ── Populate Dropdowns ───────────────────────────────────
async function populateDropdowns() {
  try {
    const [evRes, pRes] = await Promise.all([fetch('/events/'), fetch('/participants/')]);
    const events = await evRes.json();
    const participants = await pRes.json();

    const evSel = document.getElementById('reg-event');
    evSel.innerHTML = '<option value="">-- Choose Event --</option>' +
      events.map(e => `<option value="${e.event_id}">${e.event_name} (${e.event_date})</option>`).join('');

    const pSel = document.getElementById('reg-participant');
    pSel.innerHTML = '<option value="">-- Choose Participant --</option>' +
      participants.map(p => `<option value="${p.participant_id}">${p.name} (${p.email})</option>`).join('');
  } catch (e) { showAlert('Failed to load dropdown data.', 'error'); }
}

// ── Load Registrations ───────────────────────────────────
async function loadRegistrations() {
  const tbody = document.getElementById('registrations-table-body');
  tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon">⏳</div><p>Loading…</p></div></td></tr>';
  try {
    const res = await fetch('/registrations/');
    const data = await res.json();
    document.getElementById('reg-count').textContent = `${data.length} registrations`;
    renderRegistrations(data);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon">❌</div><p>Failed to load.</p></div></td></tr>';
  }
}

function renderRegistrations(regs) {
  const tbody = document.getElementById('registrations-table-body');
  if (!regs.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon">📭</div><p>No registrations found.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = regs.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${r.event_name}</strong></td>
      <td>${r.participant_name}</td>
      <td>📧 ${r.participant_email}</td>
      <td>${r.registration_date}</td>
      <td>${statusBadge(r.status)}</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-warning btn-sm btn-icon" onclick="openEditModal(${r.registration_id}, '${r.status}', '${r.registration_date}')" title="Edit">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="cancelRegistration(${r.registration_id})" title="Cancel">🚫</button>
        </div>
      </td>
    </tr>`).join('');
}

// ── Register Participant ─────────────────────────────────
async function registerParticipant() {
  const event_id = document.getElementById('reg-event').value;
  const participant_id = document.getElementById('reg-participant').value;
  const registration_date = document.getElementById('reg-date').value;
  const status = document.getElementById('reg-status').value;

  if (!event_id || !participant_id || !registration_date) {
    showAlert('Please fill all required fields.', 'error'); return;
  }

  try {
    const res = await fetch('/registrations/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: parseInt(event_id), participant_id: parseInt(participant_id), registration_date, status })
    });
    const data = await res.json();
    if (res.ok) {
      showAlert('Registration successful!');
      clearRegForm();
      loadRegistrations();
    } else {
      showAlert(data.detail || 'Registration failed.', 'error');
    }
  } catch (e) { showAlert('Server error.', 'error'); }
}

function clearRegForm() {
  document.getElementById('reg-event').value = '';
  document.getElementById('reg-participant').value = '';
  document.getElementById('reg-date').value = '';
  document.getElementById('reg-status').value = 'Registered';
}

// ── Search ───────────────────────────────────────────────
async function searchRegistrations() {
  const pName = document.getElementById('search-reg-participant').value.trim();
  const eName = document.getElementById('search-reg-event').value.trim();
  let url = '/registrations/';
  if (eName) url = `/registrations/search?event_name=${encodeURIComponent(eName)}`;
  else if (pName) url = `/registrations/search?participant_name=${encodeURIComponent(pName)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    document.getElementById('reg-count').textContent = `${data.length} found`;
    renderRegistrations(data);
  } catch (e) { showAlert('Search failed.', 'error'); }
}

// ── Edit Modal ───────────────────────────────────────────
function openEditModal(id, status, regDate) {
  document.getElementById('edit-reg-id').value = id;
  document.getElementById('edit-reg-status').value = status;
  document.getElementById('edit-reg-date').value = regDate;
  document.getElementById('edit-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('edit-modal').classList.remove('active');
}

async function updateRegistration() {
  const id = document.getElementById('edit-reg-id').value;
  const status = document.getElementById('edit-reg-status').value;
  const registration_date = document.getElementById('edit-reg-date').value;
  try {
    const res = await fetch(`/registrations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, registration_date })
    });
    const data = await res.json();
    if (res.ok) {
      showAlert('Registration updated!');
      closeModal();
      loadRegistrations();
    } else {
      showAlert(data.detail || 'Update failed.', 'error');
    }
  } catch (e) { showAlert('Server error.', 'error'); }
}

// ── Cancel Registration ──────────────────────────────────
async function cancelRegistration(id) {
  if (!confirm('Cancel this registration?')) return;
  try {
    const res = await fetch(`/registrations/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showAlert('Registration cancelled.');
      loadRegistrations();
    } else {
      showAlert(data.detail || 'Cancel failed.', 'error');
    }
  } catch (e) { showAlert('Server error.', 'error'); }
}

document.getElementById('edit-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// Set today's date as default
document.getElementById('reg-date').valueAsDate = new Date();

// Init
populateDropdowns();
loadRegistrations();
