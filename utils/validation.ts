export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phoneCode: string, localNumber: string): boolean => {
  const cleanNumber = localNumber.replace(/\D/g, '');

  const phoneLengths: { [key: string]: number[] } = {
    '1': [10],
    '44': [10],
    '961': [8],
    '971': [9],
    '966': [9],
    '20': [10],
    '962': [9],
    '965': [8],
    '974': [8],
    '973': [8],
    '968': [8],
    '33': [9],
    '49': [10, 11],
    '61': [9],
    '91': [10],
    '92': [10],
    '90': [10],
    '34': [9],
    '39': [10],
  };

  const allowedLengths = phoneLengths[phoneCode] || [8, 9, 10];
  return allowedLengths.includes(cleanNumber.length);
};

export const validatePhone = (phone: string): boolean => {
  if (!phone || phone.trim().length === 0) {
    return false;
  }

  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return false;
  }

  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 8 && digitsOnly.length <= 15;
};

export interface PasswordStrength {
  score: number;
  label: 'Weak' | 'Medium' | 'Strong';
  isValid: boolean;
}

export const validatePassword = (password: string): PasswordStrength => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const criteriaCount = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  const isValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

  if (criteriaCount <= 2) {
    return { score: 1, label: 'Weak', isValid: false };
  } else if (criteriaCount <= 4) {
    return { score: 2, label: 'Medium', isValid: false };
  } else {
    return { score: 3, label: 'Strong', isValid };
  }
};
