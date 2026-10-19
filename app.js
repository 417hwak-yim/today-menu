/* app.js — 기본 데이터, 냉장고 화면, 재료 관리, 재료 등록, 몽글이 대화 */

/* ---------- 기본값 ---------- */
const DEF_ST = '양파, 당근, 애호박, 팽이버섯, 두부, 대파, 마늘, 계란, 기본 양념(간장, 된장, 소금, 설탕, 식용유, 참기름)';
const DEF_PATTERN = `- 4인 가족, 부부 맞벌이. 집에서는 주로 아침과 저녁을 먹음.
- 아이들(10살, 7살 딸)은 매운 걸 못 먹음. 기본은 맵지 않게.
- 평일은 가벼운 아침과 30분 안에 끝나는 저녁 (메인 하나 + 국이나 반찬 하나).
- 한쪽 부모가 야근하면 어른 1명 + 아이 2명이 저녁을 먹음.
- 한 사람은 다이어트 중이라 가볍게 먹거나 간편식을 먹기도 함.
- 아침: 시리얼+우유+과일, 사 둔 브리또, 냉동빵 해동 + 크림치즈나 치즈(전자레인지), 삶은 계란, 김 싼 밥, 여유 있으면 유부초밥.
- 주말 한두 끼는 면: 순한 라면, 어묵 우동, 스파게티, 에어프라이어 냉동피자, 사 먹는 쌀국수.
- 외식이나 배달을 할 때도 있음.`;
const DEF_TOOLS = '전자레인지, 에어프라이어, 작은 압력솥(계란·고구마 찌기), 전기밥솥, 식기세척기, 김치냉장고, 팬트리(실온 선반)';
const DEF_BF = `시리얼 + 우유 + 과일 | 3
삶은 계란 | 1
김 싼 밥 | 5
브리또 데우기 | 5
냉동빵 + 크림치즈 | 5
냉동빵 + 치즈 | 5
유부초밥 | 15`;
const DEF_FAM = [
  {id:'m1', name:'엄마', kid:false, age:'', diet:false},
  {id:'m2', name:'아빠', kid:false, age:'', diet:false},
  {id:'m3', name:'첫째', kid:true, age:'10', diet:false},
  {id:'m4', name:'둘째', kid:true, age:'7', diet:false}
];
const STATES = ['함께','다이어트','간편식','안 먹음'];
const WEIGHT_UNITS = ['g','kg','ml','mL','L','l','cc'];
const QUICK_ITEMS = ['계란','우유','두부','양파','대파','감자','고구마','김치','시리얼','냉동만두','브리또','냉동빵','크림치즈','치즈','라면','우동면','어묵','스파게티면','사과','바나나'];
const ZONE_WORD = {'냉장':'냉장실', '냉동':'냉동실', '김치냉장고':'김치냉장고', '실온':'팬트리 같은 실온'};

/* ---------- 도구 ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const fix = i => ({storage:'냉장', ...i, orig: i.orig ?? i.amount});
let inv = load('inv', []).map(fix);
let hist = load('hist', []);
let waste = load('waste', []);
let buys = load('buys', []);
let place = '전체';
let sel = new Set();
function save(){
  localStorage.setItem('inv', JSON.stringify(inv));
  localStorage.setItem('hist', JSON.stringify(hist));
  localStorage.setItem('waste', JSON.stringify(waste));
  localStorage.setItem('buys', JSON.stringify(buys));
}
const newId = () => Math.random().toString(36).slice(2, 10);
const fmt = n => Number.isFinite(+n) ? Math.round(n * 10) / 10 : '';
const won = n => Number.isFinite(+n) && +n > 0 ? (+n).toLocaleString() + '원' : '';
const amtText = i => i.amount != null ? (i.approx ? '약 ' : '') + fmt(i.amount) + (i.unit || '') : (i.qty || '');
const qtyText = i => amtText(i) + (i.size ? ` (${i.size})` : '');
const isCount = i => i.amount != null && !WEIGHT_UNITS.includes(i.unit);
const needsCheck = i => i.check && i.estimated !== false;
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const where = i => ZONES.includes(i.storage) ? i.storage : '냉장';
const norm = s => String(s || '').replace(/\s/g, '').toLowerCase();

function dateStr(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function today(){ return dateStr(new Date()); }
function addDays(n){ const d = new Date(); d.setDate(d.getDate() + n); return dateStr(d); }
function md(s){ const [, m, d] = s.split('-'); return `${+m}월 ${+d}일`; }
function dday(x){ if(!x) return null; return Math.round((new Date(x + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 864e5); }
function badge(d){
  if(d === null) return ['?', '#bbb'];
  if(d < 0) return ['지남', 'var(--red)'];
  if(d === 0) return ['오늘', 'var(--red)'];
  if(d <= 2) return ['D-' + d, 'var(--red)'];
  if(d <= 4) return ['D-' + d, 'var(--yellow)'];
  return ['D-' + d, 'var(--green)'];
}
const sorted = () => [...inv].sort((a, b) => (dday(a.expiry) ?? 999) - (dday(b.expiry) ?? 999));
const isHot = i => { const d = dday(i.expiry); return d !== null && d <= 2; };
const chunk = (a, n) => { const o = []; for(let k = 0; k < a.length; k += n) o.push(a.slice(k, k + n)); return o; };
function toast(m, ms = 2400){
  const t = $('#toast'); t.textContent = m; t.classList.toggle('on', !!m);
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), ms);
}

function go(t){
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  document.querySelectorAll('section').forEach(s => s.classList.toggle('on', s.id === t));
  window.scrollTo(0, 0);
  render();
}
document.querySelectorAll('nav button').forEach(b => b.onclick = () => go(b.dataset.t));
function openSheet(html){ $('#sheetBody').innerHTML = html; $('#sheet').classList.add('on'); }
function closeSheet(){ $('#sheet').classList.remove('on'); }

/* ---------- 가족과 오늘 상태 ---------- */
const fam = () => load('fam', DEF_FAM);
const pattern = () => localStorage.getItem('pattern') || DEF_PATTERN;
const tools = () => localStorage.getItem('tools') || DEF_TOOLS;
const staples = () => localStorage.getItem('staples') || DEF_ST;
const bfSets = () => (localStorage.getItem('bf') || DEF_BF).split('\n').map(l => {
  const [n, m] = l.split('|').map(s => (s || '').trim());
  return n ? {name: n, min: +m || 5} : null;
}).filter(Boolean);
const bfText = () => bfSets().map(b => `${b.name}(${b.min}분)`).join(', ');

