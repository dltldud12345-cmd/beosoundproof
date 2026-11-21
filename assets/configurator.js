/* =========================================================================
   BEO SOUNDPROOF — 3D 견적 시뮬레이터
   -------------------------------------------------------------------------
   [1] 단가 테이블  ← 사장님 단가를 받으면 여기 숫자만 넣으면 견적 박스가
                      자동 합산으로 바뀝니다. null 은 "상담 시 확정".
   [2] 옵션 정의
   [3] UI (옵션 패널 · 요약 · 사양 복사)
   [4] 3D 씬 (Three.js)
   ========================================================================= */

import * as THREE from './three.module.min.js';

/* ============================ [1] 단가 테이블 ============================
   숫자(원)를 넣으면 그 항목부터 합산에 포함됩니다.
   모든 항목이 숫자가 되면 견적 박스가 총액 표시로 전환됩니다.
   areaRate: ㎡당 단가(원). null 이면 면적 합산을 쓰지 않습니다.            */
const PRICE = {
  base:    { ss: null, ssp: null, db: null, custom: null }, // 모델 기본가
  areaRate: null,
  artboard:{ cream: null, ivory: null, warm: null, charcoal: null },
  slat:    { oak: null, walnut: null, white: null },
  light:   { cob3000: null, cob4000: null, rail: null },
  floor:   { oak: null, wash: null, walnut: null },
  door:    { front: null, left: null, right: null },
  window1: null,
  window2: null,
  project: null,
  acLine:  null
};

/* ============================ [2] 옵션 정의 ============================ */
const MODELS = [
  { id:'ss',  name:'슈퍼싱글',       w:1500, d:1800, tag:'주력',     desc:'피아노 · 1인 방송 · 녹음' },
  { id:'ssp', name:'슈퍼싱글 플러스', w:1800, d:2000, tag:'차음 상위', desc:'보컬 · 악기 · 방송' },
  { id:'db',  name:'더블',           w:2000, d:2400, tag:'2인용',    desc:'2인 합주 · 레슨' }
];

/* 색은 여기에 한 줄만 추가하면 패널·3D·사양 요약에 동시에 반영됩니다. */
const ARTBOARD = [
  { v:'cream',    label:'크림 베이지', sub:'기본 · 따뜻한 톤', hex:'#DCCEB6', rough:0.94 },
  { v:'ivory',    label:'아이보리 화이트', sub:'가장 밝은 톤', hex:'#EDE7DA', rough:0.93 },
  { v:'warm',     label:'웜 그레이', sub:'차분한 회색', hex:'#A9A296', rough:0.94 },
  { v:'charcoal', label:'차콜 그레이', sub:'블랙&화이트', hex:'#3A3D40', rough:0.92 }
];
const SLAT = [
  { v:'oak',    label:'내추럴 오크', hex:'#C4A47F', grain:'#8A6234' },
  { v:'walnut', label:'월넛',       hex:'#6A4C38', grain:'#3B2417' },
  { v:'white',  label:'화이트',      hex:'#EBE7DE', grain:'#B9B3A6' }
];
const LIGHT = [
  { v:'cob3000', label:'COB 3000K', sub:'웜 화이트', temp:3000 },
  { v:'cob4000', label:'COB 4000K', sub:'뉴트럴',    temp:4000 },
  { v:'rail',    label:'레일등',     sub:'대형 공간', temp:3500 }
];
const FLOOR = [
  { v:'oak',    label:'내추럴 오크', hex:'#C6A57E', grain:'#8E6C46' },
  { v:'wash',   label:'라이트 워시', hex:'#DCCCB4', grain:'#A98F6E' },
  { v:'walnut', label:'다크 월넛',  hex:'#584234', grain:'#2F1F14' }
];
const DOORS = [
  { v:'front', label:'정면', theta:0 },
  { v:'left',  label:'좌측', theta:-Math.PI/2 },
  { v:'right', label:'우측', theta:Math.PI/2 }
];
const HINGES = [
  { v:'right', label:'우경첩' },
  { v:'left',  label:'좌경첩' }
];
const WINDOWS = [
  { v:'none', label:'없음' },
  { v:'1',    label:'1개' },
  { v:'2',    label:'2개' }
];
const PROJECTS = [
  { v:'none', label:'없음' },
  { v:'in',   label:'포함' }
];
const PRESETS = [
  { id:'bw', label:'블랙&화이트',   sw:['#3E4245','#EBE7DE','#C9A472'], set:{ artboard:'charcoal', slat:'white',  floor:'oak',   light:'cob3000' } },
  { id:'iv', label:'화이트&메이플', sw:['#F1ECE1','#C29A6E','#DFCDB2'], set:{ artboard:'ivory',    slat:'oak',    floor:'wash',  light:'cob4000' } },
  { id:'bg', label:'베이지&우드',   sw:['#E2D6C1','#C29A6E','#C9A472'], set:{ artboard:'cream',    slat:'oak',    floor:'oak',   light:'cob3000' } }
];
const INCLUDED = ['세로 2구 콘센트','강화마루','3면 아트보드','1면 라인타공','COB 매립등·중앙 LED등','시스템도어'];
const PHONE = '010-3001-5906';
const DOOR_OPEN = 1.12;   // 문이 바깥으로 열리는 각도(rad)

const state = {
  model:'ss', w:1500, d:1800,
  artboard:'cream', slat:'oak', light:'cob3000', floor:'oak',
  door:'front', hinge:'right', open:false, window:'none', project:'none', ac:false,
  view:'exterior'
};

const $ = (s, r = document) => r.querySelector(s);
const fmt = n => Number(n).toLocaleString('ko-KR');
const pick = (arr, v) => arr.find(o => o.v === v) || arr[0];

/* ============================ [3] UI ============================ */
const panel = $('#panelBody');

