/* ai.js — Claude에게 보내는 요청과 지시문 */
const MODEL = 'claude-sonnet-5-5';
const ZONES = ['냉장','냉동','김치냉장고','실온'];
const DOW = ['일','월','화','수','목','금','토'];
function dowOf(s){ return DOW[new Date(s + 'T00:00:00').getDay()]; }
function isWeekend(s){ const d = new Date(s + 'T00:00:00').getDay(); return d === 0 || d === 6; }

/* 사진은 AI가 읽는 데만 쓰고 저장하지 않아요 (전단지만 따로 저장) */
function toB64(file, max = 1568){
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      res(c.toDataURL('image/jpeg', 0.85).split(',')[1]);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}
async function imagesOf(files){
  const out = [];
  for(const f of files) out.push({type:'image', source:{type:'base64', media_type:'image/jpeg', data: await toB64(f)}});
  return out;
}

async function callClaude(body){
  const key = localStorage.getItem('key');
  if(!key){ alert('설정에서 API 키를 먼저 넣어주세요'); go('set'); throw new Error('API 키 없음'); }
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{
      'content-type':'application/json',
      'x-api-key':key,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    },
    body: JSON.stringify({model: MODEL, ...body})
  });
  const j = await r.json();
  if(!r.ok) throw new Error(j.error?.message || ('HTTP ' + r.status));
  const t = j.content.map(c => c.text || '').join('');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if(a < 0 || b < 0) throw new Error('AI 응답을 읽지 못했어요. 다시 시도해 주세요.');
  return JSON.parse(t.slice(a, b + 1));
}
const ask = (content, maxTokens = 4000) => callClaude({max_tokens: maxTokens, messages: [{role:'user', content}]});
const askChat = (system, messages, maxTokens = 1500) => callClaude({max_tokens: maxTokens, system, messages});

/* 공통 정보 묶음 */
function ctx(o = {}){
  const p = [
    `오늘은 ${today()} (${dowOf(today())}요일, ${isWeekend(today()) ? '주말' : '평일'})이야.`,
    familyText()
  ];
  if(o.today) p.push(todayText());
  if(o.inv)   p.push(`우리집 재료 (기한 임박 순, [보관 위치]):\n${listText()}\n늘 있는 기본 재료: ${staples()}`);
  if(o.flyer) p.push(`동네 마트 전단 할인:\n${flyerText()}`);
  if(o.meals) p.push(`최근 7일 먹은 기록:\n${recentMeals()}`);
  if(o.waste) p.push(`예전에 먹지 못하고 버린 기록:\n${wasteText()}`);
  if(o.buys)  p.push(`예전 구매 이력 (이름 | 횟수 | 지난 구매 | 가격):\n${buyHist()}`);
  return p.join('\n\n');
}
const J = s => `\n다른 말 없이 JSON만 출력해:\n${s}`;

