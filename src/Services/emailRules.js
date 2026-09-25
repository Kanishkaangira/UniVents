import {UNIVERSITY_EMAIL_DOMAIN} from '../Constants/env';

// New accounts must use a roll-number email:  <rollno>@svsu.ac.in
// Roll number = letters/digits only (no dots, no +tags), 4-20 characters, at least one digit.
// Keep this in sync with the SQL hook in supabase/account_setup.sql.
const ROLL_NUMBER = /^(?=.*\d)[a-z0-9]{4,20}$/;

export const ROLL_EMAIL_EXAMPLE = `2301234${UNIVERSITY_EMAIL_DOMAIN}`;

export const isUniversityEmail = email => {
  const mail = String(email || '').trim().toLowerCase();
  return mail.split('@').length === 2 && mail.endsWith(UNIVERSITY_EMAIL_DOMAIN) && mail.length > UNIVERSITY_EMAIL_DOMAIN.length;
};

// '2301234@svsu.ac.in' -> '2301234'   (anything else -> null)
export const rollNumberFromEmail = email => {
  const mail = String(email || '').trim().toLowerCase();
  if (!isUniversityEmail(mail)) return null;
  const roll = mail.slice(0, mail.length - UNIVERSITY_EMAIL_DOMAIN.length);
  return ROLL_NUMBER.test(roll) ? roll : null;
};
