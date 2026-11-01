// Spreadsheet apps run cells that start with these characters as formulas.
const FORMULA_PREFIX = /^[=+\-@\t\r]/

export function csvCell(value: string | number | boolean | null | undefined): string {
  let text = value === null || value === undefined ? '' : String(value)
  if (FORMULA_PREFIX.test(text)) {
    text = `'${text}`
  }

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Builds CSV text with a UTF-8 byte order mark so Excel keeps accented names intact. */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<string | number | boolean | null | undefined>>): string {
  return `﻿${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}\r\n`
}
