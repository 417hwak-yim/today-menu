/* app2.js — 추천, 계획, 아침, 전단지, 장보기, 기록, 영양 체크, 설정 */

/* ---------- 저녁 추천 ---------- */
$('#recBtn').onclick = () => runRec(recMode(), inv.filter(i => sel.has(i.id)).map(i => `${i.name} ${amtText(i)}`).join(', '), $('#wish').value.trim());
async function runRec(mode, picked, wish){
  const out = $('#recOut'); out.dataset.busy = 1;
  out.innerHTML = `<div class="card">${buddyLine(mode === 'wish' ? `'${esc(wish)}' 만들 방법 찾는 중이에요…` : '오늘 저녁 메뉴 고르는 중이에요…')}</div>`;
  out.scrollIntoView({behavior:'smooth', block:'start'});
  try{
    const data = await ask([{type:'text', text: PROMPT_REC(mode, picked, wish)}], 4500);
    localStorage.setItem('rec', JSON.stringify({date: today(), data}));
    showRec(data);
  }catch(e){ out.innerHTML = `<div class="card">${buddyLine('앗, 오류가 났어요: ' + esc(e.message), 'worry')}</div>`; }
  delete out.dataset.busy;
}
const buyHTML = b => typeof b === 'string' ? esc(b) : `${esc(b.item)}${b.guide ? ` <span class="price">(${esc(b.guide)})</span>` : ''}`;
function showRec(d){
  $('#recOut').innerHTML =
    (d.urgent || d.nutri ? `<div class="card">${buddyLine(esc([d.urgent, d.nutri].filter(Boolean).join(' ')))}</div>` : '') +
    (d.shopping ? `<div class="card"><b>최소 장보기</b><p class="buy">${esc(d.shopping)}</p></div>` : '') +
    (d.menus || []).map((m, n) => `<div class="card"><b style="font-size:16px">${esc(m.name)}</b>
      <span class="muted"> · ${esc(m.minutes)}분${m.serves ? ' · ' + esc(m.serves) : ''}${m.tool ? ' · ' + esc(m.tool) : ''}</span>
      <p>${esc(m.why)}</p>
      <p class="muted">집 재료: ${(m.uses || []).map(esc).join(', ')}</p>
      ${(m.buy || []).length ? `<p class="buy">사야 할 것: ${m.buy.map(buyHTML).join(', ')}</p>` : '<p class="ok" style="font-size:13px">집에 있는 재료로 충분해요</p>'}
      ${m.kids ? `<p class="tip">아이들: ${esc(m.kids)}</p>` : ''}
      ${m.diet ? `<p class="tip" style="color:#b7791f">다이어트: ${esc(m.diet)}</p>` : ''}
      ${m.leftover ? `<p class="adv">남는 재료: ${esc(m.leftover)}</p>` : ''}
      <details><summary>만드는 법</summary><ol>${(m.steps || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol></details>
      <button class="btn light" onclick="eatMenu(${n})">이걸로 먹었어요</button></div>`).join('');
}
function renderRecCache(){
  const out = $('#recOut'); if(out.dataset.busy || out.innerHTML) return;
  const r = load('rec', null); if(r && r.date === today()) showRec(r.data);
}
function eatMenu(n){
  const m = load('rec', null)?.data?.menus?.[n]; if(!m) return;
  const t = `오늘 저녁으로 ${m.name} 해먹었어. 쓴 재료: ${(m.uses || []).join(', ')}`;
  $('#eatText').value = t; go('log'); eat(t);
}

