import emailjs from "emailjs-com";
import { format, parseISO } from "date-fns";

// Sends the proposal email with the confirm link
export function sendProposalEmail({
  to_email,
  to_name,
  from_name,
  from_email,
  day,
  date,
  time,
  location,
  note,        // <-- Use 'note' for proposal emails!
  gameType,
  raceLength
}) {
  // SAFETY CHECK
  if (!to_email || to_email === "undefined") {
    alert("Recipient email is missing. Cannot send proposal.");
    return Promise.reject(new Error("Recipient email is missing."));
  }
  if (!from_email || from_email === "undefined") {
    alert("Your email is missing. Cannot send proposal.");
    return Promise.reject(new Error("Sender email is missing."));
  }

  const formattedDate = format(parseISO(date), "MM-dd-yyyy");
  const matchDetails = {
    from: from_name,
    to: to_name,
    day,
    date: formattedDate,
    time,
    location,
    note,               // <-- Use 'note' here
    proposerEmail: from_email,
    gameType,
    raceLength
  };
  const queryString = Object.entries(matchDetails)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  const confirmLink = `https://frbcapl.github.io/NEWAPP/#/confirm-match?${queryString}`;

  return emailjs.send(
    'service_l5q2047',
    'template_xu0tl3i',
    {
      to_email,
      to_name,
      from_name,
      day,
      date: formattedDate,
      time,
      location,
      note,              // <-- Use 'note' here
      gameType,
      raceLength,
      confirm_link: confirmLink,
    },
    'g6vqrOs_Jb6LL1VCZ'
  );
}

// Sends the confirmation email to the proposer
export function sendConfirmationEmail({
  to_email,
  to_name,
  day,
  date,
  time,
  location,
  proposal_note,        // <-- Use these for confirmation email
  confirmation_note,
  confirmed_by,
  gameType,
  raceLength
}) {
  return emailjs.send(
    'service_l5q2047',
    'template_dtc43h8',
    {
      to_email,
      to_name,
      day,
      date,
      time,
      location,
      proposal_note,     // <-- Use these for confirmation email
      confirmation_note,
      confirmed_by,
      gameType,
      raceLength,
    },
    'g6vqrOs_Jb6LL1VCZ'
  );
}