const ITEM_RULES = `- amount와 unit: 개수나 양. 예: 사과 10개 → 10,"개" / 돼지고기 600g → 600,"g" / 계란 30구 → 30,"개" / 우유 900ml 2개 → 2,"개". 같은 걸 여러 개면 곱해. 모르면 1과 "개"나 "팩".
- 무게로 산 과일·채소(사과 2kg 등)나 봉지에 많이 든 냉동식품(만두, 새우, 떡, 너겟, 브리또 등)은 개수를 대충 추정해서 amount=추정 개수, approx:true, basis에 근거 (예: "2kg, 개당 약 250g"). 세기 애매한 것(다진 고기, 쌀)은 g 그대로.
- size: 개당 용량이나 산 무게 (예: "900ml", "2kg"). 없으면 "".
- storage: 가장 좋은 보관 위치. "냉장" | "냉동" | "김치냉장고" | "실온" 중 하나.
  (감자·고구마·양파·바나나는 실온 서늘한 곳. 고구마·감자는 김치냉장고 금지. 김치·무·배추·사과·배·쌀은 김치냉장고도 좋음. 바로 안 먹을 고기·생선·식빵은 냉동)
- why: 왜 거기가 좋은지 한 줄 (말하듯이).
- alt: 그 자리가 없을 때 대체 보관 장소와 방법 한 줄 (예: "팬트리가 꽉 찼으면 베란다 그늘진 곳에 신문지로 싸서").
- tip: 4인 가족 기준 보관 요령 한두 문장.
- openDays: 개봉 후 며칠 안에 먹어야 하는지 (우유 3, 크림치즈 10, 소스 5). 해당 없으면 null.
- check: 포장에 날짜가 찍혀 나오고 기한이 짧은 것(두부, 우유, 요거트, 치즈, 계란, 생고기, 생선, 햄, 어묵, 밀키트, 빵)이면 true.
- expiry: 사진 속 포장 날짜가 보이면 그 날짜에 estimated:false, 아니면 보관 위치 기준 추정에 estimated:true.`;
const ITEM_JSON = '"name":"","amount":1,"unit":"개","approx":false,"basis":"","size":"","storage":"냉장","why":"","alt":"","tip":"","openDays":null,"check":false,"expiry":"YYYY-MM-DD","estimated":true';

/* 영수증·주문내역 */
const PROMPT_ANA = memo => `${ctx({waste:true, buys:true})}

첨부한 사진(마트 영수증, 온라인 주문내역, 장 본 식재료, 포장의 날짜 부분)과 메모에서 먹는 식재료와 식품만 뽑아줘. 생활용품은 빼.
사진 속 이름, 주소, 카드번호 같은 개인정보는 무시하고 절대 적지 마.
${ITEM_RULES}
- price: 영수증에 보이는 그 품목 금액(원, 숫자). 안 보이면 null.
- purchased: 영수증 날짜, 없으면 오늘.
- advice: 이번에 산 것 중 예전에 버린 적 있는 재료가 있으면 그 기록을 근거로 이번엔 제때 먹자는 짧고 다정한 조언 (언제까지 뭘로, 소분·냉동 방법). 없으면 [].
메모: ${memo || '없음'}
${J(`{"items":[{${ITEM_JSON},"price":null,"purchased":"YYYY-MM-DD"}],"advice":[{"name":"","text":""}]}`)}`;

/* 재료 등록하기 (냉장고·팬트리 사진, 말, 글) */
const PROMPT_REG = (memo, hasPhoto) => `${ctx({})}

${hasPhoto ? '첨부한 사진은 우리집 냉장고, 냉동실, 김치냉장고, 팬트리 중 한 곳이야. 사진에서 보이는 식재료와 식품을 찾아줘. 사진 속 사람이나 개인정보는 무시해. 사진에 보이는 장소를 storage로 (냉동실이면 "냉동", 팬트리면 "실온").\n' : ''}내가 말하거나 쓴 내용: "${memo || '없음'}"
이미 집에 있는 재료를 처음 등록하는 거야. 구매일을 모르면 purchased는 "".
${ITEM_RULES}
- 사진으로는 남은 양을 대충 추정해. 확실하지 않은 건 sure:false.
${J(`{"items":[{${ITEM_JSON},"sure":true,"purchased":""}]}`)}`;

/* 포장 날짜 읽기 */
const PROMPT_LABEL = name => `사진은 "${name}" 포장이야. 오늘은 ${today()}이야. 포장에 찍힌 날짜를 읽어줘.
- 소비기한이 있으면 소비기한, 없으면 유통기한.
- 연도가 안 보이면 오늘 이후 가장 가까운 날짜로.
- 제조일만 보이면 이 식품의 일반적인 기한으로 계산하고 kind를 "제조일 기준 추정"으로.
- 읽을 수 없으면 found:false. 용량이 보이면 size에. 개봉 후 주의사항이 보이면 note에 한 줄.
${J('{"found":true,"expiry":"YYYY-MM-DD","kind":"소비기한","size":"","note":""}')}`;