/* ---------- 이번 주 계획 ---------- */
$('#planBtn').onclick = makePlan;
async function makePlan(){
  const out = $('#planOut'); out.dataset.busy = 1;
  out.innerHTML = buddyLine('이번 주 계획 짜는 중이에요… 남은 재료까지 꼼꼼히 볼게요. (20~40초)');
  try{
    const p = await ask([{type:'text', text: PROMPT_PLAN()}], 7000);
    p.made = today(); localStorage.setItem('plan', JSON.stringify(p));
    delete out.dataset.busy; toast('이번 주 계획을 짰어요!'); render();
  }catch(e){ delete out.dataset.busy; out.innerHTML = buddyLine('앗, 계획을 못 짰어요: ' + esc(e.message), 'worry'); }
}
function renderPlan(){
  const out = $('#planOut'); if(out.dataset.busy) return;
  const p = load('plan', null);
  if(!p){ out.innerHTML = '<p class="muted">아직 계획이 없어요. 재료를 등록하고 "계획 짜기"를 눌러보세요.</p>'; $('#planBtn').textContent = '계획 짜기'; return; }
  $('#planBtn').textContent = '계획 다시 짜기';
  const days = (p.days || []).filter(d => isDate(d.date) && dday(d.date) >= 0);
  const ln = (k, v) => v ? `<div class="ln"><em>${k}</em>${v}</div>` : '';
  out.innerHTML = (p.tip ? buddyLine(esc(p.tip)) : '') +
    (days.length ? days.map(d => `<div class="day ${d.date === today() ? 'today' : ''}">
      <div class="dh">${md(d.date)} (${dowOf(d.date)})<span>${d.date === today() ? '오늘' : ''}</span></div>
      ${ln('아침', esc(d.breakfast))}${ln('저녁', '<b>' + esc(d.dinner) + '</b>')}
      ${ln('가볍게', esc(d.diet))}
      ${ln('재료', esc((d.uses || []).join(', ')))}
      ${(d.buy || []).length ? ln('살 것', `<span class="buy">${d.buy.map(buyHTML).join(', ')}</span>`) : ''}
      ${ln('미리', esc(d.prep))}${ln('메모', esc(d.note))}</div>`).join('')
      : '<p class="muted">계획 기간이 끝났어요. 다시 짜볼까요?</p>') +
    ((p.leftovers || []).length ? `<details open><summary>남은 재료 소비 계획 ${p.leftovers.length}개</summary>${p.leftovers.map(l => `<div class="item"><div class="name">${esc(l.name)}<small>${isDate(l.by) ? md(l.by) + '까지 · ' : ''}${esc(l.how)}</small></div></div>`).join('')}</details>` : '') +
    (p.made !== today() ? `<p class="muted">${md(p.made)}에 짠 계획이에요. 재료가 바뀌었으면 다시 짜주세요.</p>` : '');
}

/* ---------- 아침 ---------- */
function renderBf(){
  $('#bfBtns').innerHTML = bfSets().map((b, n) => `<button class="x" onclick="eatBf(${n})">${esc(b.name)} <span class="price">${b.min}분</span></button>`).join('');
}
function eatBf(n){
  const b = bfSets()[n];
  const v = prompt(`${b.name}, 몇 명이 먹었어요?`, String(fam().length));
  if(v === null) return;
  const t = `아침으로 ${b.name}을(를) ${parseInt(v) || fam().length}명이 먹었어`;
  $('#eatText').value = t; go('log'); eat(t);
}

