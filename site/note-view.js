export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

export function getCategories(notes) {
  return ['全部', ...new Set(notes.filter(note => !note.draft).map(note => note.category))];
}

export function filterNotes(notes, category = '全部', query = '') {
  const keyword = query.trim().toLowerCase();
  return notes.filter(note => {
    const haystack = [note.title, note.summary, note.category, ...(note.tags || [])].join(' ').toLowerCase();
    return !note.draft && (category === '全部' || note.category === category) && (!keyword || haystack.includes(keyword));
  }).sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
}

export function latestUpdate(notes) {
  return filterNotes(notes)[0]?.updated || '';
}
