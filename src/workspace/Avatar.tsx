import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';

export const initialsOf = (name: string) => name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();

/** Round profile picture, falling back to coloured initials. */
export function Avatar({ name, url, small = false }: { name: string; url?: string; small?: boolean }) {
  return <span className={`avatar ${small ? 'small' : ''}`} data-tone={name.charCodeAt(0) % 4}>{url ? <img src={url} alt="" referrerPolicy="no-referrer" /> : initialsOf(name)}</span>;
}

const MAX_SOURCE_BYTES = 6 * 1024 * 1024;

/** Reads an image file and returns a small square JPEG data URL (centre-cropped) that is cheap to store with the workspace. */
export function imageToAvatar(file: File, size = 192): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Choose an image file (JPG, PNG or WebP).')); return; }
    if (file.size > MAX_SOURCE_BYTES) { reject(new Error('That image is larger than 6 MB.')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Could not process the image.')); return; }
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That image could not be read.')); };
    img.src = url;
  });
}

/** Avatar with a camera button to upload a new picture. */
export function AvatarUpload({ name, url, onChange, onError }: { name: string; url?: string; onChange: (dataUrl: string) => void; onError?: (message: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try { onChange(await imageToAvatar(file)); } catch (e) { onError?.((e as Error).message); } finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return <span className="avatar-upload">
    <Avatar name={name} url={url} />
    <button type="button" className="avatar-upload-btn" aria-label={`Change photo for ${name}`} title="Change photo" disabled={busy} onClick={() => input.current?.click()}><Camera size={13} /></button>
    <input ref={input} type="file" accept="image/*" hidden onChange={e => pick(e.target.files?.[0])} />
  </span>;
}