function dayState(){
  let s = load('day', null);
  if(!s || s.date !== today()) s = {date: today(), st: {}, out: false, relaxed: isWeekend(today())};
  fam().forEach(m => { if(!s.st[m.id]) s.st[m.id] = m.diet ? '다이어트' : '함께'; });
  return s;
}
const saveDay = s => localStorage.setItem('day', JSON.stringify(s));

function familyText(){
  const m = fam().map(x => `${x.name}(${x.kid ? `아이${x.age ? ' ' + x.age + '살' : ''}` : '어른'}${x.diet ? ', 다이어트 중' : ''})`).join(', ');
  return `우리 가족: ${m}\n우리집 조리 도구와 보관 장소: ${tools()}\n식사 패턴과 취향:\n${pattern()}`;
}
function todayText(){
  const s = dayState(), f = fam();
  const eat = f.filter(m => ['함께','다이어트'].includes(s.st[m.id]));
  return `오늘 저녁 상태: ${f.map(m => `${m.name}-${s.st[m.id]}`).join(', ')}
가족 메뉴를 먹는 사람 ${eat.length}명 (어른 ${eat.filter(m => !m.kid).length}, 아이 ${eat.filter(m => m.kid).length}, 그중 다이어트 ${eat.filter(m => s.st[m.id] === '다이어트').length})${s.out ? '\n오늘 저녁은 외식/배달이야.' : ''}
${s.relaxed ? '오늘은 시간 여유가 있는 날.' : '오늘은 바쁜 날이라 30분 이내.'}`;
}

/* ---------- AI에 보낼 정보 ---------- */
const listText = () => sorted().map(i => `- [${where(i)}${i.spot ? ' ' + i.spot : ''}] ${i.name} ${qtyText(i)}, 기한 ${i.expiry || '모름'}${i.expiry ? ` (${badge(dday(i.expiry))[0]})` : ''}${i.opened ? `, ${i.opened} 개봉` : ''}`).join('\n') || '(등록된 재료 없음)';
const invList = () => inv.map(i => `${i.id} | ${i.name} | ${i.amount ?? ''} | ${i.unit || i.qty || ''} | ${i.size || ''} | ${i.approx ? '추정' : ''} | ${where(i)}${i.spot ? ' ' + i.spot : ''}`).join('\n') || '(없음)';
const wasteText = () => waste.length ? waste.slice(0, 20).map(w => `- ${w.date} ${w.name} ${fmt(w.amount)}${w.unit} 버림 (${w.reason}, 구입 ${w.purchased || '?'}, ${w.storage})`).join('\n') : '(없음)';
function recentMeals(){
  const L = hist.filter(h => { const d = dday(h.date); return d !== null && d >= -7; });
  return L.length ? L.slice(0, 40).map(h => `- ${h.date} [${h.kind || '기록'}] ${h.meal}${h.items?.length ? ` (${h.items.join(', ')})` : ''}`).join('\n') : '(기록 없음)';
}
function flyerText(){
  const f = load('flyer', null);
  if(!f || !f.items?.length) return '(없음)';
  const L = f.items.filter(x => !x.to || dday(x.to) >= 0);
  return L.length ? L.map(x => `- ${x.from === x.to ? x.from : `${x.from}~${x.to}`} ${x.name}${x.sure === false ? '(흐릿함)' : ''} ${x.price ? x.price + '원' : ''} ${x.unit || ''}`).join('\n') : '(진행 중인 할인 없음)';
}
function nutriText(){
  const n = load('nutri', null); if(!n) return '(아직 없음)';
  return `${n.data.summary || ''} 부족: ${(n.data.lacking || []).map(l => l.name).join(', ')}`;
}

/* ---------- 구매 이력 ---------- */
function groupBuys(){
  const g = {};
  for(const b of buys){ const k = norm(b.name); (g[k] = g[k] || {key: k, name: b.name, list: []}).list.push(b); }
  for(const k in g){
    const L = g[k].list.sort((a, b) => b.date.localeCompare(a.date));
    g[k].count = L.length; g[k].last = L[0];
    const p = L.filter(x => x.price);
    g[k].avg = p.length ? Math.round(p.reduce((s, x) => s + x.price, 0) / p.length) : null;
  }
  return g;
}
function findGroup(name){ const k = norm(name); return Object.values(groupBuys()).find(g => g.key.includes(k) || k.includes(g.key)); }
const buyAmt = b => `${b.approx ? '약 ' : ''}${fmt(b.amount)}${b.unit || ''}${b.size ? ` (${b.size})` : ''}`;
function guideText(name){
  const g = findGroup(name); if(!g) return '';
  return `지난번엔 ${buyAmt(g.last)}${g.last.price ? `을(를) ${won(g.last.price)}에 샀어요` : '을(를) 샀어요'}${g.avg && g.count > 1 ? ` (평균 ${won(g.avg)})` : ''}`;
}
function priceCompare(x){
  if(!x.price) return '';
  const g = findGroup(x.name); let s = won(x.price);
  if(g && g.last.price){
    const d = x.price - g.last.price;
    s += Math.abs(d) < 100 ? ' · 지난번과 비슷해요' : d > 0 ? ` · 지난번(${won(g.last.price)})보다 ${won(d)} 비싸요` : ` · 지난번보다 ${won(-d)} 저렴해요`;
  }
  return s;
}
function lowStock(){
  const low = inv.filter(i => i.amount != null && ((i.orig > 0 && i.amount / i.orig <= 0.25) || (isCount(i) && i.amount <= 1)));
  const have = inv.map(i => norm(i.name));
  const gone = Object.values(groupBuys()).filter(g => g.count >= 2 && !have.some(n => n.includes(g.key) || g.key.includes(n)));
  return {low, gone};
}
function buyHist(){
  const g = Object.values(groupBuys()).sort((a, b) => b.last.date.localeCompare(a.last.date)).slice(0, 40);
  return g.length ? g.map(x => `- ${x.name} | ${x.count}회 | ${x.last.date} ${buyAmt(x.last)} | ${x.last.price ? x.last.price + '원' : '가격 모름'}${x.avg && x.count > 1 ? ` (평균 ${x.avg}원)` : ''}`).join('\n') : '(없음)';
}

