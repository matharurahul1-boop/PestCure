import type { Field } from './model';
import { cadence } from './schedule';

export type Cadence = 'daily' | 'weekly' | 'monthly';
export type TagKind = Cadence | 'target' | 'actual' | 'text' | 'status' | 'auto' | 'info' | 'who';
export type GuideTag = { label: string; kind: TagKind };
export type GuideIcon = 'sparkles' | 'target' | 'sun' | 'calendar' | 'send' | 'check' | 'users' | 'trend' | 'wallet' | 'phone' | 'clipboard' | 'shield' | 'bell' | 'lock' | 'clock' | 'network' | 'settings' | 'chart' | 'userplus' | 'smartphone';
export type GuideStep = { icon: GuideIcon; title: string; desc: string; tag: GuideTag };
export type GuideBlock =
  | { type: 'stats'; items: Array<{ value: string; label: string }> }
  | { type: 'chips'; title: string; items: string[]; more?: number }
  | { type: 'steps'; items: GuideStep[] };
/** What the narrator says for a card. {{like this}} marks English words / names inside the Hindi script. */
export type Narration = { hi: string; en: string };
export type GuideCard = { id: string; tone: number; icon: GuideIcon; eyebrow: string; title: string; subtitle?: string; tags: GuideTag[]; blocks: GuideBlock[]; say: Narration };

const CADENCE_TAG: Record<Cadence, GuideTag> = {
  daily: { label: 'Every day', kind: 'daily' },
  weekly: { label: 'Weekly', kind: 'weekly' },
  monthly: { label: 'Monthly', kind: 'monthly' },
};
const COLUMN_TAG: Record<string, GuideTag> = {
  target: { label: 'Targets', kind: 'target' },
  daily: { label: 'Mon–Sun entries', kind: 'daily' },
  number: { label: 'Your numbers', kind: 'actual' },
  text: { label: 'Remarks', kind: 'text' },
  date: { label: 'Dates', kind: 'text' },
  status: { label: 'Status', kind: 'status' },
  computed: { label: 'Auto-scored', kind: 'auto' },
};
const WHEN_HI: Record<Cadence, string> = { daily: 'इसे रोज़ भरना है', weekly: 'इसे हफ़्ते में एक बार भरना है', monthly: 'इसे महीने में एक बार भरना है' };
const WHEN_EN: Record<Cadence, string> = { daily: 'Fill it every day', weekly: 'Fill it once a week', monthly: 'Fill it once a month' };

/** Pick an icon for a KRA from what it is called. */
export function iconFor(kra: string): GuideIcon {
  const k = kra.toLowerCase();
  if (/attend|employee/.test(k)) return 'calendar';
  if (/daily|activity/.test(k)) return 'sun';
  if (/payment|account|collection|billing|invoice|revenue|running/.test(k)) return 'wallet';
  if (/lead|crm|customer|client|care|call/.test(k)) return 'phone';
  if (/sales|business|target|achievement|metric|growth/.test(k)) return 'trend';
  if (/team|supervis|people|staff/.test(k)) return 'users';
  return 'clipboard';
}

export type KraSummary = { kra: string; items: string[]; cadences: Cadence[]; columns: string[]; hasTargets: boolean; byCadence: Record<Cadence, string[]> };

/** One summary per KRA section of the form, in form order: what is in it and how often it is filled. */
export function summarizeFields(fields: Field[]): KraSummary[] {
  const order: string[] = [];
  const by = new Map<string, KraSummary>();
  for (const f of fields) {
    let s = by.get(f.kra);
    if (!s) { s = { kra: f.kra, items: [], cadences: [], columns: [], hasTargets: false, byCadence: { daily: [], weekly: [], monthly: [] } }; by.set(f.kra, s); order.push(f.kra); }
    const addCadence = (c: Cadence) => { if (!s!.cadences.includes(c)) s!.cadences.push(c); };
    if (f.table) {
      const dailyTable = f.table.columns.some(c => c.type === 'daily');
      for (const row of f.table.rows) { const c = row.cadence ?? f.cadence ?? cadence(f); s.items.push(row.label); addCadence(c); s.byCadence[dailyTable ? 'daily' : c].push(row.label); }
      for (const c of f.table.columns) { if (!s.columns.includes(c.type)) s.columns.push(c.type); if (c.type === 'target') s.hasTargets = true; if (c.type === 'daily') addCadence('daily'); }
    } else {
      s.items.push(f.label); addCadence(cadence(f)); s.byCadence[cadence(f)].push(f.label);
      const kind = f.type === 'number' ? 'number' : f.type === 'text' ? 'text' : 'status';
      if (!s.columns.includes(kind)) s.columns.push(kind);
      if (f.type === 'number') s.hasTargets = true;
    }
  }
  return order.map(k => by.get(k)!);
}

