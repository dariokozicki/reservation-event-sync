const messages = {
  title: 'Reservation <accent>sync</accent>',
  workspace: 'Workspace',
  reservations: 'Reservations',
  assumptions: 'Assumptions',
  eyebrow: 'OPERATIONS / RESERVATIONS',
  description: 'Send events. Inspect state. Verify confirmation delivery.',
  refresh: 'Refresh',
  exportResult: 'Export result',
  totals: 'Simulation totals',
  deliveries: 'Event deliveries',
  duplicates: 'Duplicates handled',
  emails: 'Emails accepted',
  footerTitle: 'PENTICE / Reservation Event Sync',
  footerNote: 'Simulated source & email provider',
  contractLabel: 'SIMULATION CONTRACT',
  contractTitle: 'What this demo assumes',
  creation: 'Creation produces a pending reservation. Confirmation is a separate event.',
  firstConfirmation:
    'Only the first confirmation schedules an email, using the guest details at ' + 'that version.',
  cancellation:
    'Pending and confirmed reservations can be cancelled. Cancellation is ' + 'terminal.',
  updates: 'Updates change details, not status. Confirmed is separate from payment ' + 'status.',
  versions:
    'Versions start at 1 and are consecutive per reservation. Missing events ' + 'remain buffered.',
  duplicatesContract: 'Identical duplicates do nothing. Conflicting IDs or versions are reported.',
  laterCancellation:
    'Confirmation followed by cancellation sends one email, regardless of ' + 'arrival order.',
  unconfirmedCancellation: 'Cancellation without confirmation sends no email.',
  providerIdempotency:
    'The provider remembers idempotency keys and returns the same receipt on ' + 'retries.',
  accessControl:
    'Reservation links are public in this local demo. In production, we would ' +
    'authenticate the visitor and verify they are authorized to access that ' +
    'specific reservation. Knowing its ID or receiving a forwarded link would ' +
    'not grant access.',
  failures:
    'Permanent delivery failures need recovery and retry. Nothing calls a real ' + 'email service.',
  scope:
    'This is a local demonstration with synthetic data. Real PMS integrations ' +
    'may need authoritative state retrieval instead of consecutive event ' +
    'versions.',
};

export default messages;