/* ---------- 먹은 것·버린 것 ---------- */
$('#eatBtn').onclick = () => {
  const t = $('#eatText').value.trim(), files = [...$('#eatPhotos').files];
  if(!t && !files.length) return alert('음식 사진을 올리거나, 뭘 먹었는지 말해주세요');
  eat(t, files);
};
async function eat(text, files = []){
  const out = $('#eatOut');
  out.innerHTML = `<div class="card">${buddyLine('뭐가 얼마나 들어갔는지 계산 중이에요…')}</div>`;
  try{
    const j = await ask([...await imagesOf(files), {type:'text', text: PROMPT_EAT(text, files.length > 0)}], 2500);
    const ch = (j.changes || []).filter(c => inv.some(i => i.id === c.id));
    if(!ch.length){
      out.innerHTML = `<div class="card">${buddyLine('냉장고에서 뺄 재료는 없는 것 같아요. 먹은 기록만 남길까요?')}<button class="btn light" id="logOnly">기록만 남기기</button></div>`;
      $('#logOnly').onclick = () => { hist.unshift({date: today(), kind: j.kind || '기록', meal: j.meal || text, items: []}); $('#eatText').value = ''; out.innerHTML = ''; toast('기록했어요'); changed(); };
      return;
    }
    out.innerHTML = `<div class="card"><b>${esc(j.meal || '기록')}</b> <span class="tag g">${esc(j.kind || '')}</span>
      <p class="muted">이만큼 남게 돼요. 숫자가 다르면 고친 뒤 확인을 눌러주세요. 0이면 목록에서 빠져요.</p>
      ${ch.map((c, n) => `<div class="item"><div class="name">${esc(c.name)}${c.discard ? '<span class="tag">버림</span>' : ''}<small>지금 ${fmt(c.before)}${esc(c.unit)} → 남는 양</small></div>
        <input type="number" inputmode="decimal" step="${WEIGHT_UNITS.includes(c.unit) ? '1' : '0.1'}" min="0" value="${fmt(c.after)}" data-n="${n}"> <span>${esc(c.unit)}</span></div>`).join('')}
      <div class="row"><button class="btn gray" id="cancelBtn">취소</button><button class="btn" id="applyBtn">확인</button></div></div>`;
    $('#cancelBtn').onclick = () => { out.innerHTML = ''; };
    $('#applyBtn').onclick = () => {
      snapshot();
      const usedList = [], left = [], partial = []; let wasted = 0;
      out.querySelectorAll('input[type=number]').forEach(el => {
        const c = ch[el.dataset.n], v = parseFloat(el.value);
        const i = inv.find(x => x.id === c.id); if(!i || isNaN(v)) return;
        const before = i.amount ?? c.before ?? 1, unit = i.unit || c.unit || '', diff = before - v;
        if(diff > 0){
          usedList.push(`${i.name} ${fmt(diff)}${unit}${c.discard ? ' (버림)' : ''}`);
          if(c.discard){ recordWaste(i, diff, c.reason || '상함'); wasted++; }
        }
        if(v <= 0){ inv = inv.filter(x => x.id !== c.id); left.push(`${i.name} ${c.discard ? '버림' : '다 씀'}`); }
        else {
          i.amount = v; if(!i.unit) i.unit = c.unit || '개'; if(i.orig == null) i.orig = before; delete i.qty;
          left.push(`${i.name} ${amtText(i)} 남음`); if(diff > 0 && !c.discard) partial.push(i.name);
        }
      });
      hist.unshift({date: today(), kind: j.kind || '저녁', meal: j.meal || text, items: usedList, waste: wasted > 0 && wasted === usedList.length});
      $('#eatText').value = ''; $('#eatPhotos').value = '';
      changed();
      out.innerHTML = `<div class="card"><b>반영했어요</b><p>${esc(left.join(', '))}</p>
        ${wasted ? buddyLine('버린 재료는 기억해 둘게요. 다음에 살 때 알려드릴게요.', 'worry') : ''}
        ${partial.length ? buddyLine(`남은 ${esc(partial.join(', '))}을(를) 언제 쓸지 계획에 반영할까요?`) + '<button class="btn" onclick="go(\'home\');makePlan()">남은 재료로 계획 다시 짜기</button>' : ''}
        <button class="btn gray" onclick="undo();$('#eatOut').innerHTML=''">되돌리기</button></div>`;
    };
  }catch(e){ out.innerHTML = `<div class="card">${buddyLine('앗, 오류가 났어요: ' + esc(e.message), 'worry')}</div>`; }
}
function renderLog(){
  $('#hist').innerHTML = hist.length ? hist.slice(0, 40).map(h =>
    `<div class="item"><div class="name">${esc(h.meal)}${h.kind ? `<span class="tag ${h.kind === '버림' ? '' : h.kind === '외식' ? 'y' : 'g'}">${esc(h.kind)}</span>` : ''}<small>${esc(h.date)}${h.items?.length ? ' · ' + esc(h.items.join(', ')) : ''}</small></div></div>`
  ).join('') : '<p class="muted">아직 기록이 없어요.</p>';
  const month = today().slice(0, 7), wm = waste.filter(w => w.date.slice(0, 7) === month);
  const freq = {}; waste.forEach(w => freq[w.name] = (freq[w.name] || 0) + 1);
  const top = Object.entries(freq).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([n, c]) => `${n}(${c}번)`).join(', ');
  $('#wasteList').innerHTML = waste.length
    ? `<p>이번 달 <b>${wm.length}번</b> 버렸어요.${top ? ` 자주 버린 재료: <b>${esc(top)}</b>` : ''}</p>` +
      waste.slice(0, 15).map(w => `<div class="item"><div class="name">${esc(w.name)} ${esc(fmt(w.amount))}${esc(w.unit)}<small>${esc(w.date)} · ${esc(w.reason)}${w.purchased ? ' · 구입 ' + esc(w.purchased) : ''}</small></div></div>`).join('')
    : '<p class="muted">버린 재료가 없어요. 잘하고 있어요!</p>';
}

