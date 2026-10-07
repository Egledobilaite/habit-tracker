const form = document.getElementById('add-form');
const input = document.getElementById('habit-input');
const list = document.getElementById('habit-list');
const emptyMessage = document.getElementById('empty-message');
const counter = document.getElementById('counter');
const counterText = document.getElementById('counter-text');
const counterAllDone = document.getElementById('counter-all-done');
const saveMessage = document.getElementById('save-message');
const undoMessage = document.getElementById('undo-message');
const undoText = document.getElementById('undo-text');
const undoButton = document.getElementById('undo-button');

const STORAGE_KEY = 'habit-tracker.habits';
const UNDO_MS = 5000;

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

// A deleted habit is hidden straight away but stays in the saved data until the undo time runs out.
let pendingDelete = null;
let pendingTimer;

function deleteHabit(habit) {
  // Only one delete can be undone at a time, so an earlier one becomes permanent now.
  finishDelete();

  pendingDelete = habit;
  pendingTimer = setTimeout(finishDelete, UNDO_MS);
  undoText.textContent = `Deleted "${habit.name}".`;
  undoMessage.hidden = false;
  render();
}

function finishDelete() {
  if (!pendingDelete) return;

  clearTimeout(pendingTimer);
  habits.splice(habits.indexOf(pendingDelete), 1);
  pendingDelete = null;
  undoMessage.hidden = true;
  saveHabits();
}

function undoDelete() {
  clearTimeout(pendingTimer);
  pendingDelete = null;
  undoMessage.hidden = true;
  render();
}

// A habit waiting out its undo time is already hidden, so it is not counted.
function updateCounter() {
  const today = todayKey();
  const shown = habits.filter((habit) => habit !== pendingDelete);
  const done = shown.filter((habit) => habit.doneDates.includes(today)).length;

  counter.hidden = shown.length === 0;
  counterText.textContent = `${done} of ${shown.length} done today`;
  counterAllDone.hidden = done < shown.length;
}

function render() {
  const today = todayKey();
  const shown = habits.filter((habit) => habit !== pendingDelete);
  renderedDay = today;
  list.replaceChildren();

  for (const habit of shown) {
    const item = document.createElement('li');
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    const name = document.createElement('span');
    const remove = document.createElement('button');

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
      updateCounter();
    });

    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${habit.name}`);
    remove.addEventListener('click', () => deleteHabit(habit));

    label.append(checkbox, name);
    item.append(label, remove);
    list.appendChild(item);
  }

  emptyMessage.hidden = shown.length > 0;
  updateCounter();
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

undoButton.addEventListener('click', undoDelete);

// A tab left open overnight should show the new day's ticks when it is looked at again.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) renderIfNewDay();
});

render();
