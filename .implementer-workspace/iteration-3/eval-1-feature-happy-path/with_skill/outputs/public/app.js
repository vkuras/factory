const list = document.getElementById('tasks');
const empty = document.getElementById('empty');
const errorBox = document.getElementById('error');
const form = document.getElementById('new-task');
const titleInput = document.getElementById('title');
const dueDateInput = document.getElementById('due-date');

// "Overdue"/"Due today" carry the meaning; colour only reinforces it (QE6).
const DUE_LABELS = { overdue: 'Overdue', 'due-today': 'Due today' };

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
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

    // S6.1-S6.4: the marking after the title, only when there is a day.
    if (task.dueDate) {
      const due = document.createElement('span');
      const label = DUE_LABELS[task.dueState];
      due.className = task.dueState === 'overdue' ? 'due overdue' : 'due';
      due.textContent = label ? `${label} ${task.dueDate}` : task.dueDate;
      li.append(due);
    }

    // S5.3: lets a team member put a day on a task, or change it, in place.
    const dueEdit = document.createElement('input');
    dueEdit.type = 'date';
    dueEdit.className = 'row-due';
    dueEdit.value = task.dueDate ?? '';
    dueEdit.setAttribute('aria-label', `Set the day for "${task.title}"`);
    dueEdit.addEventListener('change', () => setDueDate(task, dueEdit.value || null));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.addEventListener('click', () => destroy(task));

    li.append(dueEdit, remove);
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

async function setDueDate(task, dueDate) {
  await fetch(`/api/tasks/${task.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dueDate }),
  });
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
