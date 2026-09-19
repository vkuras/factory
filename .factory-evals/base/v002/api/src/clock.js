// The current instant. APP_FAKE_NOW (ISO 8601) overrides it for tests and validation; it is empty in production.
export function now() {
  const fake = process.env.APP_FAKE_NOW;
  return fake ? new Date(fake) : new Date();
}
