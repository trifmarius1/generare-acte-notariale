const KEY = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];

export interface CnpCheck {
  valid: boolean;
  message: string;
}

export function checkCnp(raw: string): CnpCheck {
  const cnp = raw.replace(/\s/g, '');
  if (!cnp) return { valid: true, message: '' };
  if (!/^\d{13}$/.test(cnp)) {
    return { valid: false, message: 'CNP-ul trebuie să aibă 13 cifre.' };
  }
  const digits = cnp.split('').map(Number);
  const sum = KEY.reduce((acc, weight, index) => acc + weight * digits[index], 0);
  const control = sum % 11 === 10 ? 1 : sum % 11;
  if (control !== digits[12]) {
    return { valid: false, message: 'Cifra de control a CNP-ului nu verifică.' };
  }
  const sex = digits[0];
  if (sex < 1 || sex > 8) return { valid: false, message: 'Prima cifră a CNP-ului nu este validă.' };
  const yearBase = sex === 1 || sex === 2 ? 1900 : sex === 3 || sex === 4 ? 1800 : sex === 5 || sex === 6 ? 2000 : 1900;
  const year = yearBase + digits[1] * 10 + digits[2];
  const month = digits[3] * 10 + digits[4];
  const day = digits[5] * 10 + digits[6];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return { valid: false, message: 'Data nașterii din CNP nu există în calendar.' };
  }
  return { valid: true, message: '' };
}
