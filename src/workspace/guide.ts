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
      hi: `नमस्ते {{${first}}}! पेस्टक्योर वर्क-स्पेस में आपका स्वागत है. ये वो जगह है जहाँ आप हर हफ़्ते अपना काम और नंबर भरते हैं, और उसी से आपकी परफ़ॉर्मेंस सही और साफ़ तरीक़े से गिनी जाती है. आपका रोल {{${roleName}}} है, इसलिए आपकी शीट बाक़ी लोगों से अलग है, और इसमें ${kras.length} सेक्शन और कुल ${itemCount} चीज़ें हैं. अगले कार्ड्स में हम शुरू से आख़िर तक सब कुछ समझेंगे: ऐप में सब कहाँ है, टार्गेट कैसे तय करना है, रोज़, हफ़्ते और महीने में क्या भरना है, रिपोर्ट कैसे सबमिट करनी है, और स्कोर कैसे बनता है. हर कार्ड आप ख़ुद भी पढ़ सकते हैं, मैं उसे आसान भाषा में और पूरा समझाता जाऊँगा. इसलिए आराम से सुनिए, और किसी और से पूछने की ज़रूरत नहीं पड़ेगी.`,
      en: `Hi ${first}! Welcome to the PestCure workspace. This is where you fill in your work and numbers every week, and where your performance is counted in a clear and fair way. Your role is ${roleName}, so your sheet is different from other people's, and it has ${kras.length} sections and ${itemCount} things in all. In the next cards we will understand everything from start to finish: where everything is in the app, how to set your targets, what to fill daily, weekly and monthly, how to submit your report, and how your score is made. You can read every card yourself too, and I will explain each one fully in simple words. So listen at your own pace, and you will not need to ask anyone else.`,
    },
  }, {
    id: 'tour', tone: 5, icon: 'smartphone', eyebrow: 'Find your way', title: 'Where things are', subtitle: 'Five places you will use, and what each one is for.',
    tags: [{ label: 'Bottom bar / menu', kind: 'info' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'chart', title: 'Dashboard', desc: 'Your score, your trend and what needs you today.', tag: { label: 'Home', kind: 'info' } },
      { icon: 'clipboard', title: 'Weekly reviews', desc: 'Your sheet for the week. This is where you work.', tag: { label: 'Main screen', kind: 'weekly' } },
      { icon: 'sun', title: 'Daily & monthly', desc: 'Your daily and monthly entries in one place.', tag: { label: 'Entries', kind: 'daily' } },
      { icon: 'lock', title: 'Missed entries', desc: 'Missed a day? Ask for it to be opened here.', tag: { label: 'Requests', kind: 'status' } },
      { icon: 'network', title: 'Org chart', desc: 'See who approves your work.', tag: { label: 'Your approver', kind: 'who' } },
    ] }],
    say: {
      hi: `सबसे पहले ये जान लें कि सब कुछ कहाँ है. नीचे के मेन्यू में पाँच जगहें हैं. {{Dashboard}} आपका होम है, जहाँ आपका स्कोर, ट्रेंड और आज का काम दिखता है. {{Weekly reviews}} सबसे ज़रूरी स्क्रीन है, यही आपकी हफ़्ते की शीट है, और आपका ज़्यादातर काम यहीं होगा. {{Daily and monthly}} में आपकी रोज़ और महीने की एंट्री एक जगह मिलती हैं. कोई दिन छूट जाए, तो {{Missed entries}} में उसे खुलवाने की रिक्वेस्ट भेजते हैं. और {{Org chart}} में आप देख सकते हैं कि आपका काम कौन अप्रूव करता है. ऊपर की तरफ़ घंटी का आइकन है, जिस पर आपके लिए सारी नई सूचनाएँ आती हैं, जैसे टार्गेट अप्रूव हुआ या रिपोर्ट वापस आई. बाक़ी चीज़ें, जैसे सेटिंग और साइन आउट, {{More}} में मिल जाएँगी.`,
      en: `First, let's see where everything is. In the bottom menu there are five places. Dashboard is your home, where your score, your trend and today's work show up. Weekly reviews is the most important screen. It is your sheet for the week, and most of your work happens here. Daily and monthly gathers your daily and monthly entries in one place. If you miss a day, Missed entries is where you ask for it to be opened. And in the Org chart you can see who approves your work. At the top there is a bell icon, where all your new notifications arrive, like targets approved or a report sent back. Everything else, like settings and sign out, is under More.`,
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
      hi: `अब पूरा हफ़्ता एक नज़र में. पूरा सिस्टम एक सीधी लाइन में चलता है. स्टेप एक: हफ़्ते की शुरुआत में आप अपना टार्गेट तय करते हैं, यानी इस हफ़्ते आप कितना हासिल करने वाले हैं. स्टेप दो: आपका अकाउंटेबल, यानी जो आपका काम अप्रूव करता है, उस टार्गेट को देखकर अप्रूव करता है. ध्यान रहे, जब तक टार्गेट अप्रूव नहीं होता, नंबर नहीं भर सकते. स्टेप तीन: अप्रूवल के बाद ${hasDaily ? 'हर दिन, उसी दिन अपने नंबर भरें' : 'हफ़्ते के दौरान अपने नंबर भरें'}. स्टेप चार: हफ़्ता ख़त्म होने पर पूरी रिपोर्ट {{submit}} करें. स्टेप पाँच: अकाउंटेबल उसे रिव्यू करता है, और आपका स्कोर बन जाता है. अगर उन्हें कुछ सुधारना हो, तो रिपोर्ट कमेंट के साथ आपके पास वापस आती है, और आप सुधारकर दोबारा भेजते हैं. आपका अकाउंटेबल कौन है, ये आप {{Org chart}} में देख सकते हैं, और अगर वहाँ कोई ख़ाली हो, तो एडमिन ख़ुद अप्रूव करते हैं. अगले कार्ड्स में हर स्टेप को बारीकी से देखेंगे.`,
      en: `Now the whole week at a glance. The whole system runs in one straight line. Step one: at the start of the week you set your target, meaning how much you plan to achieve this week. Step two: your accountable, the person who approves your work, checks and approves that target. Remember, until the target is approved you cannot enter numbers. Step three: after approval, ${hasDaily ? 'fill your numbers every day, on that day' : 'fill your numbers during the week'}. Step four: when the week ends, submit the full report. Step five: your accountable reviews it and your score is created. If they want something fixed, the report comes back to you with comments, and you fix it and send it again. You can see who your accountable is in the Org chart, and if that seat is empty, the admin approves directly. In the next cards we will look at each step closely.`,
    },
  }, {
    id: 'targets', tone: 2, icon: 'target', eyebrow: 'Start of every week', title: 'Setting your targets', subtitle: 'Your plan for the week, agreed before you start.',
    tags: [{ label: 'Target', kind: 'target' }, { label: 'Needs approval', kind: 'who' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'clipboard', title: 'Open your weekly sheet', desc: 'Go to Weekly reviews and open this week.', tag: { label: 'Weekly reviews', kind: 'weekly' } },
      { icon: 'target', title: 'Fill the Target column', desc: 'Write how much you will achieve for each item.', tag: { label: 'Target', kind: 'target' } },
      { icon: 'send', title: 'Press “Submit targets”', desc: 'This sends your plan to your accountable.', tag: { label: 'Submit targets', kind: 'status' } },
      { icon: 'check', title: 'Wait for approval', desc: 'You get a bell notification when it is decided.', tag: { label: 'Bell icon', kind: 'info' } },
      { icon: 'lock', title: 'Need to change later?', desc: 'After approval, use “Request target update”.', tag: { label: 'Request update', kind: 'who' } },
    ] }],
    say: {
      hi: `हर हफ़्ते की शुरुआत टार्गेट से होती है. {{Weekly reviews}} में जाइए और इस हफ़्ते की शीट खोलिए. जिन चीज़ों में {{Target}} का कॉलम है, वहाँ लिखिए कि इस हफ़्ते आप कितना हासिल करेंगे. टार्गेट सोच-समझकर और सच्चा रखिए, क्योंकि आपका स्कोर इसी के मुक़ाबले गिना जाएगा. सब भर जाए, तो {{Submit targets}} दबाइए. इससे आपका प्लान आपके अकाउंटेबल के पास चला जाता है. वो उसे देखकर अप्रूव करेंगे, या कुछ बदलने को कहेंगे. जैसे ही फ़ैसला होता है, घंटी पर सूचना आ जाती है. अगर वो बदलाव माँगें, तो उनका कमेंट पढ़िए, टार्गेट ठीक कीजिए और फिर से सबमिट कीजिए. एक बार टार्गेट अप्रूव हो जाएँ, तो वो ख़ुद नहीं बदलते. अगर कभी सच में बदलना पड़े, तो {{Request target update}} दबाइए, और अपने अकाउंटेबल को कारण बताइए. और याद रखिए, टार्गेट अप्रूव होने के बाद ही नंबर भरने का कॉलम खुलता है.`,
      en: `Every week starts with targets. Go to Weekly reviews and open this week's sheet. For the items that have a Target column, write how much you will achieve this week. Keep targets thoughtful and honest, because your score is counted against them. When everything is filled, press Submit targets. This sends your plan to your accountable. They will either approve it or ask you to change something. As soon as they decide, a notification arrives on the bell. If they ask for changes, read their comment, fix your targets and submit again. Once targets are approved they do not change by themselves. If you truly must change one later, press Request target update and tell your accountable why. And remember, the columns for entering your numbers open only after the targets are approved.`,
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
      hi: `अब रोज़ का काम. इसमें बस कुछ मिनट लगते हैं, पर इसे आदत बना लेना सबसे अच्छा है. आपको हर दिन ${countHi(daily.length)} भरनी हैं, जैसे ${list(marked(names(daily, 3)), 'और')}. तरीक़ा ये है: {{Weekly reviews}} या {{Daily and monthly}} में अपनी शीट खोलिए, उस सेक्शन में जाइए, और जिस दिन का नंबर है, उसी दिन के कॉलम में भर दीजिए. मान लीजिए आज बुधवार है, तो सिर्फ़ बुधवार का कॉलम खुला मिलेगा, आगे के दिन बंद रहेंगे. नंबर आप जैसे ही भरते हैं, सेव होता जाता है, और हफ़्ते का टोटल और अचीवमेंट परसेंट अपने आप बन जाता है. बाद में याद करके भरने से नंबर ग़लत हो सकते हैं, इसलिए दिन ख़त्म होने से पहले भर दें. कोई दिन छूट जाए, तो घबराइए मत. {{Missed entries}} में जाकर उस दिन की रिक्वेस्ट भेजिए, और अकाउंटेबल या एडमिन उसे खोल देंगे.`,
      en: `Now the daily work. It takes just a few minutes, but it is best to make it a habit. Every day you fill ${countEn(daily.length)}, like ${list(names(daily, 3), 'and')}. The method is this: open your sheet in Weekly reviews or Daily and monthly, go to that section, and enter the number in the column of the day it belongs to. If today is Wednesday, only the Wednesday column is open, and the later days stay closed. Your numbers are saved as you enter them, and the weekly total and achievement percentage are made automatically. Filling in later from memory can make numbers wrong, so fill them before the day ends. If you miss a day, do not worry. Go to Missed entries, send a request for that day, and your accountable or the admin will open it.`,
    },
  });
  if (weekly.length) cards.push({
    id: 'weekly', tone: 5, icon: 'calendar', eyebrow: 'Every week', title: 'Your weekly wrap-up', subtitle: 'Fill these during the week, then submit the report.',
    tags: [CADENCE_TAG.weekly, { label: 'Then submit', kind: 'status' }],
    blocks: [{ type: 'chips', title: 'Fill once a week', items: weekly.slice(0, 8), more: Math.max(0, weekly.length - 8) }],
    say: {
      hi: `अब हफ़्ते की चीज़ें. ये रोज़ नहीं, हफ़्ते में सिर्फ़ एक बार भरनी हैं, जैसे ${list(marked(names(weekly, 3)), 'और')}. इनमें अक्सर आपको नंबर के साथ, या उसकी जगह, एक छोटा नोट लिखना होता है. जैसे हफ़्ते में क्या अच्छा रहा, कहाँ अटके, और अगले हफ़्ते क्या सुधारेंगे. नोट छोटे और सीधे रखिए, दो-तीन लाइन काफ़ी हैं. जहाँ ज़रूरत लगे, वहाँ हर लाइन के पास कमेंट के आइकन से अपने अकाउंटेबल के लिए सवाल या जानकारी भी लिख सकते हैं. इन्हें हफ़्ते के आख़िर तक पूरा करें. जब सब भर जाए, तब {{Submit review}} दबाइए. सबमिट करने का मतलब है कि अब आपका अकाउंटेबल इसे देखेगा. अगर उन्हें कुछ ठीक करवाना होगा, तो रिपोर्ट आपके पास वापस आएगी, तब सुधार करके दोबारा सबमिट कर दें.`,
      en: `Now the weekly items. These are not daily. You fill them just once a week, like ${list(names(weekly, 3), 'and')}. Often in these you write a short note, along with the number or instead of it. For example what went well this week, where you got stuck, and what you will improve next week. Keep notes short and direct, two or three lines are enough. Wherever you need to, you can also use the comment icon next to a line to leave a question or information for your accountable. Finish these by the end of the week. When everything is filled, press Submit review. Submitting means your accountable will now look at it. If they want something corrected, the report comes back to you. Fix it and submit again.`,
    },
  });
  if (monthly.length) cards.push({
    id: 'monthly', tone: 4, icon: 'calendar', eyebrow: 'Every month', title: 'Your monthly items', subtitle: 'Fill these once a month, not every week.',
    tags: [CADENCE_TAG.monthly],
    blocks: [{ type: 'chips', title: 'Fill once a month', items: monthly.slice(0, 8), more: Math.max(0, monthly.length - 8) }],
    say: {
      hi: `ये चीज़ें हर हफ़्ते नहीं भरनी होतीं, जैसे ${list(marked(names(monthly, 2)), 'और')}. इन्हें महीने की अपनी शीट में एक ही बार भरना है, और महीना ख़त्म होने से पहले पूरा कर देना है.`,
      en: `You do not fill these every week, like ${list(names(monthly, 2), 'and')}. Fill them just once in your monthly sheet, and finish before the month ends.`,
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
        hi: `{{${k.kra}}} सेक्शन. ${mixHi(k) || WHEN_HI[main] + '.'} उदाहरण के लिए {{${sample[0]}}}${sample[1] ? ' और {{' + sample[1] + '}}' : ''}. ${howToFill(k).hi}`,
        en: `${k.kra} section. ${mixEn(k) || WHEN_EN[main] + '.'} For example ${sample[0]}${sample[1] ? ' and ' + sample[1] : ''}. ${howToFill(k).en}`,
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
        hi: `आपके फ़ॉर्म में ${rest.length} सेक्शन और हैं, जैसे {{${names[0]}}}. ये सब भी इसी तरह भरे जाते हैं. जो सेक्शन आपके लिए ज़रूरी नहीं है, उसे आपकी शीट में ख़ुद देख सकते हैं.`,
        en: `Your form has ${rest.length} more sections, like ${names[0]}. They are all filled in the same way. You can see each one on your sheet.`,
      },
    });
  }

  cards.push({
    id: 'submit', tone: 4, icon: 'send', eyebrow: 'End of the week', title: 'Submit and get reviewed', subtitle: 'What happens after you press Submit review.',
    tags: [{ label: 'Submit review', kind: 'status' }, { label: 'Accountable reviews', kind: 'who' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'check', title: 'Check everything is filled', desc: 'Empty items are scored as zero.', tag: { label: 'Fill all', kind: 'daily' } },
      { icon: 'send', title: 'Press “Submit review”', desc: 'Your week now goes to your accountable.', tag: { label: 'Submit review', kind: 'status' } },
      { icon: 'shield', title: 'They approve or send it back', desc: 'If back, read the comments and fix the points.', tag: { label: 'Request changes', kind: 'who' } },
      { icon: 'chart', title: 'Your score appears', desc: 'Once approved, see it on your Dashboard.', tag: { label: 'Dashboard', kind: 'auto' } },
    ] }],
    say: {
      hi: `अब हफ़्ते के अंत की बात. जब सारे नंबर और नोट भर जाएँ, तो एक बार पूरी शीट ऊपर से नीचे देख लीजिए. कोई चीज़ ख़ाली नहीं रहनी चाहिए, क्योंकि ख़ाली चीज़ ज़ीरो गिनी जाती है. फिर {{Submit review}} दबाइए. इसका मतलब है कि अब आपका अकाउंटेबल आपका हफ़्ता देखेगा. वो या तो उसे अप्रूव करेंगे, या {{Request changes}} दबाकर वापस भेजेंगे. वापस आए तो घबराइए नहीं. हर लाइन के पास कमेंट का आइकन होता है, उसमें उनकी बात लिखी होगी. उसे पढ़िए, ज़रूरी सुधार कीजिए, चाहें तो जवाब में अपना कमेंट भी लिखिए, और दोबारा सबमिट कीजिए. अप्रूव होते ही आपका स्कोर फ़ाइनल हो जाता है, और {{Dashboard}} पर आपको अपना स्कोर और ट्रेंड दिखने लगता है. अगर आप हफ़्ता ख़त्म होने तक सबमिट करना भूल गए, तो वो हफ़्ते की रिपोर्ट आगे भी भरी जा सकती है, पर उसे जल्दी से जल्दी सबमिट कर दीजिए. रोज़ और महीने की एंट्री पीछे जाकर नहीं भरी जा सकतीं, उनके लिए {{Missed entries}} में रिक्वेस्ट भेजनी होती है.`,
      en: `Now the end of the week. When all your numbers and notes are filled, look through the whole sheet once from top to bottom. Nothing should be left empty, because an empty item counts as zero. Then press Submit review. This means your accountable will now look at your week. They will either approve it, or send it back with Request changes. If it comes back, do not worry. Next to every line there is a comment icon, and their note will be there. Read it, make the needed fixes, write a reply in the comment if you like, and submit again. As soon as it is approved your score is final, and you can see your score and trend on the Dashboard. If you forgot to submit by the end of the week, that weekly report can still be filled later, but submit it as soon as you can. Daily and monthly entries cannot be filled by going back. For those you send a request in Missed entries.`,
    },
  });

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
      hi: `अब स्कोर समझ लीजिए, ताकि कोई हैरानी न हो. हर नंबर वाली चीज़ में देखा जाता है कि आपने अप्रूव हुए टार्गेट का कितना हिस्सा पूरा किया. जैसे टार्गेट बीस था और आपने पंद्रह किया, तो पचहत्तर परसेंट. एक चीज़ में सौ परसेंट से ज़्यादा नहीं गिना जाता, इसलिए टार्गेट से बहुत ज़्यादा करने पर भी वो सौ ही रहता है. जो चीज़ ख़ाली छोड़ दी, वो ज़ीरो गिनी जाती है, इसलिए सब कुछ भरना ज़रूरी है. आख़िर में सारी चीज़ों का औसत आपका स्कोर है. स्कोर को ग्रेड और रंग मिलते हैं. हरा मतलब ऑन ट्रैक, पीला मतलब थोड़ा ध्यान देने की ज़रूरत, और लाल मतलब मदद चाहिए. ग्रेड के पास आँख वाले आइकन पर टैप करेंगे, तो हर ग्रेड की रेंज दिख जाएगी. और अगर किसी हफ़्ते का स्कोर कम आए, तो शीट के स्कोर वाले हिस्से में {{Why the score moved}} नाम की लिस्ट में देख सकते हैं कि कौन सी चीज़ ने स्कोर गिराया, और सबसे कमज़ोर चीज़ सबसे ऊपर आती है.`,
      en: `Now let's understand the score, so nothing is a surprise. For every number item, we see how much of the approved target you completed. For example, if the target was twenty and you did fifteen, that is seventy five percent. One item never counts above one hundred percent, so even if you do far more than the target, it stays at one hundred. Anything left empty counts as zero, so filling everything is important. Finally, the average of all items is your score. The score gets a grade and a colour. Green means on track, amber means pay a little attention, and red means you need help. Tap the eye icon next to the grade and you can see the range of every grade. And if a week's score is low, the list on your sheet shows which items pulled it down, with the weakest item at the top.`,
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
        hi: `आप एक टीम भी लीड करते हैं, इसलिए आपके पास एक एक्स्ट्रा काम है. ऊपर {{My team}} पर स्विच करें. वहाँ आपकी टीम के लोगों के टार्गेट और रिपोर्ट आपके अप्रूवल का इंतज़ार करते हैं. ठीक लगे तो अप्रूव करें, वरना कारण लिखकर वापस भेज दें. आपके अप्रूव करते ही उनका काम आगे बढ़ता है.`,
        en: `You also lead a team, so you have one extra job. Switch to My team at the top. There, your team's targets and reports wait for your approval. If they look right, approve them. Otherwise write the reason and send them back. As soon as you approve, their work moves forward.`,
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
      hi: `आख़िर में कुछ काम की बातें. एक, दिन का कॉलम सिर्फ़ उसी दिन खुलता है. दो, कोई रोज़ या महीने की एंट्री छूट जाए, तो {{Missed entries}} से रिक्वेस्ट भेजें. तीन, ऊपर घंटी वाले आइकन से {{alerts}} ऑन कर लें, ताकि टार्गेट अप्रूव हुआ, रिपोर्ट वापस आई, या कमेंट आया, तो ख़बर तुरंत मिले, चाहे ऐप बंद ही क्यों न हो. चार, ऐप को फ़ोन में इंस्टॉल कर लें, ऊपर इंस्टॉल का आइकन है, तो ये बाक़ी ऐप्स की तरह आपकी होम स्क्रीन से खुलेगा. पाँच, अगर आपका रोल बदलता है, तो इस हफ़्ते की शीट पुराने रोल की ही रहती है और स्कोर भी उसी से बनता है. नया रोल अगले हफ़्ते से लागू होता है. छह, अगर कभी ये गाइड दोबारा देखना हो, तो {{More}} में {{How it works}} दबाइए. बस, अब आप तैयार हैं. शुरू कीजिए!`,
      en: `Finally, a few useful things. One, a day column opens only on that day. Two, if you miss a daily or monthly entry, send a request from Missed entries. Three, turn on alerts with the bell icon, so that when targets are approved, a report is sent back, or a comment arrives, you hear at once, even when the app is closed. Four, install the app on your phone. There is an install icon at the top, and then it opens from your home screen like any other app. Five, if your role changes, this week's sheet stays on the old role and the score is made from it. The new role starts from next week. Six, if you ever want to see this guide again, tap How it works under More. That's it, you're ready. Let's begin!`,
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
      { icon: 'userplus', title: 'Bring people in', desc: 'Approve sign-ups and give each a role and a seat.', tag: { label: 'Users', kind: 'who' } },
      { icon: 'target', title: 'Keep the week moving', desc: 'Targets and reports are approved, or sent back.', tag: { label: 'Approvals', kind: 'status' } },
      { icon: 'chart', title: 'Watch performance', desc: 'Scores, trends and who needs support.', tag: { label: 'Stats', kind: 'auto' } },
      { icon: 'settings', title: 'Tune the system', desc: 'Roles, week start day, grade ranges.', tag: { label: 'Settings', kind: 'info' } },
    ] }],
    say: {
      hi: `नमस्ते {{${first}}}! आप इस वर्क-स्पेस के एडमिन हैं, यानी सब कुछ आपके हाथ में है. अगले कार्ड्स में हम शुरू से आख़िर तक समझेंगे कि नए लोगों को कैसे जोड़ना है, उन्हें रोल और सीट कैसे देनी है, हर हफ़्ते अप्रूवल कैसे चलाने हैं, परफ़ॉर्मेंस कहाँ देखनी है, और सिस्टम को अपने हिसाब से कैसे सेट करना है. हर कार्ड आप ख़ुद भी पढ़ सकते हैं, मैं उसे आसान भाषा में पूरा समझाता जाऊँगा. ध्यान रहे, ये गाइड हर बार लॉगिन पर सबसे पहले खुलेगा. नीचे के चेकबॉक्स से आप इसे बंद भी कर सकते हैं, और बाद में {{More}} में {{How it works}} से कभी भी दोबारा देख सकते हैं.`,
      en: `Hi ${first}! You are the admin of this workspace, which means everything is in your hands. In the next cards we will understand, from start to finish, how to bring new people in, how to give them a role and a seat, how to run approvals every week, where to watch performance, and how to set the system up your way. You can read each card yourself too, and I will explain it fully in simple words. Note that this guide opens first on every sign-in. You can turn that off with the checkbox below, and open it again any time from How it works under More.`,
    },
  }, {
    id: 'people', tone: 1, icon: 'userplus', eyebrow: 'Step 1', title: 'Bring people in', subtitle: 'Nobody gets in until you say yes.',
    tags: [{ label: 'Users', kind: 'who' }, { label: 'Role + seat', kind: 'target' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'userplus', title: 'They sign up', desc: 'With email or Google. They then wait on a pending screen.', tag: { label: 'Pending', kind: 'status' } },
      { icon: 'check', title: 'You approve them', desc: 'In Users, pick their role template and their seat.', tag: { label: 'Approve', kind: 'who' } },
      { icon: 'clipboard', title: 'Their sheet is ready', desc: 'This week’s review is made from their role.', tag: { label: 'Role template', kind: 'weekly' } },
      { icon: 'lock', title: 'Or say no / deactivate', desc: 'Reject a sign-up, or deactivate someone later.', tag: { label: 'Keeps history', kind: 'info' } },
    ] }],
    say: {
      hi: `सबसे पहले लोगों को जोड़ना. कोई भी व्यक्ति ईमेल या गूगल से साइन अप कर सकता है, लेकिन जब तक आप हाँ नहीं कहते, वो अंदर नहीं आ सकता. वो एक इंतज़ार वाली स्क्रीन पर रुका रहता है. आप {{Users}} में जाइए, वहाँ सबसे ऊपर नए साइन-अप की रिक्वेस्ट दिखती हैं. हर रिक्वेस्ट पर दो चीज़ें चुनिए. पहली, उसका रोल टेम्पलेट, क्योंकि उसी से तय होता है कि वो कौन सी रिव्यू शीट भरेगा. दूसरी, उसकी सीट, यानी ऑर्ग चार्ट में वो कहाँ बैठता है, क्योंकि उसी से तय होता है कि उसका काम कौन अप्रूव करेगा. अप्रूव करते ही उसके लिए इस हफ़्ते की शीट अपने आप बन जाती है. अगर किसी को अंदर नहीं लेना, तो रिजेक्ट कर दीजिए. कोई कंपनी छोड़ दे, तो उसके कार्ड पर डिएक्टिवेट का आइकन दबाइए. वो लॉगिन नहीं कर पाएगा और उसकी सीट ख़ाली हो जाएगी, पर उसकी पुरानी रिपोर्ट और स्कोर सुरक्षित रहते हैं. बाद में ज़रूरत हो तो रीएक्टिवेट भी कर सकते हैं.`,
      en: `First, bringing people in. Anyone can sign up with email or Google, but until you say yes they cannot get in. They stay on a waiting screen. Go to Users, and at the top you will see the new sign-up requests. On each request choose two things. First, their role template, because that decides which review sheet they will fill. Second, their seat, meaning where they sit on the org chart, because that decides who approves their work. The moment you approve, this week's sheet is created for them automatically. If you do not want someone in, reject them. If someone leaves the company, press the deactivate icon on their card. They will not be able to sign in and their seat becomes empty, but their old reports and scores stay safe. You can reactivate them later if needed.`,
    },
  }, {
    id: 'org', tone: 4, icon: 'network', eyebrow: 'Step 2', title: 'Seats and approvers', subtitle: 'The org chart decides who approves whom.',
    tags: [{ label: 'Org chart', kind: 'info' }, { label: 'Accountable', kind: 'who' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'network', title: 'Each seat reports to a seat', desc: 'The seat above is the approver.', tag: { label: 'Reports to', kind: 'who' } },
      { icon: 'users', title: 'Empty seat above? You approve', desc: 'The admin is the fallback for everything.', tag: { label: 'Admin', kind: 'status' } },
      { icon: 'settings', title: 'Edit any time', desc: 'Add, move or delete seats, and change holders.', tag: { label: 'Edit seats', kind: 'info' } },
      { icon: 'clipboard', title: 'Role change', desc: 'Starts next week. This week’s sheet stays.', tag: { label: 'Safe', kind: 'weekly' } },
    ] }],
    say: {
      hi: `अब ऑर्ग चार्ट, यानी कौन किसको रिपोर्ट करता है. हर सीट किसी ऊपर वाली सीट को रिपोर्ट करती है, और ऊपर वाली सीट पर जो व्यक्ति बैठा है, वही नीचे वाले का अकाउंटेबल बनता है. यानी उसके टार्गेट, रिपोर्ट और रिक्वेस्ट वही अप्रूव करता है. अगर ऊपर की सीट ख़ाली है, तो अप्रूवल अगली भरी हुई सीट पर जाता है, और कोई न मिले तो सीधा आपके पास आता है. आप हर अप्रूवल कभी भी ख़ुद भी कर सकते हैं. {{Org chart}} में आप सीट जोड़ सकते हैं, हटा सकते हैं, किसी को दूसरी सीट पर रख सकते हैं, और हर सीट पर डिफ़ॉल्ट रोल टेम्पलेट भी तय कर सकते हैं. बदलाव सबको एक मिनट के अंदर दिख जाता है, और पुराने लोगों का रिकॉर्ड रहता है. किसी का रोल बदलें, तो वो अगले हफ़्ते से लागू होता है, इस हफ़्ते की शीट और स्कोर पुराने रोल के ही रहते हैं. सबसे अच्छा तरीक़ा है कि हर नए व्यक्ति को अप्रूव करते समय ही सही सीट दे दें.`,
      en: `Now the org chart, meaning who reports to whom. Every seat reports to a seat above it, and the person sitting in the seat above becomes the accountable of the one below. That means they approve the targets, reports and requests. If the seat above is empty, approval goes to the next filled seat, and if there is none it comes straight to you. You can always do any approval yourself too. In the Org chart you can add seats, remove them, move someone to another seat, and set a default role template for each seat. Changes reach everyone within a minute, and the record of past holders is kept. If you change someone's role, it starts from next week, and this week's sheet and score stay on the old role. The best way is to give each new person the right seat at the moment you approve them.`,
    },
  }, {
    id: 'approvals', tone: 2, icon: 'shield', eyebrow: 'Every week', title: 'Approvals', subtitle: 'Four kinds of things wait for a decision.',
    tags: [{ label: 'Approvals', kind: 'status' }, { label: 'Bell icon', kind: 'info' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'target', title: 'Targets', desc: 'Approve, adjust, or send back with a reason.', tag: { label: 'Start of week', kind: 'target' } },
      { icon: 'send', title: 'Weekly reports', desc: 'Approve to finalise the score, or request changes.', tag: { label: 'Week end', kind: 'weekly' } },
      { icon: 'clipboard', title: 'Target change requests', desc: 'When someone wants to change an approved target.', tag: { label: 'Request update', kind: 'who' } },
      { icon: 'lock', title: 'Late-entry requests', desc: 'Unlock a missed day, or keep it locked.', tag: { label: 'Missed entries', kind: 'daily' } },
    ] }],
    say: {
      hi: `अब हर हफ़्ते का सबसे ज़रूरी काम, अप्रूवल. {{Approvals}} में चार तरह की चीज़ें इंतज़ार करती हैं, और जैसे ही कुछ आता है, आपको घंटी पर और पुश नोटिफ़िकेशन से ख़बर मिल जाती है. एक, टार्गेट. हर कोई हफ़्ते की शुरुआत में अपना टार्गेट भेजता है. आप उसे अप्रूव कर सकते हैं, उसमें ख़ुद बदलाव कर सकते हैं, या कारण लिखकर वापस भेज सकते हैं. टार्गेट अप्रूव होने के बाद ही सामने वाला नंबर भर पाता है. दो, हफ़्ते की रिपोर्ट. हफ़्ता ख़त्म होने पर जब कोई सबमिट करे, तब आप रिव्यू करके अप्रूव करते हैं, जिससे उसका स्कोर फ़ाइनल हो जाता है, या {{Request changes}} से कमेंट के साथ वापस भेजते हैं. तीन, टार्गेट बदलने की रिक्वेस्ट, जब कोई अप्रूव हुआ टार्गेट बदलवाना चाहे. चार, लेट एंट्री की रिक्वेस्ट, जब कोई छूटा हुआ दिन खुलवाना चाहे. जो लोग आपके नीचे सीधे रिपोर्ट नहीं करते, उनके अप्रूवल उनके अपने अकाउंटेबल के पास जाते हैं, पर आप हर चीज़ में दख़ल दे सकते हैं. हर रिक्वेस्ट पर साफ़ और छोटा कमेंट लिखने से सामने वाले को पता रहता है कि क्या सुधारना है.`,
      en: `Now the most important weekly job, approvals. In Approvals, four kinds of things wait for you, and the moment something arrives you hear about it on the bell and by push notification. One, targets. Everyone sends their target at the start of the week. You can approve it, change it yourself, or send it back with a reason. Only after the target is approved can the person enter numbers. Two, weekly reports. When someone submits at the end of the week, you review and approve, which makes their score final, or you press Request changes and send it back with a comment. Three, target change requests, when someone wants to change an approved target. Four, late entry requests, when someone wants a missed day opened. People who do not report directly to you have their approvals go to their own accountable, but you can step into anything. A short, clear comment on each request tells the other person exactly what to fix.`,
    },
  }, {
    id: 'watch', tone: 5, icon: 'chart', eyebrow: 'Always on', title: 'Watch performance', subtitle: 'See scores, trends and who needs support.',
    tags: [{ label: 'Performance', kind: 'auto' }, { label: 'Breakdown', kind: 'auto' }, { label: 'Export', kind: 'info' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'chart', title: 'Performance', desc: 'Team average, trend by week or month, top people.', tag: { label: 'Stats', kind: 'auto' } },
      { icon: 'target', title: 'Achievement breakdown', desc: 'Which KPI pulled someone’s score down.', tag: { label: 'Why', kind: 'target' } },
      { icon: 'clipboard', title: 'Weekly reviews', desc: 'Every sheet, with filters for status and people.', tag: { label: 'All sheets', kind: 'weekly' } },
      { icon: 'send', title: 'Save or export', desc: 'Keep a snapshot or download a spreadsheet.', tag: { label: 'Save report', kind: 'status' } },
    ] }],
    say: {
      hi: `अब देखिए कि सब कैसा चल रहा है. {{Performance}} में टीम का औसत स्कोर, हफ़्ते या महीने के हिसाब से ट्रेंड, और कितने लोग ऑन ट्रैक हैं और किसे सपोर्ट चाहिए, ये सब दिखता है. ऊपर के फ़िल्टर से आप किसी एक व्यक्ति या पूरी टीम, और कोई भी समय चुन सकते हैं. बार जितना भरा होगा, उतना काम पूरा हुआ है, और धारीदार हिस्सा बताता है कि कितना बाक़ी है. {{Achievement breakdown}} में हर व्यक्ति का स्कोर खुलकर दिखता है, कि कौन सी चीज़ ने स्कोर गिराया, सबसे कमज़ोर चीज़ सबसे ऊपर. {{Weekly reviews}} में सभी शीट्स की लिस्ट है, जिसे आप स्टेटस और व्यक्ति से छाँट सकते हैं, और वहाँ से कोई भी शीट खोलकर देख सकते हैं. किसी स्क्रीन की रिपोर्ट रखनी हो, तो {{Save report}} से उसका स्नैपशॉट सेव कर लीजिए, और {{Export}} से स्प्रेडशीट डाउनलोड कर लीजिए. ग्रेड के पास आँख के आइकन पर टैप करके देखिए कि A, B, C किस रेंज के हैं.`,
      en: `Now see how everything is going. In Performance you see the team average score, the trend by week or month, how many people are on track and who needs support. With the filters at the top you can pick one person or the whole team, and any time period. The fuller the bar, the more work is done, and the striped part shows how much is left. In Achievement breakdown each person's score is opened up, showing which item pulled it down, with the weakest at the top. Weekly reviews has the list of all sheets, which you can filter by status and person, and open any sheet from there. If you want to keep a record of a screen, use Save report to save a snapshot, and Export to download a spreadsheet. Tap the eye icon next to a grade to see what range A, B and C cover.`,
    },
  }, {
    id: 'setup', tone: 3, icon: 'settings', eyebrow: 'Make it yours', title: 'Roles and settings', subtitle: 'Set these once, then it runs by itself.',
    tags: [{ label: 'Roles', kind: 'weekly' }, { label: 'Settings', kind: 'info' }],
    blocks: [{ type: 'steps', items: [
      { icon: 'clipboard', title: 'Role templates', desc: 'Each role has its own sections, fields and targets.', tag: { label: 'Roles', kind: 'weekly' } },
      { icon: 'calendar', title: 'Week start day', desc: 'For example Tuesday to Monday.', tag: { label: 'Settings', kind: 'info' } },
      { icon: 'chart', title: 'Grade ranges', desc: 'Choose what scores are A, B and C.', tag: { label: 'Settings', kind: 'auto' } },
      { icon: 'bell', title: 'Alerts and install', desc: 'Turn on alerts and add the app to your phone.', tag: { label: 'Bell, install', kind: 'info' } },
    ] }],
    say: {
      hi: `आख़िर में, सिस्टम को अपने हिसाब से सेट करना. {{Roles}} में हर रोल का टेम्पलेट है, यानी उस रोल की शीट के सेक्शन, फ़ील्ड और टार्गेट. आप उन्हें एडिट कर सकते हैं. ध्यान रहे, टेम्पलेट बदलने से पुरानी रिपोर्ट नहीं बदलतीं, और चाहें तो खुली हुई रिपोर्ट पर भी लागू कर सकते हैं. {{Settings}} में आप हफ़्ते का शुरुआती दिन चुनते हैं, जैसे मंगलवार से सोमवार, और ग्रेड की रेंज तय करते हैं कि कितने स्कोर पर A, B या C मिले. इसी से रिव्यू कैलेंडर चलता है, और रोज़, हफ़्ते और महीने की शीट्स अपने आप बनती हैं. घंटी के आइकन से {{alerts}} ऑन कीजिए, ताकि कोई सबमिट करे तो आपको तुरंत पता चल जाए, चाहे ऐप बंद हो. और ऊपर के इंस्टॉल आइकन से ऐप को फ़ोन या कंप्यूटर पर इंस्टॉल कर लीजिए. बस, अब आप तैयार हैं. शुरू कीजिए!`,
      en: `Finally, set the system up your way. In Roles there is a template for each role, meaning the sections, fields and targets of that role's sheet. You can edit them. Note that changing a template does not change old reports, and if you like you can apply it to open reports too. In Settings you choose the week start day, like Tuesday to Monday, and set the grade ranges, meaning what score earns an A, B or C. The review calendar runs from this, and the daily, weekly and monthly sheets are created automatically. Turn on alerts with the bell icon, so you know at once when someone submits, even when the app is closed. And install the app on your phone or computer with the install icon at the top. That's it, you're ready. Let's begin!`,
    },
  }];
}

function dedupe(tags: GuideTag[]): GuideTag[] {
  const seen = new Set<string>();
  return tags.filter(t => (seen.has(t.label) ? false : (seen.add(t.label), true)));
}