/* ---------- 영양 체크 ---------- */
$('#nutBtn').onclick = async () => {
  const out = $('#nutOut'); out.dataset.busy = 1;
  out.innerHTML = buddyLine('우리 가족 영양을 살펴보는 중이에요…');
  try{
    const data = await ask([{type:'text', text: PROMPT_NUT()}], 3000);
    localStorage.setItem('nutri', JSON.stringify({date: today(), data}));
    delete out.dataset.busy; showNut(data); render();
  }catch(e){ delete out.dataset.busy; out.innerHTML = buddyLine('앗, 오류가 났어요: ' + esc(e.message), 'worry'); }
};
function showNut(d){
  $('#nutOut').innerHTML = buddyLine(esc(d.summary || '')) +
    (d.kids ? `<p><b>아이들</b><br>${esc(d.kids)}</p>` : '') +
    (d.diet ? `<p><b>다이어트하는 분</b><br>${esc(d.diet)}</p>` : '') +
    (d.breakfast ? `<p><b>아침</b><br>${esc(d.breakfast)}</p>` : '') +
    ((d.good || []).filter(Boolean).length ? `<p>잘 챙긴 것: ${d.good.filter(Boolean).map(g => `<span class="tag g">${esc(g)}</span>`).join(' ')}</p>` : '') +
    ((d.lacking || []).length ? `<p><b>조금 부족해요</b></p>${d.lacking.map(l => `<div class="item"><div class="name">${esc(l.name)}<small>${esc(l.why)}</small></div></div>`).join('')}` : '') +
    ((d.next || []).length ? `<p><b>다음엔 이거 어때요?</b></p>${d.next.map(m => `<div class="item"><div class="name">${esc(m.name)} <span class="tag b">${esc(m.fills)}</span><small>재료: ${esc((m.uses || []).join(', '))}${(m.buy || []).length ? ' · 살 것: ' + esc(m.buy.join(', ')) : ''}</small></div></div>`).join('')}` : '');
}
function renderNutCache(){
  const out = $('#nutOut'); if(out.dataset.busy || out.innerHTML) return;
  const n = load('nutri', null); if(n && dday(n.date) >= -3) showNut(n.data);
}