/* ---------- 몽글이 ---------- */
function chefSVG(mood, size = 72){
  const mouth = mood === 'worry'
    ? '<path d="M31 51 q3.5 -4 7 0 q3.5 4 7 0" stroke="#5a3b2e" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
    : '<path d="M31 48 q7 8 14 0 z" fill="#e86a5a" stroke="#5a3b2e" stroke-width="2" stroke-linejoin="round"/>';
  const brows = mood === 'worry' ? '<path d="M25 33 l7 2 M51 33 l-7 2" stroke="#5a3b2e" stroke-width="1.8" stroke-linecap="round"/>' : '';
  const sweat = mood === 'worry' ? '<path d="M59 30 q4 6 0 9 q-4 -3 0 -9z" fill="#8fc6f0"/>' : '';
  return `<svg viewBox="0 0 80 82" width="${size}" height="${Math.round(size * 82 / 80)}" aria-label="몽글이">
    <ellipse cx="38" cy="78" rx="20" ry="3" fill="rgba(0,0,0,.08)"/>
    <rect x="12" y="22" width="52" height="52" rx="17" fill="#fffaf0" stroke="#eadfcb" stroke-width="2"/>
    <rect x="22" y="15" width="32" height="10" rx="3" fill="#fff" stroke="#e5dccf" stroke-width="1.5"/>
    <circle cx="27" cy="12" r="7" fill="#fff" stroke="#e5dccf" stroke-width="1.5"/>
    <circle cx="38" cy="8" r="8.5" fill="#fff" stroke="#e5dccf" stroke-width="1.5"/>
    <circle cx="49" cy="12" r="7" fill="#fff" stroke="#e5dccf" stroke-width="1.5"/>
    <rect x="23" y="17" width="30" height="7" fill="#fff"/>
    ${brows}
    <ellipse cx="29" cy="41" rx="3" ry="3.7" fill="#3a2a22"/><ellipse cx="47" cy="41" rx="3" ry="3.7" fill="#3a2a22"/>
    <circle cx="30.1" cy="39.6" r="1.1" fill="#fff"/><circle cx="48.1" cy="39.6" r="1.1" fill="#fff"/>
    <ellipse cx="21.5" cy="49" rx="4.5" ry="3" fill="#ffb3a7" opacity=".85"/><ellipse cx="54.5" cy="49" rx="4.5" ry="3" fill="#ffb3a7" opacity=".85"/>
    ${mouth}${sweat}
    <path d="M63 54 l8 -11" stroke="#c9a77c" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="72.5" cy="39.5" rx="3.6" ry="4.6" fill="#d8b98f"/>
  </svg>`;
}
const buddyLine = (text, mood = 'happy') => `<div class="mini">${chefSVG(mood, 52)}<div class="bubble"><b>몽글이</b>${text}</div></div>`;

let msgs = [], msgI = 0;
function buildMsgs(L){
  const m = [];
  if(!inv.length) m.push({mood:'happy', t:'안녕하세요, 저는 몽글이에요! 위의 "재료 등록하기"로 집에 있는 재료를 틈틈이 알려주세요. 냉장고 칸 사진을 찍거나 말로 해도 돼요.'});
  const exp = L.filter(i => { const d = dday(i.expiry); return d !== null && d < 0; });
  const hot = L.filter(i => { const d = dday(i.expiry); return d !== null && d >= 0 && d <= 2; });
  if(exp.length) m.push({mood:'worry', t:`앗, ${exp.slice(0, 3).map(i => i.name).join(', ')} 기한이 지났어요! 아래에서 먹었는지 버렸는지 알려줄래요?`});
  const p = load('plan', null), tp = p?.days?.find(d => d.date === today());
  if(tp?.dinner) m.push({mood:'happy', t:`오늘 저녁은 계획대로 "${tp.dinner}" 하는 날이에요.${tp.uses?.length ? ` ${tp.uses.slice(0, 3).join(', ')}을(를) 써요.` : ''}`});
  if(tp?.prep) m.push({mood:'happy', t:`오늘 미리 해둘 일: ${tp.prep}`});
  if(hot.length) m.push({mood:'worry', t:`${hot.slice(0, 3).map(i => i.name).join(', ')}은(는) ${dday(hot[0].expiry) === 0 ? '오늘' : '곧'} 먹어야 해요. 냉장고에서 골라서 메뉴를 같이 찾아봐요!`});
  const unk = L.filter(i => !i.expiry);
  if(unk.length) m.push({mood:'happy', t:`기한을 모르는 재료가 ${unk.length}개 있어요. 아래에서 날짜를 알려주시면 더 잘 챙길게요.`});
  const {low} = lowStock();
  if(low.length){ const i = low[0], g = guideText(i.name); m.push({mood:'happy', t:`${i.name}이(가) 거의 떨어졌어요.${g ? ` ${g}. 비슷한 가격대면 괜찮아요!` : ''}`}); }
  const n = load('nutri', null);
  if(n && dday(n.date) >= -3 && n.data?.lacking?.length){
    const l = n.data.lacking[0], nx = n.data.next?.[0];
    m.push({mood:'happy', t:`요즘 ${l.name}이(가) 부족해 보여요.${nx ? ` 다음엔 ${nx.name} 어때요?` : ''}`});
  }
  const wm = waste.filter(w => w.date.slice(0, 7) === today().slice(0, 7)).length;
  if(wm >= 2) m.push({mood:'worry', t:`이번 달에 벌써 ${wm}번 버렸어요. 다음엔 조금씩 사거나 미리 소분해서 냉동해 봐요.`});
  const tips = L.filter(i => i.tip);
  if(tips.length){ const i = tips[Math.floor(Math.random() * tips.length)]; m.push({mood:'happy', t:`보관 팁! ${i.name}: ${i.tip}`}); }
  const h = new Date().getHours();
  m.push({mood:'happy', t: h < 10 ? '좋은 아침이에요! 아침 먹었으면 아래 "오늘 아침"을 눌러주세요.' : h < 16 ? '오늘 저녁 누가 먹는지 알려주면 메뉴를 같이 고민할게요.' : h < 21 ? '저녁 메뉴 고민되면 저한테 물어봐요!' : '내일 아침 준비할 것도 한번 봐요. 김 싼 밥이면 밥이 있는지 확인!'});
  return m;
}
function showMsg(){
  const x = msgs[msgI % msgs.length]; if(!x) return;
  $('#bchar').innerHTML = chefSVG(x.mood);
  $('#bmsg').textContent = x.t;
  $('#bmore').textContent = msgs.length > 1 ? `눌러서 다음 이야기 (${msgI % msgs.length + 1}/${msgs.length})` : '';
}
function nextMsg(){ msgI++; showMsg(); }

