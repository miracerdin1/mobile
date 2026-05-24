/**
 * Formats a Date object into standard Turkish date-time format: DD.MM.YYYY - HH:MM
 */
export function formatTurkishDateTime(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }
  
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  
  return `${day}.${month}.${year} - ${hours}:${minutes}`;
}
