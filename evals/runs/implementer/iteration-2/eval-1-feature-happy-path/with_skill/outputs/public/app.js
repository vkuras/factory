const list = document.getElementById('tasks');
const empty = document.getElementById('empty');
const errorBox = document.getElementById('error');
const form = document.getElementById('new-task');
const titleInput = document.getElementById('title');
const dueDateInput = document.getElementById('due-date');

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

// The word carries the meaning, the colour only reinforces it (QE6). Upcoming
// and no-day tasks get no word (S6.3, S6.4).
function dueLabel(task) {
  if (task.dueState === 'overdue') return `Overdue ${task.dueDate}`;
  if (task.dueState === 'due-today') return `Due today ${task.dueDate}`;
  if (task.dueState === 'upcoming') return task.dueDate;
  return null;
}

function render(tasks) {
  list.replaceChildren();
  empty.hidden = tasks.length > 0;
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

    li.append(checkbox, title);

    const label = dueLabel(task);
    if (label) {
      const due = document.createElement('span');
      due.className = `due ${task.dueState}`;
      due.textContent = label;
      li.append(due);
    }

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.addEventListener('click', () => destroy(task));

    li.append(remove);
    list.append(li);
  }
}

async function load() {
  const response = await fetch('/api/tasks');
  const body = await response.json();
  render(body.tasks);
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
    body: JSON.stringify({ title: titleInput.value, dueDate: dueDateInput.value || null }),
  });
  if (!response.ok) {
    const body = await response.json();
    showError(body.error);
    return;
  }
  titleInput.value = '';
  dueDateInput.value = '';
  await load();
});

load();