const MAX_KRA_CARDS = 6;

/** What each kind of column means for the person filling it, in Hindi and English. */
function howToFill(k: KraSummary): { hi: string; en: string } {
  const hi: string[] = []; const en: string[] = [];
  if (k.hasTargets) { hi.push('हफ़्ते की शुरुआत में हर चीज़ का टार्गेट तय होता है, और आपका अकाउंटेबल उसे अप्रूव करता है.'); en.push('At the start of the week a target is set for each item, and your accountable approves it.'); }
  if (k.columns.includes('daily')) { hi.push('सोमवार से रविवार, हर दिन का नंबर उसी दिन के कॉलम में भरें. आगे के दिन का कॉलम पहले से नहीं खुलता.'); en.push("From Monday to Sunday, enter each day's number in that day's column. Future days stay closed."); }
  else if (k.columns.includes('number')) { hi.push('जो आपने हासिल किया, वो नंबर में भरें.'); en.push('Enter what you achieved as a number.'); }
  if (k.columns.includes('computed')) { hi.push('अचीवमेंट परसेंट अपने आप कैलकुलेट हो जाता है, उसे आपको नहीं भरना.'); en.push('The achievement percentage is calculated for you. You do not fill it.'); }
  if (k.columns.includes('status')) { hi.push('स्टेटस ड्रॉपडाउन से चुनें.'); en.push('Pick the status from the dropdown.'); }
  if (k.columns.includes('text') || k.columns.includes('date')) { hi.push('जहाँ रिमार्क्स या नोट का बॉक्स है, वहाँ एक छोटी लाइन में लिखें कि क्या हुआ.'); en.push('Where there is a remarks or note box, write one short line about what happened.'); }
  return { hi: hi.join(' '), en: en.join(' ') };
}
const CAD_ORDER: Cadence[] = ['daily', 'weekly', 'monthly'];
const WHEN_SHORT_HI: Record<Cadence, string> = { daily: 'रोज़', weekly: 'हफ़्ते में एक बार', monthly: 'महीने में एक बार' };
const WHEN_SHORT_EN: Record<Cadence, string> = { daily: 'every day', weekly: 'once a week', monthly: 'once a month' };
/** When a section mixes rhythms, spell out which items belong to which. */
const groups = (k: KraSummary) => CAD_ORDER.filter(c => k.byCadence[c].length).length;
const mixHi = (k: KraSummary) => groups(k) > 1 ? 'इसमें अलग-अलग चीज़ें अलग समय पर भरनी होती हैं: ' + CAD_ORDER.filter(c => k.byCadence[c].length).map(c => `${list(marked(k.byCadence[c].slice(0, 2).map(clean)), 'और')} ${WHEN_SHORT_HI[c]}`).join(', ') + '.' : '';
const mixEn = (k: KraSummary) => groups(k) > 1 ? 'Different items are filled at different times: ' + CAD_ORDER.filter(c => k.byCadence[c].length).map(c => `${list(k.byCadence[c].slice(0, 2).map(clean), 'and')} ${WHEN_SHORT_EN[c]}`).join(', ') + '.' : '';
const names = (items: string[], n: number) => items.slice(0, n).map(clean);
const countHi = (n: number) => n === 1 ? 'एक चीज़' : `${n} चीज़ें`;
const countEn = (n: number) => n === 1 ? 'one item' : `${n} items`;
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
const list = (items: string[], and: string) => items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ${and} ${items.at(-1)}`;
const marked = (items: string[]) => items.map(i => `{{${i}}}`);

export type GuideInput = { name: string; roleName: string; department?: string; fields: Field[]; hasTeam?: boolean };

/** The first-time walkthrough for a team member: generated from their own role template, so each role sees different cards. */
export function memberGuide({ name, roleName, department, fields, hasTeam }: GuideInput): GuideCard[] {
  const kras = summarizeFields(fields);
  const cadences = (['daily', 'weekly', 'monthly'] as Cadence[]).filter(c => kras.some(k => k.cadences.includes(c)));
  const itemCount = kras.reduce((n, k) => n + k.items.length, 0);
  const first = clean(name).split(' ')[0] || 'there';
  const hasDaily = cadences.includes('daily');

  const cards: GuideCard[] = [{
    id: 'welcome', tone: 0, icon: 'sparkles', eyebrow: 'Welcome', title: `Hi ${first}!`,
    subtitle: department && department.trim().toLowerCase() !== roleName.trim().toLowerCase() ? `${roleName} · ${department}` : roleName,
    tags: cadences.map(c => CADENCE_TAG[c]),
    blocks: [{ type: 'stats', items: [{ value: String(kras.length), label: kras.length === 1 ? 'Section' : 'Sections' }, { value: String(itemCount), label: 'Things to track' }, { value: String(cadences.length || 1), label: cadences.length === 1 ? 'Rhythm' : 'Rhythms' }] }],
    say: {
      hi: `नमस्ते {{${first}}}! आपका रोल है {{${roleName}}}. आपके फ़ॉर्म में ${kras.length} सेक्शन हैं और कुल ${itemCount} चीज़ें ट्रैक करनी हैं. आइए देखते हैं कि पूरा सिस्टम कैसे काम करता है.`,
      en: `Hi ${first}! Your role is ${roleName}. Your form has ${kras.length} sections and ${itemCount} things to track. Let's see how everything works.`,
    },
  }, {
    id: 'flow', tone: 1, icon: 'clipboard', eyebrow: 'Your week', title: 'How it works', subtitle: 'Five simple steps, every single week.',
    tags: [{ label: '5 simple steps', kind: 'info' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'target', title: 'Set your targets', desc: 'Decide what you will achieve this week.', tag: { label: 'Start of week', kind: 'target' } },
      { icon: 'check', title: 'Get them approved', desc: 'Your accountable checks and approves them.', tag: { label: 'Accountable', kind: 'who' } },
      { icon: 'sun', title: 'Fill your numbers', desc: hasDaily ? 'Enter your results each day, on that day.' : 'Enter your results as the week goes.', tag: { label: hasDaily ? 'Every day' : 'During the week', kind: 'daily' } },
      { icon: 'send', title: 'Submit the week', desc: 'Press submit when the week is over.', tag: { label: 'Week end', kind: 'weekly' } },
      { icon: 'shield', title: 'Review & score', desc: 'Your accountable reviews it and your score appears.', tag: { label: 'Accountable', kind: 'who' } },
    ] }],
    say: {
      hi: `हर हफ़्ते का काम पाँच आसान स्टेप में होता है. पहला, हफ़्ते की शुरुआत में अपनी {{Weekly reviews}} शीट खोलें और अपने {{targets}} सेट करें, यानी इस हफ़्ते आप कितना हासिल करेंगे. दूसरा, आपका अकाउंटेबल उन टार्गेट को देखकर अप्रूव करेगा. जब तक वो अप्रूव नहीं होते, नंबर नहीं भर सकते. तीसरा, ${hasDaily ? 'अप्रूवल के बाद रोज़, उसी दिन अपने नंबर भरें' : 'अप्रूवल के बाद हफ़्ते के दौरान अपने नंबर भरें'}. चौथा, हफ़्ता ख़त्म होने पर पूरी रिपोर्ट {{submit}} करें. और पाँचवाँ, आपका अकाउंटेबल रिव्यू करेगा, और आपका स्कोर बन जाएगा. अगर उन्हें कुछ सुधारना हो, तो रिपोर्ट आपके पास वापस आएगी.`,
      en: `Your week runs in five simple steps. One, at the start of the week open your Weekly reviews sheet and set your targets, meaning how much you will achieve this week. Two, your accountable checks and approves those targets. Until they are approved you cannot enter numbers. Three, once approved, ${hasDaily ? 'fill your numbers every day, on that day' : 'fill your numbers during the week'}. Four, when the week ends, submit the full report. And five, your accountable reviews it and your score is ready. If something needs fixing, the report comes back to you.`,
    },
  }];

  // what to do every day / every week / every month, across all sections
  const rhythm = (c: Cadence) => kras.flatMap(k => k.byCadence[c].map(clean)).filter((x, i, a) => a.indexOf(x) === i);
  const daily = rhythm('daily'), weekly = rhythm('weekly'), monthly = rhythm('monthly');
  if (daily.length) cards.push({
    id: 'daily', tone: 2, icon: 'sun', eyebrow: 'Every day', title: 'Your daily routine', subtitle: 'Do this once a day, on that day. It takes a few minutes.',
    tags: [CADENCE_TAG.daily, { label: 'Mon–Sun', kind: 'daily' }],
    blocks: [{ type: 'chips', title: 'Fill every day', items: daily.slice(0, 8), more: Math.max(0, daily.length - 8) }],
    say: {
      hi: `रोज़ का काम. हर दिन आपको ${countHi(daily.length)} भरनी हैं, जैसे ${list(marked(names(daily, 6)), 'और')}. दिन के अंत तक उसी दिन का नंबर उसी दिन के कॉलम में भर दें. आगे के दिन का कॉलम पहले नहीं खुलता, इसलिए रोज़ भरने की आदत बनाइए. अगर कोई दिन छूट जाए, तो {{Missed entries}} से लेट एंट्री की रिक्वेस्ट भेजें.`,
      en: `Your daily routine. Every day you fill ${countEn(daily.length)}, like ${list(names(daily, 6), 'and')}. By the end of the day, enter that day's number in that day's column. Future days stay closed, so make it a daily habit. If you miss a day, send a late entry request from Missed entries.`,
    },
  });
  if (weekly.length) cards.push({
    id: 'weekly', tone: 5, icon: 'calendar', eyebrow: 'Every week', title: 'Your weekly wrap-up', subtitle: 'Fill these during the week, then submit the report.',
    tags: [CADENCE_TAG.weekly, { label: 'Then submit', kind: 'status' }],
    blocks: [{ type: 'chips', title: 'Fill once a week', items: weekly.slice(0, 8), more: Math.max(0, weekly.length - 8) }],
    say: {
      hi: `हफ़्ते का काम. हफ़्ते में एक बार आपको ${countHi(weekly.length)} भरनी हैं, जैसे ${list(marked(names(weekly, 6)), 'और')}. इन्हें हफ़्ते के आख़िर तक पूरा करें. सब भरने के बाद {{Submit}} दबाएँ. सबमिट करने के बाद आपका अकाउंटेबल रिव्यू करेगा. अगर बदलाव चाहिए तो वो रिपोर्ट वापस भेजेगा, तब सुधार कर दोबारा सबमिट करें.`,
      en: `Your weekly wrap-up. Once a week you fill ${countEn(weekly.length)}, like ${list(names(weekly, 6), 'and')}. Finish them by the end of the week. When everything is filled, press Submit. After you submit, your accountable reviews it. If changes are needed they send it back, and you fix it and submit again.`,
    },
  });
  if (monthly.length) cards.push({
    id: 'monthly', tone: 4, icon: 'calendar', eyebrow: 'Every month', title: 'Your monthly items', subtitle: 'Fill these once a month, not every week.',
    tags: [CADENCE_TAG.monthly],
    blocks: [{ type: 'chips', title: 'Fill once a month', items: monthly.slice(0, 8), more: Math.max(0, monthly.length - 8) }],
    say: {
      hi: `महीने का काम. महीने में एक बार आपको ${countHi(monthly.length)} भरनी हैं, जैसे ${list(marked(names(monthly, 6)), 'और')}. ये हर हफ़्ते नहीं भरनी होतीं, बस महीने की अपनी शीट में एक बार भरें, और महीना ख़त्म होने से पहले पूरा कर दें.`,
      en: `Your monthly items. Once a month you fill ${countEn(monthly.length)}, like ${list(names(monthly, 6), 'and')}. You do not fill these every week. Fill them once in your monthly sheet and finish before the month ends.`,
    },
  });

  const shown = kras.slice(0, MAX_KRA_CARDS);
  const rest = kras.slice(MAX_KRA_CARDS);
  shown.forEach((k, i) => {
    const tags: GuideTag[] = [...k.cadences.map(c => CADENCE_TAG[c]), ...k.columns.filter(c => COLUMN_TAG[c]).slice(0, 3).map(c => COLUMN_TAG[c])];
    const main = CAD_ORDER.find(c => k.byCadence[c].length) ?? k.cadences[0] ?? 'weekly';
    const sample = k.items.slice(0, 3).map(clean);
    cards.push({
      id: `kra-${i}`, tone: (i + 2) % 6, icon: iconFor(k.kra), eyebrow: `Section ${i + 1} of ${kras.length}`, title: k.kra,
      subtitle: `${WHEN_EN[main]}. ${k.hasTargets ? 'Agree a target first, then enter what you achieved.' : 'Just enter the details as you go.'}`,
      tags: dedupe(tags),
      blocks: [{ type: 'chips', title: 'You will fill', items: k.items.slice(0, 8).map(clean), more: Math.max(0, k.items.length - 8) }],
      say: {
        hi: `सेक्शन ${i + 1}, {{${k.kra}}}. ${mixHi(k) || WHEN_HI[main] + '.'} इसमें कुल ${countHi(k.items.length)} हैं, जैसे ${list(marked(sample), 'और')}. ${howToFill(k).hi}`,
        en: `Section ${i + 1}, ${k.kra}. ${mixEn(k) || WHEN_EN[main] + '.'} There are ${countEn(k.items.length)} in all, like ${list(sample, 'and')}. ${howToFill(k).en}`,
      },
    });
  });
  if (rest.length) {
    const names = rest.map(k => k.kra).slice(0, 10);
    cards.push({
      id: 'kra-more', tone: 5, icon: 'clipboard', eyebrow: 'And more', title: `${rest.length} more ${rest.length === 1 ? 'section' : 'sections'}`, subtitle: 'The rest of your form works the same way.',
      tags: dedupe(rest.flatMap(k => k.cadences.map(c => CADENCE_TAG[c]))),
      blocks: [{ type: 'chips', title: 'Also in your form', items: names }],
      say: {
        hi: `आपके फ़ॉर्म में ${rest.length} सेक्शन और हैं, जैसे ${list(marked(names.slice(0, 3)), 'और')}. ये सब भी इसी तरह भरे जाते हैं.`,
        en: `Your form has ${rest.length} more sections, like ${list(names.slice(0, 3), 'and')}. They all work the same way.`,
      },
    });
  }

  cards.push({
    id: 'score', tone: 1, icon: 'chart', eyebrow: 'Your score', title: 'How you are scored', subtitle: 'Simple: what you achieved against your target.',
    tags: [{ label: 'Auto-scored', kind: 'auto' }, { label: 'Max 100%', kind: 'target' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'target', title: 'Achieved ÷ target', desc: 'Each number item is your result divided by its approved target.', tag: { label: 'Per item', kind: 'actual' } },
      { icon: 'check', title: 'Capped at 100%', desc: 'Beating a target does not push you above 100% on that item.', tag: { label: 'Max 100%', kind: 'target' } },
      { icon: 'clock', title: 'Empty counts as zero', desc: 'An item left unfilled is scored as zero, so fill everything.', tag: { label: 'Fill all', kind: 'daily' } },
      { icon: 'chart', title: 'Average is your score', desc: 'Green is on track, amber needs attention, red needs support.', tag: { label: 'Grade colours', kind: 'auto' } },
    ] }],
    say: {
      hi: `स्कोर कैसे बनता है, ये भी जान लें. हर नंबर वाली चीज़ में आपका अचीवमेंट होता है, यानी जो आपने हासिल किया, उसे अप्रूव हुए टार्गेट से भाग देना. एक चीज़ में ज़्यादा से ज़्यादा सौ परसेंट गिना जाता है, इसलिए टार्गेट से ज़्यादा करने पर भी वो सौ से ऊपर नहीं जाता. जो चीज़ ख़ाली छूट जाए, वो ज़ीरो गिनी जाती है, इसलिए सब कुछ भरें. आख़िर में सबका औसत आपका स्कोर है. हरा मतलब ऑन ट्रैक, पीला मतलब ध्यान देने की ज़रूरत, और लाल मतलब सपोर्ट चाहिए.`,
      en: `Let's also see how your score works. For every number item, your achievement is what you achieved divided by your approved target. Each item is capped at one hundred percent, so beating a target does not push it higher. Anything left empty counts as zero, so fill everything. Finally, the average of all items is your score. Green means on track, amber means needs attention, and red means support is needed.`,
    },
  });

  if (hasTeam) {
    cards.push({
      id: 'team', tone: 4, icon: 'users', eyebrow: 'You lead a team', title: 'Approve your team', subtitle: 'People reporting to you send their targets and reports to you.',
      tags: [{ label: 'My team', kind: 'who' }, { label: 'Approvals', kind: 'status' }],
      blocks: [{ type: 'steps', items: [
        { icon: 'users', title: 'Switch to “My team”', desc: 'Use the switch at the top of the screen.', tag: { label: 'Top bar', kind: 'info' } },
        { icon: 'check', title: 'Approve or return their work', desc: 'Targets and reports wait for your decision.', tag: { label: 'Approvals', kind: 'status' } },
      ] }],
      say: {
        hi: `आप एक टीम भी लीड करते हैं. ऊपर {{My team}} पर स्विच करें. आपकी टीम के टार्गेट और रिपोर्ट वहाँ आपके अप्रूवल का इंतज़ार करेंगे. उन्हें अप्रूव करें, या सुधार के लिए वापस भेजें.`,
        en: `You also lead a team. Switch to My team at the top. Your team's targets and reports wait there for your approval. Approve them, or send them back for changes.`,
      },
    });
  }

  cards.push({
    id: 'rules', tone: 3, icon: 'lock', eyebrow: 'Good to know', title: 'Stay on track', subtitle: 'Four small things that make life easier.',
    tags: [{ label: 'Quick tips', kind: 'info' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'clock', title: 'Day columns open on their day', desc: 'Monday fills on Monday, Tuesday on Tuesday.', tag: { label: 'Daily', kind: 'daily' } },
      { icon: 'lock', title: 'Missed it? Ask for a late entry', desc: 'Send a request from Missed entries.', tag: { label: 'Missed entries', kind: 'status' } },
      { icon: 'bell', title: 'Turn on alerts', desc: 'Get told when something is approved or returned.', tag: { label: 'Bell icon', kind: 'info' } },
      { icon: 'smartphone', title: 'Install the app', desc: 'Add PestCure to your phone’s home screen.', tag: { label: 'Install icon', kind: 'info' } },
    ] }],
    say: {
      hi: `कुछ ज़रूरी बातें. दिन का कॉलम सिर्फ़ उसी दिन खुलता है. अगर कोई एंट्री छूट जाए, तो {{Missed entries}} से लेट एंट्री की रिक्वेस्ट भेजें. ऊपर घंटी वाले आइकन से {{alerts}} ऑन करें, ताकि अप्रूवल की ख़बर तुरंत मिले. और अपने फ़ोन में ऐप इंस्टॉल कर लें. बस, अब आप तैयार हैं!`,
      en: `A few things to remember. A day column opens only on that day. If you miss an entry, send a late entry request from Missed entries. Turn on alerts with the bell icon so you hear about approvals right away. And install the app on your phone. That's it, you're ready!`,
    },
  });
  return cards;
}

