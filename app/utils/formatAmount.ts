// Helper function to format numbers with commas and handle decimals
const formatNumberWithCommas = (value: string) => {
  if (!value) return '';
  
  // Convert to number to check if it's >= 1
  const num = parseFloat(value);
  if (isNaN(num)) return '';

  // Split into whole and decimal parts
  const [wholePart, decimalPart] = value.split('.');
  
  // Add commas to whole number part
  const formattedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // If number is >= 1, limit to 2 decimal places
  if (Math.abs(num) >= 1) {
    if (!decimalPart) return formattedWholePart;
    return `${formattedWholePart}.${decimalPart.slice(0, 2)}`;
  }
  
  // For numbers < 1, keep all decimal places
  return decimalPart ? `${formattedWholePart}.${decimalPart}` : formattedWholePart;
};

export const formatDisplayAmount = (amount: string | number) => {
  if (!amount) return '';
  
  // Convert to string and remove existing commas
  const cleanAmount = amount.toString().replace(/,/g, '');
  return formatNumberWithCommas(cleanAmount);
};

export const formatTokenAmount = (amount: string | number, decimals: number) => {
  if (amount === '' || amount === null || amount === undefined) return '';
  
  // Convert to string and remove existing commas
  const cleanAmount = amount.toString().replace(/,/g, '');
  const parsedAmount = typeof cleanAmount === 'string' ? parseFloat(cleanAmount) : cleanAmount;
  const formattedAmount = parsedAmount / Math.pow(10, decimals);
  
  return formatNumberWithCommas(formattedAmount.toString());
};

// Helper function to format any number according to the requirements
export const formatNumber = (value: number | string): string => {
  if (!value) return '';
  
  // Convert to string and remove existing commas
  const cleanValue = value.toString().replace(/,/g, '');
  return formatNumberWithCommas(cleanValue);
};