/* ---------- 전단지 ---------- */
$('#flyerBtn').onclick = async () => {
  const files = [...$('#flyerPhotos').files].slice(0, 6);
  if(!files.length) return alert('전단지 사진을 골라주세요');
  const out = $('#flyerOut');
  out.innerHTML = buddyLine('전단지 읽는 중이에요… (20~40초)');
  try{
    const j = await ask([...await imagesOf(files), {type:'text', text: PROMPT_FLYER()}], 7000);
    const fl = {date: today(), store: j.store || '', items: (j.items || []).filter(x => x.name)};
    localStorage.setItem('flyer', JSON.stringify(fl));
    const thumbs = []; for(const f of files.slice(0, 4)) thumbs.push(await toB64(f, 1100));
    try{ localStorage.setItem('flyerImgs', JSON.stringify(thumbs)); }catch{ localStorage.removeItem('flyerImgs'); }
    $('#flyerPhotos').value = ''; out.innerHTML = '';
    toast(`전단지에서 ${fl.items.length}개 품목을 찾았어요`); render();
  }catch(e){ out.innerHTML = buddyLine('앗, 전단지를 못 읽었어요: ' + esc(e.message), 'worry'); }
};
function renderFlyer(){
  const imgs = load('flyerImgs', []);
  $('#flyerImgs').innerHTML = imgs.map((d, n) => `<img src="data:image/jpeg;base64,${d}" onclick="viewFlyer(${n})" alt="전단지 ${n + 1}">`).join('');
  const out = $('#flyerOut');
  if(out.innerHTML.includes('읽는 중')) return;
  const f = load('flyer', null);
  if(!f){ out.innerHTML = ''; return; }
  const items = f.items.filter(x => !x.to || dday(x.to) >= 0);
  if(!items.length){ out.innerHTML = '<p class="muted">전단 행사 기간이 모두 끝났어요. 새 전단지를 올려주세요.</p>'; return; }
  const groups = {};
  items.forEach(x => { const k = `${x.from || ''}|${x.to || ''}`; (groups[k] = groups[k] || []).push(x); });
  const label = k => {
    const [a, b] = k.split('|'); if(!isDate(a)) return '기간 모름';
    const s = `${md(a)}(${dowOf(a)})${b && b !== a ? ` ~ ${md(b)}(${dowOf(b)})` : ''}`;
    return dday(a) <= 0 && (!b || dday(b) >= 0) ? `오늘 할인 · ${s}` : s;
  };
  out.innerHTML = (f.store ? `<p class="muted">${esc(f.store)} · ${md(f.date)}에 올린 전단</p>` : '') +
    Object.keys(groups).sort().map(k => `<div class="fd">${label(k)}</div>` + groups[k].map(x =>
      `<div class="item"><div class="name">${esc(x.name)}${x.sure === false ? '<span class="tag y">흐릿함</span>' : ''}<small>${x.price ? won(x.price) : '가격 확인 필요'}${x.unit ? ' · ' + esc(x.unit) : ''}${findGroup(x.name)?.last?.price ? ' · ' + esc(guideText(x.name)) : ''}</small></div></div>`).join('')).join('') +
    `<button class="btn" onclick="go('home');runRec('sel','오늘 전단 할인 품목 (위 전단 할인 목록에서 오늘 날짜에 해당하는 것)','')">오늘 할인 품목으로 저녁 추천받기</button>`;
}
function viewFlyer(n){ const d = load('flyerImgs', [])[n]; if(d) openSheet(`<img src="data:image/jpeg;base64,${d}" style="width:100%;border-radius:10px">`); }

/* ---------- 장보기 가이드 ---------- */
function renderLowList(){
  const {low, gone} = lowStock();
  const rows = [...low.map(i => ({name: i.name, state: `${amtText(i)} 남음`})), ...gone.map(g => ({name: g.name, state: '다 떨어짐 · 자주 사요'}))];
  $('#lowList').innerHTML = rows.length ? rows.map(x => `<div class="item"><div class="name">${esc(x.name)} <span class="warn" style="font-size:12px">${esc(x.state)}</span><small>${esc(guideText(x.name) || '구매 이력 없음')}</small></div></div>`).join('')
    : '<p class="muted">지금은 곧 떨어질 재료가 없어요.</p>';
}
$('#shopBtn').onclick = async () => {
  const out = $('#shopOut'); out.dataset.busy = 1;
  out.innerHTML = buddyLine('장보기 목록 만드는 중이에요…');
  try{
    const data = await ask([{type:'text', text: PROMPT_SHOP()}], 4000);
    localStorage.setItem('shop', JSON.stringify({date: today(), data}));
    delete out.dataset.busy; showShop(data);
  }catch(e){ delete out.dataset.busy; out.innerHTML = buddyLine('앗, 오류가 났어요: ' + esc(e.message), 'worry'); }
};
function showShop(d){
  $('#shopOut').innerHTML = (d.items || []).map(x => `<div class="item"><div class="name"><b>${esc(x.name)}</b> ${esc(x.amount || '')}${x.sale ? `<span class="tag g">${esc(x.sale)}</span>` : ''}
      <small>${esc(x.why || '')}</small>${x.guide ? `<div class="tip">${esc(x.guide)}</div>` : ''}</div></div>`).join('') +
    (d.total ? `<p><b>${esc(d.total)}</b></p>` : '') +
    (d.storage ? buddyLine(esc(d.storage)) : '') +
    '<button class="btn gray" onclick="copyShop()">목록 복사하기</button>';
}
function copyShop(){
  const d = load('shop', null)?.data; if(!d) return;
  const t = (d.items || []).map(x => `□ ${x.name} ${x.amount || ''}${x.sale ? ' (' + x.sale + ')' : ''}`).join('\n') + (d.total ? '\n' + d.total : '');
  if(navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('장보기 목록을 복사했어요')).catch(() => prompt('길게 눌러 복사하세요', t));
  else prompt('길게 눌러 복사하세요', t);
}
function renderShopCache(){
  const out = $('#shopOut'); if(out.dataset.busy || out.innerHTML) return;
  const s = load('shop', null); if(s && dday(s.date) >= -3) showShop(s.data);
}

