const form = document.getElementById('add-form');
const input = document.getElementById('habit-input');
const list = document.getElementById('habit-list');
const emptyMessage = document.getElementById('empty-message');

const STORAGE_KEY = 'habit-tracker.habits';

function loadHabits() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    return saved.filter((habit) => typeof habit === 'string');
  } catch (error) {
    return [];
  }
}

function saveHabits() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch (error) {
    alert('Your habits could not be saved, so they may be gone after you reload the page.');
  }
}

const habits = loadHabits();

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
  saveHabits();
});

render();
