const emailTemplate = {
  subject: 'Your reservation at {property} is confirmed',
  greeting: 'Hi {guestName},',
  confirmed: 'Your stay at {property} is confirmed.',
  checkIn: 'Check-in: {date}',
  checkOut: 'Check-out: {date}',
  guests: 'Guests: {count, number}',
  link: 'View your reservation: {url}',
  signature: 'Pentice',
};

export default emailTemplate;
