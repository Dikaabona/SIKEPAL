import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPaginationRange(currentPage: number, totalPages: number) {
  const delta = 1;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i);
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}

export const parseIndoDate = (dateStr: string) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();

  // Handle YYYY-MM-DD (from input date) - Parse as local time to avoid timezone mismatch
  if (cleanStr.includes('-') && cleanStr.split('-')[0].length === 4) {
    const parts = cleanStr.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY (possibly with DayName prefix like "Kamis, 02/04/2026")
  const datePattern = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/;
  const match = cleanStr.match(datePattern);
  if (match) {
    const d = parseInt(match[1]);
    const m = parseInt(match[2]) - 1;
    let y = parseInt(match[3]);
    if (y < 100) y += 2000;
    return new Date(y, m, d);
  }

  // Handle "Rabu, 1 April 2026" or "Rabu, 1, April, 2026" format
  if (cleanStr.includes(',') || cleanStr.split(' ').length >= 3) {
    const parts = cleanStr.split(/[,\s]+/).map(p => p.trim()).filter(Boolean);
    
    // We expect at least [Day, Month, Year] or [DayName, Day, Month, Year]
    if (parts.length >= 3) {
      const year = parseInt(parts[parts.length - 1]);
      const monthName = parts[parts.length - 2].toLowerCase();
      const day = parseInt(parts[parts.length - 3]);

      const months: { [key: string]: number } = {
        'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
        'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11,
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'jun': 5,
        'jul': 6, 'agu': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'des': 11
      };

      const month = months[monthName];
      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        let finalYear = year;
        if (finalYear < 100) finalYear += 2000;
        return new Date(finalYear, month, day);
      }
    }
  }

  const d = new Date(cleanStr);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = parseIndoDate(dateStr);
  if (!date) return dateStr;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};
