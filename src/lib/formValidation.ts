const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return "Email is required.";
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password.length > 128) {
    return "Password must be 128 characters or fewer.";
  }
  return null;
}

export function validateProjectIntent(intent: string): string | null {
  const trimmed = intent.trim();
  if (trimmed.length < 8) {
    return "Describe your project in at least 8 characters.";
  }
  if (trimmed.length > 2000) {
    return "Project description must be 2000 characters or fewer.";
  }
  return null;
}

export function validateProjectAddress(address: string): string | null {
  const trimmed = address.trim();
  if (trimmed.length < 10) {
    return "Enter a complete street address with city and state.";
  }
  if (trimmed.length > 300) {
    return "Address must be 300 characters or fewer.";
  }
  if (!/\d/.test(trimmed)) {
    return "Include a street number in the address.";
  }
  return null;
}

export function isHoneypotFilled(value: string): boolean {
  return value.trim().length > 0;
}
