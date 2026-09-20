const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailAddresses(addresses: string[]): string | null {
  if (addresses.length === 0) {
    return "At least one recipient email is required.";
  }

  for (const address of addresses) {
    const trimmed = address.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      return `Invalid email address: ${address}`;
    }
  }

  return null;
}
