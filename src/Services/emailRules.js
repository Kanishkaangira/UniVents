import {UNIVERSITY_EMAIL_DOMAIN} from '../Constants/env';

// Student enrollment numbers are derived from roll-number emails. Faculty
// accounts may use a username before the same university email domain.
const ROLL_NUMBER = /^(?=.*\d)[a-z0-9]{4,20}$/;

export const ROLL_EMAIL_EXAMPLE = `2301234${UNIVERSITY_EMAIL_DOMAIN}`;

export const isUniversityEmail = email => {
  const mail = String(email || '').trim().toLowerCase();
  return /^[a-z0-9._-]+@svsu[.]ac[.]in$/.test(mail);
};

// '2301234@svsu.ac.in' -> '2301234'   (anything else -> null)
export const rollNumberFromEmail = email => {
  const mail = String(email || '').trim().toLowerCase();
  if (!isUniversityEmail(mail)) return null;
  const roll = mail.slice(0, mail.length - UNIVERSITY_EMAIL_DOMAIN.length);
  return ROLL_NUMBER.test(roll) ? roll : null;
};
