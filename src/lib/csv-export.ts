/**
 * CSV Export Utility
 * Generates and triggers a browser download of CSV data.
 */

function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  // Format dates nicely
  if (value instanceof Date) {
    return value.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Detect ISO date strings and format them
  if (typeof value === "string") {
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
    if (isoDatePattern.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-CA", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    }
  }

  const str = String(value);

  // Escape if value contains commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function downloadCSV(
  data: Record<string, unknown>[],
  filename: string
): void {
  if (data.length === 0) return;

  // Use keys from the first record as column headers
  const headers = Object.keys(data[0]);

  // Build CSV rows
  const headerRow = headers.map((h) => formatCSVValue(h)).join(",");
  const dataRows = data.map((row) =>
    headers.map((h) => formatCSVValue(row[h])).join(",")
  );

  const csvContent = [headerRow, ...dataRows].join("\r\n");

  // Create blob and trigger download
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