/* ---------- 오늘 저녁 인원 ---------- */
function renderWho(){
  const s = dayState();
  $('#who').innerHTML = fam().map(m => `<button class="s${STATES.indexOf(s.st[m.id])}" onclick="cycleWho('${m.id}')">${esc(m.name)}<small>${s.st[m.id]}</small></button>`).join('');
  $('#outBtn').classList.toggle('on', s.out);
  $('#relaxBtn').classList.toggle('on', s.relaxed);
}
function cycleWho(id){ const s = dayState(); s.st[id] = STATES[(STATES.indexOf(s.st[id]) + 1) % STATES.length]; saveDay(s); render(); }
$('#outBtn').onclick = () => {
  const s = dayState(); s.out = !s.out; saveDay(s);
  if(s.out){
    hist.unshift({date: today(), kind: '외식', meal: '저녁 외식/배달', items: []});
    toast('오늘은 외식! 오늘 쓰려던 재료는 계획에서 내일로 넘겨요', 3000);
  } else hist = hist.filter(h => !(h.date === today() && h.kind === '외식' && h.meal === '저녁 외식/배달'));
  save(); render();
};
$('#relaxBtn').onclick = () => { const s = dayState(); s.relaxed = !s.relaxed; saveDay(s); render(); };

/* ---------- 냉장고 그림 ---------- */
function toggleDoor(k){ $('#side' + k).classList.toggle('open'); }
function closeDoor(k){ $('#side' + k).classList.remove('open'); }
function toggleKimchi(){ $('#kimchi').classList.toggle('open'); }
function foodHTML(i){
  return `<button class="food ${sel.has(i.id) ? 'sel' : ''}" onclick="toggleSel('${i.id}',this)"><i style="background:${badge(dday(i.expiry))[1]}"></i>${esc(i.name)}<small>${esc(amtText(i))}</small></button>`;
}
function shelves(items, per, minRows){
  const rows = chunk(items, per).map(r => `<div class="shelfrow">${r.map(foodHTML).join('')}</div>`);
  while(rows.length < minRows) rows.push('<div class="shelfrow"></div>');
  return rows.join('');
}
function renderFridge(L){
  const by = z => L.filter(i => where(i) === z);
  const F = by('냉동'), R = by('냉장'), K = by('김치냉장고'), P = by('실온');
  $('#inF').innerHTML = `<div class="ih">냉동실 · ${F.length} <a onclick="closeDoor('F')">닫기</a></div>` + (F.length ? shelves(F, 2, 6) : '<p class="empty">비어 있어요</p>');
  $('#inR').innerHTML = `<div class="ih">냉장실 · ${R.length} <a onclick="closeDoor('R')">닫기</a></div>` + (R.length ? shelves(R, 2, 6) : '<p class="empty">비어 있어요</p>');
  $('#inK').innerHTML = `<div class="kh">${K.length}가지 <a onclick="toggleKimchi()">닫기</a></div>` + (K.length ? shelves(K, 2, 3) : '<p class="empty">비어 있어요</p>');
  $('#inP').innerHTML = P.length ? shelves(P, 2, 2) : '<p class="empty">비어 있어요</p>';
  $('#dcF').textContent = `${F.length}가지`; $('#dcR').textContent = `${R.length}가지`;
  $('#dcK').textContent = K.filter(isHot).length ? `급해요 ${K.filter(isHot).length}` : `${K.length}가지`;
  const hF = F.filter(isHot).length, hR = R.filter(isHot).length;
  $('#hotF').innerHTML = hF ? `<span class="hot">급해요 ${hF}</span>` : '';
  $('#hotR').innerHTML = hR ? `<span class="hot">급해요 ${hR}</span>` : '';
}
function toggleSel(id, el){
  sel.has(id) ? sel.delete(id) : sel.add(id);
  if(el) el.classList.toggle('sel', sel.has(id));
  updRec();
}
function clearSel(){ sel.clear(); document.querySelectorAll('.food.sel').forEach(e => e.classList.remove('sel')); updRec(); }
function recMode(){ const w = $('#wish').value.trim(); return w ? 'wish' : sel.size ? 'sel' : 'auto'; }
function updRec(){
  const names = inv.filter(i => sel.has(i.id)).map(i => i.name);
  $('#selInfo').innerHTML = names.length
    ? `고른 재료: <b>${esc(names.join(', '))}</b> · <a onclick="clearSel()">선택 해제</a>`
    : '냉장고에서 재료를 고르거나, 먹고 싶은 메뉴를 적어도 돼요.';
  const m = recMode();
  $('#recBtn').textContent = m === 'wish' ? `'${$('#wish').value.trim()}' 만들 방법 찾기` : m === 'sel' ? `고른 재료 ${sel.size}개로 추천받기` : '오늘 저녁 추천받기';
}
$('#wish').oninput = updRec;

/* ---------- 메인 알림 ---------- */
function renderAlerts(L){
  const exp = L.filter(i => { const d = dday(i.expiry); return d !== null && d < 0; });
  const hot = L.filter(i => { const d = dday(i.expiry); return d !== null && d >= 0 && d <= 2; });
  const chk = L.filter(i => i.expiry && needsCheck(i));
  const unk = L.filter(i => !i.expiry);
  const dateRow = i => `<input type="date" class="dateIn" value="${esc(i.expiry || '')}" onchange="setDate('${i.id}',this.value)"><button class="x cam" onclick="scan('i','${i.id}')">📷 날짜 찍기</button>`;
  let a = '';
  if(exp.length) a += `<div class="card"><b class="warn">기한이 지난 재료 ${exp.length}개</b>
    <p class="muted">먹었는지 버렸는지 알려주세요. 버린 건 기억했다가 다음 장보기 때 알려드릴게요.</p>
    ${exp.map(i => `<div class="item"><div class="name">${esc(i.name)} <b>${esc(amtText(i))}</b><small>기한 ${esc(i.expiry)} · ${esc(where(i))}</small>
      <div class="acts"><button class="x" onclick="used('${i.id}')">먹었어요</button><button class="x trash" onclick="discard('${i.id}')">버렸어요</button>
      <input type="date" class="dateIn" value="${esc(i.expiry)}" onchange="setDate('${i.id}',this.value)"></div></div></div>`).join('')}</div>`;
  if(hot.length) a += `<div class="card"><b>빨리 먹어야 할 재료 ${hot.length}개</b><p>${hot.map(i => `${esc(i.name)} ${esc(amtText(i))} (${badge(dday(i.expiry))[0]})`).join(', ')}</p></div>`;
  if(chk.length) a += `<div class="card"><b>포장 날짜를 확인하면 좋은 재료 ${chk.length}개</b>
    <p class="muted">지금 기한은 추정이에요. 포장 날짜를 찍거나 달력에서 골라주세요.</p>
    ${chk.map(i => `<div class="item"><div class="name">${esc(i.name)} <b>${esc(qtyText(i))}</b><small>추정 기한 ${esc(i.expiry)}</small><div class="acts">${dateRow(i)}</div></div></div>`).join('')}</div>`;
  if(unk.length) a += `<div class="card"><b>기한을 모르는 재료 ${unk.length}개</b>
    <p class="muted">시간 날 때 하나씩 알려주세요. 모르면 비워둬도 돼요.</p>
    ${unk.map(i => `<div class="item"><div class="name">${esc(i.name)} <b>${esc(qtyText(i))}</b><small>${esc(where(i))}</small><div class="acts">${dateRow(i)}</div></div></div>`).join('')}</div>`;
  $('#homeAlerts').innerHTML = a;
}

