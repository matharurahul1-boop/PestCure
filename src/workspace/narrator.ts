import { useCallback, useEffect, useRef, useState } from 'react';

export type NarrationLang = 'hi' | 'en';
export type Segment = { text: string; lang: NarrationLang };

/** "नमस्ते {{Alka}}!" → Hindi / English pieces, so names and terms are read by an English voice. */
export function toSegments(text: string, base: NarrationLang): Segment[] {
  const out: Segment[] = [];
  text.split(/\{\{(.+?)\}\}/g).forEach((part, i) => { if (part.trim()) out.push({ text: part, lang: i % 2 ? 'en' : base }); });
  return out;
}
/** What to show as the subtitle: the same sentence without the markers. */
export const caption = (text: string) => text.replace(/\{\{(.+?)\}\}/g, '$1');

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

/** Reads text aloud with the device's own voices (no audio files). Hindi and English, with progress for the caption bar. */
export function useNarrator() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [progress, setProgress] = useState(0);
  const run = useRef(0);   // bumped on every speak/stop so stale callbacks are ignored

  useEffect(() => {
    if (!supported()) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => { window.speechSynthesis.removeEventListener('voiceschanged', load); window.speechSynthesis.cancel(); };
  }, []);

  const pick = useCallback((lang: NarrationLang) => {
    const want = lang === 'hi' ? ['hi-IN', 'hi'] : ['en-IN', 'en-GB', 'en-US', 'en'];
    for (const w of want) { const v = voices.find(x => x.lang.replace('_', '-').toLowerCase().startsWith(w.toLowerCase())); if (v) return v; }
    return undefined;
  }, [voices]);

  const stop = useCallback(() => { run.current++; if (supported()) window.speechSynthesis.cancel(); setProgress(0); }, []);

  /** Speak `text` (with {{English}} markers when lang is Hindi); onEnd fires only when it finished naturally. */
  const speak = useCallback((text: string, lang: NarrationLang, onEnd?: () => void) => {
    if (!supported()) return;
    const id = ++run.current;
    window.speechSynthesis.cancel();
    const segments = toSegments(text, lang);
    const total = segments.reduce((n, s) => n + s.text.length, 0) || 1;
    let done = 0;
    setProgress(0);
    const next = (i: number) => {
      if (id !== run.current) return;
      if (i >= segments.length) { setProgress(1); onEnd?.(); return; }
      const seg = segments[i];
      const u = new SpeechSynthesisUtterance(seg.text);
      const voice = pick(seg.lang) ?? pick(lang);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = seg.lang === 'hi' ? 'hi-IN' : 'en-IN';
      u.rate = 0.95;
      u.onboundary = e => { if (id === run.current) setProgress(Math.min(1, (done + e.charIndex) / total)); };
      u.onend = () => { done += seg.text.length; if (id === run.current) setProgress(Math.min(1, done / total)); next(i + 1); };
      u.onerror = () => { if (id === run.current) next(i + 1); };
      window.speechSynthesis.speak(u);
    };
    next(0);
  }, [pick]);

  return {
    supported: supported(),
    hasHindi: voices.some(v => v.lang.toLowerCase().startsWith('hi')),
    ready: voices.length > 0,
    progress, speak, stop,
  };
}
