// Account identity
export function createAccountId() {
  return `usr_${crypto.randomUUID()}`;
}
