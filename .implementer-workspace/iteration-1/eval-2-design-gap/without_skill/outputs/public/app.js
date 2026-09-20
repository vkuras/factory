const list = document.getElementById('tasks');
const empty = document.getElementById('empty');
const noMatch = document.getElementById('no-match');
const errorBox = document.getElementById('error');
const form = document.getElementById('new-task');
const titleInput = document.getElementById('title');
const searchInput = document.getElementById('search');
const openOnlyInput = document.getElementById('open-only');

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

// S5.5: an empty result while filtering gets its own message instead of the
// 001 "No tasks yet." empty state.
function isFiltering() {
  return searchInput.value !== '' || openOnlyInput.checked;
}

function render(tasks, query) {
  list.replaceChildren();
  const filtering = isFiltering();
  empty.hidden = tasks.length > 0 || filtering;
  noMatch.hidden = tasks.length > 0 || !filtering;
  if (noMatch.hidden === false) {
    noMatch.textContent = query ? `No task matches "${query}".` : 'No task matches.';
  }
  for (const task of tasks) {
    const li = document.createElement('li');
    li.className = task.done ? 'done' : '';
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', `Mark "${task.title}" as done`);
    checkbox.addEventListener('change', () => toggle(task, checkbox.checked));

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = task.title;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.addEventListener('click', () => destroy(task));

    li.append(checkbox, title, remove);
    list.append(li);
  }
}

async function load() {
  const params = new URLSearchParams();
  if (searchInput.value) params.set('q', searchInput.value);
  if (openOnlyInput.checked) params.set('open', 'true');
  const query = params.toString();
  const response = await fetch(`/api/tasks${query ? `?${query}` : ''}`);
  const body = await response.json();
  render(body.tasks, searchInput.value);
}

async function toggle(task, done) {
  await fetch(`/api/tasks/${task.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done }),
  });
  await load();
}

async function destroy(task) {
  await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
  await load();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showError('');
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: titleInput.value }),
  });
  if (!response.ok) {
    const body = await response.json();
    showError(body.error);
    return;
  }
  titleInput.value = '';
  await load();
});

// S5.1/S5.4: a request and re-render on every keystroke, no button.
searchInput.addEventListener('input', load);
// S6.1/S6.3: toggling "open only" re-filters immediately.
openOnlyInput.addEventListener('change', load);

load();