/* ---------- 장 본 거 (영수증) ---------- */
$('#anaBtn').onclick = async () => {
  const files = [...$('#photos').files], memo = $('#memo').value.trim();
  if(!files.length && !memo) return alert('영수증 사진이나 메모를 넣어주세요');
  const out = $('#anaOut');
  out.innerHTML = `<div class="card">${buddyLine('영수증 읽는 중이에요… (10~30초)')}</div>`;
  try{
    const j = await ask([...await imagesOf(files), {type:'text', text: PROMPT_ANA(memo)}], 5000);
    const adv = (j.advice || []).filter(a => a.name && a.text);
    pending = (j.items || []).map(x => {
      const a = adv.find(a => norm(x.name).includes(norm(a.name)) || norm(a.name).includes(norm(x.name)));
      return {...normItem(x), advice: a ? a.text : '', price: Number.isFinite(+x.price) && +x.price > 0 ? +x.price : null};
    });
    if(!pending.length){ out.innerHTML = `<div class="card">${buddyLine('식재료를 못 찾았어요. 더 밝게 다시 찍어볼래요?', 'worry')}</div>`; return; }
    const chk = pending.filter(needsCheck).map(x => x.name);
    out.innerHTML =
      (adv.length ? `<div class="card"><b>지난번 기억</b>${adv.map(a => buddyLine(esc(a.text), 'worry')).join('')}</div>` : '') +
      `<div class="card"><b>찾은 재료 ${pending.length}개</b>
      ${chk.length ? `<p><span class="warn">${esc(chk.join(', '))}</span>은(는) 포장 날짜를 찍어주면 정확하게 관리할 수 있어요.</p>` : ''}
      <p class="muted">뺄 건 체크를 풀어주세요. 넣고 나면 몽글이가 보관 장소를 같이 정해줘요.</p>
      ${previewHTML(pending)}<button class="btn" id="addBtn">넣고 보관 장소 정하기</button></div>`;
    activeBox = out;
    $('#addBtn').onclick = () => {
      const keep = collectPreview(out, pending);
      keep.forEach(x => buys.unshift({date: x.purchased || today(), name: x.name, amount: x.amount, unit: x.unit, size: x.size || '', approx: !!x.approx, price: x.price}));
      buys = buys.slice(0, 400);
      inv.push(...keep); pending = [];
      $('#photos').value = ''; $('#memo').value = '';
      localStorage.removeItem('rec'); changed();
      out.innerHTML = `<div class="card">${buddyLine(`${keep.length}가지 재료를 넣었어요! 산 재료로 이번 주 계획을 새로 짤까요?`)}<button class="btn" onclick="go('home');makePlan()">이번 주 계획 짜기</button></div>`;
      startStorageChat(keep.map(k => k.id));
    };
  }catch(e){ out.innerHTML = `<div class="card">${buddyLine('앗, 오류가 났어요: ' + esc(e.message), 'worry')}</div>`; }
};
function renderBuyList(){
  $('#buyList').innerHTML = buys.length ? buys.slice(0, 20).map(b => `<div class="item"><div class="name">${esc(b.name)} ${esc(buyAmt(b))}<small>${esc(b.date)}${b.price ? ' · ' + won(b.price) : ''}</small></div></div>`).join('')
    : '<p class="muted">영수증을 올리면 구매 이력과 가격이 쌓여요.</p>';
}

