// CSV Parser utility - No external dependencies
// Handles CSV parsing with proper quote and escape handling

export interface CSVParseResult {
  headers: string[];
  data: Record<string, string>[];
  rowCount: number;
}

export function parseCSV(csvText: string): CSVParseResult {
  const lines = csvText.split(/\r?\n/);
  const headers: string[] = [];
  const data: Record<string, string>[] = [];

  if (lines.length === 0) {
    return { headers: [], data: [], rowCount: 0 };
  }

  // Parse first line as headers
  const headerLine = lines[0];
  const parsedHeaders = parseCSVLine(headerLine);
  headers.push(...parsedHeaders);

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    data.push(row);
  }

  return {
    headers,
    data,
    rowCount: data.length,
  };
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last value
  values.push(current.trim());

  return values;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
