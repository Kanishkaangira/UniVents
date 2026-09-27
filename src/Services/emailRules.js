import {UNIVERSITY_EMAIL_DOMAIN} from '../Constants/env';

// Some students use a roll-number email, while others and faculty use names.
// Enrollment numbers are collected separately in the student profile.
const ROLL_NUMBER = /^(?=.*\d)[a-z0-9]{4,20}$/;
export const ROLL_EMAIL_EXAMPLE = `2301234${UNIVERSITY_EMAIL_DOMAIN}`;

export const isUniversityEmail = email => {
  const mail = String(email || '').trim().toLowerCase();
  const domain = UNIVERSITY_EMAIL_DOMAIN.toLowerCase();
  const at = mail.lastIndexOf('@');
  return at > 0 && mail.endsWith(domain) && !mail.slice(0, at).includes('@');
};

// '2301234@svsu.ac.in' -> '2301234' (other email usernames -> null)
export const rollNumberFromEmail = email => {
  const mail = String(email || '').trim().toLowerCase();
  if (!isUniversityEmail(mail)) return null;
  const roll = mail.slice(0, mail.length - UNIVERSITY_EMAIL_DOMAIN.length);
  return ROLL_NUMBER.test(roll) ? roll : null;
};
