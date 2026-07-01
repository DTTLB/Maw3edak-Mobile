export const formatBirthDate = (input: string, previousValue: string): string => {
  const cleaned = input.replace(/\D/g, '');

  if (cleaned.length === 0) return '';

  let formatted = '';

  if (cleaned.length <= 2) {
    formatted = cleaned;
  } else if (cleaned.length <= 4) {
    formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  } else {
    formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  }

  return formatted;
};

export const isValidDate = (dateString: string): boolean => {
  if (!dateString || dateString.length !== 10) return false;

  const parts = dateString.split('/');
  if (parts.length !== 3) return false;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) return false;

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
    daysInMonth[1] = 29;
  }

  if (day > daysInMonth[month - 1]) return false;

  const date = new Date(year, month - 1, day);
  if (date > new Date()) return false;

  return true;
};

export const getAge = (dateString: string): number => {
  if (!isValidDate(dateString)) return 0;

  const parts = dateString.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

export const convertToISODate = (dateString: string): string | null => {
  if (!isValidDate(dateString)) return null;

  const parts = dateString.split('/');
  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];

  return `${year}-${month}-${day}`;
};
