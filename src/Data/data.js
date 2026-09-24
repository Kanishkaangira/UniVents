// Sample data. Replace with API calls to your backend later – keep the same shape.
export const FACULTIES = {
  SFET: 'Skill Faculty of Engineering & Technology',
  SFASH: 'Skill Faculty of Applied Sciences & Humanities',
  SFMSR: 'Skill Faculty of Management Studies & Research',
  SFMAHS: 'Skill Faculty of Medical & Allied Health Sciences',
  SFA: 'Skill Faculty of Agriculture',
  SFIS: 'Skill Faculty of Interdisciplinary Studies',
  SFPVA: 'Skill Faculty of Performing and Visual Arts',
};

export const CLUBS = {'Technical Club': '💻', 'Sports Club': '🏆', 'Arts Club': '🎨'};

// Demo calendar month (September 2026, month index 8)
export const DEMO_MONTH = {year: 2026, month: 8, today: 24, label: 'September 2026'};

const ev = (id, title, org, date, time, venue, grad, emoji, desc, extra = {}) => ({
  id, title, org, date, time, venue, grad, emoji, desc,
  seats: 60 + ((title.length * 13) % 110), ...extra,
});
const nt = (id, title, source, date, text, tag, pinned = false) => ({
  id, title, source, date, text, tag, pinned,
});

// Same structure for Events and Notices: group -> sub-group -> items
export const EVENTS = {
  University: {
    All: [
      ev('u1', 'Blood Donation Camp', 'NSS', '28 Sep', '10:00 AM – 4:00 PM', 'Main Auditorium', 'a', '🩸', 'Donate blood and save lives. Refreshments and certificates for every donor.'),
      ev('u2', 'Annual Cultural Fest', 'Cultural Committee', '2 Oct', '6:00 PM onwards', 'Open Air Theatre', 'd', '🎭', 'Music, dance and drama performances from every faculty.'),
      ev('u3', 'Tree Plantation Drive', 'NSS', '5 Oct', '8:00 AM', 'Campus Garden', 'c', '🌱', 'Join us to plant 500 saplings across the campus.'),
    ],
  },
  Departments: {
    SFET: [
      ev('f1', 'AI/ML Workshop', 'SFET', '24 Sep', '11:00 AM – 1:00 PM', 'Seminar Hall', 'b', '🤖', 'Hands-on session on building and evaluating ML models.', {live: true}),
      ev('f2', 'SFET Hackathon', 'SFET', '30 Sep', '9:00 AM', 'Lab Block A', 'e', '💻', '24-hour hackathon. Teams of up to 4 students.'),
    ],
    SFASH: [ev('f3', 'Science Exhibition', 'SFASH', '1 Oct', '10:00 AM', 'Science Block', 'c', '🔬', 'Student models and experiments on display.')],
    SFMSR: [ev('f4', 'Startup Funding Talk', 'SFMSR', '3 Oct', '3:00 PM', 'Conference Hall', 'd', '🚀', 'Guest lecture by a venture investor.')],
    SFMAHS: [ev('f5', 'Health Check-up Camp', 'SFMAHS', '29 Sep', '9:00 AM', 'Medical Wing', 'a', '🩺', 'Free check-up open to all students and staff.')],
    SFA: [ev('f6', 'Smart Farming Expo', 'SFA', '4 Oct', '10:00 AM', 'Agri Field', 'c', '🌾', 'Drones, sensors and modern farming techniques.')],
    SFIS: [ev('f7', 'Design Thinking Jam', 'SFIS', '6 Oct', '2:00 PM', 'Innovation Lab', 'e', '💡', 'Cross-faculty team challenge.')],
    SFPVA: [ev('f8', 'Art Exhibition', 'SFPVA', '7 Oct', '11:00 AM', 'Gallery Hall', 'd', '🖼️', 'Paintings, sculpture and digital art by students.')],
  },
  Clubs: {
    'Technical Club': [ev('c1', 'Python Workshop', 'Technical Club', '3 Oct', '4:00 PM', 'Lab Block B', 'b', '🐍', 'Beginner-friendly Python workshop with live exercises.')],
    'Sports Club': [ev('c2', 'Inter-Faculty Cricket', 'Sports Club', '3 Oct', '8:00 AM', 'Main Ground', 'a', '🏏', 'Knockout tournament between faculty teams.')],
    'Arts Club': [ev('c3', 'Open Mic Night', 'Arts Club', '29 Sep', '6:30 PM', 'Student Cafe', 'd', '🎤', 'Sing, play or just enjoy the evening.')],
  },
};

export const NOTICES = {
  University: {
    All: [
      nt('n1', 'Mid-semester exam schedule released', 'Examination Cell', 'Sep 23', 'The timetable for mid-semester exams is now available.', 'Exams', true),
      nt('n2', 'Library hours extended', 'Library', 'Sep 22', 'The central library stays open until 10 PM during exams.', 'Library'),
      nt('n3', 'Holiday on Gandhi Jayanti', 'Registrar', 'Sep 20', 'The university will remain closed on 2 October.', 'Holiday'),
    ],
  },
  Departments: {
    SFET: [
      nt('n4', 'Lab timetable updated', 'SFET', 'Sep 24', 'New lab slots are live for all semesters.', 'Timetable', true),
      nt('n5', 'Project report deadline', 'SFET', 'Sep 21', 'Final-year reports are due by 10 October.', 'Deadline'),
    ],
    SFASH: [nt('n6', 'Practical file submission', 'SFASH', 'Sep 22', 'Submit lab files to your subject coordinator.', 'Deadline')],
    SFMSR: [nt('n7', 'Internship drive registrations', 'SFMSR', 'Sep 22', 'Register with the placement cell before 30 September.', 'Placement')],
    SFMAHS: [nt('n8', 'Clinical posting roster', 'SFMAHS', 'Sep 19', 'Roster for the next month is published.', 'Timetable')],
    SFA: [nt('n9', 'Field visit permission forms', 'SFA', 'Sep 18', 'Return signed forms by Friday.', 'Deadline')],
    SFIS: [nt('n10', 'Elective selection open', 'SFIS', 'Sep 20', 'Choose your electives on the portal.', 'Update')],
    SFPVA: [nt('n11', 'Studio safety induction', 'SFPVA', 'Sep 19', 'Attendance mandatory for first-year students.', 'Safety')],
  },
  Clubs: {
    'Technical Club': [nt('n12', 'Core team recruitment open', 'Technical Club', 'Sep 23', 'Applications close on 1 October.', 'Recruitment')],
    'Sports Club': [nt('n13', 'Ground booking rules', 'Sports Club', 'Sep 21', 'Book slots through the club coordinator.', 'Update')],
    'Arts Club': [nt('n14', 'Rehearsal room open hours', 'Arts Club', 'Sep 20', 'Open on weekdays from 3 to 6 PM.', 'Update')],
  },
};

export const flatten = data => Object.values(data).flatMap(group => Object.values(group).flat());