/* 전단지 */
const PROMPT_FLYER = () => `오늘은 ${today()} (${dowOf(today())}요일)이야. 첨부한 사진은 동네 마트 할인 전단지야.
우리 가족 식사에 쓸 만한 식재료와 식품만 뽑아줘 (생활용품, 술, 주방용품 제외).
- 확실히 읽히는 것만. 절대 지어내지 마. 이름이 흐릿하면 보이는 대로 적고 sure:false. 가격이 안 읽히면 price null.
- 행사 기간 from, to (YYYY-MM-DD). 요일별 품목이면 그날 하루. 연도는 오늘 기준. 기간이 안 보이면 오늘부터 7일.
- unit: 판매 단위 (예: "1팩", "100g", "2kg"). store: 마트 이름이 보이면.
${J('{"store":"","items":[{"name":"","price":0,"unit":"","from":"YYYY-MM-DD","to":"YYYY-MM-DD","sure":true}]}')}`;

/* 저녁 추천 */
const PROMPT_REC = (mode, picked, wish) => `${ctx({today:true, inv:true, flyer:true, meals:true, waste:true, buys:true})}

${mode === 'wish' ? `먹고 싶은 메뉴: "${wish}". 우리집 재료를 최대한 활용해서 만드는 방법 3가지 버전 (기본 / 냉장고 털이 / 더 간단한). 이름에 버전 표시.`
 : mode === 'sel' ? `내가 고른 재료: ${picked}. 이 재료를 중심으로 쓰는 저녁 메뉴 3개.`
 : '오늘 저녁 메뉴 3개를 추천해.'}

규칙:
- 오늘 저녁 인원과 상태에 맞는 양(serves). 아이들 것은 맵지 않게. 어른만 맵게 먹고 싶을 때 덜어서 따로 하는 법은 kids에 한 줄.
- 다이어트 중인 사람이 함께 먹으면 diet에 같은 재료로 가볍게 먹는 법 한 줄. 없으면 "".
- 평일이고 여유 없는 날이면 30분 이내, 메인 하나 + 국이나 반찬 하나. 주말이면 면 요리도 좋아.
- 우리집 조리 도구를 활용하고 tool에 적어 (에어프라이어, 압력솥, 밥솥, 전자레인지). 설거지 줄게 팬이나 냄비 하나 위주.
- 기한이 가까운 재료, 예전에 버린 적 있는 재료를 먼저.
- 최근 기록을 보고 부족한 영양소를 채우는 메뉴를 하나 이상. nutri에 한 줄.
- uses: 우리집 재료와 쓸 양.
- buy: 꼭 필요한 것만 최소로. guide에 가격 가이드 (전단 할인 중이면 할인가와 날짜, 아니면 지난 구매 가격, 이력 없으면 일반 시세 "약 ~원"). 브랜드는 말하지 마. 필요 없으면 [].
- leftover: 이 메뉴를 하고 남는 재료를 언제까지 무엇으로 쓸지 한 줄.
- shopping: 세 메뉴 통틀어 최소 장보기 한 문장 (없으면 ""). urgent: 오늘~내일 꼭 써야 할 재료 한두 문장.
${J('{"urgent":"","nutri":"","shopping":"","menus":[{"name":"","minutes":20,"serves":"","tool":"","uses":[""],"buy":[{"item":"","guide":""}],"kids":"","diet":"","leftover":"","why":"","steps":[""]}]}')}`;

