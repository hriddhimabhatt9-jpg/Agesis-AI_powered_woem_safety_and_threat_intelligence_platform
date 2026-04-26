/**
 * Phone number validation utility for Indian phone numbers.
 * Enforces exactly 10 digits (excluding country code +91).
 */

// Strip all non-digit characters except leading +
export function cleanPhone(raw) {
  if (!raw) return '';
  let cleaned = raw.replace(/[^\d+]/g, '');
  // Remove leading +91
  if (cleaned.startsWith('+91')) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith('91') && cleaned.length > 10) cleaned = cleaned.slice(2);
  // Remove leading 0 (trunk prefix)
  if (cleaned.startsWith('0') && cleaned.length === 11) cleaned = cleaned.slice(1);
  return cleaned;
}

// Validate that the phone has exactly 10 digits
export function isValidIndianPhone(raw) {
  const digits = cleanPhone(raw);
  return /^[6-9]\d{9}$/.test(digits);
}

// Format for display: +91 XXXXX XXXXX
export function formatPhone(raw) {
  const digits = cleanPhone(raw);
  if (digits.length !== 10) return raw;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

// Restrict input to valid phone characters and max length
export function handlePhoneInput(value) {
  // Allow digits, spaces, +, and - only
  let cleaned = value.replace(/[^\d\s+\-]/g, '');
  // Extract digits only for length check
  const digits = cleaned.replace(/\D/g, '');
  // If starts with +91 or 91, allow up to 12-13 digits total; otherwise max 10
  if (digits.startsWith('91') && digits.length > 12) {
    return cleaned.slice(0, cleaned.length - (digits.length - 12));
  }
  if (!digits.startsWith('91') && digits.length > 10) {
    return cleaned.slice(0, cleaned.length - (digits.length - 10));
  }
  return cleaned;
}

// Get error message for phone validation
export function getPhoneError(raw) {
  if (!raw || raw.trim() === '') return '';
  const digits = cleanPhone(raw);
  if (digits.length < 10) return `Enter 10 digits (${digits.length}/10)`;
  if (digits.length > 10) return 'Too many digits. Indian numbers are 10 digits.';
  if (!/^[6-9]/.test(digits)) return 'Indian mobile numbers start with 6, 7, 8, or 9';
  return '';
}
