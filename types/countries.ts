export interface Country {
  name: string;
  code: string;
  phoneCode: string;
  flag: string;
}

export const countries: Country[] = [
  { name: 'United States', code: 'US', phoneCode: '1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', phoneCode: '44', flag: '🇬🇧' },
  { name: 'Lebanon', code: 'LB', phoneCode: '961', flag: '🇱🇧' },
  { name: 'United Arab Emirates', code: 'AE', phoneCode: '971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: 'SA', phoneCode: '966', flag: '🇸🇦' },
  { name: 'Egypt', code: 'EG', phoneCode: '20', flag: '🇪🇬' },
  { name: 'Jordan', code: 'JO', phoneCode: '962', flag: '🇯🇴' },
  { name: 'Kuwait', code: 'KW', phoneCode: '965', flag: '🇰🇼' },
  { name: 'Qatar', code: 'QA', phoneCode: '974', flag: '🇶🇦' },
  { name: 'Bahrain', code: 'BH', phoneCode: '973', flag: '🇧🇭' },
  { name: 'Oman', code: 'OM', phoneCode: '968', flag: '🇴🇲' },
  { name: 'Canada', code: 'CA', phoneCode: '1', flag: '🇨🇦' },
  { name: 'France', code: 'FR', phoneCode: '33', flag: '🇫🇷' },
  { name: 'Germany', code: 'DE', phoneCode: '49', flag: '🇩🇪' },
  { name: 'Australia', code: 'AU', phoneCode: '61', flag: '🇦🇺' },
  { name: 'India', code: 'IN', phoneCode: '91', flag: '🇮🇳' },
  { name: 'Pakistan', code: 'PK', phoneCode: '92', flag: '🇵🇰' },
  { name: 'Turkey', code: 'TR', phoneCode: '90', flag: '🇹🇷' },
  { name: 'Spain', code: 'ES', phoneCode: '34', flag: '🇪🇸' },
  { name: 'Italy', code: 'IT', phoneCode: '39', flag: '🇮🇹' },
];
