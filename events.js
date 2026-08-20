// ── Utilities ────────────────────────────────────────────
function showAlert(message, type = 'success') {
  const container = document.getElementById('alert-container');
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.innerHTML = `${type === 'success' ? '✅' : '❌'} ${message}`;
  container.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

function statusBadge(date) {
  const today = new Date().toISOString().split('T')[0];
  if (date >= today) return '<span class="badge badge-success">Upcoming</span>';
  return '<span class="badge badge-secondary">Past</span>';
}

// ── Load All Events ──────────────────────────────────────
async function loadEvents() {
  const tbody = document.getElementById('events-table-body');
  tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><div class="icon">⏳</div><p>Loading…</p></div></td></tr>';
  try {
    const res = await fetch('/events/');
    const events = await res.json();
    document.getElementById('event-count').textContent = `${events.length} events`;
    renderEvents(events);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><div class="icon">❌</div><p>Failed to load events.</p></div></td></tr>';
  }
}

function renderEvents(events) {
  const tbody = document.getElementById('events-table-body');
  if (!events.length) {
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><div class="icon">📭</div><p>No events found.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = events.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${e.event_name}</strong></td>
      <td><span class="badge badge-info">${e.event_type}</span></td>
      <td>${e.event_date} ${statusBadge(e.event_date)}</td>
      <td>${e.event_time}</td>
      <td>📍 ${e.location}</td>
      <td>${e.capacity}</td>
      <td>
        <span class="badge ${(e.registered_count || 0) >= e.capacity ? 'badge-danger' : 'badge-success'}">
          ${e.registered_count || 0} / ${e.capacity}
        </span>
      </td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-warning btn-sm btn-icon" title="Edit" onclick="openEditModal(${e.event_id})">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="deleteEvent(${e.event_id}, '${e.event_name.replace(/'/g, "\\'")}')">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
}

// ── Add Event ────────────────────────────────────────────
async function addEvent() {
  const name = document.getElementById('ev-name').value.trim();
  const type = document.getElementById('ev-type').value;
  const date = document.getElementById('ev-date').value;
  const time = document.getElementById('ev-time').value;
  const location = document.getElementById('ev-location').value.trim();
  const capacity = document.getElementById('ev-capacity').value;
  const description = document.getElementById('ev-description').value.trim();

  if (!name || !type || !date || !time || !location || !capacity) {
    showAlert('Please fill all required fields.', 'error'); return;
  }

  try {
    const res = await fetch('/events/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: name, event_type: type, event_date: date, event_time: time, location, capacity: parseInt(capacity), description })
    });
    const data = await res.json();
    if (res.ok) {
      showAlert('Event added successfully!');
      clearEventForm();
      loadEvents();
    } else {
      showAlert(data.detail || 'Failed to add event.', 'error');
    }
  } catch (e) {
    showAlert('Server error. Please try again.', 'error');
  }
}

function clearEventForm() {
  ['ev-name', 'ev-date', 'ev-time', 'ev-location', 'ev-capacity', 'ev-description'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ev-type').value = '';
}

// ── Search Events ────────────────────────────────────────
async function searchEvents() {
  const name = document.getElementById('search-name').value.trim();
  const type = document.getElementById('search-type').value;
  let url = '/events/';
  if (name) url = `/events/search?name=${encodeURIComponent(name)}`;
  else if (type) url = `/events/type/${encodeURIComponent(type)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    document.getElementById('event-count').textContent = `${data.length} events`;
    renderEvents(data);
  } catch (e) {
    showAlert('Search failed.', 'error');
  }
}

async function loadUpcoming() {
  try {
    const res = await fetch('/events/upcoming');
    const data = await res.json();
    document.getElementById('event-count').textContent = `${data.length} upcoming`;
    renderEvents(data);
  } catch (e) { showAlert('Failed to load upcoming events.', 'error'); }
}

async function loadAvailable() {
  try {
    const res = await fetch('/events/available');
    const data = await res.json();
    document.getElementById('event-count').textContent = `${data.length} available`;
    renderEvents(data);
  } catch (e) { showAlert('Failed to load available events.', 'error'); }
}

// ── Edit Modal ───────────────────────────────────────────
async function openEditModal(id) {
  try {
    const res = await fetch(`/events/${id}`);
    const e = await res.json();
    document.getElementById('edit-ev-id').value = e.event_id;
    document.getElementById('edit-ev-name').value = e.event_name;
    document.getElementById('edit-ev-type').value = e.event_type;
    document.getElementById('edit-ev-date').value = e.event_date;
    document.getElementById('edit-ev-time').value = e.event_time ? e.event_time.substring(0,5) : '';
    document.getElementById('edit-ev-location').value = e.location;
    document.getElementById('edit-ev-capacity').value = e.capacity;
    document.getElementById('edit-ev-description').value = e.description || '';
    document.getElementById('edit-modal').classList.add('active');
  } catch (err) { showAlert('Failed to load event data.', 'error'); }
}

function closeModal() {
  document.getElementById('edit-modal').classList.remove('active');
}

async function updateEvent() {
  const id = document.getElementById('edit-ev-id').value;
  const payload = {
    event_name: document.getElementById('edit-ev-name').value.trim(),
    event_type: document.getElementById('edit-ev-type').value,
    event_date: document.getElementById('edit-ev-date').value,
    event_time: document.getElementById('edit-ev-time').value,
    location: document.getElementById('edit-ev-location').value.trim(),
    capacity: parseInt(document.getElementById('edit-ev-capacity').value),
    description: document.getElementById('edit-ev-description').value.trim()
  };
  try {
    const res = await fetch(`/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      showAlert('Event updated successfully!');
      closeModal();
      loadEvents();
    } else {
      showAlert(data.detail || 'Update failed.', 'error');
    }
  } catch (e) { showAlert('Server error.', 'error'); }
}

// ── Delete Event ─────────────────────────────────────────
async function deleteEvent(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?\nAll registrations for this event will also be removed.`)) return;
  try {
    const res = await fetch(`/events/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showAlert('Event deleted successfully!');
      loadEvents();
    } else {
      showAlert(data.detail || 'Delete failed.', 'error');
    }
  } catch (e) { showAlert('Server error.', 'error'); }
}

// Close modal on overlay click
document.getElementById('edit-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// Init
loadEvents();
