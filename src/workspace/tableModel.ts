export type CellValue = number | string | boolean;
export type Column = { id: string; label: string; type: 'text' | 'number' | 'daily' | 'status' | 'date' | 'target' | 'computed'; owner?: 'admin' | 'member'; formula?: 'sum' | 'percent'; inputs?: string[]; denominator?: string; multiplier?: number };
export type TableRow = { id: string; label: string; cadence?: 'weekly' | 'daily' | 'monthly'; defaults: Record<string, CellValue>; scored?: boolean };
export type TableDefinition = { columns: Column[]; rows: TableRow[]; showTotals?: boolean; source?: string };
export type TableValues = Record<string, Record<string, CellValue>>;
export function validTable(table?: TableDefinition): boolean { return Boolean(table && table.rows.length && table.columns.length && table.rows.every(r => r.label.trim()) && table.columns.every(c => c.label.trim() && (c.type !== 'computed' || ((c.inputs?.length ?? 0) > 0 && c.inputs!.every(id => table.columns.some(input => input.id === id && ['number','daily'].includes(input.type))) && (c.formula !== 'percent' || (table.columns.some(target => target.id === c.denominator && target.type === 'target') && (c.multiplier ?? 1) > 0)))))); }
export const numeric = (value: unknown): number | null => { if (typeof value === 'number') return Number.isFinite(value) ? value : null; if (typeof value === 'string' && value.trim() && /^-?\d+(\.\d+)?$/.test(value.trim())) return Number(value); return null; };
export function cellValue(table: TableDefinition, values: TableValues | undefined, row: TableRow, column: Column): CellValue | undefined { return values?.[row.id]?.[column.id] ?? (column.type === 'target' ? row.defaults[column.id] : undefined); }
export function calculated(table: TableDefinition, values: TableValues | undefined, row: TableRow, column: Column): number | null {
  const inputs = (column.inputs ?? []).map(id => numeric(values?.[row.id]?.[id]));
  if (!inputs.some(v => v !== null)) return null;
  const total = inputs.reduce<number>((sum, n) => sum + (n ?? 0), 0);
  if (column.formula === 'sum') return total;
  const target = numeric(values?.[row.id]?.[column.denominator ?? ''] ?? row.defaults[column.denominator ?? '']);
  if (target === null || target <= 0) return null;
  return total / (target * (column.multiplier ?? 1)) * 100;
}
export function initialTableValues(table: TableDefinition): TableValues { return Object.fromEntries(table.rows.map(row => [row.id, { ...row.defaults }])); }
export function tableScores(table: TableDefinition, values?: TableValues): number[] {
  const percentColumns = table.columns.filter(c => c.type === 'computed' && c.formula === 'percent');
  return table.rows.filter(r => r.scored !== false).flatMap(row => percentColumns.filter(c => (numeric(values?.[row.id]?.[c.denominator ?? ''] ?? row.defaults[c.denominator ?? '']) ?? 0) > 0).map(c => Math.min(100, Math.max(0, calculated(table, values, row, c) ?? 0))));
}
export function mergeTableStructure(previous: TableValues | undefined, table: TableDefinition): TableValues { return Object.fromEntries(table.rows.map(row => [row.id, Object.fromEntries(table.columns.filter(c => c.type !== 'computed').flatMap(col => { const value = previous?.[row.id]?.[col.id] ?? row.defaults[col.id]; return value === undefined ? [] : [[col.id, value]]; }))])); }
