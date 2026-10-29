import React from 'react';
import { ExternalLink, Gift } from 'lucide-react';
import './refer.css';

/** The referral app linked from the "Refer & earn" button. */
export const REFERRAL_URL = 'https://referral-umber.vercel.app/';

/**
 * Link to the referral app for the signed-in user, so it knows who is referring:
 * ?referrerEmail=…&referrerName=…  The name is the one given at sign-up, else the part of the email before the @.
 */
export function referralUrl(email?: string | null, name?: string | null): string {
  if (!email) return REFERRAL_URL;
  const referrerName = (typeof name === 'string' && name.trim()) || email.split('@')[0];
  return `${REFERRAL_URL}?${new URLSearchParams({ referrerEmail: email, referrerName })}`;
}

/** Sparkles that twinkle around the gift on hover: offset (px from the gift's centre), size and start delay. */
const SPARKLES = [
  { x: -11, y: -11, size: 7, delay: 0 },
  { x: 12, y: -9, size: 5, delay: 90 },
  { x: 10, y: 11, size: 6, delay: 170 },
];

/** "Refer & earn" button for the bottom of the sidebar. With the sidebar collapsed it shrinks to the gift icon. */
export function ReferButton({ email, name, expanded = true }: { email?: string | null; name?: string | null; expanded?: boolean }) {
  return (
    <a
      className={`refer-button${expanded ? '' : ' compact'}`}
      href={referralUrl(email, name)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Refer and earn (opens the referral app in a new tab)"
      title={expanded ? undefined : 'Refer & earn'}
    >
      <span className="refer-gift-wrap">
        <span aria-hidden="true" className="refer-sparkles">
          {SPARKLES.map((s, i) => <span key={i} className="refer-sparkle" style={{ '--sx': `${s.x}px`, '--sy': `${s.y}px`, '--ss': `${s.size}px`, '--sd': `${s.delay}ms` } as React.CSSProperties} />)}
        </span>
        <Gift size={19} className="refer-gift" />
      </span>
      {expanded && <>
        <span className="refer-text"><span className="refer-label">Refer &amp; earn</span><span className="refer-sub">Invite a friend</span></span>
        <ExternalLink size={14} className="refer-ext" />
      </>}
    </a>
  );
}