/* ---------- 재료 관리 ---------- */
function expiryNote(i){
  if(!i.expiry) return '<span class="warn">기한 모름</span>';
  if(needsCheck(i)) return `기한 ${esc(i.expiry)} (추정) · <span class="warn">포장 날짜 확인 추천</span>`;
  return `기한 ${esc(i.expiry)}${i.estimated ? ' (추정)' : ''}`;
}
function itemHTML(i){
  const [t, c] = badge(dday(i.expiry));
  const pct = i.orig > 0 && i.amount != null ? Math.max(0, Math.min(100, i.amount / i.orig * 100)) : null;
  return `<div class="item"><span class="badge" style="background:${c}">${t}</span>
    <div class="name">${esc(i.name)} <b>${esc(qtyText(i))} 남음</b>${i.opened ? '<span class="tag b">개봉</span>' : ''}
      <small>${i.orig != null && i.orig !== i.amount ? `처음 ${fmt(i.orig)}${esc(i.unit || '')} · ` : ''}${expiryNote(i)}${i.purchased ? ' · 구입 ' + esc(i.purchased) : ''}${i.spot ? ' · ' + esc(i.spot) : ''}</small>
      ${i.advice ? `<div class="adv">${esc(i.advice)}</div>` : ''}
      ${i.tip || i.note ? `<div class="tip">${esc([i.tip, i.note].filter(Boolean).join(' · '))}</div>` : ''}
      ${pct !== null ? `<div class="bar"><i style="width:${pct}%"></i></div>` : ''}
      <div class="acts">
        ${isCount(i) ? `<button class="x minus" onclick="minusOne('${i.id}')">−1</button>` : ''}
        <button class="x" onclick="editAmt('${i.id}')">양</button>
        <select onchange="setStore('${i.id}',this.value)">${ZONES.map(z => `<option ${z === where(i) ? 'selected' : ''}>${z}</option>`).join('')}</select>
        <input type="date" class="dateIn" value="${esc(i.expiry || '')}" onchange="setDate('${i.id}',this.value)">
        <button class="x cam" onclick="scan('i','${i.id}')">📷 기한</button>
        ${i.opened ? '' : `<button class="x" onclick="openItem('${i.id}')">개봉</button>`}
        <button class="x" onclick="showStore('${i.id}')">보관법</button>
        <button class="x" onclick="used('${i.id}')">다 씀</button>
        <button class="x trash" onclick="discard('${i.id}')">버림</button>
      </div>
    </div></div>`;
}
function setPlace(p){ place = p; render(); }
function renderManage(L){
  $('#chips').innerHTML = ['전체', ...ZONES].map(p => {
    const n = p === '전체' ? inv.length : inv.filter(i => where(i) === p).length;
    return `<button class="${p === place ? 'on' : ''}" onclick="setPlace('${p}')">${p} ${n}</button>`;
  }).join('');
  const groups = ZONES.filter(z => place === '전체' || place === z).map(z => {
    const items = L.filter(i => where(i) === z);
    return items.length ? `<div class="card"><b>${z}</b>${items.map(itemHTML).join('')}</div>` : '';
  }).join('');
  $('#invList').innerHTML = groups || '<div class="card"><p class="muted">여기엔 아직 재료가 없어요. 냉장고 탭의 "재료 등록하기"로 넣어보세요.</p></div>';
}

/* ---------- 재료 동작 ---------- */
function changed(){ save(); render(); }
function snapshot(){ localStorage.setItem('undo', JSON.stringify({inv, hist, waste})); }
function recordWaste(i, amt, reason){
  waste.unshift({date: today(), name: i.name, amount: amt, unit: i.unit || '', reason, purchased: i.purchased || '', expiry: i.expiry || '', storage: where(i)});
  waste = waste.slice(0, 100);
}
function minusOne(id){
  const i = inv.find(x => x.id === id); if(!i) return;
  snapshot();
  i.amount = Math.max(0, (i.amount ?? 1) - 1);
  hist.unshift({date: today(), kind: '간식', meal: `${i.name} 1${i.unit || '개'} 먹음`, items: [`${i.name} 1${i.unit || '개'}`]});
  if(i.amount <= 0){ inv = inv.filter(x => x.id !== id); toast(`${i.name}을(를) 다 먹었어요`); }
  else toast(`${i.name} ${amtText(i)} 남았어요`);
  changed();
}
function used(id){
  const i = inv.find(x => x.id === id);
  if(!confirm(`${i.name}을(를) 다 먹은 걸로 할까요?`)) return;
  snapshot();
  hist.unshift({date: today(), kind: '기록', meal: `${i.name} 다 씀`, items: [`${i.name} ${amtText(i)}`]});
  inv = inv.filter(x => x.id !== id); changed();
}
function discard(id){
  const i = inv.find(x => x.id === id); if(!i) return;
  let amt = i.amount ?? 1;
  if(isCount(i) && amt > 1){
    const v = prompt(`${i.name} 몇 ${i.unit || '개'} 버렸어요? (지금 ${amtText(i)})`, fmt(amt));
    if(v === null) return;
    const n = parseFloat(v); if(isNaN(n) || n <= 0) return;
    amt = Math.min(n, amt);
  } else if(!confirm(`${i.name}을(를) 버린 걸로 기록할까요?`)) return;
  const d = dday(i.expiry), reason = d !== null && d < 0 ? '기한 지남' : '상함';
  snapshot();
  recordWaste(i, amt, reason);
  hist.unshift({date: today(), kind: '버림', meal: `${i.name} ${fmt(amt)}${i.unit || ''} 버림`, items: [reason], waste: true});
  i.amount = (i.amount ?? 1) - amt;
  if(i.amount <= 0) inv = inv.filter(x => x.id !== id);
  toast(`${i.name} 버린 걸 기억해 둘게요. 다음엔 제때 먹어봐요!`, 3000);
  changed();
}
function editAmt(id){
  const i = inv.find(x => x.id === id);
  const v = prompt(`${i.name} 남은 양 (단위: ${i.unit || '개'})`, i.amount ?? '');
  if(v === null) return;
  const n = parseFloat(v); if(isNaN(n)) return;
  if(n <= 0) inv = inv.filter(x => x.id !== id);
  else { i.amount = n; i.approx = false; if(!i.unit) i.unit = '개'; if(i.orig == null || n > i.orig) i.orig = n; delete i.qty; }
  changed();
}
function setDate(id, v){
  const i = inv.find(x => x.id === id); if(!i || !isDate(v)) return;
  i.expiry = v; i.estimated = false; changed();
  toast(`${i.name} 기한 ${md(v)} (${badge(dday(v))[0]})로 저장했어요`);
}
function setStore(id, v){
  const i = inv.find(x => x.id === id); const prev = where(i);
  i.storage = v; i.spot = '';
  if(v === '냉동' && prev !== '냉동' && confirm('냉동하면 보통 한 달 정도 보관할 수 있어요. 기한을 한 달 뒤로 바꿀까요?')){ i.expiry = addDays(30); i.estimated = true; i.check = false; }
  if(prev === '냉동' && v !== '냉동' && confirm('해동한 재료는 1~2일 안에 먹는 게 좋아요. 기한을 내일로 바꿀까요?')){ i.expiry = addDays(1); i.estimated = true; i.check = false; }
  changed();
}
function openItem(id){
  const i = inv.find(x => x.id === id); if(!i) return;
  let days = i.openDays;
  if(!days){
    const v = prompt(`${i.name} 개봉 후 며칠 안에 먹어야 하나요?`, '3');
    if(v === null) return; days = parseInt(v) || 3; i.openDays = days;
  }
  i.opened = today();
  const e = addDays(days);
  if(!i.expiry || e < i.expiry){ i.expiry = e; i.estimated = true; i.check = false; }
  toast(`${i.name} 개봉! ${md(i.expiry)}까지 먹어요`, 3000);
  changed();
}
function undo(){
  const u = load('undo', null); if(!u) return;
  inv = u.inv; hist = u.hist; waste = u.waste || waste; localStorage.removeItem('undo');
  toast('되돌렸어요'); changed();
}

