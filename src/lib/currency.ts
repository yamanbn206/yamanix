export function getCurrencySymbol(currency?: string, lang: 'ar' | 'en' = 'ar'): string {
  if (!currency) return lang === 'ar' ? 'ر.س' : 'SAR';
  const trimmed = currency.trim();
  const code = trimmed.toUpperCase();
  const isAr = lang === 'ar';

  switch (code) {
    case 'SAR':
    case 'SR':
      return isAr ? 'ر.س' : 'SAR';
    case 'AED':
      return isAr ? 'د.إ' : 'AED';
    case 'USD':
    case '$':
      return '$';
    case 'EUR':
    case '€':
      return '€';
    case 'EGP':
      return isAr ? 'ج.م' : 'EGP';
    case 'QAR':
      return isAr ? 'ر.ق' : 'QAR';
    case 'KWD':
      return isAr ? 'د.ك' : 'KWD';
    case 'BHD':
      return isAr ? 'د.ب' : 'BHD';
    case 'OMR':
      return isAr ? 'ر.ع' : 'OMR';
    case 'JOD':
      return isAr ? 'د.أ' : 'JOD';
    default:
      return trimmed;
  }
}

export function formatCurrency(amount: number | string, currency?: string, lang: 'ar' | 'en' = 'ar'): string {
  const sym = getCurrencySymbol(currency, lang);
  const num = Number(amount || 0);
  const formattedAmount = lang === 'ar' 
    ? num.toLocaleString('ar-SA') 
    : num.toLocaleString('en-US');

  if (sym === '$' || sym === '€') {
    return lang === 'ar' ? `${formattedAmount} ${sym}` : `${sym}${formattedAmount}`;
  }

  return `${formattedAmount} ${sym}`;
}
