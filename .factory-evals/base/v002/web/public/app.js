const list = document.getElementById('tasks');
const form = document.getElementById('new-task');
const errorBox = document.getElementById('error');

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function render(tasks) {
  list.replaceChildren(
    ...tasks.map((task) => {
      const li = document.createElement('li');
      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = task.title;
      li.append(title);
      if (task.dueDate) {
        const due = document.createElement('span');
        due.className = 'due';
        due.textContent = formatDate(task.dueDate);
        li.append(due);
      }
      if (task.overdueLabel) {
        const overdue = document.createElement('span');
        overdue.className = 'overdue';
        overdue.textContent = task.overdueLabel;
        li.append(overdue);
      }
      const done = document.createElement('button');
      done.textContent = 'Erledigt';
      done.addEventListener('click', async () => {
        await fetch(`/api/tasks/${task.id}/done`, { method: 'POST' });
        load();
      });
      li.append(done);
      return li;
    })
  );
  document.getElementById('empty').hidden = tasks.length > 0;
}

async function load() {
  const onlyOverdue = document.getElementById('only-overdue').checked;
  const res = await fetch(onlyOverdue ? '/api/tasks?filter=overdue' : '/api/tasks');
  render(await res.json());
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = { title: form.title.value, dueDate: form.dueDate.value || null };
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    errorBox.textContent = (await res.json()).error;
    errorBox.hidden = false;
    return;
  }
  errorBox.hidden = true;
  form.reset();
  load();
});

document.getElementById('only-overdue').addEventListener('change', load);

load();
