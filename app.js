const form = document.getElementById('add-form');
const input = document.getElementById('habit-input');
const list = document.getElementById('habit-list');
const emptyMessage = document.getElementById('empty-message');
const saveMessage = document.getElementById('save-message');

const STORAGE_KEY = 'habit-tracker.habits';

// A habit is { name, doneDates }, where doneDates holds local dates as 'YYYY-MM-DD'.
function loadHabits() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    return saved.map(toHabit).filter(Boolean);
  } catch (error) {
    return [];
  }
}

// Habits saved before ticking existed are plain name strings.
function toHabit(entry) {
  if (typeof entry === 'string') return { name: entry, doneDates: [] };
  if (!entry || typeof entry.name !== 'string') return null;

  const doneDates = Array.isArray(entry.doneDates)
    ? entry.doneDates.filter((date) => typeof date === 'string')
    : [];
  return { name: entry.name, doneDates };
}

function saveHabits() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    saveMessage.hidden = true;
  } catch (error) {
    saveMessage.hidden = false;
  }
}

// Uses the local date, so the day changes at the user's midnight rather than UTC's.
function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function toggleToday(habit) {
  const today = todayKey();
  const done = !habit.doneDates.includes(today);

  if (done) {
    habit.doneDates.push(today);
  } else {
    habit.doneDates = habit.doneDates.filter((date) => date !== today);
  }

  saveHabits();
  return done;
}

const habits = loadHabits();

// The day the list was last drawn for, so a page left open past midnight can be noticed.
let renderedDay;

// Redraws the list if the day has changed since it was drawn. Returns whether it did.
function renderIfNewDay() {
  if (renderedDay === todayKey()) return false;
  render();
  return true;
}

function render() {
  const today = todayKey();
  renderedDay = today;
  list.replaceChildren();

  for (const habit of habits) {
    const item = document.createElement('li');
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    const name = document.createElement('span');

    checkbox.type = 'checkbox';
    checkbox.checked = habit.doneDates.includes(today);
    item.classList.toggle('done', checkbox.checked);
    name.textContent = habit.name;

    checkbox.addEventListener('change', () => {
      // A tick made on yesterday's list is not recorded; the fresh list is shown instead.
      if (renderIfNewDay()) return;

      const done = toggleToday(habit);
      checkbox.checked = done;
      item.classList.toggle('done', done);
    });

    label.append(checkbox, name);
    item.appendChild(label);
    list.appendChild(item);
  }

  emptyMessage.hidden = habits.length > 0;
}

// Submitting the form covers both the Add button and pressing Enter.
form.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = input.value.trim();
  if (!name) return;

  habits.push({ name, doneDates: [] });
  input.value = '';
  input.focus();
  render();
  saveHabits();
});

// A tab left open overnight should show the new day's ticks when it is looked at again.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) renderIfNewDay();
});

render();
