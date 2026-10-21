import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import type { ReviewComment } from './model';

const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** Small speech-bubble toggle with a count, shown next to a KPI or table row. */
export function CommentToggle({ count, open, onClick, label }: { count: number; open: boolean; onClick: () => void; label: string }) {
  return <button type="button" className={`comment-btn${count ? ' has' : ''}${open ? ' on' : ''}`} aria-expanded={open} aria-label={`${count ? count + ' comment' + (count === 1 ? '' : 's') + ' on' : 'Comment on'} ${label}`} onClick={onClick}><MessageSquare size={14} />{count > 0 && <b>{count}</b>}</button>;
}

/** The conversation under one KPI. Both the admin and the member can write; nothing here edits the review's numbers. */
export function CommentThread({ comments, onAdd, viewerId, placeholder }: { comments: ReviewComment[]; onAdd: (text: string) => void; viewerId: string; placeholder: string }) {
  const [text, setText] = useState('');
  const send = () => { const value = text.trim(); if (!value) return; onAdd(value); setText(''); };
  return <div className="comment-thread">
    {comments.length > 0 && <ul>{comments.map(c => <li key={c.id} className={`${c.role}${c.authorId === viewerId ? ' mine' : ''}`}><div><strong>{c.authorId === viewerId ? 'You' : c.author}</strong><small>{c.role === 'admin' ? 'Admin' : 'Member'} · {when(c.at)}</small></div><p>{c.text}</p></li>)}</ul>}
    <div className="comment-compose"><textarea rows={1} value={text} placeholder={placeholder} aria-label={placeholder} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }} /><button type="button" className="button primary" disabled={!text.trim()} onClick={send}><Send size={14} />Send</button></div>
  </div>;
}
