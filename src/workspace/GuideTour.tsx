import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, BarChart3, Bell, CalendarDays, CheckCheck, ClipboardList, Clock3, Lock, Network, Pause, PhoneCall, Play, Rocket, Send, Settings2, ShieldCheck, Smartphone, Sparkles, Sun, Target, TrendingUp, UserPlus, Users, Volume2, Wallet, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { GuideBlock, GuideCard, GuideIcon, GuideTag } from './guide';
import { caption, useNarrator, type NarrationLang } from './narrator';
import './guide.css';

const ICONS: Record<GuideIcon, LucideIcon> = {
  sparkles: Sparkles, target: Target, sun: Sun, calendar: CalendarDays, send: Send, check: CheckCheck, users: Users, trend: TrendingUp, wallet: Wallet, phone: PhoneCall,
  clipboard: ClipboardList, shield: ShieldCheck, bell: Bell, lock: Lock, clock: Clock3, network: Network, settings: Settings2, chart: BarChart3, userplus: UserPlus, smartphone: Smartphone,
};
const LANG_KEY = 'pestcure_guide_lang';

const Tag = ({ tag }: { tag: GuideTag }) => <span className={`g-tag ${tag.kind}`}>{tag.label}</span>;

function Block({ block, lit }: { block: GuideBlock; lit: number }) {
  if (block.type === 'stats') return <div className="g-stats">{block.items.map(s => <div key={s.label}><b>{s.value}</b><span>{s.label}</span></div>)}</div>;
  if (block.type === 'chips') return <div className="g-chips-wrap"><h4>{block.title}</h4><div className="g-chips">{block.items.map(i => <span key={i} className="g-chip"><i />{i}</span>)}{!!block.more && <span className="g-chip more">+{block.more} more</span>}</div></div>;
  return <ol className="g-steps">{block.items.map((s, i) => { const Icon = ICONS[s.icon]; return <li key={s.title} style={{ '--i': i } as React.CSSProperties} className={lit < 0 ? '' : i === lit ? 'lit' : i < lit ? 'seen' : 'dim'}>
    <span className="g-step-ico"><Icon size={18} /><em>{i + 1}</em></span>
    <span className="g-step-text"><strong>{s.title}</strong><small>{s.desc}</small></span>
    <Tag tag={s.tag} />
  </li>; })}</ol>;
}

const readLang = (): NarrationLang => { try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'hi'; } catch { return 'hi'; } };

/** Full-screen, swipeable walkthrough cards with an optional voice-over (Hindi / English) that plays the cards like a short video. */
export function GuideTour({ cards, onDone, finishLabel = 'Start' }: { cards: GuideCard[]; onDone: () => void; finishLabel?: string }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<'next' | 'back'>('next');
  const [playing, setPlaying] = useState(false);
  const [lang, setLang] = useState<NarrationLang>(readLang);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const narrator = useNarrator();
  const last = index === cards.length - 1;
  const go = (to: number) => { if (to < 0 || to >= cards.length || to === index) return; setDir(to > index ? 'next' : 'back'); setIndex(to); };
  const finish = () => { narrator.stop(); onDone(); };
  const chooseLang = (l: NarrationLang) => { setLang(l); try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ } };

  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(); if (e.key === 'ArrowRight') go(index + 1); if (e.key === 'ArrowLeft') go(index - 1); };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', key); };
  });

  // play mode: read the card, then move on to the next one by itself
  useEffect(() => {
    if (!playing) { narrator.stop(); return; }
    let timer = 0;
    narrator.speak(cards[index].say[lang], lang, () => { timer = window.setTimeout(() => { if (index < cards.length - 1) go(index + 1); else setPlaying(false); }, 700); });
    return () => window.clearTimeout(timer);
  }, [playing, index, lang]);   // eslint-disable-line react-hooks/exhaustive-deps

  const card = cards[index];
  const Icon = ICONS[card.icon];
  const stepCount = card.blocks.reduce((n, b) => b.type === 'steps' ? b.items.length : n, 0);
  const lit = playing && stepCount ? Math.min(stepCount - 1, Math.floor(narrator.progress * stepCount)) : -1;
  useEffect(() => { if (lit >= 0) document.querySelector<HTMLElement>('.g-steps li.lit')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [lit, index]);
  const noHindi = lang === 'hi' && narrator.ready && !narrator.hasHindi;

  return createPortal(
    <div className="guide" role="dialog" aria-modal="true" aria-label="Getting started guide">
      <div className="guide-top">
        <div className="g-dots" role="tablist" aria-label="Guide progress">{cards.map((c, i) => <button key={c.id} role="tab" aria-selected={i === index} aria-label={`Card ${i + 1}`} className={i === index ? 'on' : i < index ? 'done' : ''} onClick={() => go(i)} />)}</div>
        <button className="g-skip" onClick={finish}>Skip <X size={15} /></button>
      </div>
      <div className="guide-stage"
        onTouchStart={e => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={e => { const t = touch.current; touch.current = null; if (!t) return; const dx = e.changedTouches[0].clientX - t.x; const dy = e.changedTouches[0].clientY - t.y; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) go(index + (dx < 0 ? 1 : -1)); }}>
        <article key={card.id} className={`g-card tone-${card.tone} ${dir}${playing ? ' playing' : ''}`}>
          <header className="g-hero">
            <span className="g-icon"><Icon size={34} strokeWidth={1.8} /></span>
            <small>{card.eyebrow}</small>
            <h2>{card.title}</h2>
            {card.subtitle && <p>{card.subtitle}</p>}
            {card.tags.length > 0 && <div className="g-tags">{card.tags.map(t => <Tag key={t.label} tag={t} />)}</div>}
          </header>
          <div className="g-body">{card.blocks.map((b, i) => <Block key={i} block={b} lit={lit} />)}</div>
        </article>
      </div>

      {narrator.supported && <div className={`g-player${playing ? ' on' : ''}`}>
        <button className="g-play" onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause voice-over' : 'Play voice-over'}>{playing ? <Pause size={20} /> : <Play size={20} />}</button>
        <div className="g-player-text">
          {playing
            ? <p className="g-caption" lang={lang === 'hi' ? 'hi' : 'en'}>{caption(card.say[lang])}</p>
            : <p className="g-listen"><Volume2 size={15} /> {lang === 'hi' ? 'सुनें: हर कार्ड को आवाज़ में समझें' : 'Listen: hear each card explained'}</p>}
          <i className="g-progress"><b style={{ width: `${playing ? Math.round(narrator.progress * 100) : 0}%` }} /></i>
          {noHindi && <small className="g-hint">Hindi voice not found on this device. Try English.</small>}
        </div>
        <div className="g-lang" role="group" aria-label="Voice language">
          <button className={lang === 'hi' ? 'on' : ''} onClick={() => chooseLang('hi')}>हिंदी</button>
          <button className={lang === 'en' ? 'on' : ''} onClick={() => chooseLang('en')}>English</button>
        </div>
      </div>}

      <footer className="guide-actions">
        <button className="g-btn ghost" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous card"><ArrowLeft size={18} /><span>Back</span></button>
        <span className="g-count">{index + 1} / {cards.length}</span>
        {last
          ? <button className="g-btn primary" onClick={finish}><span>{finishLabel}</span><Rocket size={18} /></button>
          : <button className="g-btn primary" onClick={() => go(index + 1)}><span>Next</span><ArrowRight size={18} /></button>}
      </footer>
    </div>,
    (document.querySelector('.workspace') as HTMLElement | null) ?? document.body);
}