/* ---------- 보관법 ---------- */
async function showStore(id){
  const i = inv.find(x => x.id === id); if(!i) return;
  const show = () => {
    const s = i.store;
    openSheet(buddyLine(`${esc(i.name)} 보관법이에요! ${esc(s.best || '')}`) +
      (s.alt ? `<p><b>자리가 없으면</b><br>${esc(s.alt)}</p>` : '') +
      (s.how?.length ? `<p><b>이렇게 보관해요</b></p><ul>${s.how.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : '') +
      (s.freeze ? `<p><b>냉동</b><br>${esc(s.freeze)}</p>` : '') +
      (s.opened ? `<p><b>개봉 후</b><br>${esc(s.opened)}</p>` : '') +
      (s.sign ? `<p><b>상했는지 보는 법</b><br>${esc(s.sign)}</p>` : '') +
      (s.bulk ? `<p><b>양이 많을 때</b><br>${esc(s.bulk)}</p>` : '') +
      `<button class="btn light" onclick="closeSheet();talkAbout('${i.id}')">💬 몽글이랑 이야기하기</button>`);
  };
  if(i.store) return show();
  openSheet(buddyLine('잠깐만요, 보관법 찾아볼게요…'));
  try{ i.store = await ask([{type:'text', text: PROMPT_STORE(i)}], 900); save(); show(); }
  catch(e){ openSheet(buddyLine('앗, 보관법을 못 가져왔어요: ' + esc(e.message), 'worry')); }
}

/* ---------- 포장 날짜 찍기 ---------- */
let pending = [], activeBox = null, scanTarget = null;
function scan(kind, key){ scanTarget = {kind, key}; $('#labelCam').value = ''; $('#labelCam').click(); }
$('#labelCam').onchange = async e => {
  const f = e.target.files[0]; if(!f || !scanTarget) return;
  const t = scanTarget; scanTarget = null;
  const item = t.kind === 'p' ? pending[t.key] : inv.find(x => x.id === t.key);
  if(!item) return;
  toast(`${item.name} 날짜 읽는 중…`, 20000);
  try{
    const j = await ask([...await imagesOf([f]), {type:'text', text: PROMPT_LABEL(item.name)}], 800);
    if(!j.found || !isDate(j.expiry)){ toast('', 1); alert(`${item.name} 날짜를 못 읽었어요. 날짜 부분을 가까이서 다시 찍거나 달력에서 골라주세요.`); return; }
    item.expiry = j.expiry; item.estimated = (j.kind || '').includes('추정');
    if(j.size && !item.size) item.size = j.size;
    if(j.note) item.note = j.note;
    if(t.kind === 'p' && activeBox){
      const el = activeBox.querySelector(`input[data-d="${t.key}"]`); if(el) el.value = j.expiry;
      const lab = activeBox.querySelector(`[data-lab="${t.key}"]`);
      if(lab) lab.innerHTML = `<span class="ok">${esc(j.kind || '기한')} ${esc(j.expiry)} 확인됨</span>`;
    } else changed();
    toast(`${item.name} ${j.kind || '기한'} ${md(j.expiry)} (${badge(dday(j.expiry))[0]})`, 3500);
  }catch(err){ toast('', 1); alert('오류: ' + err.message); }
};

/* ---------- 미리보기 (재료 등록·영수증 공통) ---------- */
const normItem = x => ({...x, id: newId(), orig: x.amount, storage: ZONES.includes(x.storage) ? x.storage : '냉장'});
function previewHTML(list){
  return list.map((x, n) => `<div class="item"><input type="checkbox" checked data-n="${n}" style="margin-top:6px;width:22px;height:22px">
    <div class="name">${esc(x.name)} <b>${esc(qtyText(x))}</b>${x.sure === false ? '<span class="tag y">확인 필요</span>' : ''}
      <small data-lab="${n}">${needsCheck(x) ? '<span class="warn">포장 날짜 확인 추천</span>' : x.estimated !== false ? '추정 기한' : '<span class="ok">포장 날짜 확인됨</span>'}${x.basis ? ' · ' + esc(x.basis) : ''}${x.price ? ' · ' + esc(priceCompare(x)) : ''}</small>
      ${x.advice ? `<div class="adv">${esc(x.advice)}</div>` : ''}
      <div class="acts">
        <select data-s="${n}">${ZONES.map(z => `<option ${z === x.storage ? 'selected' : ''}>${z}</option>`).join('')}</select>
        <input type="date" class="dateIn" value="${esc(x.expiry || '')}" data-d="${n}">
        <button class="x cam" onclick="scan('p',${n})">📷 기한</button>
      </div></div></div>`).join('');
}
function collectPreview(box, list){
  box.querySelectorAll('select[data-s]').forEach(s => { list[s.dataset.s].storage = s.value; });
  box.querySelectorAll('input[data-d]').forEach(d => {
    const p = list[d.dataset.d];
    if(isDate(d.value) && d.value !== p.expiry){ p.expiry = d.value; p.estimated = false; }
    if(!d.value) p.expiry = '';
  });
  return [...box.querySelectorAll('input[type=checkbox]:checked')].map(c => list[c.dataset.n]);
}

/* ---------- 재료 등록하기 ---------- */
$('#regBtn').onclick = openRegister;
function openRegister(){
  openSheet(buddyLine('집에 있는 재료를 알려주세요! 냉장고 한 칸씩 사진을 찍거나, 말이나 글로 여러 개를 한 번에 말해도 돼요. 사진은 재료를 알아보는 데만 쓰고 저장하지 않아요.') + `
    <b>📷 사진으로</b>
    <input type="file" id="regPhotos" accept="image/*" multiple>
    <b style="display:block;margin-top:14px">🎤 말이나 글로</b>
    <textarea id="regText" rows="3" placeholder="예: 계란 20개, 고구마 한 봉지, 김치 반 통, 냉동만두 반 봉지"></textarea>
    <div class="row"><button class="btn gray" type="button" onclick="mic(this,'#regText')">🎤 말로 하기</button></div>
    <b style="display:block;margin-top:14px">⚡ 빠른 추가</b>
    <div class="acts">${QUICK_ITEMS.map(q => `<button class="x" onclick="addQuick('${q}')">${q}</button>`).join('')}</div>
    <button class="btn" id="regGo">등록할 재료 찾기</button>
    <div id="regOut"></div>`);
  $('#regGo').onclick = runRegister;
}
function addQuick(q){ const t = $('#regText'); t.value = (t.value.trim() ? t.value.trim() + ', ' : '') + q + ' '; t.focus(); }
async function runRegister(){
  const files = [...$('#regPhotos').files], memo = $('#regText').value.trim();
  if(!files.length && !memo) return alert('사진을 고르거나 재료를 적어주세요');
  const out = $('#regOut');
  out.innerHTML = '<div class="loading">몽글이가 재료를 찾고 있어요… (10~30초)</div>';
  try{
    const j = await ask([...await imagesOf(files), {type:'text', text: PROMPT_REG(memo, files.length > 0)}]);
    pending = (j.items || []).map(normItem);
    pending.forEach(p => { p.fromPhoto = files.length > 0 && !memo; });
    if(!pending.length){ out.innerHTML = buddyLine('음… 재료를 못 찾았어요. 조금 더 밝게 찍거나 말로 알려줄래요?', 'worry'); return; }
    out.innerHTML = `<div class="card"><b>찾은 재료 ${pending.length}개</b><p class="muted">맞는 것만 체크하세요. 양은 나중에 재료 관리에서 고칠 수 있어요.</p>${previewHTML(pending)}
      <button class="btn" id="regAdd">냉장고에 넣기</button></div>`;
    activeBox = out;
    $('#regAdd').onclick = () => {
      const keep = collectPreview(out, pending);
      keep.forEach(k => { if(!k.purchased) delete k.purchased; });
      inv.push(...keep); changed(); closeSheet();
      toast(`${keep.length}가지 재료를 등록했어요`);
      const ask1 = keep.filter(k => !k.fromPhoto).map(k => k.id);
      if(ask1.length) startStorageChat(ask1);
      pending = [];
    };
  }catch(e){ out.innerHTML = buddyLine('앗, 오류가 났어요: ' + esc(e.message), 'worry'); }
}

/* ---------- 마이크 ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function mic(btn, target){
  if(!SR){ alert('이 브라우저는 음성 입력을 지원하지 않아요. 크롬에서 열거나, 키보드의 마이크 버튼으로 말해주세요.'); return; }
  if(btn._rec){ btn._rec.stop(); return; }
  btn._label = btn._label || btn.textContent;
  const rec = new SR(); rec.lang = 'ko-KR'; rec.interimResults = true; rec.continuous = true;
  const ta = $(target), base = ta.value ? ta.value + ' ' : '';
  rec.onresult = e => { let t = ''; for(const r of e.results) t += r[0].transcript; ta.value = base + t; ta.dispatchEvent(new Event('input')); };
  rec.onend = () => { btn._rec = null; btn.classList.remove('rec'); btn.textContent = btn._label; };
  rec.onerror = e => { if(e.error === 'not-allowed' || e.error === 'service-not-allowed') alert('마이크 권한을 허용해 주세요. 크롬 주소창 왼쪽 아이콘 → 권한에서 바꿀 수 있어요.'); };
  rec.start(); btn._rec = rec; btn.classList.add('rec'); btn.textContent = btn._label.length > 2 ? '■ 그만' : '■';
}

/* ---------- 몽글이 대화 (보관 도우미) ---------- */
let chatLog = [], chatQueue = [], chatCur = null, chatBusy = false;
$('#chatBtn').onclick = () => {
  openChat();
  if(!chatLog.length) botSay('무엇이든 물어봐요! 어디에 보관할지, 오늘 뭐 먹을지, 남은 재료를 어떻게 쓸지 같이 고민해요.', ['냉장고가 꽉 찼어', '오늘 뭐 먹지?', '곧 버릴 것 같은 재료 있어?']);
};
function openChat(){ $('#chat').classList.add('on'); $('#chatFace').innerHTML = chefSVG('happy', 36); renderChat(); }
function closeChat(){ $('#chat').classList.remove('on'); }
function renderChat(quick){
  $('#chatLog').innerHTML = chatLog.map(m => m.who === 'me'
    ? `<div class="msg me"><div class="bb">${esc(m.text)}</div></div>`
    : `<div class="msg bot">${chefSVG(m.mood || 'happy', 34)}<div class="bb">${esc(m.text)}</div></div>`).join('');
  if(quick !== undefined) $('#chatQuick').innerHTML = quick.map(q => `<button onclick="quickReply(this.textContent)">${esc(q)}</button>`).join('');
  const box = $('#chatLog'); box.scrollTop = box.scrollHeight;
}
function botSay(text, quick = [], mood = 'happy'){ chatLog.push({who:'bot', text, mood}); renderChat(quick); }
function meSay(text){ chatLog.push({who:'me', text}); renderChat([]); }

function startStorageChat(ids){
  chatQueue = [...ids]; openChat();
  botSay(`재료 ${ids.length}가지가 들어왔어요! 하나씩 어디에 둘지 같이 정해봐요.`);
  setTimeout(nextStorage, 500);
}
function talkAbout(id){
  const i = inv.find(x => x.id === id); if(!i) return;
  chatCur = id; openChat();
  botSay(`${i.name} 이야기를 해볼까요? 지금은 ${ZONE_WORD[where(i)]}${i.spot ? '(' + i.spot + ')' : ''}에 있어요. 궁금한 게 있어요?`, ['자리를 옮기고 싶어', '얼마나 둘 수 있어?', '이걸로 뭐 해먹지?']);
}
function nextStorage(){
  chatCur = chatQueue.shift() || null;
  if(!chatCur){ botSay('다 정리했어요! 기한이 가까워지면 제가 먼저 알려줄게요.', ['고마워']); return; }
  const i = inv.find(x => x.id === chatCur);
  if(!i) return nextStorage();
  botSay(`${i.name} ${qtyText(i)}! ${i.name}은(는) ${ZONE_WORD[where(i)]}가 좋아요. ${i.why || ''} 거기 둘까요?`, ['거기 둘게', '자리가 없어', '다른 데 둘래', '나중에 할게']);
}
function quickReply(t){
  const i = chatCur ? inv.find(x => x.id === chatCur) : null;
  if(i && t === '거기 둘게'){
    meSay(t);
    botSay(`좋아요! ${i.tip || ''}`.trim());
    return setTimeout(nextStorage, 700);
  }
  if(i && t === '다른 데 둘래'){
    meSay(t);
    return botSay('어디에 둘까요?', ZONES.filter(z => z !== where(i)).map(z => ZONE_WORD[z]));
  }
  const z = Object.keys(ZONE_WORD).find(k => ZONE_WORD[k] === t);
  if(i && z){
    meSay(t);
    const prev = where(i); i.storage = z; i.spot = '';
    let extra = '';
    if(z === '냉동' && prev !== '냉동'){ i.expiry = addDays(30); i.estimated = true; i.check = false; extra = ' 냉동했으니 한 달쯤 두고 먹어도 돼요. 한 번 먹을 만큼 나눠 담으면 꺼내 쓰기 편해요.'; }
    if(z === '김치냉장고' && /고구마|감자/.test(i.name)) extra = ' 그런데 고구마와 감자는 너무 차가우면 금방 상해요. 그래도 괜찮을까요?';
    changed();
    botSay(`${ZONE_WORD[z]}에 넣었어요!${extra}`);
    return setTimeout(nextStorage, extra.includes('괜찮을까요') ? 2500 : 800);
  }
  if(t === '나중에 할게'){ meSay(t); chatQueue = []; chatCur = null; return botSay('알겠어요! 재료 관리에서 언제든 옮길 수 있어요.', ['고마워']); }
  if(t === '고마워'){ meSay(t); return botSay('천만에요! 맛있게 드세요 :)'); }
  sendChat(t);
}
async function sendChat(text){
  text = (text || '').trim(); if(!text || chatBusy) return;
  meSay(text); chatBusy = true;
  chatLog.push({who:'bot', text:'…', mood:'happy', temp:true}); renderChat([]);
  const cur = chatCur ? inv.find(x => x.id === chatCur) : null;
  const sys = chatSystem() + (cur ? `\n\n지금 이야기 중인 재료: id ${cur.id}, ${cur.name} ${qtyText(cur)}, 지금 ${where(cur)}, 추천 이유: ${cur.why || ''}, 대체 장소 후보: ${cur.alt || ''}` : '');
  const msgs = [];
  for(const m of chatLog.filter(m => !m.temp).slice(-20)){
    const role = m.who === 'me' ? 'user' : 'assistant';
    if(!msgs.length && role === 'assistant') msgs.push({role:'user', content:'안녕 몽글아'});
    if(msgs.length && msgs[msgs.length - 1].role === role) msgs[msgs.length - 1].content += '\n' + m.text;
    else msgs.push({role, content: m.text});
  }
  try{
    const r = await askChat(sys, msgs);
    chatLog = chatLog.filter(m => !m.temp);
    const goNext = applyActions(r.actions || []);
    botSay(r.reply || '음… 다시 말해줄래요?', r.quick || []);
    if(goNext && chatQueue.length + (chatCur ? 1 : 0)) setTimeout(nextStorage, 900);
  }catch(e){
    chatLog = chatLog.filter(m => !m.temp);
    botSay('앗, 지금은 대답하기 어려워요: ' + e.message, ['다시 해볼게'], 'worry');
  }
  chatBusy = false;
}
function applyActions(acts){
  let goNext = false, touched = false;
  for(const a of acts){
    const i = a.id ? inv.find(x => x.id === a.id) : null;
    if(a.type === 'next'){ goNext = true; continue; }
    if(!i) continue;
    if(a.type === 'move' && ZONES.includes(a.storage)){
      const prev = where(i); i.storage = a.storage; i.spot = a.spot || '';
      if(a.storage === '냉동' && prev !== '냉동' && !acts.some(b => b.type === 'expiry' && b.id === a.id)){ i.expiry = addDays(30); i.estimated = true; i.check = false; }
      touched = true;
    }
    if(a.type === 'expiry' && isDate(a.date)){ i.expiry = a.date; i.estimated = true; touched = true; }
    if(a.type === 'note' && a.text){ i.note = a.text; touched = true; }
  }
  if(touched) changed();
  return goNext;
}
$('#chatSend').onclick = () => { const t = $('#chatInput'); const v = t.value; t.value = ''; t.style.height = ''; sendChat(v); };
$('#chatInput').addEventListener('keydown', e => { if(e.key === 'Enter' && !e.shiftKey && !e.isComposing){ e.preventDefault(); $('#chatSend').click(); } });
$('#chatInput').addEventListener('input', e => { const t = e.target; t.style.height = ''; t.style.height = Math.min(120, t.scrollHeight) + 'px'; });

/* ---------- 전체 화면 그리기 ---------- */
function render(){
  $('#date').textContent = new Date().toLocaleDateString('ko-KR', {month:'long', day:'numeric', weekday:'short'});
  sel = new Set([...sel].filter(id => inv.some(i => i.id === id)));
  const L = sorted();
  renderWho(); renderFridge(L); updRec(); renderAlerts(L); renderManage(L);
  if(typeof renderApp2 === 'function') renderApp2(L);
  msgs = buildMsgs(L); if(msgI >= msgs.length) msgI = 0; showMsg();
}
