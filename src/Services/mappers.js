import {noticeEmoji} from '../Constants/theme';
import {supabase} from './supabase';

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

const imageUrlFor = (path, contentType) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const objectPath = path.replace(/^\/+/, '');
  const folder = contentType === 'notice' ? 'Notice Folder' : 'Events Folder';
  const pathWithFolder = objectPath.includes('/') ? objectPath : `${folder}/${objectPath}`;
  return supabase.storage.from('event-posters').getPublicUrl(pathWithFolder).data.publicUrl;
};

export const flatten = tree => Object.values(tree).flatMap(value =>
  Array.isArray(value) ? value : flatten(value),
);

// One row of the `events` table -> the object the cards/sheets render
export function mapPost(r) {
  const base = {
    id: r.id, kind: r.content_type, title: r.title, category: r.category,
    organizerScope: r.organizer_scope || (r.department_id ? 'department' : r.club_id ? 'club' : 'university'),
    departmentId: r.department_id, skillFacultyId: r.skill_faculty_id, clubId: r.club_id, visibility: r.visibility,
    status: r.status, createdAt: r.created_at, imageUrl: imageUrlFor(r.image_url, r.content_type),
  };
  if (r.content_type === 'notice') {
    const d = new Date(r.created_at);
    const storedAttachmentType = String(r.attachment_type || '').toLowerCase();
    const attachmentType = ['pdf', 'image'].includes(storedAttachmentType)
      ? storedAttachmentType
      : (r.attachment_url ? (/\.pdf(?:$|[?#])/i.test(r.attachment_url) ? 'pdf' : 'image') : null);
    return {
      ...base, source: r.organizer_name, text: r.description, tag: r.category,
      date: `${MON[d.getMonth()]} ${d.getDate()}`,
      icon: noticeEmoji[r.category] || '🔔',
      attachmentUrl: imageUrlFor(r.attachment_url, 'notice'),
      attachmentType,
      attachmentName: r.attachment_name || null,
    };
  }
  const [grad, emoji] = styleFor(r.category, r.id);
  return {
    ...base, grad, emoji, org: r.organizer_name, desc: r.description,
    dateISO: r.event_date, date: fmtDay(r.event_date) || 'Date TBA',
    time: r.start_time ? (r.end_time ? `${fmtTime(r.start_time)} – ${fmtTime(r.end_time)}` : fmtTime(r.start_time)) : 'Time TBA',
    venue: r.venue, live: r.status === 'live',
    registrationRequired: !!r.registration_required,
    deadline: r.registration_deadline ? new Date(r.registration_deadline) : null,
    capacity: r.capacity,
  };
}

// Groups posts by their explicit organizer_scope and uses the related table for option labels.
export function buildTree(items, skillFaculties, departments, clubs) {
  const departmentById = Object.fromEntries(departments.map(department => [department.id, department]));
  const facultyById = Object.fromEntries(skillFaculties.map(faculty => [faculty.id, faculty]));
  const clubById = Object.fromEntries(clubs.map(c => [c.id, c]));
  const tree = {
    University: {All: []},
    'Skill Faculty': Object.fromEntries(skillFaculties.map(faculty => [
      faculty.code,
      Object.fromEntries([
        ['__all_departments__', []],
        ...departments
          .filter(department => department.skill_faculty_id === faculty.id)
          .map(department => [department.code, []]),
      ]),
    ])),
    Clubs: Object.fromEntries(clubs.map(c => [c.name, []])),
  };
  items.forEach(i => {
    if (i.organizerScope === 'skill_faculty') {
      const faculty = facultyById[i.skillFacultyId];
      if (faculty && tree['Skill Faculty'][faculty.code]) {
        tree['Skill Faculty'][faculty.code].__all_departments__.push({
          ...i,
          scopeLabel: faculty.code,
          scopeName: faculty.name,
          skillFacultyName: faculty.name,
        });
      }
    } else if (i.organizerScope === 'department') {
      const department = departmentById[i.departmentId];
      const faculty = department
        ? facultyById[department.skill_faculty_id]
        : facultyById[i.skillFacultyId] || facultyById[i.departmentId];
      if (faculty && tree['Skill Faculty'][faculty.code]) {
        const departmentKey = department?.code || '__all_departments__';
        if (tree['Skill Faculty'][faculty.code][departmentKey]) {
          tree['Skill Faculty'][faculty.code][departmentKey].push({
            ...i,
            scopeLabel: department?.code || faculty.code,
            scopeName: department?.name || faculty.name,
            skillFacultyName: faculty.name,
          });
        }
      }
    } else if (i.organizerScope === 'club' && clubById[i.clubId]) {
      const club = clubById[i.clubId];
      tree.Clubs[club.name].push({...i, scopeLabel: club.code || club.name, scopeName: club.name});
    } else {
      tree.University.All.push(i);
    }
  });
  return tree;
}
