const form = document.getElementById('add-form');
const input = document.getElementById('habit-input');
const list = document.getElementById('habit-list');
const emptyMessage = document.getElementById('empty-message');

const habits = [];

function render() {
  list.replaceChildren();

  for (const habit of habits) {
    const item = document.createElement('li');
    item.textContent = habit;
    list.appendChild(item);
  }

  emptyMessage.hidden = habits.length > 0;
}

// Submitting the form covers both the Add button and pressing Enter.
form.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = input.value.trim();
  if (!name) return;

  habits.push(name);
  input.value = '';
  input.focus();
  render();
});

render();
