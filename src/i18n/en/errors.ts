const errors = {
  network: 'Cannot reach the service. Check your connection and try again.',
  validation: 'Check the entered values. The request could not be applied.',
  conflict: 'This event conflicts with an existing ID or version.',
  unavailable: 'The service is unavailable. Try again shortly.',
  invalid_response: 'The service returned an unexpected response. Try refreshing.',
  request: 'The request could not be completed.',
  detail: 'Diagnostic details',
  stale: 'Saved data may be out of date.',
};

export default errors;
