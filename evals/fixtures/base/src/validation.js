export const MAX_TITLE_LENGTH = 200;

// R1: the title is trimmed, must not be empty and must not exceed 200 characters.
export function validateTitle(raw) {
  if (typeof raw !== 'string') {
    return { error: 'A title is required.' };
  }
  const title = raw.trim();
  if (title.length === 0) {
    return { error: 'A title is required.' };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { error: `A title may not be longer than ${MAX_TITLE_LENGTH} characters.` };
  }
  return { title };
}
