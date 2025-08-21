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
  raceLength,
  proposalId
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
    raceLength,
    proposalId
  };
  const queryString = Object.entries(matchDetails)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  // Always use production URL for email links
  const baseUrl = "https://newapp-1-ic1v.onrender.com";
  const confirmLink = `${baseUrl}/#/confirm-match?${queryString}`;
  const counterProposeLink = `${baseUrl}/#/confirm-match?${queryString}`;

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
      counter_propose_link: counterProposeLink,
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

// Sends deadline reminder emails for Phase 1
export function sendDeadlineReminderEmail({
  to_email,
  to_name,
  division,
  daysUntilDeadline,
  completedMatches,
  totalRequiredMatches,
  deadlineDate,
  remainingMatches
}) {
  // SAFETY CHECK
  if (!to_email || to_email === "undefined") {
    console.error("Recipient email is missing. Cannot send deadline reminder.");
    return Promise.reject(new Error("Recipient email is missing."));
  }

  const progressPercentage = Math.round((completedMatches / totalRequiredMatches) * 100);
  const urgencyLevel = daysUntilDeadline <= 1 ? "CRITICAL" : 
                      daysUntilDeadline <= 3 ? "URGENT" : 
                      daysUntilDeadline <= 7 ? "WARNING" : "REMINDER";

  return emailjs.send(
    'service_l5q2047',
    'template_xbpnbge',
    {
      to_email,
      to_name,
      division,
      days_until_deadline: daysUntilDeadline,
      completed_matches: completedMatches,
      total_required_matches: totalRequiredMatches,
      progress_percentage: progressPercentage,
      deadline_date: deadlineDate,
      remaining_matches: remainingMatches,
      urgency_level: urgencyLevel,
      app_url: "https://newapp-1-ic1v.onrender.com"
    },
    'g6vqrOs_Jb6LL1VCZ'
  );
}
