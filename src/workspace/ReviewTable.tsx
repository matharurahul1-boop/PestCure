import { frozen, entryOpen, entryWindow } from './schedule';
import React from 'react';
import type { Field, Review } from './model';
import { calculated, cellValue, numeric, type Column } from './tableModel';
import { CommentThread, CommentToggle } from './KpiComments';
import type { ReviewComment } from './model';
import { matchBand, DEFAULT_GRADE_BANDS, type GradeBand } from './gradeBands';
export function ReviewTable({ field, review, admin, update, tone, bands = DEFAULT_GRADE_BANDS, adjusted, adjusting, comments = [], viewerId = '', addComment }: { field: Field; review: Review; admin: boolean; update: (r: Review) => void; tone: (n: number | null) => string; bands?: GradeBand[]; adjusted?: Set<string>; adjusting?: boolean; comments?: ReviewComment[]; viewerId?: string; addComment?: (key: string, label: string, text: string) => void }) {
  const table = field.table!;
  const viewOnly = frozen(review);
  const [openRow, setOpenRow] = React.useState<string | null>(null);
  const rowKey = (rowId: string) => field.id + ':' + rowId;
  const values = review.tables?.[field.id];
  const targetEditable = !frozen(review) && (['draft', 'changes'].includes(review.targetStatus) || (admin && (review.targetStatus === 'pending' || adjusting)));
  const resultEditable = !frozen(review) && review.targetStatus === 'approved' && ['draft', 'changes'].includes(review.status);
  const write = (row: string, col: string, value: string, type: Column['type']) => {
    const rowValues = { ...values?.[row] };
    if (value === '') delete rowValues[col]; else rowValues[col] = (type === 'number' || type === 'target' || type === 'daily') && numeric(value) !== null ? Number(value) : value;
    update({ ...review, tables: { ...review.tables, [field.id]: { ...values, [row]: rowValues } } });
  };
  /** Enter moves to the same column in the next row, so a whole column can be filled without the mouse. */
  const moveDown = (e: React.KeyboardEvent<HTMLTableElement>) => {
    const target = e.target as HTMLElement;
    if (e.key !== 'Enter' || target.tagName !== 'INPUT') return;
    const cell = target.closest('td'); const row = cell?.parentElement; if (!cell || !row) return;
    const column = Array.from(row.children).indexOf(cell);
    for (let next = row.nextElementSibling; next; next = next.nextElementSibling) {
      const field = next.children[column]?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');
      if (field) { e.preventDefault(); field.focus(); if (field instanceof HTMLInputElement) field.select(); return; }
    }
  };
  return <><div className="reference-table-scroll" tabIndex={0} aria-label={`${field.label} table; scroll horizontally for more columns`}><table className="reference-table" onKeyDown={moveDown}><thead><tr><th>Task / metric</th>{table.columns.map(c => <th key={c.id}>{c.label}{review.trackingFrom && c.type === "daily" && <small>{entryWindow(review, field, c).start}</small>}{c.type === 'target' && <small>{c.owner === 'admin' ? 'Admin target' : 'Member target'}</small>}</th>)}</tr></thead><tbody>{table.rows.map(row => <React.Fragment key={row.id}><tr><th scope="row">{row.label}{row.scored === false && table.columns.some(c => c.type === "computed" && c.formula === "percent") && <small>Not scored</small>}{addComment && <CommentToggle count={comments.filter(c => c.key === rowKey(row.id)).length} open={openRow === row.id} label={row.label} onClick={() => setOpenRow(openRow === row.id ? null : row.id)} />}</th>{table.columns.map(column => {
    const value = cellValue(table, values, row, column);
    const label = `${field.label}: ${row.label} — ${column.label}`;
    if (column.type === 'computed') { const result = calculated(table, values, row, column); const display = column.formula === 'percent' && review.targetStatus !== 'approved' ? null : result; return <td key={column.id} data-label={column.label} data-type={column.type} className="computed-cell" style={column.formula === 'percent' ? { color: matchBand(display, bands).colorText } : undefined}>{display === null ? '—' : `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(display)}${column.formula === 'percent' ? '%' : ''}`}</td>; }
    const canEdit = column.type === 'target' ? targetEditable && (admin || column.owner !== 'admin') : resultEditable && entryOpen(review, field, column);
    const isNumeric = ['number', 'target'].includes(column.type);
    if (viewOnly) return <td key={column.id} data-label={column.label} data-type={column.type} className={`view-cell${column.type === 'text' ? ' view-cell-text' : ''}`}>{value === undefined || value === '' ? <span className="view-empty">—</span> : typeof value === 'number' ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value) : String(value)}</td>;
    const nonnumeric = isNumeric && value !== undefined && numeric(value) === null;
    return <td key={column.id} data-label={column.label} data-type={column.type} className={`${nonnumeric ? 'source-text-cell' : ''}${column.type === 'target' && adjusted?.has(field.id + ':' + row.id + ':' + column.id) ? ' target-adjusted' : ''}`}>{column.type === 'status' ? <select aria-label={label} value={String(value ?? '')} disabled={!canEdit} onChange={e => write(row.id, column.id, e.target.value, column.type)}><option value="">Select status</option>{[...new Set(['Pending','In progress','Completed','Done','Not applicable','Planned','Delayed','Under Review', ...(value ? [String(value)] : [])])].map(s => <option key={s}>{s}</option>)}</select> : column.type === 'text' ? <textarea aria-label={label} rows={2} value={String(value ?? '')} disabled={!canEdit} placeholder="—" onChange={e => write(row.id, column.id, e.target.value, column.type)} /> : <input aria-label={label} type={column.type === 'date' ? 'date' : isNumeric && !nonnumeric ? 'number' : 'text'} min={isNumeric ? 0 : undefined} step="any" value={String(value ?? '')} disabled={!canEdit} placeholder="" onInput={column.type === 'date' ? e => write(row.id, column.id, e.currentTarget.value, column.type) : undefined} onChange={e => write(row.id, column.id, e.target.value, column.type)} />}{nonnumeric && <small className="source-cell-note">Source text; enter a confirmed number</small>}</td>;
  })}</tr>{addComment && openRow === row.id && <tr className="comment-row"><td colSpan={table.columns.length + 1}><CommentThread comments={comments.filter(c => c.key === rowKey(row.id))} viewerId={viewerId} placeholder="Comment on this row…" onAdd={text => addComment(rowKey(row.id), field.label + ' · ' + row.label, text)} /></td></tr>}</React.Fragment>)}</tbody>{table.showTotals && <tfoot><tr><th>Total</th>{table.columns.map(c => <td key={c.id} data-label={c.label}>{c.type === 'number' ? new Intl.NumberFormat('en-IN').format(table.rows.reduce((sum, row) => sum + (numeric(values?.[row.id]?.[c.id]) ?? 0), 0)) : ''}</td>)}</tr></tfoot>}</table></div></>;
}

