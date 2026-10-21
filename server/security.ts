import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';

const KEY_LENGTH = 64;

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, KEY_LENGTH, (err, key) => (err ? reject(err) : resolve(key))));
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await derive(password, salt)).toString('hex');
  return { salt, hash };
}

const DUMMY_SALT = randomBytes(16).toString('hex');
const DUMMY_HASH = Buffer.alloc(KEY_LENGTH);

/** Constant-work verification: an unknown account still pays for one scrypt run. */
export async function verifyPassword(password: string, salt: string | null, hash: string | null) {
  const derived = await derive(password, salt ?? DUMMY_SALT);
  const expected = hash ? Buffer.from(hash, 'hex') : DUMMY_HASH;
  return expected.length === derived.length && timingSafeEqual(derived, expected) && Boolean(salt && hash);
}

export const newSessionToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** Small in-memory failure counter so password guessing is throttled per client + account. */
export class AttemptLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();
  constructor(private max = 10, private windowMs = 15 * 60_000) {}
  blocked(key: string) {
    const entry = this.hits.get(key);
    if (!entry) return false;
    if (Date.now() > entry.resetAt) { this.hits.delete(key); return false; }
    return entry.count >= this.max;
  }
  fail(key: string) {
    if (this.hits.size > 5000) this.hits.clear();
    const entry = this.hits.get(key);
    if (!entry || Date.now() > entry.resetAt) this.hits.set(key, { count: 1, resetAt: Date.now() + this.windowMs });
    else entry.count++;
  }
  clear(key: string) { this.hits.delete(key); }
}