/* ---------- 설정 ---------- */
let famDraft = fam();
function renderFamEdit(list){
  $('#famEdit').innerHTML = list.map((m, n) => `<div class="famrow">
    <input type="text" value="${esc(m.name)}" data-k="name" placeholder="이름">
    <select data-k="kid"><option value="0" ${!m.kid ? 'selected' : ''}>어른</option><option value="1" ${m.kid ? 'selected' : ''}>아이</option></select>
    <input type="text" class="age" value="${esc(m.age || '')}" data-k="age" placeholder="나이" inputmode="numeric">
    <label><input type="checkbox" data-k="diet" ${m.diet ? 'checked' : ''}>다이어트</label>
    <button class="x" onclick="famDel(${n})">삭제</button></div>`).join('');
}
function readFam(){
  return [...$('#famEdit').querySelectorAll('.famrow')].map((r, n) => ({
    id: famDraft[n]?.id || newId(),
    name: r.querySelector('[data-k=name]').value.trim() || '가족',
    kid: r.querySelector('[data-k=kid]').value === '1',
    age: r.querySelector('[data-k=age]').value.trim(),
    diet: r.querySelector('[data-k=diet]').checked
  }));
}
$('#famAdd').onclick = () => { famDraft = readFam(); famDraft.push({id: newId(), name:'', kid:false, age:'', diet:false}); renderFamEdit(famDraft); };
function famDel(n){ famDraft = readFam(); famDraft.splice(n, 1); renderFamEdit(famDraft); }
$('#famSave').onclick = () => {
  famDraft = readFam(); localStorage.setItem('fam', JSON.stringify(famDraft));
  const s = dayState(); famDraft.forEach(m => { s.st[m.id] = m.diet ? '다이어트' : (s.st[m.id] || '함께'); }); saveDay(s);
  toast('가족 정보를 저장했어요'); render();
};
$('#keyBtn').onclick = () => { localStorage.setItem('key', $('#key').value.trim()); toast('저장했어요'); if($('#key').value.trim()) go('home'); };
$('#patSave').onclick = () => { localStorage.setItem('pattern', $('#pattern').value); toast('저장했어요'); };
$('#toolSave').onclick = () => { localStorage.setItem('tools', $('#tools').value); toast('저장했어요'); };
$('#bfSave').onclick = () => { localStorage.setItem('bf', $('#bfEdit').value); toast('저장했어요'); render(); };
$('#stBtn').onclick = () => { localStorage.setItem('staples', $('#staples').value); toast('저장했어요'); };

const BACKUP_KEYS = ['inv','hist','waste','buys','fam','pattern','tools','bf','staples','plan','flyer','nutri'];
$('#expBtn').onclick = () => {
  const o = {}; BACKUP_KEYS.forEach(k => { const v = localStorage.getItem(k); if(v !== null) o[k] = v; });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(o)], {type:'application/json'}));
  a.download = `오늘의식사-백업-${today()}.json`; a.click();
};
$('#imp').onchange = async e => {
  const f = e.target.files[0]; if(!f) return;
  try{
    const o = JSON.parse(await f.text());
    if(!confirm('백업을 불러올까요? 지금 데이터는 백업 내용으로 바뀌어요.')) return;
    BACKUP_KEYS.forEach(k => { if(o[k] !== undefined) localStorage.setItem(k, o[k]); });
    location.reload();
  }catch{ alert('백업 파일을 읽지 못했어요'); }
};

/* ---------- 시작 ---------- */
function renderApp2(L){
  renderRecCache(); renderPlan(); renderBf(); renderFlyer();
  renderLowList(); renderShopCache(); renderBuyList(); renderLog(); renderNutCache();
}
function initSettings(){
  $('#key').value = localStorage.getItem('key') || '';
  famDraft = fam(); renderFamEdit(famDraft);
  $('#pattern').value = pattern();
  $('#tools').value = tools();
  $('#bfEdit').value = localStorage.getItem('bf') || DEF_BF;
  $('#staples').value = staples();
}
initSettings();
save();
if(!localStorage.getItem('key')) go('set'); else render();
