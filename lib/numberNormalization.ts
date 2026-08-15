/**
 * Normalizes number input to handle various formats
 * - Arabic numerals (٠١٢٣٤٥٦٧٨٩) to Western (0123456789)
 * - Comma decimal separator to dot (1,5 → 1.5)
 * - Removes non-numeric characters except dots and minus
 */
export function normalizeNumberInput(input: string): number {
  if (!input || input.trim() === '') return NaN
  
  // Replace Arabic numerals with Western numerals
  let normalized = input
    .replace(/[٠-٩]/g, (char) => {
      const arabicMap: Record<string, string> = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
      }
      return arabicMap[char] || char
    })
  
  // Replace comma with dot for decimal separator
  normalized = normalized.replace(',', '.')
  
  // Remove any non-numeric characters except dots and minus
  normalized = normalized.replace(/[^0-9.\-]/g, '')
  
  return parseFloat(normalized)
}