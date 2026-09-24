import {noticeEmoji} from '../Constants/theme';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// '2026-09-28' -> '28 Sep'
export const fmtDay = iso => {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${+d} ${MON[+m - 1]}`;
};

// '16:00:00' -> '4:00 PM'
export const fmtTime = t => {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${((+h + 11) % 12) + 1}:${m} ${+h >= 12 ? 'PM' : 'AM'}`;
};

// Date -> '27 Sep, 6:00 PM'
export const fmtDateTime = date => {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${MON[date.getMonth()]}, ${fmtTime(`${hh}:${mm}`)}`;
};

// The database has no colour / emoji columns, so the look of a card comes from its `category`
const CATEGORY_STYLE = {
  workshop: ['b', '🛠️'], seminar: ['b', '🎓'], webinar: ['b', '💻'], academic: ['b', '📚'],
  hackathon: ['e', '💻'], competition: ['e', '🏅'], technical: ['b', '💻'],
  cultural: ['d', '🎭'], fest: ['d', '🎉'], sports: ['a', '🏆'],
  social: ['c', '🤝'], camp: ['a', '🩸'], awareness: ['c', '🌱'],
};
const FALLBACK = ['b', 'a', 'c', 'd', 'e'];

const styleFor = (category, id) => {
  const hit = CATEGORY_STYLE[String(category).toLowerCase()];
  if (hit) return hit;
  const sum = [...String(id)].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return [FALLBACK[sum % FALLBACK.length], '📅'];
};

const CLUB_EMOJI = {TECH: '💻', CULT: '🎭', SPORTS: '🏆'};
export const clubEmoji = code => CLUB_EMOJI[code] || '🎯';

export const flatten = tree => Object.values(tree).flatMap(group => Object.values(group).flat());

// One row of the `events` table -> the object the cards/sheets render
export function mapPost(r) {
  const base = {
    id: r.id, kind: r.content_type, title: r.title, category: r.category,
    departmentId: r.department_id, clubId: r.club_id, visibility: r.visibility,
    status: r.status, createdAt: r.created_at, imageUrl: r.image_url,
  };
  if (r.content_type === 'notice') {
    const d = new Date(r.created_at);
    return {
      ...base, source: r.organizer_name, text: r.description, tag: r.category,
      date: `${MON[d.getMonth()]} ${d.getDate()}`,
      icon: noticeEmoji[r.category] || '🔔',
    };
  }
  const [grad, emoji] = styleFor(r.category, r.id);
  return {
    ...base, grad, emoji, org: r.organizer_name, desc: r.description,
    dateISO: r.event_date, date: fmtDay(r.event_date),
    time: r.end_time ? `${fmtTime(r.start_time)} – ${fmtTime(r.end_time)}` : fmtTime(r.start_time),
    venue: r.venue, live: r.status === 'live',
    registrationRequired: !!r.registration_required,
    deadline: r.registration_deadline ? new Date(r.registration_deadline) : null,
    capacity: r.capacity,
  };
}

// Groups posts exactly like the UI: University | Departments (by dept code) | Clubs (by club name).
// A post with department_id goes under Departments, else club_id -> Clubs, else University-wide.
export function buildTree(items, departments, clubs) {
  const deptCode = Object.fromEntries(departments.map(d => [d.id, d.code]));
  const clubName = Object.fromEntries(clubs.map(c => [c.id, c.name]));
  const tree = {
    University: {All: []},
    Departments: Object.fromEntries(departments.map(d => [d.code, []])),
    Clubs: Object.fromEntries(clubs.map(c => [c.name, []])),
  };
  items.forEach(i => {
    if (deptCode[i.departmentId]) tree.Departments[deptCode[i.departmentId]].push(i);
    else if (clubName[i.clubId]) tree.Clubs[clubName[i.clubId]].push(i);
    else tree.University.All.push(i);
  });
  return tree;
}
