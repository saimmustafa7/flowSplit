// ALL amounts stored as integers in paisa. Format ONLY at display layer.
export function formatCurrency(paisa: number): string {
  return `₨${(paisa / 100).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

// Parse user input (e.g. "500" or "5.50") to paisa integer
export function parseToPaisa(input: string): number {
  const num = parseFloat(input);
  if (isNaN(num) || num <= 0) throw new Error('Invalid amount');
  return Math.round(num * 100);
}
