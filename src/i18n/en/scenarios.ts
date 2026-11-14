const messages = {
  standard: {
    name: 'In order',
    description: 'Create, update guest count, then confirm.',
    order: '1 → 2 → 3',
  },
  duplicates: {
    name: 'Duplicate events',
    description: 'Deliver creation and confirmation more than once.',
    order: '1 → 1 → 2 → 3 → 3 → 2',
  },
  reordered: {
    name: 'Out of order',
    description: 'Confirmation arrives before creation. All changes are preserved.',
    order: '3 → 2 → 1',
  },
  gap: {
    name: 'Missing event',
    description: 'Hold version 2. Deliver it later from the event history.',
    order: '1 → 3 · hold 2',
  },
  email_retry: {
    name: 'Lost email response',
    description: 'The provider accepts the email, then times out. Retry uses the same key.',
    order: 'accept → timeout → retry',
  },
  cancelled: {
    name: 'Cancellation arrives first',
    description: 'Apply the full history. Final state is cancelled, with one confirmation.',
    order: '4 → 3 → 1 → 2',
  },
  unconfirmed_cancelled: {
    name: 'Cancelled before confirmation',
    description: 'A pending reservation is cancelled. No email is scheduled.',
    order: '2 → 1 · no confirmation',
  },
};

export default messages;