/* 먹은 것·버린 것 차감 */
const PROMPT_EAT = (text, hasPhoto) => `${ctx({today:true})}

우리집 재료 목록 (id | 이름 | 남은 양 | 단위 | 개당 용량 | 추정 | 보관):
${invList()}

${hasPhoto ? '첨부한 사진은 우리가 먹은 음식이야. 무슨 요리인지, 목록 중 어떤 재료가 얼마나 들어갔을지 추정해.\n' : ''}내 설명: "${text || '없음'}"

목록에서 쓴 만큼 빼줘.
- 내가 말한 재료와 양이 가장 우선.
- 인원을 말하지 않았으면 아침은 가족 전체, 저녁은 위의 오늘 저녁 인원 기준으로 추정.
- 개수로 세는 건 정수로. 추정(approx) 재료는 대략적으로.
- 개당 용량이 있으면 용량 기준 (예: 우유 900ml 2개에서 400ml → after 1.6).
- 버렸다/썩었다/상했다는 재료는 discard:true, reason에 "상함"이나 "기한 지남".
- 목록에 있는 재료만, id 그대로. 기본 양념은 무시. after는 남은 양(0 이상), unit은 목록 그대로.
- kind: "아침" | "저녁" | "간식" | "외식" | "버림".
${J('{"meal":"짧은 요약","kind":"저녁","changes":[{"id":"","name":"","before":1,"after":0.5,"unit":"개","discard":false,"reason":""}]}')}`;

/* 일주일 계획 */
const PROMPT_PLAN = () => `${ctx({today:true, inv:true, flyer:true, meals:true, waste:true, buys:true})}
아침 세트: ${bfText()}

오늘부터 7일 동안 우리집 아침·저녁 계획을 세워줘.
가장 중요한 목표: 지금 있는 재료와 요리하고 남는 재료를 기한 안에 버리지 않고 다 쓰기.
- 기한 가까운 재료부터. 재료를 일부만 쓰면 남은 양을 언제 무엇으로 쓸지 다음 날짜에 꼭 이어서 넣어.
- 평일: 아침은 아침 세트 중 가볍게, 저녁은 30분 이내 메인 + 국이나 반찬. 아이들 것은 맵지 않게.
- 주말: 면 요리 한두 끼 포함. 외식·배달 가능성이 있으면 note에 "외식하면 ○○는 다음 날로".
- 조리 도구 활용: 압력솥으로 계란·고구마 미리 쪄두기, 김 싼 밥 전날엔 "밥 넉넉히"를 prep에.
- 과일은 아침과 저녁 곁들임에 기한 맞춰 나눠.
- 다이어트 중인 사람이 있으면 diet에 그날 저녁 가볍게 먹는 법 한 줄.
- 오늘은 오늘 상태(인원, 외식 여부) 반영. 이미 지난 끼니는 "".
- 부족한 재료는 buy에, 전단 할인 날짜에 맞춰 그날 사도록 guide에 가격과 날짜.
- leftovers: 기한 관리가 필요한 재료들의 소비 계획 (재료와 양, 언제까지, 어느 날 무엇으로).
- tip: 이번 주 한두 문장 조언.
${J('{"days":[{"date":"YYYY-MM-DD","breakfast":"","dinner":"","diet":"","uses":[""],"buy":[{"item":"","guide":""}],"prep":"","note":""}],"leftovers":[{"name":"","by":"YYYY-MM-DD","how":""}],"tip":""}')}`;

/* 영양 체크 */
const PROMPT_NUT = () => `${ctx({inv:true, meals:true})}

최근 7일 기록으로 우리 가족 영양 균형을 봐줘. 다정하게, 잔소리처럼 들리지 않게.
- 아이들(성장기): 단백질, 칼슘, 철분, 채소·과일 중심.
- 다이어트 중인 사람: 단백질과 채소가 충분한지.
- 아침이 시리얼·빵 위주면 손 안 가는 단백질 추가법 한 가지 (삶은 계란, 요거트, 치즈 등).
- 외식·배달 기록도 고려.
- next: 다음 며칠 저녁으로 좋은 간단 메뉴 3개 (맵지 않게, 30분 이내, 우리집 재료 위주).
- 기록이 적으면 summary에 기록을 남겨달라고 하고 재료 기준으로 추천.
${J('{"summary":"","kids":"","diet":"","breakfast":"","good":[""],"lacking":[{"name":"","why":""}],"next":[{"name":"","fills":"","uses":[""],"buy":[""]}]}')}`;

