export const formatDisplayAmount = (amount: string, decimals: number) => {
  const parsedAmount = parseFloat(amount);
  return parsedAmount.toFixed(decimals);
};

export const formatTokenAmount = (amount: string | number, decimals: number) => {
  if (amount === '' || amount === null || amount === undefined) return '';
  const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formattedAmount = parsedAmount / Math.pow(10, decimals);
  return formattedAmount.toFixed(decimals);
};

