/**
 * Israeli-specific validation helpers
 * Includes ID number, phone, VAT, and address validation
 */

/**
 * Validates Israeli ID number using the Luhn algorithm
 * @param id - 9-digit Israeli ID number
 * @returns true if valid
 */
export function validateIsraeliID(id: string): boolean {
  // Remove spaces and dashes
  const cleanId = id.replace(/[\s-]/g, "");

  // Must be exactly 9 digits
  if (!/^\d{9}$/.test(cleanId)) {
    return false;
  }

  // Luhn algorithm (Israeli ID checksum)
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(cleanId[i], 10);

    // Double every second digit (from right to left)
    if (i % 2 === 0) {
      digit *= 1;
    } else {
      digit *= 2;
      // If result is > 9, add the digits together
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

/**
 * Validates Israeli phone number
 * Accepts formats: 05X-XXX-XXXX, 0X-XXX-XXXX, or without dashes
 * @param phone - Israeli phone number
 * @returns true if valid
 */
export function validateIsraeliPhone(phone: string): boolean {
  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, "");

  // Mobile: 05X-XXXXXXX (10 digits starting with 05)
  // Landline: 0X-XXXXXXX (9-10 digits starting with 0)
  const mobilePattern = /^05[0-9]{8}$/;
  const landlinePattern = /^0[2-9][0-9]{7,8}$/;

  return mobilePattern.test(cleanPhone) || landlinePattern.test(cleanPhone);
}

/**
 * Formats Israeli phone number to standard format
 * @param phone - Israeli phone number
 * @returns formatted phone (05X-XXX-XXXX or 0X-XXX-XXXX)
 */
export function formatIsraeliPhone(phone: string): string {
  const cleanPhone = phone.replace(/[\s\-()]/g, "");

  if (cleanPhone.startsWith("05") && cleanPhone.length === 10) {
    // Mobile: 05X-XXX-XXXX
    return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
  } else if (cleanPhone.startsWith("0") && cleanPhone.length >= 9) {
    // Landline: 0X-XXX-XXXX
    return `${cleanPhone.slice(0, 2)}-${cleanPhone.slice(2, 5)}-${cleanPhone.slice(5)}`;
  }

  return phone; // Return as-is if not recognizable
}

/**
 * Validates Israeli VAT number (HP number)
 * @param vat - 9-digit VAT number
 * @returns true if valid
 */
export function validateIsraeliVAT(vat: string): boolean {
  // Remove spaces and dashes
  const cleanVat = vat.replace(/[\s-]/g, "");

  // Must be exactly 9 digits
  if (!/^\d{9}$/.test(cleanVat)) {
    return false;
  }

  // VAT numbers in Israel use a similar checksum to ID numbers
  return validateIsraeliID(cleanVat);
}

/**
 * Validates Israeli postal code
 * @param postalCode - 7-digit postal code
 * @returns true if valid
 */
export function validateIsraeliPostalCode(postalCode: string): boolean {
  const clean = postalCode.replace(/[\s-]/g, "");
  return /^\d{7}$/.test(clean);
}

/**
 * Formats Israeli currency amount
 * @param amount - numeric amount
 * @param includeCurrency - whether to include ₪ symbol
 * @returns formatted string (e.g., "5,000" or "5,000 ₪")
 */
export function formatIsraeliCurrency(
  amount: number,
  includeCurrency = true
): string {
  const formatted = amount.toLocaleString("he-IL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return includeCurrency ? `${formatted} ₪` : formatted;
}

/**
 * Parses Israeli currency string to number
 * @param value - currency string (may include ₪, commas)
 * @returns numeric value
 */
export function parseIsraeliCurrency(value: string): number {
  // Remove ₪, spaces, and commas
  const clean = value.replace(/[₪\s,]/g, "");
  return parseFloat(clean) || 0;
}

/**
 * Validates Israeli bank account number
 * @param accountNumber - bank account number
 * @returns true if valid format
 */
export function validateIsraeliBankAccount(accountNumber: string): boolean {
  const clean = accountNumber.replace(/[\s-]/g, "");
  // Israeli bank accounts are typically 6-9 digits
  return /^\d{6,9}$/.test(clean);
}

/**
 * Validates Israeli bank branch number
 * @param branchNumber - bank branch number
 * @returns true if valid format
 */
export function validateIsraeliBankBranch(branchNumber: string): boolean {
  const clean = branchNumber.replace(/[\s-]/g, "");
  // Israeli bank branches are 3 digits
  return /^\d{3}$/.test(clean);
}

/**
 * Validates date is in the future (for contract end dates, etc.)
 * @param date - Date object or ISO string
 * @returns true if date is in the future
 */
export function validateFutureDate(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj > new Date();
}

/**
 * Validates date range (end date must be after start date)
 * @param startDate - start date
 * @param endDate - end date
 * @param minDuration - optional minimum duration in days
 * @returns true if valid range
 */
export function validateDateRange(
  startDate: Date | string,
  endDate: Date | string,
  minDuration?: number
): boolean {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  if (end <= start) {
    return false;
  }

  if (minDuration) {
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= minDuration;
  }

  return true;
}

/**
 * Calculates age from Israeli ID number
 * @param id - Israeli ID number
 * @returns age in years, or null if invalid
 */
export function getAgeFromIsraeliID(id: string): number | null {
  if (!validateIsraeliID(id)) {
    return null;
  }

  // Note: This is a simplified version. Real ID numbers don't directly encode birthdate
  // For production, you'd need a government database lookup
  // This is just a placeholder
  return null;
}

/**
 * Validates minimum age requirement
 * @param birthDate - date of birth
 * @param minAge - minimum required age
 * @returns true if person is old enough
 */
export function validateMinimumAge(
  birthDate: Date | string,
  minAge: number
): boolean {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    return age - 1 >= minAge;
  }

  return age >= minAge;
}

/**
 * Format Israeli ID with dashes for display
 * @param id - 9-digit ID
 * @returns formatted ID (XXX-XXX-XXX)
 */
export function formatIsraeliID(id: string): string {
  const clean = id.replace(/[\s-]/g, "");
  if (clean.length === 9) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  return id;
}