export function adminGuide(name: string): GuideCard[] {
  const first = clean(name).split(' ')[0] || 'there';
  return [{
    id: 'welcome', tone: 0, icon: 'sparkles', eyebrow: 'Welcome', title: `Hi ${first}!`, subtitle: 'You run this workspace.',
    tags: [{ label: 'Admin', kind: 'who' }, { label: 'Full access', kind: 'info' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'userplus', title: 'Approve new sign-ups', desc: 'Everyone waits for your yes before entering.', tag: { label: 'Users', kind: 'who' } },
      { icon: 'clipboard', title: 'Give each person a role', desc: 'The role decides which review sheet they fill.', tag: { label: 'Templates', kind: 'weekly' } },
      { icon: 'network', title: 'Place them on the org chart', desc: 'This decides who approves their work.', tag: { label: 'Org chart', kind: 'info' } },
    ] }],
    say: {
      hi: `नमस्ते {{${first}}}! आप इस वर्कस्पेस के एडमिन हैं. नए साइन-अप आपके अप्रूवल का इंतज़ार करते हैं. हर व्यक्ति को एक रोल दें, उसी से तय होता है कि वो कौन सी रिव्यू शीट भरेगा. फिर उन्हें {{org chart}} में सही जगह पर रखें, उसी से तय होता है कि उनका काम कौन अप्रूव करेगा.`,
      en: `Hi ${first}! You are the admin of this workspace. New sign-ups wait for your approval. Give each person a role, which decides the review sheet they fill. Then place them on the org chart, which decides who approves their work.`,
    },
  }, {
    id: 'keep', tone: 1, icon: 'shield', eyebrow: 'Every week', title: 'Keep it moving', subtitle: 'Your weekly routine in three moves.',
    tags: [{ label: 'Approvals', kind: 'status' }, { label: 'Missed entries', kind: 'daily' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'target', title: 'Approve targets and reports', desc: 'Nothing is scored until you or an accountable approves.', tag: { label: 'Approvals', kind: 'status' } },
      { icon: 'lock', title: 'Decide late-entry requests', desc: 'Unlock a missed day, or keep it locked.', tag: { label: 'Missed entries', kind: 'daily' } },
      { icon: 'chart', title: 'Watch scores and trends', desc: 'See who is on track and who needs support.', tag: { label: 'Stats', kind: 'auto' } },
    ] }],
    say: {
      hi: `हर हफ़्ते तीन काम. एक, {{Approvals}} में टार्गेट और रिपोर्ट अप्रूव करें. दो, {{Missed entries}} में लेट एंट्री की रिक्वेस्ट पर फ़ैसला लें. तीन, {{Stats}} में देखें कि कौन ट्रैक पर है और किसे मदद चाहिए.`,
      en: `Three jobs every week. One, approve targets and reports in Approvals. Two, decide late entry requests in Missed entries. Three, watch scores and trends in Stats to see who is on track and who needs support.`,
    },
  }, {
    id: 'own', tone: 3, icon: 'settings', eyebrow: 'Make it yours', title: 'Set it up once', subtitle: 'A few settings, then it runs by itself.',
    tags: [{ label: 'Settings', kind: 'info' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'calendar', title: 'Choose the week start day', desc: 'For example Tuesday to Monday.', tag: { label: 'Settings', kind: 'info' } },
      { icon: 'clipboard', title: 'Edit role templates', desc: 'Change sections, fields and weightage.', tag: { label: 'Roles', kind: 'weekly' } },
      { icon: 'bell', title: 'Turn on alerts', desc: 'Know the moment someone submits.', tag: { label: 'Bell icon', kind: 'info' } },
    ] }],
    say: {
      hi: `आख़िर में, एक बार सेटअप कर लें. {{Settings}} में हफ़्ते का शुरुआती दिन चुनें. {{Roles}} में रोल टेम्पलेट एडिट करें. और घंटी वाले आइकन से {{alerts}} ऑन करें, ताकि जैसे ही कोई सबमिट करे, आपको पता चल जाए. बस, आप तैयार हैं!`,
      en: `Finally, set things up once. Choose the week start day in Settings. Edit role templates in Roles. And turn on alerts with the bell icon, so you know the moment someone submits. That's it, you're ready!`,
    },
  }];
}

function dedupe(tags: GuideTag[]): GuideTag[] {
  const seen = new Set<string>();
  return tags.filter(t => (seen.has(t.label) ? false : (seen.add(t.label), true)));
}