/* 장보기 목록 */
const PROMPT_SHOP = () => `${ctx({inv:true, flyer:true, meals:true, waste:true, buys:true})}
영양 체크 결과: ${nutriText()}
아침 세트: ${bfText()}

다음 장보기 목록을 만들어줘. 우리 가족이 일주일 안에 버리지 않고 다 먹을 만큼만.
- 곧 떨어지거나 다 떨어진, 자주 사는 재료 우선 (아침 재료와 주말 면 재료도 확인).
- 전단 할인 품목 중 쓸모 있는 건 sale에 날짜와 가격 (예: "10/20 화 990원").
- 부족한 영양소를 채울 재료 1~2개.
- 예전에 버린 재료는 양을 줄이라고 why에.
- guide: 지난 구매 가격 기준 가격 가이드라인 (이력 없으면 일반 시세 "약 ~원"). 브랜드는 말하지 마.
- total: 예상 총액 범위 한 문장. storage: 장 보고 와서 정리 팁 한두 문장 (김치냉장고 활용 포함).
${J('{"items":[{"name":"","amount":"","why":"","guide":"","sale":""}],"total":"","storage":""}')}`;

/* 보관법 */
const PROMPT_STORE = i => `${familyText()}
"${i.name}" (${qtyText(i)}, 지금 ${where(i)}${i.spot ? ' ' + i.spot : ''} 보관, 기한 ${i.expiry || '모름'}${i.opened ? ', ' + i.opened + ' 개봉' : ''}) 보관법을 알려줘.
${J('{"best":"가장 좋은 보관 위치와 이유 한 줄","alt":"그 자리가 없을 때 대체 장소 한 줄","how":["담는 법이나 손질법 2~3개"],"freeze":"냉동 가능 여부, 방법, 기간","opened":"개봉 후 보관과 기한","sign":"상했는지 알아보는 법","bulk":"양이 많을 때 소분 팁 (해당 없으면 빈 문자열)"}')}`;

/* 몽글이 대화 (보관 도우미) */
function chatSystem(){
  return `너는 "몽글이"야. 셰프 모자를 쓴 두부 캐릭터이고, 이 가족의 다정한 식재료 보관·식사 도우미야.
말투: 짧고 다정한 존댓말, 한 번에 2~4문장. 지시하지 말고 "~할까요?", "~어때요?"처럼 같이 고민하듯 대화해.
사용자가 자리가 없다고 하면 다른 보관 장소를 구체적으로 제안해 (냉장고 문칸, 김치냉장고 야채칸, 베란다 그늘, 냉동 소분 등).
사용자가 위치를 정하면 actions로 바로 반영해. 모르는 건 지어내지 말고 물어봐.

${ctx({today:true, inv:true})}

재료 목록 (id | 이름 | 남은 양 | 단위 | 개당 용량 | 추정 | 보관):
${invList()}

할 수 있는 actions:
- {"type":"move","id":"재료 id","storage":"냉장|냉동|김치냉장고|실온","spot":"구체적인 자리 (예: 베란다 그늘, 냉장고 문칸)"}
- {"type":"expiry","id":"","date":"YYYY-MM-DD"}  (냉동으로 옮기면 기한 연장 등)
- {"type":"note","id":"","text":"보관 메모 한 줄"}
- {"type":"next"}  (지금 이야기한 재료를 마치고 다음 재료로 넘어갈 때)
quick: 사용자가 누를 수 있는 짧은 답 버튼 2~4개 (예: "거기 둘게", "자리가 없어", "냉동할래").
${J('{"reply":"","quick":[""],"actions":[]}')}`;
}