function buildPanel(){
  panel.innerHTML = `
    <section class="sec" style="background:var(--cream)">
      <div class="sec-h"><h2>추천 조합으로 시작</h2><span class="tag">색만 먼저 바꿔보기</span></div>
      <div class="presets">
        ${PRESETS.map(p => `<button type="button" class="preset" data-preset="${p.id}" aria-pressed="false">
          <span class="sw">${p.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span>${p.label}
        </button>`).join('')}
      </div>
    </section>

    <section class="sec">
      <div class="sec-h"><span class="n">01</span><h2>규격</h2><span class="tag" id="sizeTag">표준 예시</span></div>
      <div class="models">
        ${MODELS.map(m => `<button type="button" class="model" data-group="model" data-value="${m.id}" aria-pressed="false">
          <b>${m.name}</b><small>${fmt(m.w)} × ${fmt(m.d)}</small><span class="pill">${m.tag}</span>
        </button>`).join('')}
      </div>
      <div class="sliders">
        <div class="sl-row">
          <span class="lb">가로</span>
          <input type="range" id="slW" min="1500" max="3000" step="100" value="${state.w}" aria-label="가로 치수(mm)">
          <span class="vl"><b id="vlW">${fmt(state.w)}</b><span> mm</span></span>
        </div>
        <div class="sl-row">
          <span class="lb">세로</span>
          <input type="range" id="slD" min="1500" max="3000" step="100" value="${state.d}" aria-label="세로 치수(mm)">
          <span class="vl"><b id="vlD">${fmt(state.d)}</b><span> mm</span></span>
        </div>
      </div>
      <p class="note">표준 예시입니다. 실제로는 방 치수에 맞춰 재단하고, 한 변도 1,500mm 미만으로 만들지 않습니다.</p>
    </section>

    <section class="sec">
      <div class="sec-h"><span class="n">02</span><h2>아트보드 색상</h2><span class="tag">3면</span></div>
      <div class="sw-grid">
        ${ARTBOARD.map(a => `<button type="button" class="sw" data-group="artboard" data-value="${a.v}" aria-pressed="false">
          <span class="dot" style="background:${a.hex}"></span>
          <span class="tx">${a.label}<em>${a.sub}</em></span>
        </button>`).join('')}
      </div>
    </section>

    <section class="sec">
      <div class="sec-h"><span class="n">03</span><h2>라인타공 포인트</h2><span class="tag">1면 · 문 맞은편</span></div>
      <div class="sw-grid three">
        ${SLAT.map(s => `<button type="button" class="sw tight" data-group="slat" data-value="${s.v}" aria-pressed="false">
          <span class="dot" style="background:${s.hex}"></span>
          <span class="tx">${s.label}</span>
        </button>`).join('')}
      </div>
    </section>

    <section class="sec">
      <div class="sec-h"><span class="n">04</span><h2>조명</h2><span class="tag">기본 포함</span></div>
      <div class="seg">
        ${LIGHT.map(l => `<button type="button" data-group="light" data-value="${l.v}" aria-pressed="false">${l.label}</button>`).join('')}
      </div>
      <p class="note">라인타공 면 위 COB 매립등 + 중앙 LED등. 공간이 넓으면 레일등으로 길게 깝니다.</p>
    </section>

    <section class="sec">
      <div class="sec-h"><span class="n">05</span><h2>바닥 마루</h2><span class="tag">강화마루</span></div>
      <div class="sw-grid three">
        ${FLOOR.map(f => `<button type="button" class="sw tight" data-group="floor" data-value="${f.v}" aria-pressed="false">
          <span class="dot" style="background:${f.hex}"></span>
          <span class="tx">${f.label}</span>
        </button>`).join('')}
      </div>
    </section>

    <section class="sec">
      <div class="sec-h"><span class="n">06</span><h2>옵션</h2><span class="tag">견적서에 미리 표기</span></div>

      <div class="row" style="display:block;padding-top:0">
        <div class="rl" style="margin-bottom:8px"><b>문 위치</b><small>현장 동선에 맞춰 정면·좌측·우측 중에서</small></div>
        <div class="seg">
          ${DOORS.map(d => `<button type="button" data-group="door" data-value="${d.v}" aria-pressed="false">${d.label}</button>`).join('')}
        </div>
      </div>

      <div class="row" style="display:block">
        <div class="rl" style="margin-bottom:8px"><b>문 경첩</b><small>바깥에서 볼 때 경첩이 붙는 쪽 · 문은 바깥으로 열립니다</small></div>
        <div class="seg two">
          ${HINGES.map(h => `<button type="button" data-group="hinge" data-value="${h.v}" aria-pressed="false">${h.label}</button>`).join('')}
        </div>
      </div>

      <div class="row" style="display:block">
        <div class="rl" style="margin-bottom:8px"><b>벽면 시창 400×800</b><small>문 옆 벽에 세로로 넣는 창</small></div>
        <div class="seg three">
          ${WINDOWS.map(w => `<button type="button" data-group="window" data-value="${w.v}" aria-pressed="false">${w.label}</button>`).join('')}
        </div>
      </div>

      <div class="row" style="display:block">
        <div class="rl" style="margin-bottom:8px"><b>천장 프로젝트창</b><small>천장 시스템에어컨 바람을 부스 안으로</small></div>
        <div class="seg two">
          ${PROJECTS.map(p => `<button type="button" data-group="project" data-value="${p.v}" aria-pressed="false">${p.label}</button>`).join('')}
        </div>
      </div>

      <div class="row">
        <div class="rl"><b>에어컨 라인 벽체 매설</b><small>배관이 부스 밖으로 드러나지 않게</small></div>
        <button type="button" class="switch" id="swAc" role="switch" aria-checked="false" aria-label="에어컨 라인 벽체 매설"></button>
      </div>
    </section>

    <section class="sec" style="border-bottom:0">
      <div class="sec-h"><span class="n">07</span><h2>사양 요약</h2><span class="tag" id="sumCount"></span></div>
      <dl class="sum" id="sumList"></dl>
    </section>

    <div class="quote">
      <span class="lab">ESTIMATE</span>
      <div class="amt" id="quoteAmt">상담 시 확정</div>
      <p class="qnote" id="quoteNote"></p>
      <div class="inc">
        <b>기본 포함 6가지 — 따로 값을 받지 않습니다</b>
        <ul>${INCLUDED.map(i => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>${i}</li>`).join('')}</ul>
      </div>
      <p class="fine">금액은 실제 치수와 현장 조건(층수·이동 거리·창·프로젝트창 위치)을 확인한 뒤 견적서로 먼저 보여드립니다. 견적서에 없는 비용을 나중에 붙이지 않습니다.</p>
    </div>
  `;
  $('#slW').addEventListener('input', onSlide);
  $('#slD').addEventListener('input', onSlide);
  $('#swAc').addEventListener('click', () => { state.ac = !state.ac; syncUI(); rebuild(); });
  panel.addEventListener('click', onPanelClick);
}

function onPanelClick(e){
  const preset = e.target.closest('[data-preset]');
  if (preset){
    const p = PRESETS.find(x => x.id === preset.dataset.preset);
    if (p){ Object.assign(state, p.set); syncUI(); rebuild(); }
    return;
  }
  const btn = e.target.closest('[data-group]');
  if (!btn) return;
  const { group, value } = btn.dataset;
  if (group === 'model'){
    const m = MODELS.find(x => x.id === value);
    if (m){ state.model = m.id; state.w = m.w; state.d = m.d; syncUI(); rebuild(); }
    return;
  }
  if (group === 'window') state.window = value;
  else if (group === 'project') state.project = value;
  else state[group] = value;
  syncUI();
  rebuild();
}

function onSlide(){
  const w = +$('#slW').value, d = +$('#slD').value;
  const match = MODELS.find(m => m.w === w && m.d === d);
  state.model = match ? match.id : 'custom';
  state.w = w; state.d = d;
  syncUI();
  scheduleRebuild();
}

let rebuildRaf = 0;
function scheduleRebuild(){
  if (rebuildRaf) return;
  rebuildRaf = requestAnimationFrame(() => { rebuildRaf = 0; rebuild(); });
}

function modelName(){
  const m = MODELS.find(x => x.id === state.model);
  return m ? m.name : '직접 설정';
}
function dimText(){ return `${fmt(state.w)} × ${fmt(state.d)}`; }

/* ---- 사양 행 ---- */
function specRows(){
  const a = pick(ARTBOARD, state.artboard), s = pick(SLAT, state.slat);
  const l = pick(LIGHT, state.light), f = pick(FLOOR, state.floor);
  const d = pick(DOORS, state.door);
  const rows = [];
  rows.push({ k:'규격', v:`${modelName()} ${dimText()}`, chg:state.model === 'custom',
              chip:'', sub:`${((state.w/1000)*(state.d/1000)).toFixed(2)}㎡` });
  rows.push({ k:'아트보드', v:a.label, chg:state.artboard !== 'cream', chip:a.hex, sub:'3면' });
  rows.push({ k:'라인타공', v:s.label, chg:state.slat !== 'oak', chip:s.hex, sub:'1면' });
  rows.push({ k:'조명', v:(state.light === 'rail' ? '레일등' : `COB 매립등 ${l.temp}K`), chg:state.light !== 'cob3000', chip:'', sub:(state.light === 'rail' ? '대형 공간' : l.sub) });
  rows.push({ k:'바닥', v:f.label, chg:state.floor !== 'oak', chip:f.hex, sub:'강화마루' });
  rows.push({ k:'문', v:`${d.label} · ${state.hinge === 'right' ? '우경첩' : '좌경첩'}`, chg:(state.door !== 'front' || state.hinge !== 'right'), chip:'', sub:'시스템도어' });
  rows.push({ k:'시창', v:(state.window === 'none' ? '없음' : `400×800 ${state.window}개`), chg:state.window !== 'none', chip:'', sub:'' });
  rows.push({ k:'프로젝트창', v:(state.project === 'in' ? '포함' : '없음'), chg:state.project === 'in', chip:'', sub:'천장 개폐형' });
  rows.push({ k:'에어컨 라인', v:(state.ac ? '벽체 매설' : '미포함'), chg:state.ac, chip:'', sub:'' });
  return rows;
}

/* ---- 견적 ---- */
function priceItems(){
  const area = (state.w/1000)*(state.d/1000);
  const items = [
    { label:'기본 부스', value: PRICE.base[state.model] },
    { label:'아트보드', value: PRICE.artboard[state.artboard] },
    { label:'라인타공', value: PRICE.slat[state.slat] },
    { label:'조명', value: PRICE.light[state.light] },
    { label:'바닥', value: PRICE.floor[state.floor] },
    { label:'문 위치', value: PRICE.door[state.door] }
  ];
  if (PRICE.areaRate != null) items.push({ label:'면적', value: Math.round(area * PRICE.areaRate) });
  if (state.window === '1') items.push({ label:'시창 1개', value: PRICE.window1 });
  if (state.window === '2') items.push({ label:'시창 2개', value: PRICE.window2 });
  if (state.project === 'in') items.push({ label:'프로젝트창', value: PRICE.project });
  if (state.ac) items.push({ label:'에어컨 라인', value: PRICE.acLine });
  return items;
}
function totalPrice(){
  const items = priceItems();
  if (items.some(i => i.value == null)) return null;
  return items.reduce((s, i) => s + i.value, 0);
}

/* ---- UI 동기화 ---- */
function syncUI(){
  panel.querySelectorAll('[data-group]').forEach(b => {
    const on = state[b.dataset.group] === b.dataset.value;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.classList.toggle('on', on);
  });
  panel.querySelectorAll('[data-preset]').forEach(b => {
    const p = PRESETS.find(x => x.id === b.dataset.preset);
    const on = p && Object.keys(p.set).every(k => state[k] === p.set[k]);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  const swAc = $('#swAc');
  if (swAc) swAc.setAttribute('aria-checked', state.ac ? 'true' : 'false');

  const slW = $('#slW'), slD = $('#slD');
  if (slW && document.activeElement !== slW) slW.value = state.w;
  if (slD && document.activeElement !== slD) slD.value = state.d;
  if ($('#vlW')) $('#vlW').textContent = fmt(state.w);
  if ($('#vlD')) $('#vlD').textContent = fmt(state.d);
  if ($('#sizeTag')) $('#sizeTag').textContent = state.model === 'custom' ? '직접 설정' : '표준 예시';

  const dtBtn = $('#doorToggle');
  if (dtBtn){
    dtBtn.setAttribute('aria-pressed', state.open ? 'true' : 'false');
    dtBtn.textContent = state.open ? '문 닫기' : '문 열기';
  }
  if ($('#badgeModel')) $('#badgeModel').textContent = modelName();
  if ($('#badgeDim')) $('#badgeDim').textContent = dimText();

  const rows = specRows();
  const changed = rows.filter(r => r.chg).length;
  if ($('#sumCount')) $('#sumCount').textContent = changed ? `${changed}개 변경` : '기본 사양';
  if ($('#sumList')) $('#sumList').innerHTML = rows.map(r => `
    <div class="sum-row"><dt>${r.k}</dt><dd>
      <span class="chip">${r.chip ? `<i style="background:${r.chip}"></i>` : ''}${r.v}</span>
      ${r.sub ? `<span style="color:var(--muted);font-weight:600;font-size:10px">${r.sub}</span>` : ''}
      ${r.chg ? '<span class="chg">선택</span>' : ''}
    </dd></div>`).join('');

  const total = totalPrice();
  if ($('#quoteAmt')) $('#quoteAmt').innerHTML = total == null
    ? '상담 시 확정 <small>현장 조건 확인 후 견적서</small>'
    : `${fmt(total)}원 <span class="won">VAT 별도</span>`;
  if ($('#footPrice')) $('#footPrice').textContent = total == null ? '상담 시 확정' : `${fmt(total)}원`;
  if ($('#quoteNote')) $('#quoteNote').textContent = total == null
    ? `선택하신 사양 ${rows.length}개 항목과 기본 포함 6가지를 그대로 견적서에 반영합니다. 화면에 금액을 미리 정해 두지 않고, 사진과 설치 위치 확인 후 금액을 먼저 보여드립니다.`
    : '선택하신 사양 기준 예상 금액입니다. 실제 치수·층수·이동 거리에 따라 달라질 수 있습니다.';

  updateLegend();
  updateSpecText();
}

function updateLegend(){
  const a = pick(ARTBOARD, state.artboard), s = pick(SLAT, state.slat);
  const f = pick(FLOOR, state.floor), l = pick(LIGHT, state.light);
  const el = $('#legend');
  if (!el) return;
  el.innerHTML = `
    <span class="lg"><i style="background:${a.hex}"></i>아트보드 ${a.label}</span>
    <span class="lg"><i style="background:${s.hex}"></i>라인타공 ${s.label}</span>
    <span class="lg"><i style="background:${f.hex}"></i>마루 ${f.label}</span>
    <span class="lg"><i style="background:${state.light === 'rail' ? '#C9CDD1' : (l.temp === 3000 ? '#FFD8A8' : '#FFF1DC')}"></i>${state.light === 'rail' ? '레일등' : `COB ${l.temp}K`}</span>`;
}

/* ---- 사양 텍스트 (복사/전달) ---- */
function specTextValue(){
  const rows = specRows().filter(r => r.k !== '시창' || state.window !== 'none');
  const lines = [
    '[베오방음 신규 방음부스 · 3D 사양]',
    `규격: ${modelName()} 표준 ${dimText()} mm (내부 기준)`,
    ''
  ];
  const map = { '규격':'규격', '아트보드':'아트보드(3면)', '라인타공':'라인타공(1면)',
                '조명':'조명', '바닥':'바닥 마루', '문':'문 위치·경첩', '시창':'벽면 시창',
                '프로젝트창':'천장 프로젝트창', '에어컨 라인':'에어컨 라인' };
  rows.filter(r => r.k !== '규격').forEach(r => lines.push(`${map[r.k] || r.k}: ${r.v}`));
  lines.push('');
  lines.push(`기본 포함: ${INCLUDED.join(' · ')}`);
  lines.push('※ 금액은 실제 치수와 현장 조건 확인 후 견적서로 안내드립니다.');
  lines.push(`문의 ${PHONE}`);
  return lines.join('\n');
}
let currentSpec = '';
function updateSpecText(){
  currentSpec = specTextValue();
  const ta = $('#specText');
  if (ta) ta.value = currentSpec;
}

/* ---- CTA ---- */
function showToast(msg){
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('on'), 1800);
}
async function copySpec(){
  const text = currentSpec || specTextValue();
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err){
    const ta = $('#specText');
    if (ta){ ta.value = text; ta.select(); ta.setSelectionRange(0, text.length); }
    try { return document.execCommand('copy'); } catch (e){ return false; }
  }
}

function initActions(){
  const open = async () => {
    const ok = await copySpec();
    $('#specModal').classList.add('on');
    document.body.style.overflow = 'hidden';
    updateSpecText();
    if (!ok) showToast('아래 사양을 길게 눌러 복사해 주세요');
  };
  $('#ctaMain').addEventListener('click', open);
  $('#modalClose').addEventListener('click', () => {
    $('#specModal').classList.remove('on');
    document.body.style.overflow = '';
  });
  $('#specModal').addEventListener('click', (e) => {
    if (e.target === $('#specModal')){
      $('#specModal').classList.remove('on');
      document.body.style.overflow = '';
    }
  });
  $('#copyAgain').addEventListener('click', async () => {
    const ok = await copySpec();
    showToast(ok ? '사양을 복사했습니다' : '복사가 되지 않으면 사양을 직접 선택해 주세요');
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#specModal').classList.contains('on')){
      $('#specModal').classList.remove('on');
      document.body.style.overflow = '';
    }
  });

  document.querySelectorAll('.views button').forEach(b => {
    b.addEventListener('click', () => setView(b.dataset.view));
  });
  $('#resetView').addEventListener('click', () => setView(state.view, true));
  const dt = $('#doorToggle');
  if (dt) dt.addEventListener('click', () => {
    state.open = !state.open;
    syncUI();
  });
  $('#hsToggle').addEventListener('click', (e) => {
    const b = e.currentTarget;
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    hotspots.forEach(h => { if (!on) h.el.classList.remove('on'); });
    hotspotOn = on;
  });
}

/* ============================ [4] 3D ============================ */
const H = 2.0;        // 내부 높이(m)
const T = 0.11;       // 벽체 두께(m) — 모델링 값이며 화면에 수치로 표기하지 않음
const SKIN = 0.12;    // 천장 구조층
const WALL_TOP = H + SKIN;
const isSmall = () => matchMedia('(max-width:900px)').matches;

let renderer, scene, camera, pmrem, envRT;
let booth = null, parts = {};
const hotspotEls = [];
let hotspots = [];
let hotspotOn = true;

const stageEl = $('#stage');
const canvas = $('#scene');

/* ---- 텍스처 ---- */
const texCache = new Map();
let maxAniso = 4;

function rng(seed){
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hexToRgb(hex){
  const h = hex.replace('#','');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function shade(hex, amt){ // amt -1..1
  const [r,g,b] = hexToRgb(hex);
  const f = v => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255-v)*amt : v*(1+amt))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function makeTex(canvasEl, { rep = [1,1], srgb = true } = {}){
  const t = new THREE.CanvasTexture(canvasEl);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.anisotropy = maxAniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function woodTexture(base, grain, seed, planks = 8){
  const key = `wood:${base}:${grain}:${seed}:${planks}`;
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const g = c.getContext('2d');
  const rand = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  const rowH = 1024 / planks;
  const [gr, gg, gb] = hexToRgb(grain);
  for (let i = 0; i < planks; i++){
    const y = i * rowH;
    g.fillStyle = shade(base, (rand() * 2 - 1) * 0.09);
    g.fillRect(0, y, 1024, rowH);
    // 세로 결
    for (let k = 0; k < 90; k++){
      const gy = y + rand() * rowH;
      const dark = rand() < 0.62;
      const a = (0.03 + rand() * 0.07).toFixed(3);
      g.strokeStyle = dark ? `rgba(${gr},${gg},${gb},${a})` : `rgba(255,248,236,${(a * 0.9).toFixed(3)})`;
      g.lineWidth = 0.5 + rand() * 1.8;
      g.beginPath();
      g.moveTo(0, gy);
      let x = 0;
      while (x < 1024){
        x += 30 + rand() * 90;
        g.lineTo(x, gy + (rand() - 0.5) * 4);
      }
      g.stroke();
    }
    // 판 이음
    g.fillStyle = 'rgba(52,38,24,0.20)';
    g.fillRect(0, y + rowH - 1.6, 1024, 1.6);
    g.fillStyle = 'rgba(255,255,255,0.05)';
    g.fillRect(0, y + rowH - 2.8, 1024, 1.2);
    // 마구리
    const jx = 90 + rand() * 840;
    g.fillStyle = 'rgba(52,38,24,0.16)';
    g.fillRect(jx, y, 1.3, rowH);
  }
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

/* 아트보드 패브릭 — 회색조 맵 × 색상 */
function artboardMap(){
  const key = 'artboard-map';
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  const rand = rng(7);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 9000; i++){
    const x = rand() * 256, y = rand() * 512;
    g.fillStyle = `rgba(0,0,0,${(rand() * 0.035).toFixed(3)})`;
    g.fillRect(x, y, 1.2, 1.6 + rand() * 2);
  }
  // 패널 이음 (오른쪽 끝)
  g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(251, 0, 3, 512);
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(254, 0, 2, 512);
  // 상단 그림자
  const grad = g.createLinearGradient(0, 0, 0, 40);
  grad.addColorStop(0, 'rgba(0,0,0,0.10)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 251, 40);
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

/* 외부 백색 알판 — 0.6m 판 이음 */
function skinMap(){
  const key = 'skin-map';
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const rand = rng(11);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++){
    g.fillStyle = `rgba(0,0,0,${(rand() * 0.03).toFixed(3)})`;
    g.fillRect(rand() * 256, rand() * 256, 1, 1);
  }
  g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(253, 0, 3, 256);
  g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(250, 0, 2, 256);
  g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(0, 0, 256, 3);
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(0, 3, 256, 2);
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

/* 슬랫 세로 결 */
function slatTexture(base, grain, seed = 3){
  const key = `slat:${base}:${grain}`;
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = 64; c.height = 512;
  const g = c.getContext('2d');
  const rand = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 64, 512);
  const [gr, gg, gb] = hexToRgb(grain);
  for (let i = 0; i < 130; i++){
    const x = rand() * 64;
    g.strokeStyle = `rgba(${gr},${gg},${gb},${(0.02 + rand() * 0.09).toFixed(3)})`;
    g.lineWidth = 0.5 + rand() * 1.6;
    g.beginPath();
    g.moveTo(x, 0);
    let y = 0;
    while (y < 512){ y += 40 + rand() * 90; g.lineTo(x + (rand() - 0.5) * 2, y); }
    g.stroke();
  }
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

/* 빛 번짐 (가산) */
function glowTexture(){
  const key = 'glow';
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.24, 'rgba(255,240,215,0.55)');
  grad.addColorStop(1, 'rgba(255,230,190,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

/* 벽에 내려앉는 빛 (스캘럽) */
function scallopTexture(){
  const key = 'scallop';
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 512);
  const grad = g.createRadialGradient(128, 34, 6, 128, 40, 250);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.35, 'rgba(255,246,228,0.42)');
  grad.addColorStop(0.72, 'rgba(255,240,215,0.10)');
  grad.addColorStop(1, 'rgba(255,240,215,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(128, 40, 120, 300, 0, 0, Math.PI * 2);
  g.fill();
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

/* 접지 그림자 */
function contactTexture(){
  const key = 'contact';
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(256, 256, 20, 256, 256, 250);
  grad.addColorStop(0, 'rgba(8,10,12,0.72)');
  grad.addColorStop(0.4, 'rgba(8,10,12,0.4)');
  grad.addColorStop(0.72, 'rgba(8,10,12,0.12)');
  grad.addColorStop(1, 'rgba(8,10,12,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

function groundTexture(){
  const key = 'ground';
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(256, 256, 20, 256, 256, 250);
  grad.addColorStop(0, 'rgba(64,70,74,0.85)');
  grad.addColorStop(0.5, 'rgba(48,53,57,0.5)');
  grad.addColorStop(1, 'rgba(24,28,31,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

function envTexture(){
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#cfd8dc');
  grad.addColorStop(0.42, '#8f9a9f');
  grad.addColorStop(0.58, '#4a5155');
  grad.addColorStop(1, '#1b1f22');
  g.fillStyle = grad; g.fillRect(0, 0, 1024, 512);
  // 창밖 하이라이트
  const win = g.createRadialGradient(720, 150, 10, 720, 150, 210);
  win.addColorStop(0, 'rgba(255,255,255,0.95)');
  win.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = win; g.fillRect(0, 0, 1024, 400);
  const t = new THREE.Texture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/* ---- 씬 초기화 ---- */
function initScene(){
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall(), alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isSmall() ? 1.8 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  maxAniso = renderer.capabilities.getMaxAnisotropy();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

  pmrem = new THREE.PMREMGenerator(renderer);
  const envSrc = envTexture();
  envRT = pmrem.fromEquirectangular(envSrc);
  scene.environment = envRT.texture;
  envSrc.dispose();

  const hemi = new THREE.HemisphereLight(0xdfe8ec, 0x2b241d, 0.55);
  scene.add(hemi);
  scene.add(new THREE.AmbientLight(0xffffff, 0.16));

  const key = new THREE.DirectionalLight(0xfff3e2, 2.3);
  key.position.set(3.1, 3.5, 4.3);
  key.castShadow = true;
  key.shadow.mapSize.set(isSmall() ? 1024 : 2048, isSmall() ? 1024 : 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 16;
  key.shadow.camera.left = -3.6;
  key.shadow.camera.right = 3.6;
  key.shadow.camera.top = 4.2;
  key.shadow.camera.bottom = -1.2;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.022;
  scene.add(key);
  parts.keyLight = key;

  const rim = new THREE.DirectionalLight(0xbcd4e0, 0.9);
  rim.position.set(-4.5, 2.4, -3.6);
  scene.add(rim);

  const fillDir = new THREE.DirectionalLight(0xffffff, 0.55);
  fillDir.position.set(-2.6, 1.4, 4.2);
  scene.add(fillDir);

  // 바닥 접지 그림자 (배경은 CSS 그라데이션)
  parts.ground = null;

  // 내부 확인용 보조광
  const fill = new THREE.PointLight(0xfff0dd, 1.7, 8, 2);
  fill.position.set(0, 1.75, 0);
  scene.add(fill);
  parts.fillLight = fill;
}

/* ---- 재질 ---- */
function stdMat(opts){ return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.9, metalness: 0 }, opts)); }

function artboardMaterial(hex, rough){
  const map = artboardMap().clone();
  map.needsUpdate = true;
  map.userData._clone = true;
  map.repeat.set(1/0.9, 1/2.0);
  return stdMat({ color: new THREE.Color(hex), map, roughness: rough, metalness: 0.02, envMapIntensity: 0.55 });
}
function skinMaterial(){
  const map = skinMap().clone();   // UV가 m 단위 — 판 이음 간격(0.6m)을 직접 맞춥니다
  map.needsUpdate = true;
  map.userData._clone = true;
  map.repeat.set(1/0.6, 1/WALL_TOP);
  return stdMat({ color: 0xEDE9E1, map, roughness: 0.52, metalness: 0.02, envMapIntensity: 1.0 });
}
function coreMaterial(){ return stdMat({ color: 0xEDEAE2, roughness: 0.85 }); }
function glassMaterial(){
  return new THREE.MeshPhysicalMaterial({
    color: 0xC2CFD2, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.5,
    side: THREE.DoubleSide, envMapIntensity: 1.5, clearcoat: 1, clearcoatRoughness: 0.06
  });
}
function metalMat(){ return new THREE.MeshStandardMaterial({ color: 0xB9BDC1, metalness: 0.92, roughness: 0.28 }); }

/* ---- 벽 ---- */
function wallDesc(name){
  const W = state.w / 1000, D = state.d / 1000;
  switch (name){
    case 'front': return { rotY: Math.PI,    pos: [0, 0, D/2 + T/2],  width: W + 2*T, innerW: W };
    case 'back':  return { rotY: 0,          pos: [0, 0, -D/2 - T/2], width: W + 2*T, innerW: W };
    case 'left':  return { rotY: Math.PI/2,  pos: [-W/2 - T/2, 0, 0], width: D, innerW: D };
    case 'right': return { rotY: -Math.PI/2, pos: [W/2 + T/2, 0, 0],  width: D, innerW: D };
  }
}

/* 개구부가 있는 판재: 셀 분할 + 연속 UV 마감재 */
function buildWallGroup(name, openings, opts){
  const d = wallDesc(name);
  const g = new THREE.Group();
  g.rotation.y = d.rotY;
  g.position.set(d.pos[0], d.pos[1], d.pos[2]);
  g.name = 'wall:' + name;
  g.userData.wall = name;

  const w = d.width;
  const Y0 = -0.12;
  const core = coreMaterial();
  // 1) 셀 분할 코어
  const xs = [-w/2, w/2], ys = [Y0, WALL_TOP];
  openings.forEach(o => { xs.push(o.x0, o.x0 + o.w); ys.push(o.y0, o.y0 + o.h); });
  const ux = [...new Set(xs)].sort((a,b) => a-b);
  const uy = [...new Set(ys)].sort((a,b) => a-b);
  for (let i = 0; i < ux.length - 1; i++){
    for (let j = 0; j < uy.length - 1; j++){
      const cx0 = ux[i], cx1 = ux[i+1], cy0 = uy[j], cy1 = uy[j+1];
      const cw = cx1 - cx0, ch = cy1 - cy0;
      if (cw < 0.004 || ch < 0.004) continue;
      const inside = openings.some(o => cx0 >= o.x0 - 1e-4 && cx1 <= o.x0 + o.w + 1e-4 && cy0 >= o.y0 - 1e-4 && cy1 <= o.y0 + o.h + 1e-4);
      if (inside) continue;
      const m = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, T), core);
      m.position.set((cx0 + cx1)/2, (cy0 + cy1)/2, 0);
      m.castShadow = true; m.receiveShadow = true;
      g.add(m);
    }
  }

  // 2) 내부 / 외부 마감 (구멍 뚫린 판, UV는 m 단위)
  const shape = new THREE.Shape();
  shape.moveTo(-w/2, Y0); shape.lineTo(w/2, Y0); shape.lineTo(w/2, WALL_TOP); shape.lineTo(-w/2, WALL_TOP); shape.closePath();
  openings.forEach(o => {
    const p = new THREE.Path();
    p.moveTo(o.x0, o.y0); p.lineTo(o.x0, o.y0 + o.h); p.lineTo(o.x0 + o.w, o.y0 + o.h); p.lineTo(o.x0 + o.w, o.y0); p.closePath();
    shape.holes.push(p);
  });
  const faceGeo = new THREE.ShapeGeometry(shape, 8);

  if (!opts || !opts.noInner){
    const inner = new THREE.Mesh(faceGeo, artboardMaterial(opts.innerHex, opts.innerRough));
    inner.position.z = T/2 + 0.0012;
    inner.receiveShadow = true;
    g.add(inner);
    g.userData.inner = inner;
  }
  const outer = new THREE.Mesh(faceGeo, skinMaterial());
  outer.rotation.y = Math.PI;
  outer.position.z = -T/2 - 0.0012;
  outer.receiveShadow = true;
  g.add(outer);
  if (!opts || !opts.noInner) addBaseShadow(g, d.innerW, T/2 + 0.004);

  return g;
}

/* 구멍 뚫린 판(문짝 등) */
function holePanel(w, h, t, holes, mat){
  const grp = new THREE.Group();
  const xs = [-w/2, w/2], ys = [-h/2, h/2];
  holes.forEach(o => { xs.push(o.x0, o.x0 + o.w); ys.push(o.y0, o.y0 + o.h); });
  const ux = [...new Set(xs)].sort((a,b) => a-b);
  const uy = [...new Set(ys)].sort((a,b) => a-b);
  for (let i = 0; i < ux.length - 1; i++){
    for (let j = 0; j < uy.length - 1; j++){
      const cx0 = ux[i], cx1 = ux[i+1], cy0 = uy[j], cy1 = uy[j+1];
      const cw = cx1 - cx0, ch = cy1 - cy0;
      if (cw < 0.003 || ch < 0.003) continue;
      const inside = holes.some(o => cx0 >= o.x0 - 1e-4 && cx1 <= o.x0 + o.w + 1e-4 && cy0 >= o.y0 - 1e-4 && cy1 <= o.y0 + o.h + 1e-4);
      if (inside) continue;
      const m = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, t), mat);
      m.position.set((cx0 + cx1)/2, (cy0 + cy1)/2, 0);
      m.castShadow = true; m.receiveShadow = true;
      grp.add(m);
    }
  }
  return grp;
}

/* 창 */
function addWindow(parent, o, opts = {}){
  const g = new THREE.Group();
  const fw = 0.028, depth = T + 0.012;
  const frameMat = stdMat({ color: 0xF4F1EA, roughness: 0.55 });
  const gasket = stdMat({ color: 0x1B1D1F, roughness: 0.85 });
  const cx = o.x0 + o.w/2, cy = o.y0 + o.h/2;
  const bars = [
    [fw, o.h + fw*2, cx - o.w/2 - fw/2, cy],
    [fw, o.h + fw*2, cx + o.w/2 + fw/2, cy],
    [o.w, fw, cx, o.y0 - fw/2],
    [o.w, fw, cx, o.y0 + o.h + fw/2]
  ];
  bars.forEach(([bw, bh, bx, by]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, depth), frameMat);
    m.position.set(bx, by, 0);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  });
  const gas = new THREE.Mesh(new THREE.BoxGeometry(o.w + 0.01, o.h + 0.01, 0.02), gasket);
  gas.position.set(cx, cy, -0.02);
  g.add(gas);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(o.w - 0.006, o.h - 0.006), glassMaterial());
  glass.position.set(cx, cy, 0);
  g.add(glass);
  if (opts.project){ // 개폐형: 상단 힌지 + 손잡이
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, o.w * 0.86, 12), metalMat());
    hinge.rotation.z = Math.PI/2;
    hinge.position.set(cx, o.y0 + o.h - 0.03, 0.028);
    g.add(hinge);
    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.016, 0.016), metalMat());
    knob.position.set(cx, o.y0 + 0.05, 0.03);
    g.add(knob);
  }
  parent.add(g);
  return g;
}

/* 2구 콘센트 / 스위치 */
function addPlate(parent, x, y, kind){
  const g = new THREE.Group();
  const w = kind === 'outlet' ? 0.086 : 0.086;
  const h = kind === 'outlet' ? 0.155 : 0.09;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.008), stdMat({ color: 0xF7F5F0, roughness: 0.5 }));
  plate.position.set(x, y, 0.012);
  plate.castShadow = true;
  g.add(plate);
  if (kind === 'outlet'){
    [-0.036, 0.036].forEach(dy => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.038, 0.006), stdMat({ color: 0x2A2C2E, roughness: 0.85 }));
      s.position.set(x, y + dy, 0.017);
      g.add(s);
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, 0.004), stdMat({ color: 0xE8E4DA }));
      s2.position.set(x, y + dy, 0.019);
      g.add(s2);
    });
  } else {
    const tog = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.008), stdMat({ color: 0xF1EEE6, roughness: 0.45 }));
    tog.position.set(x, y, 0.017);
    g.add(tog);
  }
  parent.add(g);
}

/* ---- 슬랫 벽 ---- */
/* 바닥 접지 그라데이션 */
function baseShadowTexture(){
  const key = 'baseshadow';
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = 16; c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 128, 0, 0);
  grad.addColorStop(0, 'rgba(10,12,14,0.5)');
  grad.addColorStop(0.4, 'rgba(10,12,14,0.18)');
  grad.addColorStop(1, 'rgba(10,12,14,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 16, 128);
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

function addBaseShadow(parent, width, zFront){
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.02, 0.2),
    new THREE.MeshBasicMaterial({ map: baseShadowTexture(), transparent: true, depthWrite: false, opacity: 0.9 })
  );
  m.position.set(0, 0.1, zFront);
  m.renderOrder = 1;
  parent.add(m);
}

function buildSlatWall(g, width, hex, grain){
  const inner = new THREE.Group();
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.006, WALL_TOP),
    stdMat({ color: 0x121417, roughness: 0.95 })
  );
  plate.position.set(0, WALL_TOP / 2, T/2 + 0.004);
  plate.receiveShadow = true;
  inner.add(plate);

  const slatW = 0.05, gap = 0.009, step = slatW + gap;
  const usable = width - 0.044;
  const count = Math.max(2, Math.floor(usable / step));
  const total = count * step - gap;
  const x0 = -total/2 + slatW/2;
  const baseColor = new THREE.Color(hex).lerp(new THREE.Color(0xF6F2EA), 0.05);
  const mat = stdMat({
    color: baseColor,
    map: slatTexture(hex, grain),
    roughness: hex === '#EBE7DE' ? 0.6 : 0.7,
    metalness: 0.03,
    envMapIntensity: 0.5
  });
  const y0 = 0.03, y1 = WALL_TOP - 0.006;
  const geo = new THREE.BoxGeometry(slatW, y1 - y0, 0.022);
  const inst = new THREE.InstancedMesh(geo, mat, count);
  inst.castShadow = true;
  inst.receiveShadow = true;
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < count; i++){
    m4.makeTranslation(x0 + i * step, (y0 + y1)/2, T/2 + 0.014);
    inst.setMatrixAt(i, m4);
  }
  inst.instanceMatrix.needsUpdate = true;
  inner.add(inst);

  g.add(inner);
  g.userData.slatInst = inst;
  addBaseShadow(inner, width, T/2 + 0.028);
  return inner;
}

/* ---- 조명 ---- */
function lightColor(){
  return state.light === 'cob4000' ? 0xFFF4E2 : 0xFFD4A6;
}

function addFixture(x, y, z, opts = {}){
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const bezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.056, 0.016, 26, 1, true),
    stdMat({ color: 0x2C2F33, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide })
  );
  g.add(bezel);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.042, 26),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: lightColor(), emissiveIntensity: opts.rail ? 3.4 : 2.9, roughness: 0.4 })
  );
  disc.rotation.x = Math.PI / 2;
  disc.position.y = -0.009;
  g.add(disc);
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.34),
    new THREE.MeshBasicMaterial({ map: glowTexture(), color: lightColor(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.4 })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = -0.02;
  halo.renderOrder = 2;
  g.add(halo);
  g.userData.disc = disc;
  g.userData.halo = halo;
  return g;
}

/* ---- 부스 생성 ---- */
function rebuild(){
  if (!scene) return;
  if (booth){
    scene.remove(booth);
    booth.traverse(o => {
      if (o.geometry && !o.geometry.userData._keep) o.geometry.dispose();
      if (o.material){
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(m => {
          if (m.map && m.map.userData._clone) m.map.dispose();
          m.dispose();
        });
      }
    });
  }
  clearHotspots();
  booth = new THREE.Group();
  parts = { keyLight: parts.keyLight, fillLight: parts.fillLight };

  const W = state.w/1000, D = state.d/1000;
  const doorName = state.door;
  const slatName = { front:'back', left:'right', right:'left' }[doorName];
  const perp = { front:['left','right'], left:['front','back'], right:['front','back'] }[doorName];

  const doorX0 = -0.43, doorW = 0.86;
  const doorOpen = { x0: doorX0, y0: 0, w: doorW, h: H };
  const winOpen = { x0: -0.2, y0: 1.08, w: 0.4, h: 0.8 };

  const walls = {};
  ['front','back','left','right'].forEach(name => {
    const openings = [];
    if (name === doorName) openings.push(doorOpen);
    if (perp.includes(name)){
      if (state.window === '1' && name === perp[0]) openings.push(winOpen);
      if (state.window === '2') openings.push(winOpen);
    }
    const isSlat = name === slatName;
    const g = buildWallGroup(name, openings, isSlat ? { noInner: true } : {
      innerHex: pick(ARTBOARD, state.artboard).hex,
      innerRough: pick(ARTBOARD, state.artboard).rough
    });
    booth.add(g);
    walls[name] = g;
    if (isSlat){
      const sw = wallDesc(name).innerW;
      buildSlatWall(g, sw, pick(SLAT, state.slat).hex, pick(SLAT, state.slat).grain);
      g.userData.slatWall = true;
    }
    if (openings.some(o => o === winOpen)) addWindow(g, winOpen, {});
  });

  // 문
  const doorWall = walls[doorName];
  buildDoor(doorWall, doorOpen, slatName);
  parts.doorWall = doorWall;

  // 바닥
  const floorHex = pick(FLOOR, state.floor).hex;
  const floorGrain = pick(FLOOR, state.floor).grain;
  const floorTex = woodTexture(floorHex, floorGrain, 5).clone();
  floorTex.needsUpdate = true;
  floorTex.userData._clone = true;
  floorTex.repeat.set((W + 2*T)/1.2, (D + 2*T)/1.2);
  const floorMat = stdMat({ color: 0xffffff, map: floorTex, roughness: 0.42, metalness: 0.02, envMapIntensity: 0.55 });
  const edgeMat = stdMat({ color: 0xE9E5DC, roughness: 0.8 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W + 2*T - 0.06, 0.12, D + 2*T - 0.06), [edgeMat, edgeMat, floorMat, edgeMat, edgeMat, edgeMat]);
  floor.position.y = -0.06;
  floor.receiveShadow = true; floor.castShadow = true;
  booth.add(floor);

  // 접지 그림자
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.5 + 0.5, D * 1.5 + 0.5),
    new THREE.MeshBasicMaterial({ map: contactTexture(), transparent: true, depthWrite: false, opacity: 0.5 })
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -0.13;
  contact.renderOrder = -1;
  booth.add(contact);

  // 천장
  const ceilArt = artboardMaterial(pick(ARTBOARD, state.artboard).hex, pick(ARTBOARD, state.artboard).rough);
  ceilArt.map = ceilArt.map.clone();
  ceilArt.map.userData._clone = true;
  ceilArt.map.needsUpdate = true;
  ceilArt.map.repeat.set(W/0.9, D/0.9);
  const ceilGroup = new THREE.Group();
  booth.add(ceilGroup);
  parts.ceiling = ceilGroup;

  // 천장 테두리 — 컷어웨이에서 천장선을 잡아 주는 얇은 프레임
  const cf = new THREE.Group();
  const cfMat = stdMat({ color: 0xE9E5DC, roughness: 0.6 });
  const cfBars = [];
  if (doorName !== 'back')   cfBars.push([W, 0.035, 0.04, 0, -(D/2 - 0.02)]);
  if (doorName !== 'front')  cfBars.push([W, 0.035, 0.04, 0, D/2 - 0.02]);
  if (doorName !== 'left')   cfBars.push([0.04, 0.035, D - 0.08, -(W/2 - 0.02), 0]);
  if (doorName !== 'right')  cfBars.push([0.04, 0.035, D - 0.08, W/2 - 0.02, 0]);
  cfBars.forEach(([bw, bh, bd, bx, bz]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), cfMat);
    m.position.set(bx, H - 0.018, bz);
    cf.add(m);
  });
  booth.add(cf);
  parts.ceilFrame = cf;
  const projHole = state.project === 'in' ? { x0: -0.3, z0: 0.04, w: 0.6, d: 0.6 } : null;
  buildCeilingSlab(ceilGroup, W, D, projHole, ceilArt);
  if (projHole) addProjectWindow(ceilGroup, projHole);

  parts.cap = null;
  if (!projHole){
    const cap = new THREE.Mesh(new THREE.BoxGeometry(W + 2*T, 0.02, D + 2*T), skinMaterial());
    cap.position.set(0, WALL_TOP + 0.01, 0);
    cap.castShadow = true; cap.receiveShadow = true;
    booth.add(cap);
    parts.cap = cap;
  }

  // 조명
  buildLights(walls[slatName], slatName);

  // 콘센트 · 스위치
  if (walls[slatName]){
    const sw = wallDesc(slatName).innerW;
    addPlate(walls[slatName], Math.min(sw/2 - 0.3, sw * 0.2), 0.3, 'outlet');
  }
  addPlate(doorWall, doorX0 - 0.13, 1.14, 'switch');

  // 에어컨 라인 매설 표시
  if (state.ac){
    const aw = perp[0];
    const aw2 = walls[aw];
    const sw = wallDesc(aw).innerW;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.13, 0.01), stdMat({ color: 0xF4F1E9, roughness: 0.5 }));
    plate.position.set(sw * 0.3, 1.88, T/2 + 0.008);
    aw2.add(plate);
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.12, 0.004), stdMat({ color: 0xD9D3C6, roughness: 0.9 }));
    groove.position.set(sw * 0.3, 1.985, T/2 + 0.006);
    aw2.add(groove);
  }

  // 시점 안내 · 치수
  booth.updateMatrixWorld(true);
  buildHotspots(walls, slatName, doorName, perp);
  buildDimensions(W, D);
  applyViewState();
  scene.add(booth);
  fitCamera(false);
}

/* ---- 문 (바깥으로 열림 · 좌/우경첩) ---- */
function buildDoor(g, o, slatName){
  const gasket = stdMat({ color: 0x141618, roughness: 0.9 });
  const white = stdMat({ color: 0xFAF7F0, roughness: 0.46 });
  const zc = T/2;

  // 문틀
  const jamb = 0.045;
  [[o.x0 - jamb/2, (o.h)/2, jamb, o.h + 0.02],
   [o.x0 + o.w + jamb/2, (o.h)/2, jamb, o.h + 0.02],
   [o.x0 + o.w/2, o.h - jamb/2, o.w + jamb*2, jamb]].forEach(([x, y, w, h]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, T + 0.014), white);
    m.position.set(x, y, 0);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  });
  // 기밀 스트립
  [[o.x0 + 0.012, o.h/2, 0.012, o.h], [o.x0 + o.w - 0.012, o.h/2, 0.012, o.h], [o.x0 + o.w/2, o.h - 0.012, o.w, 0.012]].forEach(([x,y,w,h]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.026), gasket);
    m.position.set(x, y, zc - 0.02);
    g.add(m);
  });

  // 상부 트랜섬
  const transH = 0.15;
  const trans = new THREE.Mesh(new THREE.BoxGeometry(o.w - 0.012, transH, 0.048), white);
  trans.position.set(o.x0 + o.w/2, o.h - transH/2 - 0.006, zc - 0.026);
  trans.castShadow = true; trans.receiveShadow = true;
  g.add(trans);
  const tGasket = new THREE.Mesh(new THREE.BoxGeometry(o.w - 0.01, 0.01, 0.03), gasket);
  tGasket.position.set(o.x0 + o.w/2, o.h - transH - 0.011, zc - 0.026);
  g.add(tGasket);

  // 문짝 — 경첩 쪽을 축으로 바깥으로 열립니다
  const hingeRight = state.hinge === 'right';
  const dir = hingeRight ? -1 : 1;             // 축에서 문짝이 뻗는 방향
  const pivotX = hingeRight ? (o.x0 + o.w - 0.015) : (o.x0 + 0.015);
  const leafW = o.w - 0.03, leafH = o.h - transH - 0.05;
  const pivot = new THREE.Group();
  pivot.position.set(pivotX, 0.012, zc - 0.03);
  g.add(pivot);

  const glassW = 0.34, glassH = 1.22;
  const holes = [{ x0: dir * 0.03 - glassW/2, y0: -leafH/2 + 0.36, w: glassW, h: glassH }];
  const leaf = holePanel(leafW, leafH, 0.046, holes, white);
  leaf.position.set(dir * leafW/2, leafH/2, 0);
  pivot.add(leaf);

  const glassY = 0.012 + 0.36 + glassH/2;   // 문짝 하단 + 0.36m 지점
  const gFrame = new THREE.Mesh(new THREE.BoxGeometry(glassW + 0.02, glassH + 0.02, 0.022), gasket);
  gFrame.position.set(dir * 0.03, glassY, 0);
  pivot.add(gFrame);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(glassW - 0.004, glassH - 0.004), glassMaterial());
  glass.position.set(dir * 0.03, glassY, 0.002);
  pivot.add(glass);
  const glass2 = glass.clone();
  glass2.position.z = -0.002;
  pivot.add(glass2);

  // 손잡이 (경첩 반대쪽)
  const handle = new THREE.Group();
  const hx = dir * (leafW - 0.085);
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 18), metalMat());
  rose.rotation.x = Math.PI/2;
  rose.position.set(hx, 1.02, 0.03);
  handle.add(rose);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.018, 0.022), metalMat());
  lever.position.set(dir * (leafW - 0.135), 1.02, 0.045);
  handle.add(lever);
  const rose2 = rose.clone(); rose2.position.z = -0.03;
  handle.add(rose2);
  const lever2 = lever.clone(); lever2.position.z = -0.045;
  handle.add(lever2);
  pivot.add(handle);

  // 경첩
  [0.3, 1.0, 1.68].forEach(y => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.1, 0.02), metalMat());
    h.position.set(dir * 0.004, y, -0.012);
    pivot.add(h);
  });

  pivot.userData.dir = dir;
  pivot.rotation.y = state.open ? dir * DOOR_OPEN : 0;
  g.userData.doorPivot = pivot;
  parts.doorPivot = pivot;
}

/* ---- 천장 ---- */
function buildCeilingSlab(parent, W, D, hole, bottomMat){
  const white = skinMaterial();
  const mats = [white, white, white, bottomMat, white, white];
  const cells = [];
  if (!hole) cells.push([-W/2, W/2, -D/2, D/2]);
  else {
    const { x0, z0, w, d } = hole, x1 = x0 + w, z1 = z0 + d;
    cells.push([-W/2, x0, -D/2, D/2]);
    cells.push([x1, W/2, -D/2, D/2]);
    cells.push([x0, x1, -D/2, z0]);
    cells.push([x0, x1, z1, D/2]);
  }
  cells.forEach(([cx0, cx1, cz0, cz1]) => {
    const cw = cx1 - cx0, cd = cz1 - cz0;
    if (cw < 0.004 || cd < 0.004) return;
    const m = new THREE.Mesh(new THREE.BoxGeometry(cw, SKIN, cd), mats);
    m.position.set((cx0 + cx1)/2, H + SKIN/2, (cz0 + cz1)/2);
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m);
  });
}

function addProjectWindow(parent, h){
  const g = new THREE.Group();
  const cx = h.x0 + h.w/2, cz = h.z0 + h.d/2;
  const fw = 0.028, depth = SKIN + 0.02;
  const frameMat = stdMat({ color: 0xF4F1EA, roughness: 0.55 });
  const y = H + SKIN/2;
  [[h.w + fw*2, fw, cx, h.z0 - fw/2], [h.w + fw*2, fw, cx, h.z0 + h.d + fw/2],
   [fw, h.d, h.x0 - fw/2, cz], [fw, h.d, h.x0 + h.w + fw/2, cz]].forEach(([bw, bd, bx, bz]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, depth, bd), frameMat);
    m.position.set(bx, y, bz);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(h.w - 0.012, h.d - 0.012), glassMaterial());
  glass.rotation.x = Math.PI / 2;
  glass.position.set(cx, y, cz);
  g.add(glass);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, h.w * 0.8, 12), metalMat());
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(cx, H + SKIN - 0.024, h.z0 + 0.02);
  g.add(hinge);
  const knob = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.013, 0.013), metalMat());
  knob.position.set(cx, H + 0.008, h.z0 + h.d - 0.07);
  g.add(knob);
  parent.add(g);
  parts.projectAnchor = new THREE.Vector3(cx, H + 0.03, cz);
  return g;
}

/* ---- 조명 설치 (슬랫 벽 로컬 좌표계) ---- */
function buildLights(slatWall, slatName){
  if (!slatWall) return;
  const w = wallDesc(slatName).innerW;
  const inward = new THREE.Vector3(0, 0, 1).applyQuaternion(slatWall.quaternion);
  const group = new THREE.Group();
  group.position.copy(slatWall.position).addScaledVector(inward, T/2);
  group.quaternion.copy(slatWall.quaternion);
  booth.add(group);
  parts.lightGroup = group;

  const n = w > 2.2 ? 3 : 2;
  const spread = Math.min(w * 0.56, 1.6);

  if (state.light === 'rail'){
    const railLen = Math.max(1.1, w - 0.5);
    const zRail = 0.42;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(railLen, 0.032, 0.032), stdMat({ color: 0x24272A, roughness: 0.38, metalness: 0.72 }));
    bar.position.set(0, H - 0.045, zRail);
    bar.castShadow = true;
    group.add(bar);
    const spots = [];
    for (let i = 0; i < 3; i++){
      const x = (i / 2 - 0.5) * (railLen - 0.4);
      const head = new THREE.Group();
      head.position.set(x, H - 0.075, zRail);
      head.rotation.x = -0.32;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.095, 20), stdMat({ color: 0x26292C, roughness: 0.42, metalness: 0.6 }));
      body.castShadow = true;
      head.add(body);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.033, 20), new THREE.MeshStandardMaterial({ color: 0x101010, emissive: lightColor(), emissiveIntensity: 3.6 }));
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = -0.05;
      head.add(disc);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.46), new THREE.MeshBasicMaterial({ map: glowTexture(), color: lightColor(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }));
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = -0.07;
      halo.renderOrder = 2;
      head.add(halo);
      group.add(head);
      spots.push(new THREE.Vector3(x, H - 0.09, zRail));
    }
    [-1, 1].forEach((side, idx) => {
      const sp = new THREE.SpotLight(lightColor(), 8.5, 6, 0.72, 0.9, 1.6);
      sp.position.set(side * (railLen * 0.3), H - 0.1, zRail);
      sp.target.position.set(side * (railLen * 0.3), 0.6, 0.1);
      sp.castShadow = idx === 0 && !isSmall();
      sp.shadow.mapSize.set(1024, 1024);
      sp.shadow.bias = -0.0012;
      group.add(sp); group.add(sp.target);
    });
    // 레일 아래 바닥 웅덩이
    [-1, 1].forEach(side => {
      const pool = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.9),
        new THREE.MeshBasicMaterial({ map: glowTexture(), color: lightColor(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.16 })
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(side * (railLen * 0.3), 0.02, zRail);
      group.add(pool);
    });
    parts.lightAnchor = new THREE.Vector3(0, H - 0.06, zRail);
  } else {
    for (let i = 0; i < n; i++){
      const t = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread;
      const fx = addFixture(t, H - 0.008, 0.19, {});
      group.add(fx);
      const scallop = new THREE.Mesh(
        new THREE.PlaneGeometry(0.46, 1.8),
        new THREE.MeshBasicMaterial({ map: scallopTexture(), color: lightColor(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.34 })
      );
      scallop.position.set(t, 1.05, 0.055);
      scallop.renderOrder = 2;
      group.add(scallop);

      const sp = new THREE.SpotLight(lightColor(), 7.4, 4.8, 0.55, 0.9, 1.6);
      sp.position.set(t, H - 0.03, 0.19);
      sp.target.position.set(t, 1.28, 0.02);
      sp.castShadow = i === 1 && !isSmall();
      sp.shadow.mapSize.set(1024, 1024);
      sp.shadow.bias = -0.0014;
      sp.shadow.normalBias = 0.02;
      group.add(sp); group.add(sp.target);
      if (i === Math.floor(n/2)) parts.lightAnchor = new THREE.Vector3(t, H - 0.06, 0.19);
    }
    const panel = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.028, 0.46), stdMat({ color: 0xE3DFD6, roughness: 0.55, metalness: 0.1 }));
    rim.position.set(0, H - 0.016, 0);
    panel.add(rim);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.43, 0.43), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFF8EC, emissiveIntensity: 1.9, roughness: 0.5 }));
    face.rotation.x = Math.PI / 2;
    face.position.set(0, H - 0.03, 0);
    panel.add(face);
    group.add(panel);
    if (!parts.lightAnchor) parts.lightAnchor = new THREE.Vector3(0, H - 0.06, 0.19);
  }
}

/* ---- 치수선 ---- */
let dimGroup = null;
function spriteLabel(text){
  const c = document.createElement('canvas');
  c.width = 384; c.height = 96;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 384, 96);
  g.font = '600 46px Pretendard, "Apple SD Gothic Neo", system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(246,243,236,0.92)';
  g.fillText(text, 192, 50);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false });
  const s = new THREE.Sprite(m);
  s.scale.set(0.78, 0.195, 1);
  s.renderOrder = 5;
  return s;
}
function buildDimensions(W, D){
  const g = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: 0xE9E4D8, transparent: true, opacity: 0.55 });
  const y = 0.012;
  const off = 0.34;
  const zf = D/2 + T + off;
  const xl = -W/2 - T - off;
  const p = (x, z) => new THREE.Vector3(x, y, z);
  const seg = (a, b) => {
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    g.add(new THREE.Line(geo, mat));
  };
  // 정면 폭
  seg(p(-W/2 - T, zf), p(W/2 + T, zf));
  seg(p(-W/2 - T, zf - 0.07), p(-W/2 - T, zf + 0.03));
  seg(p(W/2 + T, zf - 0.07), p(W/2 + T, zf + 0.03));
  const l1 = spriteLabel(fmt(state.w) + ' mm');
  l1.position.set(0, y + 0.02, zf + 0.15);
  g.add(l1);
  // 측면 깊이
  seg(p(xl, -D/2 - T), p(xl, D/2 + T));
  seg(p(xl - 0.07, -D/2 - T), p(xl + 0.03, -D/2 - T));
  seg(p(xl - 0.07, D/2 + T), p(xl + 0.03, D/2 + T));
  const l2 = spriteLabel(fmt(state.d) + ' mm');
  l2.position.set(xl - 0.17, y + 0.02, 0);
  g.add(l2);
  booth.add(g);
  dimGroup = g;
}

/* ---- 부위 안내 ---- */
function addHotspot(pos, label, scope = 'all'){
  const el = document.createElement('div');
  el.className = 'hs';
  el.innerHTML = `<i></i><span>${label}</span>`;
  $('#hsLayer').appendChild(el);
  hotspots.push({ el, pos, scope });
}
function clearHotspots(){
  hotspots.forEach(h => h.el.remove());
  hotspots = [];
}
function buildHotspots(walls, slatName, doorName, perp){
  const slat = walls[slatName];
  if (slat){
    const inward = new THREE.Vector3(0,0,1).applyQuaternion(slat.quaternion);
    addHotspot(slat.position.clone().addScaledVector(inward, 0.16).setY(1.52), '1면 라인타공', 'in');
  }
  if (parts.lightGroup && parts.lightAnchor){
    addHotspot(parts.lightGroup.localToWorld(parts.lightAnchor.clone()), state.light === 'rail' ? '레일등' : 'COB 매립등', 'in');
  }
  const dw = walls[doorName];
  if (dw){
    addHotspot(dw.localToWorld(new THREE.Vector3(0, 1.25, 0.06)), '시스템도어', 'out');
  }
  if (state.window !== 'none'){
    const wv = walls[perp[0]];
    if (wv) addHotspot(wv.localToWorld(new THREE.Vector3(0, 1.52, 0.06)), '시창 400×800');
  }
  if (state.project === 'in' && parts.projectAnchor) addHotspot(parts.projectAnchor.clone(), '프로젝트창', 'in');
  if (state.ac){
    const aw = walls[perp[0]];
    const sw = wallDesc(perp[0]).innerW;
    if (aw) addHotspot(aw.localToWorld(new THREE.Vector3(sw * 0.3, 1.9, 0.05)), '에어컨 라인 매설', 'in');
  }
}

/* ---- 시점 ---- */
const cam = { theta: 0.62, phi: 1.14, r: 6, ty: 0.9, fov: 38 };
const camTarget = { ...cam };
let camAnim = 0;
let dragging = false;

function aspectFactor(){
  const a = camera.aspect;
  return a >= 1 ? 1 : Math.pow(1/a, 0.86);
}
function viewSettings(name){
  const W = state.w/1000, D = state.d/1000;
  const S = Math.hypot(W, D) * 0.94;
  const doorTheta = pick(DOORS, state.door).theta;
  const base = (S * 2.7 + 1.4) * aspectFactor() * (isSmall() ? 0.84 : 1);
  switch (name){
    case 'interior': return { theta: doorTheta + 0.34, phi: 1.06, r: base * 0.80, ty: 0.96, fov: 44 };
    case 'door':     return { theta: doorTheta + 0.14, phi: 1.44, r: base * 1.1, ty: 1.1, fov: 28 };
    case 'top':      return { theta: doorTheta + 0.45, phi: 0.20, r: base * 0.98, ty: 0.35, fov: 36 };
    default:         return { theta: doorTheta + 0.62, phi: 1.13, r: base * 1.0, ty: 0.92, fov: 38 };
  }
}
function setView(name, force = false){
  state.view = name;
  document.querySelectorAll('.views button').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === name ? 'true' : 'false'));
  const v = viewSettings(name);
  camTarget.theta = v.theta; camTarget.phi = v.phi; camTarget.r = v.r; camTarget.ty = v.ty; camTarget.fov = v.fov;
  if (force){
    cam.theta = v.theta; cam.phi = v.phi; cam.r = v.r; cam.ty = v.ty; cam.fov = v.fov;
    camAnim = 0;
  } else {
    camAnim = performance.now();
  }
  applyViewState();
}
function fitCamera(immediate){
  if (!camera) return;
  const v = viewSettings(state.view);
  camTarget.r = v.r; camTarget.ty = v.ty;
  if (immediate){ cam.r = v.r; cam.ty = v.ty; }
}
function updateCameraState(){
  cam.phi = Math.max(0.08, Math.min(1.52, cam.phi));
  const v = cam;
  const sp = Math.sin(v.phi);
  camera.position.set(
    Math.sin(v.theta) * sp * v.r,
    v.ty + Math.cos(v.phi) * v.r,
    Math.cos(v.theta) * sp * v.r
  );
  camera.lookAt(0, v.ty, 0);
  if (Math.abs(camera.fov - cam.fov) > 0.01){
    camera.fov += (cam.fov - camera.fov) * 0.2;
    camera.updateProjectionMatrix();
  }
}
function applyViewState(){
  if (!parts.doorWall) return;
  const interior = state.view === 'interior';
  const top = state.view === 'top';
  const open = interior || top;
  if (parts.ceiling) parts.ceiling.visible = !open;
  if (parts.cap) parts.cap.visible = !open;
  if (parts.ceilFrame) parts.ceilFrame.visible = open;
  parts.doorWall.visible = !interior;
  if (dimGroup) dimGroup.visible = top;
  if (parts.lightGroup) parts.lightGroup.visible = true;
  if (parts.fillLight) parts.fillLight.intensity = interior ? 1.9 : 1.4;
}
function setGhost(root, on){
  root.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach(m => {
      if (!m.userData._orig){
        m.userData._orig = { opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite };
      }
      if (on){
        m.transparent = true;
        m.opacity = (m.userData._orig.opacity ?? 1) * 0.1;
        m.depthWrite = false;
        o.castShadow = false;
        o.renderOrder = 3;
      } else {
        m.transparent = m.userData._orig.transparent;
        m.opacity = m.userData._orig.opacity;
        m.depthWrite = m.userData._orig.depthWrite;
        o.castShadow = true;
        o.renderOrder = 0;
      }
      m.needsUpdate = true;
    });
  });
}

/* ---- 입력 ---- */
function initControls(){
  const pointers = new Map();
  let lastDist = 0;

  stageEl.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.views, .stage-foot, a, button')) return;
    stageEl.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragging = true;
    camAnim = 0;
  });
  stageEl.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1){
      cam.theta -= dx * 0.0075;
      cam.phi -= dy * 0.0065;
      cam.thetaManual = true;
    } else if (pointers.size === 2){
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastDist){
        const k = lastDist / dist;
        cam.r = clampR(cam.r * k);
        camTarget.r = cam.r;
      }
      lastDist = dist;
    }
  });
  const end = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) lastDist = 0;
    if (pointers.size === 0) dragging = false;
  };
  stageEl.addEventListener('pointerup', end);
  stageEl.addEventListener('pointercancel', end);
  stageEl.addEventListener('pointerleave', (e) => { if (e.buttons === 0) end(e); });

  stageEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    camAnim = 0;
    cam.r = clampR(cam.r * Math.exp(e.deltaY * 0.0011));
    camTarget.r = cam.r;
  }, { passive: false });

  addEventListener('resize', onResize);
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(stageEl);
}
function clampR(r){
  const v = viewSettings(state.view);
  return Math.max(v.r * 0.45, Math.min(v.r * 1.9, r));
}
let resizeRaf = 0;
function onResize(){
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0;
    const w = stageEl.clientWidth, h = stageEl.clientHeight;
    if (!w || !h || !renderer) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fitCamera(true);
  });
}

/* ---- 루프 ---- */
const tmpV = new THREE.Vector3();
let firstFrame = true;
function tick(){
  requestAnimationFrame(tick);
  if (camAnim){
    const t = Math.min(1, (performance.now() - camAnim) / 850);
    const e = 1 - Math.pow(1 - t, 3);
    cam.theta += (camTarget.theta - cam.theta) * (0.08 + e * 0.2);
    cam.phi += (camTarget.phi - cam.phi) * (0.08 + e * 0.2);
    cam.r += (camTarget.r - cam.r) * (0.08 + e * 0.2);
    cam.ty += (camTarget.ty - cam.ty) * (0.08 + e * 0.2);
    cam.fov += (camTarget.fov - cam.fov) * (0.08 + e * 0.2);
    if (t >= 1) camAnim = 0;
  }
  updateCameraState();
  if (parts.doorPivot){
    const pv = parts.doorPivot;
    const target = state.open ? pv.userData.dir * DOOR_OPEN : 0;
    if (Math.abs(pv.rotation.y - target) > 0.0015) pv.rotation.y += (target - pv.rotation.y) * 0.16;
  }
  if (renderer) renderer.render(scene, camera);
  updateHotspots();
  if (firstFrame && renderer){
    firstFrame = false;
    const l = $('#stageLoad');
    if (l) l.classList.add('off');
  }
}
function updateHotspots(){
  if (!camera) return;
  const w = stageEl.clientWidth, h = stageEl.clientHeight;
  const view = state.view;
  const show = hotspotOn && view !== 'top';
  hotspots.forEach(hs => {
    const scoped = hs.scope === 'all' || (hs.scope === 'in' && view === 'interior') || (hs.scope === 'out' && view !== 'interior');
    if (!show || !scoped){ hs.el.classList.remove('on'); return; }
    tmpV.copy(hs.pos).project(camera);
    if (tmpV.z > 1){ hs.el.classList.remove('on'); return; }
    const x = (tmpV.x * 0.5 + 0.5) * w;
    const y = (-tmpV.y * 0.5 + 0.5) * h;
    if (x < -40 || x > w + 40 || y < -20 || y > h + 20){ hs.el.classList.remove('on'); return; }
    hs.el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    hs.el.classList.add('on');
  });
}

/* ---- 시작 ---- */
function start(){
  try {
    if (!window.WebGLRenderingContext) throw new Error('no webgl');
    initScene();
  } catch (err){
    $('#stageLoad').style.display = 'none';
    $('#stageFallback').classList.add('on');
    return;
  }
  buildPanel();
  syncUI();
  initActions();
  initControls();
  onResize();
  rebuild();
  setView('exterior', true);
  tick();
  window.__beo = { scene, camera, state, rebuild, get booth(){ return booth; }, get parts(){ return parts; } };
}

start();
