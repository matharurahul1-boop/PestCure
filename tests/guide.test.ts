import test from 'node:test';
import assert from 'node:assert/strict';
import { adminGuide, memberGuide, summarizeFields } from '../src/workspace/guide';
import { templatesOnlyWorkspace } from '../src/workspace/reportData';

const guideFor = (roleId: string, hasTeam = false) => {
 const role = templatesOnlyWorkspace().roles.find(r => r.id === roleId)!;
 return { role, cards: memberGuide({ name: 'Asha Rao', roleName: role.name, department: role.department, fields: role.fields, hasTeam }) };
};

test('every role gets its own guide, built from its own sections', () => {
 const roles = templatesOnlyWorkspace().roles;
 const titles = new Map<string, string>();
 for (const role of roles) {
  const { cards } = guideFor(role.id);
  assert.ok(cards.length >= 4 && cards.length <= 16, `${role.name}: ${cards.length} cards`);
  assert.equal(cards[0].id, 'welcome');
  assert.equal(cards.at(-1)!.id, 'rules');
  titles.set(role.id, cards.filter(c => c.id.startsWith('kra-')).map(c => c.title).join('|'));
  for (const c of cards) assert.ok(c.title && c.tags.length >= 0 && c.blocks.length > 0, `${role.name}/${c.id} has content`);
 }
 assert.ok(new Set(titles.values()).size > 5, 'different roles produce different section cards');
});

test('cards reflect cadence and the role sections; long forms are capped', () => {
 const { role, cards } = guideFor('role-commercial-bd');
 const kras = summarizeFields(role.fields);
 const kraCards = cards.filter(c => /^kra-\d/.test(c.id));
 assert.equal(kraCards.length, Math.min(6, kras.length));
 assert.deepEqual(kraCards.map(c => c.title), kras.slice(0, 6).map(k => k.kra));
 const welcome = cards[0];
 assert.ok(welcome.tags.some(t => t.kind === 'daily') && welcome.tags.some(t => t.kind === 'weekly'));
 if (kras.length > 6) assert.ok(cards.some(c => c.id === 'kra-more'));
 const chips = kraCards[0].blocks[0];
 assert.ok(chips.type === 'chips' && chips.items.length > 0 && chips.items.length <= 8);
});

test('accountables get an approval card, admins get their own short guide', () => {
 assert.ok(!guideFor('role-commercial-bd').cards.some(c => c.id === 'team'));
 assert.ok(guideFor('role-commercial-bd', true).cards.some(c => c.id === 'team'));
 const admin = adminGuide('Tushar Bali');
 assert.equal(admin.length, 3);
 assert.equal(admin[0].title, 'Hi Tushar!');
});

test('every card has a description and a Hindi + English narration', async () => {
 const { toSegments, caption } = await import('../src/workspace/narrator');
 const roles = templatesOnlyWorkspace().roles;
 for (const role of [...roles.slice(0, 6), roles.at(-1)!]) {
  for (const c of memberGuide({ name: 'Asha Rao', roleName: role.name, department: role.department, fields: role.fields, hasTeam: true }).concat(adminGuide('Tushar'))) {
   assert.ok(c.say.en.length > 30 && c.say.hi.length > 30, `${role.name}/${c.id} has narration`);
   assert.ok(/[\u0900-\u097F]/.test(c.say.hi), `${c.id}: Hindi narration is in Devanagari`);
   assert.equal((c.say.hi.match(/\{\{/g) ?? []).length, (c.say.hi.match(/\}\}/g) ?? []).length, `${c.id}: balanced markers`);
   assert.ok(!caption(c.say.hi).includes('{{'));
   assert.ok(c.subtitle || c.blocks.some(b => b.type === 'steps' || b.type === 'chips'), `${c.id} explains itself`);
   for (const b of c.blocks) if (b.type === 'steps') for (const s of b.items) assert.ok(s.desc.length > 10, `${c.id}/${s.title} has a description`);
   const segs = toSegments(c.say.hi, 'hi');
   assert.ok(segs.some(s => s.lang === 'hi'));
  }
 }
 assert.deepEqual(toSegments('नमस्ते {{Asha}}!', 'hi').map(s => [s.lang, s.text]), [['hi', 'नमस्ते '], ['en', 'Asha'], ['hi', '!']]);
});
