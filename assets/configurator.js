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
  artboard:{ beige: null, beige_d: null, white: null, gray_l: null, gray_d: null, black: null, orange: null, melon: null, green: null, sky: null, blue: null, pink: null },
  slat:    { oak: null, walnut: null, white: null, whitewash: null, maple: null, teak: null, ash: null, dark: null },
  light:   { cob4000: null, rail: null },
  floor:   { oak: null, pine: null },
  door:    { left: null, center: null, right: null },
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

/* 색은 여기에 한 줄만 추가하면 패널·3D·사양 요약에 동시에 반영됩니다.
   아트보드 = 실제 멜란지 흡음 펠트 견본 12색 / 라인타공 = RG-LT3203 8종 */
const ARTBOARD = [
  { v:'beige',   label:'연베이지',   sub:'기본', hex:'#DCC9A9', rough:0.97 },
  { v:'beige_d', label:'진베이지',   sub:'',     hex:'#BE9A62', rough:0.97 },
  { v:'white',   label:'화이트',     sub:'',     hex:'#E7E5E1', rough:0.96 },
  { v:'gray_l',  label:'연그레이',   sub:'',     hex:'#C2C1BE', rough:0.97 },
  { v:'gray_d',  label:'진그레이',   sub:'',     hex:'#737A82', rough:0.97 },
  { v:'black',   label:'블랙',       sub:'',     hex:'#26292C', rough:0.95 },
  { v:'orange',  label:'오렌지',     sub:'',     hex:'#EFA63A', rough:0.97 },
  { v:'melon',   label:'메론',       sub:'',     hex:'#93CE6C', rough:0.97 },
  { v:'green',   label:'그린',       sub:'',     hex:'#1E6A4D', rough:0.97 },
  { v:'sky',     label:'스카이블루', sub:'',     hex:'#8FA8C8', rough:0.97 },
  { v:'blue',    label:'블루',       sub:'',     hex:'#2C3C74', rough:0.97 },
  { v:'pink',    label:'핑크',       sub:'',     hex:'#D2716F', rough:0.97 }
];
const SLAT = [
  { v:'oak',      label:'내추럴 오크', hex:'#C9B393', grain:'#8E7146', code:'001' },
  { v:'walnut',   label:'미디엄 월넛', hex:'#A08063', grain:'#5C3F27', code:'002' },
  { v:'white',    label:'화이트',      hex:'#F0EFEA', grain:'#C6C3B8', code:'003' },
  { v:'whitewash',label:'화이트워시',  hex:'#DFDBD0', grain:'#A9A498', code:'004' },
  { v:'maple',    label:'메이플',      hex:'#E0CBA6', grain:'#A98B5D', code:'005' },
  { v:'teak',     label:'티크',        hex:'#BC8A64', grain:'#7B4E30', code:'006' },
  { v:'ash',      label:'애쉬 오크',   hex:'#B5A896', grain:'#7C6E5B', code:'007' },
  { v:'dark',     label:'다크 월넛',   hex:'#5B483A', grain:'#2E2018', code:'008' }
];
/* 매립등은 주백색 4000K 고정 · 레일등은 2,400mm 이상 규격의 기본값 */
const LIGHT = [
  { v:'cob4000', label:'COB 매립등 4000K', sub:'2구 · 주백색', temp:4000 },
  { v:'rail',    label:'레일등',           sub:'대형 공간',   temp:4000 }
];
const LEDTEMP = [
  { v:'4000', label:'주백색 4000K', hex:'#FFF4E2', light:'#FFEFD6' },
  { v:'6500', label:'주광색 6500K', hex:'#F6FAFF', light:'#EAF2FF' }
];
const FLOOR = [
  { v:'oak',  label:'멜로우 오크', hex:'#C6A47E', grain:'#8E7048' },
  { v:'pine', label:'화이트 파인', hex:'#E4DDD0', grain:'#B9B0A0' }
];
const DOORS = [
  { v:'left',   label:'좌측 구석' },
  { v:'center', label:'가운데' },
  { v:'right',  label:'우측 구석' }
];
const DOOR_W = 0.86;
/* 문은 항상 정면(가로 벽)에 있고 좌/가운데/우로만 이동합니다 (front 벽은 rotY=π 이므로 바깥 기준 좌=+X, 우=-X) */
function doorX0Of(){
  const W = state.w/1000;
  /* 옆벽 두께(T) + 2cm 안쪽에 붙여 문틀이 옆벽을 파고들지 않게 합니다 */
  if (state.door === 'left')  return  W/2 - T - 0.02 - DOOR_W;
  if (state.door === 'right') return -W/2 + T + 0.02;
  return -DOOR_W/2;
}
const HINGES = [
  { v:'right', label:'우경첩' },
  { v:'left',  label:'좌경첩' }
];
const WINDOWS = [
  { v:'none',       label:'없음',        w:0,   h:0,   sub:'' },
  { v:'600x800',    label:'600×800',     w:0.6, h:0.8, sub:'600 모듈 1칸' },
  { v:'1200x800',   label:'1200×800',    w:1.2, h:0.8, sub:'600 모듈 2칸' },
  { v:'800x800',    label:'800×800',     w:0.8, h:0.8, sub:'검사시창' },
  { v:'double1200', label:'이중창 1200', w:1.2, h:0.8, sub:'1,200×800 · 돌출', isDouble:true }
];
const PROJECTS = [
  { v:'none', label:'없음' },
  { v:'in',   label:'포함' }
];
/* 시창·타공판을 놓을 수 있는 세 벽 (문은 항상 정면) */
const WALLS3 = [
  { v:'left',  label:'좌측' },
  { v:'back',  label:'후면' },
  { v:'right', label:'우측' }
];
const WALL_LABEL = { left:'좌측', back:'후면', right:'우측' };
const FREE_ORDER = ['back', 'left', 'right'];
const PRESETS = [
  { id:'studio', label:'스튜디오 베스트', sw:['#D8C6A6','#E0CBA6','#C6A47E'], set:{ artboard:'beige',  slat:'maple',     floor:'oak',   light:'cob4000' } },
  { id:'clean',  label:'클린 화이트',     sw:['#E7E5E1','#DFDBD0','#E4DDD0'], set:{ artboard:'white',  slat:'whitewash', floor:'pine',  light:'cob4000' } },
  { id:'dark',   label:'모던 다크',       sw:['#AEAFAC','#5B483A','#C6A47E'], set:{ artboard:'gray_l', slat:'dark',      floor:'oak',   light:'cob4000' } },
  { id:'bw',     label:'블랙 & 화이트',   sw:['#26292C','#F0EFEA','#C6A47E'], set:{ artboard:'black',  slat:'white',     floor:'oak',   light:'cob4000' } }
];
const DEFAULTS = { artboard:'beige', slat:'maple', light:'cob4000', floor:'oak', ledTemp:'4000', door:'right' };
const INCLUDED = ['세로 2구 콘센트','강화마루','3면 아트보드','1면 라인타공','COB 매립등·레일등·중앙 LED등','시스템도어'];
const PHONE = '010-3001-5906';
const DOOR_OPEN = 1.12;   // 문이 바깥으로 열리는 각도(rad)

const state = {
  model:'ss', w:1500, d:1800,
  artboard:'beige', slat:'maple', slatPos:'back', light:'cob4000', floor:'oak', ledTemp:'4000',
  door:'right', hinge:'right', open:false, window:'none', winPos:'left', project:'none', ac:false,
  view:'photo'
};

/* ---- 조명 규칙 ----
   매립등은 주백색 4000K 고정. 가로(W)·세로(D) 중 한 변이라도 2,400mm 이상이면
   레일등이 필수(자동 선택)이고, 그 미만은 COB 매립등 2구가 기본(레일등 선택 가능). */
const RAIL_MIN_MM = 2400;
let lightAuto = true;   // 지금 조명 선택이 규격 때문에 자동으로 정해진 것인지(사용자가 누르면 false)
function railRequired(){ return state.w >= RAIL_MIN_MM || state.d >= RAIL_MIN_MM; }
function defaultLight(){ return railRequired() ? 'rail' : 'cob4000'; }
function enforceLightRule(){
  if (railRequired()){
    if (state.light !== 'rail'){ state.light = 'rail'; lightAuto = true; }
  } else if (lightAuto && state.light === 'rail'){
    state.light = 'cob4000';
  }
}

const $ = (s, r = document) => r.querySelector(s);
const fmt = n => Number(n).toLocaleString('ko-KR');
const pick = (arr, v) => arr.find(o => o.v === v) || arr[0];

/* ============================ [3] UI ============================ */
const panel = $('#panelBody');

/* 문(정면) 기준 배치도 — 지금 고른 벽을 진하게, 같이 놓는 다른 요소는 연하게 */
function miniPlan(kind){
  const slat = state.slatPos || 'back';
  const win = state.winPos || 'left';
  const hasWin = state.window !== 'none';
  const mine = kind === 'slat' ? slat : win;
  const other = kind === 'slat' ? win : slat;
  const mineCol = kind === 'slat' ? '#9A7448' : '#2E9C86';
  const otherCol = kind === 'slat' ? '#2E9C86' : '#9A7448';
  const line = (wall) => {
    if (wall === 'back')  return 'x1="8" y1="8" x2="52" y2="8"';
    if (wall === 'left')  return 'x1="8" y1="8" x2="8" y2="64"';
    if (wall === 'right') return 'x1="52" y1="8" x2="52" y2="64"';
    return 'x1="8" y1="64" x2="52" y2="64"';
  };
  /* 시창을 아직 안 골랐으면 타공판 배치도에 시창 줄을 그리지 않습니다 */
  const otherLine = (kind === 'slat' && !hasWin) ? ''
    : `<line ${line(other)} stroke="${otherCol}" stroke-width="3" stroke-linecap="round" opacity=".34"/>`;
  return `<svg class="plan" viewBox="0 0 60 78" aria-hidden="true">
    <rect x="8" y="8" width="44" height="56" rx="3" fill="#FBF8F2" stroke="#DDD7C9" stroke-width="1.5"/>
    <line x1="8" y1="64" x2="23" y2="64" stroke="#DDD7C9" stroke-width="1.5"/>
    <line x1="37" y1="64" x2="52" y2="64" stroke="#DDD7C9" stroke-width="1.5"/>
    ${otherLine}
    <line ${line(mine)} stroke="${mineCol}" stroke-width="5.5" stroke-linecap="round"/>
    <text x="30" y="74" text-anchor="middle" font-size="7.5" fill="#8A867E">문</text>
  </svg>`;
}
function posBlock(kind){
  const isSlat = kind === 'slat';
  const group = isSlat ? 'slatPos' : 'winPos';
  return `<div class="pos-block">
    <span class="planwrap" data-plan="${kind}">${miniPlan(kind)}</span>
    <div class="pos-body">
      <div class="pos-h"><b>${isSlat ? '타공판 위치' : '시창 위치'}</b><small>문 기준 · 좌/후/우</small></div>
      <div class="seg three">
        ${WALLS3.map(w => `<button type="button" data-group="${group}" data-value="${w.v}" aria-pressed="false">${w.label}</button>`).join('')}
      </div>
      <p class="pos-note" data-posnote="${kind}"></p>
    </div>
  </div>`;
}

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
      <div class="sec-h"><span class="n">02</span><h2>아트보드 색상</h2><span class="tag">3면 · 12색</span></div>
      <div class="sw-circles">
        ${ARTBOARD.map(a => `<button type="button" class="csw" data-group="artboard" data-value="${a.v}" aria-pressed="false" title="${a.label}">
          <span class="cc" style="--c:${a.hex}"></span><span class="cl">${a.label}</span>
        </button>`).join('')}
      </div>
      <p class="note">실제 멜란지 흡음 펠트 견본 12색입니다. 연베이지가 기본입니다.</p>
    </section>

    <section class="sec">
      <div class="sec-h"><span class="n">03</span><h2>라인타공 포인트</h2><span class="tag">1면 · 8종</span></div>
      <div class="sw-circles">
        ${SLAT.map(s => `<button type="button" class="csw wood" data-group="slat" data-value="${s.v}" aria-pressed="false" title="${s.label}">
          <span class="cc" style="--c:${s.hex}"></span><span class="cl">${s.label}</span>
        </button>`).join('')}
      </div>
      ${posBlock('slat')}
      <p class="note">RG-LT3203 라인타공 8종. 슬랫 사이로는 검정 흡음 펠트가 보입니다.</p>
    </section>

    <section class="sec">
      <div class="sec-h"><span class="n">04</span><h2>조명</h2><span class="tag">기본 포함</span></div>
      <div class="seg">
        ${LIGHT.map(l => `<button type="button" data-group="light" data-value="${l.v}" aria-pressed="false">${l.label}</button>`).join('')}
      </div>
      <div class="row" style="display:block;padding:10px 0 2px">
        <div class="rl" style="margin-bottom:7px"><b>중앙 LED등 색온도</b><small>천장 중앙 원형등</small></div>
        <div class="seg two">
          ${LEDTEMP.map(t => `<button type="button" data-group="ledTemp" data-value="${t.v}" aria-pressed="false">${t.label}</button>`).join('')}
        </div>
      </div>
      <p class="note" id="lightNote">COB 매립등 2구를 주백색 4000K로 시공합니다. 가로·세로 2,400mm 이상은 레일등이 기본입니다.</p>
    </section>

    <section class="sec">
      <div class="sec-h"><span class="n">05</span><h2>바닥 마루</h2><span class="tag">강화마루</span></div>
      <div class="sw-grid">
        ${FLOOR.map(f => `<button type="button" class="sw tight" data-group="floor" data-value="${f.v}" aria-pressed="false">
          <span class="dot" style="background:${f.hex}"></span>
          <span class="tx">${f.label}</span>
        </button>`).join('')}
      </div>
    </section>

    <section class="sec">
      <div class="sec-h"><span class="n">06</span><h2>옵션</h2><span class="tag">견적서에 미리 표기</span></div>

      <div class="row" style="display:block;padding-top:0">
        <div class="rl" style="margin-bottom:8px"><b>문 위치</b><small>문이 있는 쪽이 정면입니다 · 정면 가로 벽에서 좌우로</small></div>
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
        <div class="rl" style="margin-bottom:8px"><b>벽면 시창 · 이중창</b><small>시창 3종은 돌출 없음 · 이중창은 안·밖 돌출</small></div>
        <div class="seg three">
          ${WINDOWS.map(w => `<button type="button" data-group="window" data-value="${w.v}" aria-pressed="false">${w.label}</button>`).join('')}
        </div>
        ${posBlock('win')}
      </div>

      <div class="row" style="display:block">
        <div class="rl" style="margin-bottom:8px"><b>천장 프로젝트창</b><small>천장 시스템에어컨 바람을 부스 안으로</small></div>
        <div class="seg two">
          ${PROJECTS.map(p => `<button type="button" data-group="project" data-value="${p.v}" aria-pressed="false">${p.label}</button>`).join('')}
        </div>
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
  if (group === 'slatPos' || group === 'winPos'){
    state[group] = value;
    /* 시창과 타공판은 같은 벽에 함께 시공할 수 없습니다 — 방금 고른 쪽을 남기고 다른 쪽을 빈 벽으로 옮깁니다 */
    if (state.window !== 'none' && (state.winPos || 'left') === (state.slatPos || 'back')){
      const moveKey = group === 'slatPos' ? 'winPos' : 'slatPos';
      const target = FREE_ORDER.find(w => w !== value) || 'back';
      state[moveKey] = target;
      showToast(`${group === 'slatPos' ? '시창' : '타공판'}을 ${WALL_LABEL[target]} 벽으로 함께 옮겼습니다. 같은 벽에는 같이 시공할 수 없습니다.`);
    }
    if (group === 'winPos' && state.window === 'none'){
      showToast(`${WALL_LABEL[value]} 벽으로 지정했습니다. 시창 종류를 고르면 그 벽에 시공됩니다.`);
    }
    syncUI();
    rebuild();
    return;
  }
  if (group === 'window'){
    state.window = value;
    /* 시창을 고르면 타공판과 겹치지 않는 벽으로 바로 잡아 줍니다 */
    if (value !== 'none' && (state.winPos || 'left') === (state.slatPos || 'back')){
      const target = FREE_ORDER.find(w => w !== (state.slatPos || 'back')) || 'left';
      state.winPos = target;
      showToast(`시창을 ${WALL_LABEL[target]} 벽에 넣었습니다. ${WALL_LABEL[state.slatPos || 'back']} 벽의 타공판과는 같이 시공할 수 없습니다.`);
    }
  }
  else if (group === 'project') state.project = value;
  else state[group] = value;
  if (group === 'light') lightAuto = false;
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
  const f = pick(FLOOR, state.floor);
  const d = pick(DOORS, state.door);
  const rows = [];
  rows.push({ k:'규격', v:`${modelName()} ${dimText()}`, chg:state.model === 'custom',
              chip:'', sub:`${((state.w/1000)*(state.d/1000)).toFixed(2)}㎡` });
  rows.push({ k:'아트보드', v:a.label, chg:state.artboard !== DEFAULTS.artboard, chip:a.hex, sub:'3면' });
  const slatPosLabel = state.slatPos === 'left' ? '좌측' : (state.slatPos === 'right' ? '우측' : '후면');
  rows.push({ k:'라인타공', v:`${s.label} · ${slatPosLabel}` + (s.code ? ` (${s.code})` : ''), chg:(state.slat !== DEFAULTS.slat || (state.slatPos && state.slatPos !== 'back')), chip:s.hex, sub:'1면' });
  rows.push({ k:'조명', v:(state.light === 'rail' ? '레일등' : 'COB 매립등 2구 · 주백색 4000K'), chg:state.light !== defaultLight(), chip:'', sub:(state.light === 'rail' ? (railRequired() ? '2,400mm 이상 필수' : '천장 트랙') : '') });
  rows.push({ k:'중앙등', v:pick(LEDTEMP, state.ledTemp).label, chg:state.ledTemp !== DEFAULTS.ledTemp, chip:pick(LEDTEMP, state.ledTemp).hex, sub:'천장 원형' });
  rows.push({ k:'바닥', v:f.label, chg:state.floor !== DEFAULTS.floor, chip:f.hex, sub:'강화마루' });
  rows.push({ k:'문', v:`${d.label} · ${state.hinge === 'right' ? '우경첩' : '좌경첩'}`, chg:(state.door !== DEFAULTS.door || state.hinge !== 'right'), chip:'', sub:'시스템도어' });
  const winSpec = pick(WINDOWS, state.window);
  const winPosLabel = WALL_LABEL[state.winPos || 'left'];
  rows.push({ k:'시창', v:(state.window === 'none' ? '없음' : (winSpec.isDouble ? '이중창 1,200×800' : `${winSpec.label} 시창`) + ` · ${winPosLabel}`), chg:(state.window !== 'none' || (state.winPos && state.winPos !== 'left')), chip:'', sub:(state.window === 'none' ? '' : `${winPosLabel} 벽`) });
  rows.push({ k:'프로젝트창', v:(state.project === 'in' ? '포함' : '없음'), chg:state.project === 'in', chip:'', sub:'천장 개폐형' });
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
  if (state.window !== 'none') items.push({ label:'창호', value: PRICE.window1 });
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
  /* 규격이 2,400mm 이상이면 레일등 필수 */
  enforceLightRule();

  panel.querySelectorAll('[data-group]').forEach(b => {
    const on = state[b.dataset.group] === b.dataset.value;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.classList.toggle('on', on);
  });
  /* 배치도·안내문도 현재 선택을 따라갑니다 */
  panel.querySelectorAll('[data-plan]').forEach(el => { el.innerHTML = miniPlan(el.dataset.plan); });
  panel.querySelectorAll('[data-posnote]').forEach(el => {
    el.textContent = el.dataset.posnote === 'slat'
      ? '시창과 같은 벽이 되면 시창이 옆 벽으로 이동합니다.'
      : (state.window === 'none'
          ? '시창 종류를 고르면 선택한 벽에 시공됩니다.'
          : '타공판과 같은 벽이 되면 타공판이 옆 벽으로 이동합니다.');
  });
  const lockRail = railRequired();
  panel.querySelectorAll('[data-group="light"]').forEach(b => {
    const lock = lockRail && b.dataset.value !== 'rail';
    b.disabled = lock;
    b.setAttribute('aria-disabled', lock ? 'true' : 'false');
  });
  if ($('#lightNote')) $('#lightNote').textContent = lockRail
    ? '가로·세로 2,400mm 이상 규격은 레일등(천장 트랙)으로 시공합니다. COB 매립등은 이 규격에서 선택할 수 없습니다.'
    : (state.light === 'rail'
        ? '레일등을 선택하셨습니다. COB 매립등 2구(주백색 4000K)로 바꾸실 수 있습니다.'
        : 'COB 매립등 2구를 주백색 4000K로 시공합니다. 원하시면 레일등으로 바꾸실 수 있습니다.');
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
  const f = pick(FLOOR, state.floor);
  const el = $('#legend');
  if (!el) return;
  el.innerHTML = `
    <span class="lg"><i style="background:${a.hex}"></i>아트보드 ${a.label}</span>
    <span class="lg"><i style="background:${s.hex}"></i>라인타공 ${s.label}</span>
    <span class="lg"><i style="background:${f.hex}"></i>마루 ${f.label}</span>
    <span class="lg"><i style="background:${state.light === 'rail' ? '#C9CDD1' : '#FFF1DC'}"></i>${state.light === 'rail' ? '레일등' : 'COB 4000K'}</span>`;
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
                '프로젝트창':'천장 프로젝트창' };
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

  document.querySelectorAll('#modeSwitch button').forEach(b => {
    b.addEventListener('click', () => setView(b.dataset.mode === 'photo' ? 'photo' : 'exterior', true));
  });
  document.querySelectorAll('#subViews button').forEach(b => {
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
/*  실제 신규 시공 사진(clinic-interior-cob / clinic-interior-slat /
    clinic-exterior / project-window-main)의 색감·질감·조명을 오마주한 씬. */
const H = 2.0;        // 내부 높이(m)
const T = 0.11;       // 벽체 두께(m) — 모델링 값이며 화면에 수치로 표기하지 않음
const SKIN = 0.12;    // 천장 구조층
const WALL_TOP = H + SKIN;
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const isSmall = () => matchMedia('(max-width:900px)').matches;

/* 광량 밸런스 — 이 값만 만지면 톤이 바뀝니다 */
const TUNE = {
  exposure: 1.08,
  env: 0.45,
  hemi: 0.34,
  key: 2.6,
  rim: 0.22,
  fill: 0.18,
  cob: 3.4,
  led: 2.4,
  rail: 2.4,
  interiorFill: 1.15,
  groundShadow: 0.12
};

let renderer, scene, camera, pmrem, envRT;
let booth = null, parts = {};
let hotspots = [];
let hotspotOn = true;

const stageEl = $('#stage');
const canvas = $('#scene');

/* ---------------- 절차적 텍스처 ---------------- */
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
function shade(hex, amt){
  const [r,g,b] = hexToRgb(hex);
  const f = v => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255-v)*amt : v*(1+amt))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function cv2d(w, h){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function makeTex(cv, { rep = [1,1], srgb = true, aniso = true } = {}){
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  if (aniso) t.anisotropy = maxAniso;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

/* 마루 · 원목 — map + roughness + bump (1024²) */
function woodSet(base, grain, seed, planks = 8){
  const key = `wood:${base}:${grain}:${seed}:${planks}`;
  if (texCache.has(key)) return texCache.get(key);
  const S = 1024, rowH = S / planks;
  const cA = cv2d(S,S), a = cA.getContext('2d');
  const cB = cv2d(S,S), b = cB.getContext('2d');
  const cR = cv2d(S,S), ro = cR.getContext('2d');
  const rand = rng(seed);
  const [gr,gg,gb] = hexToRgb(grain);
  a.fillStyle = base; a.fillRect(0,0,S,S);
  b.fillStyle = '#808080'; b.fillRect(0,0,S,S);
  ro.fillStyle = '#6c6c6c'; ro.fillRect(0,0,S,S);

  for (let i = 0; i < planks; i++){
    const y = i * rowH;
    const tone = (rand()*2 - 1) * 0.075;
    a.fillStyle = shade(base, tone); a.fillRect(0, y, S, rowH);
    ro.fillStyle = shade('#6c6c6c', tone * 0.8 + (rand()*2-1) * 0.05); ro.fillRect(0, y, S, rowH);

    for (let k = 0; k < 130; k++){
      const gy = y + rand() * rowH;
      const dark = rand() < 0.66;
      const al = 0.02 + rand() * 0.08;
      a.strokeStyle = dark ? `rgba(${gr},${gg},${gb},${al.toFixed(3)})` : `rgba(255,247,233,${(al*0.8).toFixed(3)})`;
      a.lineWidth = 0.4 + rand() * 2.0;
      b.strokeStyle = dark ? `rgba(30,30,30,${(al*2.4).toFixed(3)})` : `rgba(220,220,220,${(al*1.5).toFixed(3)})`;
      b.lineWidth = a.lineWidth;
      let x = -30, yy = gy;
      a.beginPath(); b.beginPath();
      a.moveTo(x, yy); b.moveTo(x, yy);
      while (x < S + 30){
        x += 40 + rand() * 120;
        yy = gy + Math.sin(x * 0.011 + k * 0.7) * (1.0 + rand() * 2.6) + (rand()-0.5) * 1.8;
        a.lineTo(x, yy); b.lineTo(x, yy);
      }
      a.stroke(); b.stroke();
    }
    if (rand() < 0.55){
      const kx = rand() * S, ky = y + rowH * (0.25 + rand() * 0.5);
      for (let q = 0; q < 3; q++){
        a.strokeStyle = `rgba(${gr},${gg},${gb},0.055)`;
        a.lineWidth = 1.5;
        a.beginPath(); a.ellipse(kx, ky, 5 + q * 7, 2.4 + q * 3, 0, 0, Math.PI * 2); a.stroke();
      }
    }
    a.fillStyle = 'rgba(46,32,20,0.22)'; a.fillRect(0, y + rowH - 2, S, 2);
    a.fillStyle = 'rgba(255,255,255,0.055)'; a.fillRect(0, y + rowH - 3.6, S, 1.2);
    b.fillStyle = 'rgba(20,20,20,0.8)'; b.fillRect(0, y + rowH - 2, S, 2);
    ro.fillStyle = 'rgba(40,40,40,0.55)'; ro.fillRect(0, y + rowH - 2, S, 2);
    const jx = 70 + rand() * 880;
    a.fillStyle = 'rgba(46,32,20,0.2)'; a.fillRect(jx, y, 1.6, rowH);
    b.fillStyle = 'rgba(20,20,20,0.6)'; b.fillRect(jx, y, 1.6, rowH);
  }
  const set = { map: makeTex(cA), bump: makeTex(cB, {srgb:false}), rough: makeTex(cR, {srgb:false}) };
  texCache.set(key, set);
  return set;
}

/* 아트보드 — 멜란지 흡음 펠트 (회색조 질감 × 색상, 1024²) */
function fabricSet(){
  const key = 'fabric';
  if (texCache.has(key)) return texCache.get(key);
  const S = 1024;
  const cA = cv2d(S,S), a = cA.getContext('2d');
  const cB = cv2d(S,S), b = cB.getContext('2d');
  const cR = cv2d(S,S), ro = cR.getContext('2d');
  const rand = rng(13);
  a.fillStyle = '#ffffff'; a.fillRect(0,0,S,S);
  b.fillStyle = '#808080'; b.fillRect(0,0,S,S);
  ro.fillStyle = '#f2f2f2'; ro.fillRect(0,0,S,S);

  // 멜란지 구름 얼룩 — 눌린 펠트 특유의 얼룩
  for (let i = 0; i < 120; i++){
    const x = rand()*S, y = rand()*S, r = 30 + rand()*110;
    const dark = rand() < 0.52;
    const g = a.createRadialGradient(x, y, 0, x, y, r);
    const al = 0.012 + rand()*0.026;
    g.addColorStop(0, dark ? `rgba(0,0,0,${al.toFixed(3)})` : `rgba(255,255,255,${(al*1.3).toFixed(3)})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    a.fillStyle = g;
    a.beginPath(); a.arc(x, y, r, 0, Math.PI*2); a.fill();
    const gb = b.createRadialGradient(x, y, 0, x, y, r);
    gb.addColorStop(0, dark ? `rgba(60,60,60,${(al*1.5).toFixed(3)})` : `rgba(200,200,200,${(al*1.2).toFixed(3)})`);
    gb.addColorStop(1, 'rgba(0,0,0,0)');
    b.fillStyle = gb;
    b.beginPath(); b.arc(x, y, r, 0, Math.PI*2); b.fill();
  }
  // 섬유 가닥 (멜란지 실)
  for (let i = 0; i < 16000; i++){
    const x = rand()*S, y = rand()*S;
    const len = 2 + rand()*9, ang = rand()*Math.PI;
    const dark = rand() < 0.55;
    const al = 0.02 + rand()*0.07;
    a.strokeStyle = dark ? `rgba(0,0,0,${al.toFixed(3)})` : `rgba(255,255,255,${(al*1.5).toFixed(3)})`;
    a.lineWidth = 0.6 + rand()*1.1;
    a.beginPath(); a.moveTo(x, y); a.lineTo(x + Math.cos(ang)*len, y + Math.sin(ang)*len); a.stroke();
    b.strokeStyle = dark ? `rgba(40,40,40,${(al*1.6).toFixed(3)})` : `rgba(215,215,215,${(al*1.4).toFixed(3)})`;
    b.lineWidth = a.lineWidth;
    b.beginPath(); b.moveTo(x, y); b.lineTo(x + Math.cos(ang)*len, y + Math.sin(ang)*len); b.stroke();
  }
  // 패널 이음 (0.9m 마다)
  a.fillStyle = 'rgba(0,0,0,0.16)'; a.fillRect(S-4, 0, 4, S);
  a.fillStyle = 'rgba(255,255,255,0.40)'; a.fillRect(S-6, 0, 2, S);
  b.fillStyle = 'rgba(40,40,40,0.8)'; b.fillRect(S-4, 0, 4, S);
  ro.fillStyle = 'rgba(120,120,120,0.9)'; ro.fillRect(S-4, 0, 4, S);
  // 상단 음영
  const grd = a.createLinearGradient(0, 0, 0, 52);
  grd.addColorStop(0, 'rgba(0,0,0,0.09)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  a.fillStyle = grd; a.fillRect(0, 0, S-6, 52);

  const set = { map: makeTex(cA), bump: makeTex(cB, {srgb:false}), rough: makeTex(cR, {srgb:false}) };
  texCache.set(key, set);
  return set;
}

/* 외부 백색 알판 — 0.6m 판 이음 + 무광 오렌지필 (1024²) */
function skinSet(){
  const key = 'skin';
  if (texCache.has(key)) return texCache.get(key);
  const S = 1024;
  const cA = cv2d(S,S), a = cA.getContext('2d');
  const cB = cv2d(S,S), b = cB.getContext('2d');
  const rand = rng(11);
  a.fillStyle = '#ffffff'; a.fillRect(0,0,S,S);
  b.fillStyle = '#808080'; b.fillRect(0,0,S,S);
  for (let i = 0; i < 9000; i++){
    const x = rand() * S, y = rand() * S, rr = 1 + rand() * 2.6;
    a.fillStyle = `rgba(0,0,0,${(rand() * 0.022).toFixed(3)})`;
    a.beginPath(); a.arc(x, y, rr, 0, Math.PI * 2); a.fill();
    b.fillStyle = `rgba(${rand() < 0.5 ? 40 : 220},${rand() < 0.5 ? 40 : 220},${rand() < 0.5 ? 40 : 220},0.05)`;
    b.beginPath(); b.arc(x, y, rr, 0, Math.PI * 2); b.fill();
  }
  // 판 이음 (오른쪽 = 0.6m)
  a.fillStyle = 'rgba(0,0,0,0.20)'; a.fillRect(S-5, 0, 5, S);
  a.fillStyle = 'rgba(255,255,255,0.85)'; a.fillRect(S-8, 0, 3, S);
  b.fillStyle = 'rgba(30,30,30,0.85)'; b.fillRect(S-4, 0, 4, S);
  const set = { map: makeTex(cA), bump: makeTex(cB, {srgb:false}) };
  texCache.set(key, set);
  return set;
}

/* 라인타공 슬랫 세로 결 */
function slatSet(base, grain){
  const key = `slat:${base}:${grain}`;
  if (texCache.has(key)) return texCache.get(key);
  const W = 256, Hh = 1024;
  const cA = cv2d(W, Hh), a = cA.getContext('2d');
  const cB = cv2d(W, Hh), b = cB.getContext('2d');
  const rand = rng(7);
  const [gr,gg,gb] = hexToRgb(grain);
  a.fillStyle = base; a.fillRect(0,0,W,Hh);
  b.fillStyle = '#808080'; b.fillRect(0,0,W,Hh);
  for (let i = 0; i < 220; i++){
    const x = rand() * W;
    const al = 0.02 + rand() * 0.10;
    a.strokeStyle = `rgba(${gr},${gg},${gb},${al.toFixed(3)})`;
    a.lineWidth = 0.4 + rand() * 1.7;
    b.strokeStyle = `rgba(30,30,30,${(al*1.8).toFixed(3)})`;
    b.lineWidth = a.lineWidth;
    let y = -20, xx = x;
    a.beginPath(); b.beginPath();
    a.moveTo(xx, y); b.moveTo(xx, y);
    while (y < Hh + 20){
      y += 50 + rand() * 120;
      xx = x + Math.sin(y * 0.01 + i) * (0.6 + rand() * 1.4) + (rand()-0.5) * 1.2;
      a.lineTo(xx, y); b.lineTo(xx, y);
    }
    a.stroke(); b.stroke();
  }
  const set = { map: makeTex(cA), bump: makeTex(cB, {srgb:false}) };
  texCache.set(key, set);
  return set;
}

/* LED 확산판 — 중심이 밝고 가장자리로 부드럽게 떨어지는 발광 */
function diffuserTexture(){
  const key = 'diffuser';
  if (texCache.has(key)) return texCache.get(key);
  const c = cv2d(256,256), g = c.getContext('2d');
  g.fillStyle = '#8a8a8a'; g.fillRect(0,0,256,256);
  const grad = g.createRadialGradient(128,128,4,128,128,126);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, '#f2f2f2');
  grad.addColorStop(0.86, '#c9c9c9');
  grad.addColorStop(1, '#9a9a9a');
  g.fillStyle = grad; g.fillRect(0,0,256,256);
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

/* 빛 번짐 (가산) */
function glowTexture(){
  const key = 'glow';
  if (texCache.has(key)) return texCache.get(key);
  const c = cv2d(256,256), g = c.getContext('2d');
  const grad = g.createRadialGradient(128,128,0,128,128,128);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.12, 'rgba(255,250,240,0.82)');
  grad.addColorStop(0.34, 'rgba(255,244,226,0.34)');
  grad.addColorStop(0.66, 'rgba(255,240,218,0.10)');
  grad.addColorStop(1, 'rgba(255,236,210,0)');
  g.fillStyle = grad; g.fillRect(0,0,256,256);
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

/* 벽면 그레이징 글로우 (아래로 퍼지는 부드러운 빛) */
function grazeTexture(){
  const key = 'graze';
  if (texCache.has(key)) return texCache.get(key);
  const W = 256, Hh = 512;
  const c = cv2d(W,Hh), g = c.getContext('2d');
  const grad = g.createRadialGradient(W/2, 60, 4, W/2, 90, 260);
  grad.addColorStop(0, 'rgba(255,255,255,0.90)');
  grad.addColorStop(0.30, 'rgba(255,248,232,0.40)');
  grad.addColorStop(0.62, 'rgba(255,240,216,0.13)');
  grad.addColorStop(1, 'rgba(255,236,208,0)');
  g.fillStyle = grad;
  g.beginPath(); g.ellipse(W/2, 120, 118, 250, 0, 0, Math.PI*2); g.fill();
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

/* 접지 그림자 */
function contactTexture(){
  const key = 'contact';
  if (texCache.has(key)) return texCache.get(key);
  const c = cv2d(512,512), g = c.getContext('2d');
  const grad = g.createRadialGradient(256,256,10,256,256,252);
  grad.addColorStop(0, 'rgba(6,8,10,0.80)');
  grad.addColorStop(0.34, 'rgba(6,8,10,0.46)');
  grad.addColorStop(0.62, 'rgba(6,8,10,0.16)');
  grad.addColorStop(1, 'rgba(6,8,10,0)');
  g.fillStyle = grad; g.fillRect(0,0,512,512);
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

/* 스튜디오 바닥 반사광 */
function floorGlowTexture(){
  const key = 'floorglow';
  if (texCache.has(key)) return texCache.get(key);
  const c = cv2d(512,512), g = c.getContext('2d');
  const grad = g.createRadialGradient(256,256,6,256,256,250);
  grad.addColorStop(0, 'rgba(214,224,230,0.30)');
  grad.addColorStop(0.42, 'rgba(190,202,210,0.12)');
  grad.addColorStop(1, 'rgba(150,164,174,0)');
  g.fillStyle = grad; g.fillRect(0,0,512,512);
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

/* 바닥 걸레받이 접지 음영 */
function baseShadowTexture(){
  const key = 'baseshadow';
  if (texCache.has(key)) return texCache.get(key);
  const c = cv2d(16,128), g = c.getContext('2d');
  const grad = g.createLinearGradient(0,128,0,0);
  grad.addColorStop(0, 'rgba(10,12,14,0.46)');
  grad.addColorStop(0.42, 'rgba(10,12,14,0.15)');
  grad.addColorStop(1, 'rgba(10,12,14,0)');
  g.fillStyle = grad; g.fillRect(0,0,16,128);
  const t = makeTex(c);
  texCache.set(key, t);
  return t;
}

/* ---- 스튜디오 환경맵 (PMREM) ---- */
function buildStudioEnv(){
  const s = new THREE.Scene();
  const shellGeo = new THREE.BoxGeometry(1,1,1);
  shellGeo.deleteAttribute('uv');
  const shell = new THREE.Mesh(shellGeo, new THREE.MeshStandardMaterial({
    color: 0x6a7278, roughness: 1, metalness: 0, side: THREE.BackSide
  }));
  shell.scale.set(20, 10, 20);
  s.add(shell);

  const panel = (w, h, d, x, y, z, color, power) => {
    const g = new THREE.BoxGeometry(1,1,1);
    g.deleteAttribute('uv');
    const m = new THREE.MeshStandardMaterial({
      color: 0x000000, emissive: color, emissiveIntensity: power, roughness: 1, metalness: 0
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.scale.set(w,h,d);
    mesh.position.set(x,y,z);
    s.add(mesh);
  };
  // 천장 대형 소프트박스 (부드러운 상단 하이라이트)
  panel(9.0, 0.3, 7.0, 0, 4.55, 0, 0xffffff, 2.6);
  // 좌측 대형 스트립 (차가운 키)
  panel(0.3, 5.6, 8.6, -9.2, 1.6, 0.4, 0xeef4ff, 1.7);
  // 우측 스트립 (따뜻한 필)
  panel(0.3, 4.4, 9.2, 9.2, 1.3, 0.8, 0xfff1da, 1.25);
  // 뒤쪽 림 패널
  panel(7.0, 3.4, 0.3, 0, 2.4, -9.2, 0xdfeaf3, 0.7);
  // 앞쪽 낮은 반사 (바닥 바운스)
  panel(8.0, 0.3, 6.0, 0.6, -4.7, 1.0, 0x9aa2a8, 0.30);
  return s;
}

/* ---- 씬 초기화 ---- */
function initScene(){
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = TUNE.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  maxAniso = renderer.capabilities.getMaxAnisotropy();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);

  pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = buildStudioEnv();
  envRT = pmrem.fromScene(envScene, 0.035);
  scene.environment = envRT.texture;
  envScene.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });

  const hemi = new THREE.HemisphereLight(0xf2f6f8, 0x2b241c, TUNE.hemi);
  scene.add(hemi);
  parts.hemi = hemi;

  const key = new THREE.DirectionalLight(0xfff8ee, TUNE.key);
  key.position.set(3.0, 5.6, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 26;
  key.shadow.camera.left = -7.0;
  key.shadow.camera.right = 7.0;
  key.shadow.camera.top = 7.0;
  key.shadow.camera.bottom = -2.2;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 3;
  scene.add(key);
  parts.keyLight = key;

  // 정면 소프트 필 (알판이 흰색으로 읽히도록)
  const front = new THREE.DirectionalLight(0xfffaf2, 0.55);
  front.position.set(1.2, 2.0, 9.0);
  scene.add(front);
  parts.frontDir = front;

  const fill = new THREE.PointLight(0xffeeda, TUNE.interiorFill, 9, 2);
  fill.position.set(0, 1.35, 0);
  scene.add(fill);
  parts.fillLight = fill;

  // 천장을 고르게 씻어 주는 약한 상향광 (사진의 은은한 천장 톤)
  const wash = new THREE.DirectionalLight(0xfff0da, 0.34);
  wash.position.set(0.4, -2.4, 0.6);
  wash.target.position.set(0, 2.2, -0.2);
  scene.add(wash);
  scene.add(wash.target);
  parts.ceilWash = wash;

  buildStudioGround();
}

/* 스튜디오 바닥 — 컨택트 섀도우 · 바운스 · 실제 그림자 받이 */
function buildStudioGround(){
  const g = new THREE.Group();
  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 26),
    new THREE.ShadowMaterial({ color: 0x05080a, opacity: TUNE.groundShadow })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -0.128;
  shadowCatcher.receiveShadow = true;
  g.add(shadowCatcher);

  const bounce = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ map: floorGlowTexture(), transparent: true, depthWrite: false, opacity: 0.55 })
  );
  bounce.rotation.x = -Math.PI / 2;
  bounce.position.y = -0.1275;
  bounce.renderOrder = -3;
  g.add(bounce);

  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: contactTexture(), transparent: true, depthWrite: false, opacity: 0.72 })
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -0.1272;
  contact.renderOrder = -2;
  g.add(contact);

  scene.add(g);
  parts.ground = g;
  parts.groundContact = contact;
  parts.groundBounce = bounce;
}

/* ---- 재질 ---- */
function stdMat(opts){ return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.9, metalness: 0 }, opts)); }

function artboardMaterial(hex, rough){
  const set = fabricSet();
  const map = set.map.clone(); map.userData._clone = true; map.needsUpdate = true;
  const bump = set.bump.clone(); bump.userData._clone = true; bump.needsUpdate = true;
  const rgh = set.rough.clone(); rgh.userData._clone = true; rgh.needsUpdate = true;
  map.repeat.set(1/0.9, 1/1.9); bump.repeat.copy(map.repeat); rgh.repeat.copy(map.repeat);
  return stdMat({
    color: new THREE.Color(hex), map,
    bumpMap: bump, bumpScale: 0.0022,
    roughnessMap: rgh, roughness: Math.min(1, rough),
    metalness: 0.0, envMapIntensity: 0.28
  });
}
function skinMaterial(){
  const set = skinSet();
  const map = set.map.clone(); map.userData._clone = true; map.needsUpdate = true;
  const bump = set.bump.clone(); bump.userData._clone = true; bump.needsUpdate = true;
  map.repeat.set(1/0.6, 1/WALL_TOP); bump.repeat.copy(map.repeat);
  return stdMat({
    color: 0xECE7DC, map,
    bumpMap: bump, bumpScale: 0.0011,
    roughness: 0.55, metalness: 0.04, envMapIntensity: 0.7
  });
}
function ceilMaterial(){
  const set = skinSet();
  const map = set.map.clone(); map.userData._clone = true; map.needsUpdate = true;
  map.repeat.set(1/1.2, 1/1.2);
  return stdMat({ color: 0xEDE6D8, map, roughness: 0.92, metalness: 0.0, envMapIntensity: 0.4 });
}
function coreMaterial(){ return stdMat({ color: 0xEDEAE2, roughness: 0.88 }); }
function glassMaterial(){
  return new THREE.MeshPhysicalMaterial({
    color: 0xBFCFD2, metalness: 0.0, roughness: 0.04,
    transparent: true, opacity: 0.30,
    side: THREE.DoubleSide, envMapIntensity: 1.6,
    clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false
  });
}
function metalMat(){ return new THREE.MeshStandardMaterial({ color: 0xC2C6CA, metalness: 0.95, roughness: 0.24, envMapIntensity: 1.15 }); }
function darkMetalMat(){ return new THREE.MeshStandardMaterial({ color: 0x33363A, metalness: 0.85, roughness: 0.34, envMapIntensity: 1.0 }); }
function trimsMat(){ return stdMat({ color: 0xF3EFE6, roughness: 0.5, metalness: 0.02, envMapIntensity: 0.45 }); }

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
function wallPoint(name, lx, ly, lz){
  const d = wallDesc(name);
  return new THREE.Vector3(lx, ly, lz).applyAxisAngle(Y_AXIS, d.rotY)
    .add(new THREE.Vector3(d.pos[0], d.pos[1], d.pos[2]));
}
function wallInward(name){
  const d = wallDesc(name);
  return new THREE.Vector3(0,0,1).applyAxisAngle(Y_AXIS, d.rotY);
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

  const shape = new THREE.Shape();
  shape.moveTo(-w/2, Y0); shape.lineTo(w/2, Y0); shape.lineTo(w/2, WALL_TOP); shape.lineTo(-w/2, WALL_TOP); shape.closePath();
  openings.forEach(o => {
    const p = new THREE.Path();
    p.moveTo(o.x0, o.y0); p.lineTo(o.x0, o.y0 + o.h); p.lineTo(o.x0 + o.w, o.y0 + o.h); p.lineTo(o.x0 + o.w, o.y0);
    p.closePath();
    shape.holes.push(p);
  });
  const faceGeo = new THREE.ShapeGeometry(shape, 10);

  if (!opts || !opts.noInner){
    const inner = new THREE.Mesh(faceGeo, artboardMaterial(opts.innerHex, opts.innerRough));
    inner.position.z = T/2 + 0.0012;
    inner.receiveShadow = true;
    g.add(inner);
    g.userData.inner = inner;
  }
  const outerShape = new THREE.Shape();
  outerShape.moveTo(-w/2, Y0); outerShape.lineTo(w/2, Y0); outerShape.lineTo(w/2, WALL_TOP); outerShape.lineTo(-w/2, WALL_TOP); outerShape.closePath();
  openings.forEach(o => {
    const p = new THREE.Path();
    const ox0 = -(o.x0 + o.w), ox1 = -o.x0;
    p.moveTo(ox0, o.y0); p.lineTo(ox0, o.y0 + o.h); p.lineTo(ox1, o.y0 + o.h); p.lineTo(ox1, o.y0);
    p.closePath();
    outerShape.holes.push(p);
  });
  const outer = new THREE.Mesh(new THREE.ShapeGeometry(outerShape, 10), skinMaterial());
  outer.rotation.y = Math.PI;
  outer.position.z = -T/2 - 0.0012;
  outer.receiveShadow = true;
  g.add(outer);
  g.userData.outer = outer;
  const outerTrims = new THREE.Group();
  g.add(outerTrims);
  addOuterTrims(outerTrims, w, openings);
  g.userData.outerTrims = outerTrims;
  if (!opts || !opts.noInner){
    addSkirting(g, d.innerW, openings);
    addCeilReveal(g, d.innerW);
  }
  return g;
}

/* 걸레받이 — 실제 사진의 흰색 70mm 몰딩 */
function addSkirting(g, width, openings){
  const h = 0.07, dpt = 0.016;
  const mat = trimsMat();
  const segs = [];
  const doors = (openings || []).filter(o => o.y0 < 0.01);
  if (!doors.length){
    segs.push([-width/2, width/2]);
  } else {
    let cursor = -width/2;
    doors.sort((a,b) => a.x0 - b.x0).forEach(o => {
      if (o.x0 > cursor) segs.push([cursor, o.x0]);
      cursor = Math.max(cursor, o.x0 + o.w);
    });
    if (cursor < width/2) segs.push([cursor, width/2]);
  }
  segs.forEach(([x0, x1]) => {
    const sw = x1 - x0;
    if (sw < 0.01) return;
    const m = new THREE.Mesh(new THREE.BoxGeometry(sw, h, dpt), mat);
    m.position.set((x0 + x1)/2, h/2 - 0.002, T/2 + dpt/2);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
    // 몰딩 상단 그림자선
    const line = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.004, 0.002), stdMat({ color: 0xCFC7B8, roughness: 0.9 }));
    line.position.set((x0 + x1)/2, h - 0.002, T/2 + dpt + 0.0006);
    g.add(line);
  });
}

/* 천장과 만나는 부분의 그림자 홈 + 천장 트림 */
function addCeilReveal(g, width){
  const rev = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.012, 0.006),
    stdMat({ color: 0x4A453C, roughness: 0.95 })
  );
  rev.position.set(0, H - 0.008, T/2 + 0.0035);
  g.add(rev);
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.026, 0.012),
    trimsMat()
  );
  trim.position.set(0, H - 0.022, T/2 + 0.007);
  trim.castShadow = true; trim.receiveShadow = true;
  g.add(trim);
}


/* 외부 마감 — 하단 걸레받이 · 상단 밴드 · 모서리 트림 (실제 알판 시공 디테일) */
function addOuterTrims(g, width, openings){
  const mat = stdMat({ color: 0xF7F3EB, roughness: 0.42, metalness: 0.03, envMapIntensity: 0.55 });
  const zOut = -T/2 - 0.011;
  const doors = (openings || []).filter(o => o.y0 < 0.01);
  const segs = [];
  if (!doors.length){
    segs.push([-width/2 + 0.03, width/2 - 0.03]);
  } else {
    let cursor = -width/2 + 0.03;
    doors.sort((a,b) => a.x0 - b.x0).forEach(o => {
      if (o.x0 - 0.06 > cursor) segs.push([cursor, o.x0 - 0.06]);
      cursor = Math.max(cursor, o.x0 + o.w + 0.06);
    });
    if (cursor < width/2 - 0.03) segs.push([cursor, width/2 - 0.03]);
  }
  // 하단
  segs.forEach(([x0, x1]) => {
    const sw = x1 - x0;
    if (sw < 0.02) return;
    const m = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.078, 0.014), mat);
    m.position.set((x0+x1)/2, 0.039, zOut);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  });
  // 상단 밴드
  const top = new THREE.Mesh(new THREE.BoxGeometry(width - 0.02, 0.052, 0.012), mat);
  top.position.set(0, WALL_TOP - 0.04, zOut + 0.001);
  top.castShadow = true; top.receiveShadow = true;
  g.add(top);
  // 모서리 수직 트림
  [-1, 1].forEach(sd => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, WALL_TOP + 0.12, 0.012), mat);
    m.position.set(sd * (width/2 - 0.028), WALL_TOP/2 - 0.06, zOut + 0.002);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  });
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
      const m = new THREE.Mesh(new THREE.BoxGeometry(cw + 0.0016, ch + 0.0016, t), mat);
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
  const isDouble = !!opts.double;
  const fw = isDouble ? 0.042 : 0.03;
  const depth = isDouble ? (T + 0.09) : (T + 0.016);
  const frameMat = trimsMat();
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
  if (isDouble){
    // 이중창: 미닫이 중간 수직 샷시바 + 안팎 이중 유리
    const mid = new THREE.Mesh(new THREE.BoxGeometry(0.036, o.h, depth - 0.018), frameMat);
    mid.position.set(cx, cy, 0);
    mid.castShadow = true; mid.receiveShadow = true;
    g.add(mid);
    [-0.028, 0.028].forEach(gz => {
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(o.w - 0.01, o.h - 0.01), glassMaterial());
      gl.position.set(cx, cy, gz);
      gl.renderOrder = 4;
      g.add(gl);
    });
  } else {
    // 창틀 안쪽 베벨 (반사)
    [1, -1].forEach(s => {
      const bev = new THREE.Mesh(new THREE.BoxGeometry(o.w + 0.02, 0.008, 0.012), stdMat({ color: 0xE8E3D8, roughness: 0.6 }));
      bev.position.set(cx, cy + s * (o.h/2 - 0.004), s * 0.004);
      g.add(bev);
    });
    const gas = new THREE.Mesh(new THREE.BoxGeometry(o.w + 0.01, o.h + 0.01, 0.02), gasket);
    gas.position.set(cx, cy, -0.024);
    g.add(gas);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(o.w - 0.006, o.h - 0.006), glassMaterial());
    glass.position.set(cx, cy, 0);
    glass.renderOrder = 4;
    g.add(glass);
  }
  if (opts.project){
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, o.w * 0.86, 16), metalMat());
    hinge.rotation.z = Math.PI/2;
    hinge.position.set(cx, o.y0 + o.h - 0.03, 0.03);
    g.add(hinge);
    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.016, 0.016), metalMat());
    knob.position.set(cx, o.y0 + 0.05, 0.032);
    g.add(knob);
  }
  parent.add(g);
  return g;
}

/* 2구 콘센트 / 스위치 */
function addPlate(parent, x, y, kind){
  const g = new THREE.Group();
  const w = 0.086;
  const h = kind === 'outlet' ? 0.155 : 0.09;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.009), stdMat({ color: 0xF7F4EE, roughness: 0.42, metalness: 0.03 }));
  plate.position.set(x, y, 0.012);
  plate.castShadow = true; plate.receiveShadow = true;
  g.add(plate);
  if (kind === 'outlet'){
    [-0.036, 0.036].forEach(dy => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.038, 0.007), stdMat({ color: 0x2A2C2E, roughness: 0.85 }));
      s.position.set(x, y + dy, 0.0175);
      g.add(s);
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.007, 0.004), stdMat({ color: 0xD8D3C6 }));
      s2.position.set(x, y + dy, 0.0195);
      g.add(s2);
    });
  } else {
    const tog = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.008), stdMat({ color: 0xF1EEE6, roughness: 0.4 }));
    tog.position.set(x, y, 0.018);
    g.add(tog);
  }
  parent.add(g);
}

/* ---- 슬랫 벽 (라인타공) ---- */
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
  const T2 = T/2;
  const felt = fabricSet();
  const feltMap = felt.map.clone(); feltMap.userData._clone = true; feltMap.needsUpdate = true;
  feltMap.repeat.set((width-0.006)/0.9, WALL_TOP/1.9);
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.006, WALL_TOP),
    stdMat({ color: 0x0E0E10, map: feltMap, roughness: 0.99, metalness: 0, envMapIntensity: 0.15 })
  );
  plate.position.set(0, WALL_TOP / 2, T2 + 0.004);
  plate.receiveShadow = true;
  inner.add(plate);

  const slatW = 0.042, gap = 0.008, step = slatW + gap;
  const usable = width - 0.05;
  const count = Math.max(2, Math.floor(usable / step));
  const total = count * step - gap;
  const x0 = -total/2 + slatW/2;
  const set = slatSet(hex, grain);
  const mat = stdMat({
    color: 0xffffff,
    map: set.map,
    bumpMap: set.bump, bumpScale: 0.0014,
    roughness: hex === '#EBE7DE' ? 0.44 : 0.56,
    metalness: 0.02,
    envMapIntensity: 0.55
  });
  const y0 = 0.072, y1 = WALL_TOP - 0.03;
  const geo = new THREE.BoxGeometry(slatW, y1 - y0, 0.026);
  const inst = new THREE.InstancedMesh(geo, mat, count);
  inst.castShadow = true;
  inst.receiveShadow = true;
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < count; i++){
    m4.makeTranslation(x0 + i * step, (y0 + y1)/2, T2 + 0.016);
    inst.setMatrixAt(i, m4);
  }
  inst.instanceMatrix.needsUpdate = true;
  inner.add(inst);

  // 슬랫 양 끝 마감재 (사진의 흰 엣지 트림)
  [-1, 1].forEach(s => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.026, y1 - y0, 0.034), trimsMat());
    post.position.set(s * (total/2 + gap + 0.011), (y0 + y1)/2, T2 + 0.017);
    post.castShadow = true; post.receiveShadow = true;
    inner.add(post);
  });
  // 슬랫 상단 마감 밴드
  const top = new THREE.Mesh(new THREE.BoxGeometry(total + 0.072, 0.03, 0.034), trimsMat());
  top.position.set(0, y1 + 0.013, T2 + 0.017);
  top.castShadow = true; top.receiveShadow = true;
  inner.add(top);

  // 걸레받이
  const sk = new THREE.Mesh(new THREE.BoxGeometry(width - 0.006, 0.072, 0.018), trimsMat());
  sk.position.set(0, 0.036, T2 + 0.017);
  sk.castShadow = true; sk.receiveShadow = true;
  inner.add(sk);

  g.add(inner);
  g.userData.slatInst = inst;
  addBaseShadow(inner, width, T2 + 0.032);
  return inner;
}

/* ---- 조명 색 (매립등은 주백색 4000K 고정) ---- */
function lightColor(){
  return 0xFFF6E8;
}
function lightGlowColor(){
  return 0xFFF7EC;
}

/* ---- COB 매립등 (실제 다운라이트 구조) ---- */
function buildCobDownlight(colorTemp){
  const g = new THREE.Group();
  const col = colorTemp;

  // 매립 슬리브 — 천장 위로 올라가는 원통
  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0505, 0.0505, 0.075, 40, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x1E1D1A, roughness: 0.62, metalness: 0.35,
      side: THREE.BackSide, envMapIntensity: 0.5
    })
  );
  sleeve.position.y = 0.038;
  g.add(sleeve);

  // 리플렉터 (새틴 알루미늄 원뿔대) — 빛을 받아 안쪽이 밝게 보입니다
  const refl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.029, 0.0485, 0.046, 40, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x8A8378, metalness: 0.45, roughness: 0.38,
      side: THREE.DoubleSide, envMapIntensity: 0.9,
      emissive: col, emissiveIntensity: 0.26
    })
  );
  refl.position.y = 0.028;
  g.add(refl);

  // 리플렉터 안쪽 은은한 빛 (켜진 등처럼 보이도록)
  const throat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0295, 0.0479, 0.044, 36, 1, true),
    new THREE.MeshBasicMaterial({
      color: lightGlowColor(), transparent: true, opacity: 0.20,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    })
  );
  throat.position.y = 0.028;
  throat.renderOrder = 3;
  g.add(throat);

  // COB 발광면
  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(0.026, 36),
    new THREE.MeshStandardMaterial({
      color: 0x14140F, emissive: col, emissiveIntensity: 3.4,
      roughness: 0.45, metalness: 0
    })
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.y = 0.048;
  g.add(lens);

  // 개구부에서 새어 나오는 빛 (비스듬한 각도에서도 켜진 게 보이게)
  const aperture = new THREE.Mesh(
    new THREE.CircleGeometry(0.044, 40),
    new THREE.MeshBasicMaterial({
      map: glowTexture(), color: lightGlowColor(), transparent: true,
      depthWrite: false, opacity: 0.34
    })
  );
  aperture.rotation.x = Math.PI / 2;
  aperture.position.y = 0.0075;
  aperture.renderOrder = 3;
  g.add(aperture);

  // 베젤 링
  const bezel = new THREE.Mesh(
    new THREE.RingGeometry(0.0475, 0.0565, 48),
    stdMat({ color: 0xF1EDE4, roughness: 0.5, metalness: 0.03, envMapIntensity: 0.8 })
  );
  bezel.rotation.x = Math.PI / 2;
  bezel.position.y = 0.0008;
  g.add(bezel);

  // 링 안쪽 얇은 홈
  const groove = new THREE.Mesh(
    new THREE.RingGeometry(0.0455, 0.0475, 48),
    stdMat({ color: 0xBDB6A8, roughness: 0.8 })
  );
  groove.rotation.x = Math.PI / 2;
  groove.position.y = 0.0006;
  g.add(groove);

  // 천장 빛 번짐
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.56),
    new THREE.MeshBasicMaterial({
      map: glowTexture(), color: lightGlowColor(), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.13
    })
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = -0.0018;
  halo.renderOrder = 3;
  g.add(halo);

  // 렌즈 자체 발광 번짐 (정면에서 봤을 때 빛무리)
  const spark = new THREE.Mesh(
    new THREE.PlaneGeometry(0.095, 0.095),
    new THREE.MeshBasicMaterial({
      map: glowTexture(), color: lightGlowColor(), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.30
    })
  );
  spark.rotation.x = Math.PI / 2;
  spark.position.y = 0.0735;
  spark.renderOrder = 3;
  g.add(spark);

  return g;
}

function ledTempPick(){ return pick(LEDTEMP, state.ledTemp); }

/* ---- 중앙 원형 LED등 (사진의 플러시 원형 조명) ---- */
function buildRoundLed(){
  const g = new THREE.Group();
  const R = 0.185;
  // 외곽 아크릴 링 베젤
  const bezel = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, 0.028, 56, 1, false),
    stdMat({ color: 0xF4F0E7, roughness: 0.42, metalness: 0.02, envMapIntensity: 0.9 })
  );
  bezel.position.y = 0.014;
  g.add(bezel);
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(R - 0.004, 0.008, 12, 56),
    stdMat({ color: 0xFAF7F0, roughness: 0.35, metalness: 0.03 })
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.001;
  g.add(lip);
  // 확산판
  const diff = new THREE.Mesh(
    new THREE.CircleGeometry(R - 0.026, 56),
    new THREE.MeshStandardMaterial({
      color: 0xFFFDF8, emissive: ledTempPick().hex, emissiveIntensity: 1.65,
      emissiveMap: diffuserTexture(), roughness: 0.62, metalness: 0
    })
  );
  diff.rotation.x = Math.PI / 2;
  diff.position.y = -0.0015;
  g.add(diff);
  // 빛 번짐
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 1.05),
    new THREE.MeshBasicMaterial({
      map: glowTexture(), color: ledTempPick().hex, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.17
    })
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = -0.004;
  halo.renderOrder = 3;
  g.add(halo);
  g.userData.diff = diff;
  g.userData.halo = halo;
  return g;
}

/* ---- 조명 배치 계획 (천장 홀 · 실제 조명이 같은 좌표를 씁니다) ---- */
function lightLayout(slatName){
  const w = wallDesc(slatName).innerW;
  const group = new THREE.Group();
  const d = wallDesc(slatName);
  group.position.set(d.pos[0], 0, d.pos[2]).addScaledVector(wallInward(slatName), T/2);
  group.rotation.y = d.rotY;
  group.updateMatrixWorld(true);
  if (state.light === 'rail'){
    const railLen = Math.max(1.15, w - 0.34);
    return { mode:'rail', group, w, railLen, zRail: 0.46, cobHoles: [], cobs: [] };
  }
  const n = w > 2.3 ? 3 : 2;
  const spread = Math.min(w * 0.52, 1.55);
  const zCob = 0.42;
  const cobs = [];
  for (let i = 0; i < n; i++){
    const t = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread;
    cobs.push({ x: t, z: zCob, world: group.localToWorld(new THREE.Vector3(t, 0, zCob)) });
  }
  // world 좌표 → 천장 홀 (booth 로컬 = 월드)
  const cobHoles = cobs.map(c => ({ x: c.world.x, z: c.world.z }));
  return { mode:'cob', group, w, cobs, cobHoles, n, spread, zCob };
}

/* ---- 조명 설치 ---- */
/* 레일등 헤드 → 타공판 벽까지 이어지는 은은한 빛 기둥 (가산 블렌딩) */
function addBeamCone(parent, from, to, color){
  const dir = new THREE.Vector3().subVectors(from, to);
  const len = dir.length();
  if (!(len > 0.05)) return null;
  const geo = new THREE.ConeGeometry(0.26, len, 22, 1, true);
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.045,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(to).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.renderOrder = 2;
  parent.add(m);
  return m;
}
function buildLights(plan){
  const w = plan.w;
  const group = plan.group;
  booth.add(group);
  booth.updateMatrixWorld(true);
  parts.lightGroup = group;

  const warm = lightColor();
  const tempK = 4000;

  if (plan.mode === 'rail'){
    /* --- 슬림 트랙 + 회전형 원통 헤드 --- */
    const railLen = plan.railLen;
    const zRail = plan.zRail;
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x2A2D30, metalness: 0.72, roughness: 0.36, envMapIntensity: 1.0 });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(railLen, 0.031, 0.034), trackMat);
    bar.position.set(0, H - 0.028, zRail);
    bar.castShadow = true; bar.receiveShadow = true;
    group.add(bar);
    // 트랙 상단 홈
    const groove = new THREE.Mesh(new THREE.BoxGeometry(railLen - 0.01, 0.008, 0.014), stdMat({ color: 0x0E1012, roughness: 0.8 }));
    groove.position.set(0, H - 0.044, zRail);
    group.add(groove);
    // 천장 연결 스템 2개
    [-1, 1].forEach(s => {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.03, 12), trackMat);
      stem.position.set(s * railLen * 0.32, H - 0.008, zRail);
      group.add(stem);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.006, 20), stdMat({ color: 0xE9E4DA, roughness: 0.5 }));
      cap.position.set(s * railLen * 0.32, H - 0.001, zRail);
      group.add(cap);
    });

    const nHead = w > 2.4 ? 4 : 3;
    for (let i = 0; i < nHead; i++){
      const x = (i / (nHead - 1) - 0.5) * (railLen - 0.28);
      const head = new THREE.Group();
      head.position.set(x, H - 0.062, zRail);
      head.rotation.x = 0.34;   // 헤드를 타공판 벽 쪽으로 기울입니다
      // 어댑터
      const ad = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.045, 0.026), trackMat);
      ad.position.y = 0.028;
      head.add(ad);
      // 몸체
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.043, 0.10, 28),
        new THREE.MeshStandardMaterial({ color: 0x24272A, metalness: 0.78, roughness: 0.32, envMapIntensity: 1.1 })
      );
      body.castShadow = true;
      head.add(body);
      // 반사경
      const cone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.020, 0.037, 0.055, 28, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x3A3A36, metalness: 0.95, roughness: 0.18, side: THREE.DoubleSide })
      );
      cone.position.y = -0.024;
      head.add(cone);
      // 렌즈
      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.019, 24),
        new THREE.MeshStandardMaterial({ color: 0x0A0A0A, emissive: warm, emissiveIntensity: 4.4, roughness: 0.4 })
      );
      lens.rotation.x = -Math.PI / 2;
      lens.position.y = -0.049;
      head.add(lens);
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.3),
        new THREE.MeshBasicMaterial({ map: glowTexture(), color: lightGlowColor(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.42 })
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = -0.052;
      halo.renderOrder = 3;
      head.add(halo);
      group.add(head);

      const wp = group.localToWorld(new THREE.Vector3(x, H - 0.085, zRail));
      const tp = group.localToWorld(new THREE.Vector3(x, 1.18, 0.05));
      const sp = new THREE.SpotLight(warm, TUNE.rail, 5.2, 0.80, 0.90, 2);
      sp.position.copy(wp);
      sp.target.position.copy(tp);
      scene.add(sp.target);
      booth.add(sp);

      /* 타공판 벽면에 맺히는 따뜻한 빛 웅덩이 */
      const graze = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 1.8),
        new THREE.MeshBasicMaterial({
          map: grazeTexture(), color: lightGlowColor(), transparent: true,
          blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.22
        })
      );
      graze.position.set(x, 1.22, 0.034);
      graze.renderOrder = 2;
      group.add(graze);

      /* 헤드에서 벽면까지 이어지는 은은한 빛 기둥 */
      addBeamCone(group, new THREE.Vector3(x, H - 0.085, zRail), new THREE.Vector3(x, 1.18, 0.05), warm);
      /* 레일등은 그림자 없이 (실내에서 아티팩트가 커집니다) */
    }
    parts.lightAnchor = group.localToWorld(new THREE.Vector3(0, H - 0.09, zRail));
    // 중앙 LED도 함께 (사진처럼 천장 중앙 원형등)
    const led = buildRoundLed();
    led.position.set(0, H, 0);
    booth.add(led);
    parts.led = led;
    return;
  }

  /* --- COB 매립등 + 중앙 원형 LED --- */
  const n = plan.n, spread = plan.spread, zCob = plan.zCob;

  for (let i = 0; i < n; i++){
    const t = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread;
    const fx = buildCobDownlight(warm);
    fx.position.set(t, H, zCob);
    group.add(fx);

    const wp = group.localToWorld(new THREE.Vector3(t, H - 0.08, zCob));
    const tp = group.localToWorld(new THREE.Vector3(t, 0.95, 0.02));
    const sp = new THREE.SpotLight(warm, TUNE.cob, 5.4, 1.10, 0.88, 2);
    sp.position.copy(wp);
    sp.target.position.copy(tp);
    scene.add(sp.target);
    booth.add(sp);
    if (i === Math.floor((n - 1) / 2) && !isSmall()){
      sp.castShadow = true;
      sp.shadow.mapSize.set(1024, 1024);
      sp.shadow.bias = -0.0008;
      sp.shadow.normalBias = 0.025;
      sp.shadow.camera.near = 0.05;
      sp.shadow.camera.far = 5.5;
    }

    // 벽면 그레이징 — 아래로 퍼지는 빛 웅덩이
    const graze = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 1.85),
      new THREE.MeshBasicMaterial({
        map: grazeTexture(), color: lightGlowColor(), transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.16
      })
    );
    graze.position.set(t, 1.16, 0.028);
    graze.renderOrder = 2;
    group.add(graze);

    // 바닥 웅덩이
    const pool = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 0.85),
      new THREE.MeshBasicMaterial({
        map: glowTexture(), color: lightGlowColor(), transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.10
      })
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(t, 0.004, zCob + 0.22);
    pool.renderOrder = 2;
    group.add(pool);
  }

  const led = buildRoundLed();
  led.position.set(0, H, 0);
  booth.add(led);
  parts.led = led;

  parts.lightAnchor = group.localToWorld(new THREE.Vector3(0, H - 0.06, zCob));
  parts.lightTemp = tempK;
}

/* ---- 부스 생성 ---- */
function disposeBooth(){
  if (!booth) return;
  scene.remove(booth);
  booth.traverse(o => {
    if (o.geometry && !o.geometry.userData._keep) o.geometry.dispose();
    if (o.material){
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => {
        ['map','bumpMap','roughnessMap','emissiveMap'].forEach(k => {
          if (m[k] && m[k].userData && m[k].userData._clone) m[k].dispose();
        });
        m.dispose();
      });
    }
  });
  // 이전 스포트라이트의 target 정리
  (parts.spots || []).forEach(sp => { if (sp.target && sp.target.parent) sp.target.parent.remove(sp.target); });
  parts.spots = [];
}

function rebuild(){
  if (!scene) return;
  disposeBooth();
  hotspots.forEach(h => h.el.remove());
  hotspots = [];
  parts = Object.assign({}, parts);
  delete parts.doorWall; delete parts.ceiling; delete parts.ceilFrame; delete parts.cap;
  delete parts.lightGroup; delete parts.lightAnchor; delete parts.led; delete parts.projectAnchor; delete parts.projectGroup;

  booth = new THREE.Group();
  booth.name = 'booth';

  const W = state.w/1000, D = state.d/1000;
  const doorName = 'front';
  const slatName = state.slatPos || 'back';
  const winWall = (state.winPos && state.winPos !== slatName) ? state.winPos : (slatName === 'left' ? 'right' : 'left');
  const perp = ['left','right'];

  const doorX0 = doorX0Of(), doorW = DOOR_W;
  const doorOpen = { x0: doorX0, y0: 0, w: doorW, h: H };
  const wSpec = pick(WINDOWS, state.window);
  /* 시창 폭은 그 벽의 안쪽 폭에 맞춰 줄입니다 (후면은 가로, 옆벽은 세로 기준) */
  const winAvail = Math.max(0.4, (wallDesc(winWall).innerW || D) - 0.36);
  const winW = (wSpec && wSpec.w > 0) ? Math.min(wSpec.w, winAvail) : 0;
  const winOpen = winW > 0 ? { x0: -winW/2, y0: 1.08, w: winW, h: wSpec.h } : null;

  const walls = {};
  ['front','back','left','right'].forEach(name => {
    const openings = [];
    if (name === doorName) openings.push(doorOpen);
    if (winOpen && name === winWall) openings.push(winOpen);
    const isSlat = name === slatName;
    const g = buildWallGroup(name, openings, isSlat ? { noInner: true } : {
      innerHex: pick(ARTBOARD, state.artboard).hex,
      innerRough: pick(ARTBOARD, state.artboard).rough
    });
    booth.add(g);
    walls[name] = g;
    if (isSlat){
      buildSlatWall(g, wallDesc(name).innerW, pick(SLAT, state.slat).hex, pick(SLAT, state.slat).grain);
      g.userData.slatWall = true;
    }
    if (winOpen && openings.some(o => o === winOpen)) addWindow(g, winOpen, { double: !!wSpec.isDouble });
  });

  const doorWall = walls[doorName];
  buildDoor(doorWall, doorOpen, slatName);
  parts.doorWall = doorWall;

  // 바닥 (강화마루)
  const floorHex = pick(FLOOR, state.floor).hex;
  const floorGrain = pick(FLOOR, state.floor).grain;
  const fset = woodSet(floorHex, floorGrain, 5, 7);
  const fMap = fset.map.clone(); fMap.userData._clone = true; fMap.needsUpdate = true;
  const fBump = fset.bump.clone(); fBump.userData._clone = true; fBump.needsUpdate = true;
  const fRough = fset.rough.clone(); fRough.userData._clone = true; fRough.needsUpdate = true;
  const rep = [(W + 2*T)/1.15, (D + 2*T)/1.15];
  fMap.repeat.set(rep[0], rep[1]); fBump.repeat.copy(fMap.repeat); fRough.repeat.copy(fMap.repeat);
  const floorMat = stdMat({
    color: 0xffffff, map: fMap,
    bumpMap: fBump, bumpScale: 0.0018,
    roughnessMap: fRough, roughness: 1.0,
    metalness: 0.02, envMapIntensity: 0.8
  });
  const edgeMat = stdMat({ color: 0xE6E1D6, roughness: 0.78 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W + 2*T - 0.06, 0.12, D + 2*T - 0.06), [edgeMat, edgeMat, floorMat, edgeMat, edgeMat, edgeMat]);
  floor.position.y = -0.06;
  floor.receiveShadow = true; floor.castShadow = true;
  booth.add(floor);

  // 스튜디오 접지
  if (parts.groundContact){
    const s = Math.max(W, D) * 1.35 + 0.9;
    parts.groundContact.scale.set(s, s, 1);
    parts.groundBounce.scale.setScalar(Math.max(1, Math.max(W, D) * 0.9));
  }

  // 천장
  const ceilGroup = new THREE.Group();
  booth.add(ceilGroup);
  parts.ceiling = ceilGroup;

  const cf = new THREE.Group();
  const cfMat = trimsMat();
  const cfBars = [];
  cfBars.push([W, 0.03, 0.03, 0, -(D/2 - 0.015)]);
  cfBars.push([W, 0.03, 0.03, 0, D/2 - 0.015]);
  cfBars.push([0.03, 0.03, D - 0.06, -(W/2 - 0.015), 0]);
  cfBars.push([0.03, 0.03, D - 0.06, W/2 - 0.015, 0]);
  cfBars.forEach(([bw, bh, bd, bx, bz]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), cfMat);
    m.position.set(bx, H - 0.014, bz);
    cf.add(m);
  });
  booth.add(cf);
  parts.ceilFrame = cf;

  const projHole = state.project === 'in' ? projectWindowRect(W, D) : null;
  const plan = lightLayout(slatName);
  buildCeilingFace(ceilGroup, W, D, projHole, plan.cobHoles);
  const projGroup = new THREE.Group();
  projGroup.name = 'projectWindow';
  booth.add(projGroup);
  parts.projectGroup = projGroup;
  if (projHole) addProjectWindow(projGroup, projHole);

  parts.cap = null;
  if (!projHole){
    const cap = new THREE.Mesh(new THREE.BoxGeometry(W + 2*T, 0.02, D + 2*T), skinMaterial());
    cap.position.set(0, WALL_TOP + 0.01, 0);
    cap.castShadow = true; cap.receiveShadow = true;
    booth.add(cap);
    parts.cap = cap;
  }

  // 조명
  if (parts.fillLight) parts.fillLight.color.set(ledTempPick().light);
  buildLights(plan);

  // 콘센트 · 스위치
  if (walls[slatName]){
    const sw = wallDesc(slatName).innerW;
    addPlate(walls[slatName], Math.min(sw/2 - 0.3, sw * 0.2), 0.34, 'outlet');
  }
  const swX = state.door === 'right' ? doorX0 + doorW + 0.13 : doorX0 - 0.13;
  addPlate(doorWall, swX, 1.14, 'switch');

  // 에어컨 라인 매설 표시
  if (state.ac){
    const aw = perp[0];
    const aw2 = walls[aw];
    const sw = wallDesc(aw).innerW;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.13, 0.011), stdMat({ color: 0xF4F1E9, roughness: 0.5 }));
    plate.position.set(sw * 0.3, 1.88, T/2 + 0.0085);
    aw2.add(plate);
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.12, 0.004), stdMat({ color: 0xD9D3C6, roughness: 0.9 }));
    groove.position.set(sw * 0.3, 1.985, T/2 + 0.0065);
    aw2.add(groove);
  }

  parts.walls = walls;
  booth.updateMatrixWorld(true);
  buildHotspots(walls, slatName, doorName, perp, winWall);
  buildDimensions(W, D);
  applyViewState();
  scene.add(booth);
  fitCamera(false);
  if (state.view === 'photo') renderPhotoStage();
}

/* ---- 문 (바깥으로 열림 · 바깥 기준 좌/우경첩) ---- */
function buildDoor(g, o, slatName){
  const gasket = stdMat({ color: 0x141618, roughness: 0.9 });
  const white = stdMat({ color: 0xF8F5EE, roughness: 0.42, metalness: 0.02, envMapIntensity: 0.75 });
  const doorZ = -0.012;

  // 문틀 (실내쪽)
  const jamb = 0.045;
  [[o.x0 - jamb/2, (o.h)/2, jamb, o.h + 0.02],
   [o.x0 + o.w + jamb/2, (o.h)/2, jamb, o.h + 0.02],
   [o.x0 + o.w/2, o.h - jamb/2, o.w + jamb*2, jamb]].forEach(([x, y, w, h]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, T + 0.016), white);
    m.position.set(x, y, 0);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  });
  // 바깥쪽 아키트레이브 (사진의 넓은 흰 몰딩)
  const arch = 0.062;
  [[o.x0 - arch/2 - 0.004, (o.h)/2, arch, o.h + arch],
   [o.x0 + o.w + arch/2 + 0.004, (o.h)/2, arch, o.h + arch],
   [o.x0 + o.w/2, o.h - 0.004 + arch/2, o.w + arch*2 + 0.008, arch]].forEach(([x, y, w, h]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.022), white);
    m.position.set(x, y, -T/2 - 0.011);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  });

  // 기밀 스트립
  [[o.x0 + 0.012, o.h/2, 0.012, o.h], [o.x0 + o.w - 0.012, o.h/2, 0.012, o.h], [o.x0 + o.w/2, o.h - 0.012, o.w, 0.012]].forEach(([x,y,w,h]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.026), gasket);
    m.position.set(x, y, doorZ + 0.01);
    g.add(m);
  });

  // 상부 트랜섬
  const transH = 0.15;
  const trans = new THREE.Mesh(new THREE.BoxGeometry(o.w - 0.012, transH, 0.05), white);
  trans.position.set(o.x0 + o.w/2, o.h - jamb - transH/2 + 0.004, doorZ);
  trans.castShadow = true; trans.receiveShadow = true;
  g.add(trans);
  const tGasket = new THREE.Mesh(new THREE.BoxGeometry(o.w - 0.01, 0.01, 0.03), gasket);
  tGasket.position.set(o.x0 + o.w/2, o.h - jamb - transH + 0.004, doorZ);
  g.add(tGasket);

  // 문짝 (front 벽은 rotY=π 이므로 바깥 기준 우측=-X(o.x0), 좌측=+X(o.x0+o.w))
  const hingeRight = state.hinge === 'right';
  const dir = hingeRight ? 1 : -1;
  const pivotX = hingeRight ? (o.x0 + 0.015) : (o.x0 + o.w - 0.015);
  const leafW = o.w - 0.03, leafH = o.h - jamb - transH + 0.004 - 0.006;
  const pivot = new THREE.Group();
  pivot.position.set(pivotX, 0.012, doorZ);
  g.add(pivot);

  const glassW = 0.30, glassH = 1.30;
  const holeCx = dir * 0.02;
  const holeCy = -leafH/2 + 0.34 + glassH/2;
  const holes = [{ x0: holeCx - glassW/2, y0: holeCy - glassH/2, w: glassW, h: glassH }];
  const leaf = holePanel(leafW, leafH, 0.046, holes, white);
  leaf.position.set(dir * leafW/2, leafH/2, 0);
  // 얇은 판재는 자기 그림자 아크네(점선)가 생기므로 문짝 자체는 그림자를 던지지 않습니다
  leaf.traverse(o => { if (o.isMesh){ o.castShadow = false; o.receiveShadow = false; } });
  pivot.add(leaf);

  // 유리창틀 & 유리 — 구멍(holeCx, holeCy)과 정확히 같은 leaf 좌표계에 배치
  const gFrameTop = new THREE.Mesh(new THREE.BoxGeometry(glassW + 0.028, 0.016, 0.052), gasket);
  gFrameTop.position.set(holeCx, holeCy + glassH/2 + 0.005, 0);
  leaf.add(gFrameTop);
  const gFrameBot = gFrameTop.clone();
  gFrameBot.position.set(holeCx, holeCy - glassH/2 - 0.005, 0);
  leaf.add(gFrameBot);
  const gFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.016, glassH + 0.026, 0.052), gasket);
  gFrameL.position.set(holeCx - glassW/2 - 0.005, holeCy, 0);
  leaf.add(gFrameL);
  const gFrameR = gFrameL.clone();
  gFrameR.position.set(holeCx + glassW/2 + 0.005, holeCy, 0);
  leaf.add(gFrameR);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(glassW - 0.002, glassH - 0.002), glassMaterial());
  glass.position.set(holeCx, holeCy, 0.004);
  glass.renderOrder = 4;
  leaf.add(glass);
  const glass2 = glass.clone();
  glass2.rotation.y = Math.PI;
  glass2.position.z = -0.004;
  leaf.add(glass2);

  // 손잡이 — 사진의 긴 백플레이트 레버
  const handle = new THREE.Group();
  const hx = dir * (leafW - 0.105);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.20, 0.007), metalMat());
  plate.position.set(hx, 1.02, 0.028);
  plate.castShadow = true;
  handle.add(plate);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.019, 0.021), metalMat());
  lever.position.set(dir * (leafW - 0.155), 1.045, 0.043);
  lever.castShadow = true;
  handle.add(lever);
  const plate2 = plate.clone(); plate2.position.z = -0.028;
  handle.add(plate2);
  const lever2 = lever.clone(); lever2.position.z = -0.043;
  handle.add(lever2);
  pivot.add(handle);

  // 경첩
  [0.3, 1.0, 1.68].forEach(y => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.105, 0.024), metalMat());
    h.position.set(dir * 0.004, y, -0.022);
    h.castShadow = true;
    pivot.add(h);
  });

  pivot.userData.dir = dir;
  pivot.rotation.y = state.open ? dir * DOOR_OPEN : 0;
  g.userData.doorPivot = pivot;
  parts.doorPivot = pivot;
}

/* ---- 천장 (COB 매립홀 · 프로젝트창 개구부를 실제로 뚫습니다) ---- */
function buildCeilingFace(parent, W, D, projHole, cobHoles){
  const shape = new THREE.Shape();
  shape.moveTo(-W/2, -D/2);
  shape.lineTo( W/2, -D/2);
  shape.lineTo( W/2,  D/2);
  shape.lineTo(-W/2,  D/2);
  shape.closePath();
  if (projHole){
    const p = new THREE.Path();
    p.moveTo(projHole.x0, projHole.z0);
    p.lineTo(projHole.x0, projHole.z0 + projHole.d);
    p.lineTo(projHole.x0 + projHole.w, projHole.z0 + projHole.d);
    p.lineTo(projHole.x0 + projHole.w, projHole.z0);
    p.closePath();
    shape.holes.push(p);
  }
  (cobHoles || []).forEach(c => {
    const p = new THREE.Path();
    p.absarc(c.x, c.z, 0.0535, 0, Math.PI * 2, true);
    shape.holes.push(p);
  });
  const geo = new THREE.ShapeGeometry(shape, 20);
  const face = new THREE.Mesh(geo, ceilMaterial());
  face.rotation.x = Math.PI / 2;   // shape의 y → world z, 법선은 아래
  face.position.y = H;
  face.receiveShadow = true;
  face.castShadow = true;          // 실내로 외부광이 새지 않게
  parent.add(face);

  // 천장 구조층(상부) — 위에서 볼 때만 보입니다
  const topShape = new THREE.Shape();
  topShape.moveTo(-W/2, -D/2);
  topShape.lineTo( W/2, -D/2);
  topShape.lineTo( W/2,  D/2);
  topShape.lineTo(-W/2,  D/2);
  topShape.closePath();
  const topGeo = new THREE.ShapeGeometry(topShape, 8);
  const topFace = new THREE.Mesh(topGeo, ceilMaterial());
  topFace.rotation.x = -Math.PI / 2;
  topFace.position.y = H + SKIN;
  topFace.receiveShadow = true;
  topFace.castShadow = true;
  parent.add(topFace);

  // 천장 슬래브 테두리
  const band = new THREE.Mesh(new THREE.BoxGeometry(W, SKIN, 0.012), skinMaterial());
  [-1, 1].forEach(sd => {
    const b = band.clone();
    b.position.set(0, H + SKIN/2, sd * (D/2 - 0.006));
    parent.add(b);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.012, SKIN, D), skinMaterial());
    b2.position.set(sd * (W/2 - 0.006), H + SKIN/2, 0);
    parent.add(b2);
  });
  band.geometry.dispose();

  // 천장 판 이음 (사진의 얇은 줄눈) — 프로젝트창 개구부는 빼고 긋습니다
  const seamMat = stdMat({ color: 0xDCD4C2, roughness: 0.95 });
  [-1, 1].forEach(sd => {
    if (D <= 1.4) return;
    const z = sd * D * 0.24;
    const cut = projHole && z > projHole.z0 - 0.012 && z < projHole.z0 + projHole.d + 0.012;
    const spans = cut
      ? [[-W/2 + 0.01, projHole.x0], [projHole.x0 + projHole.w, W/2 - 0.01]]
      : [[-W/2 + 0.01, W/2 - 0.01]];
    spans.forEach(([a, b]) => {
      const len = b - a;
      if (len < 0.08) return;
      const seam = new THREE.Mesh(new THREE.BoxGeometry(len, 0.0015, 0.005), seamMat);
      seam.position.set((a + b)/2, H - 0.0004, z);
      parent.add(seam);
    });
  });
}

/* ---- 프로젝트창(천장 개폐창) 자리 ----------------
   천장 가운데 원형 LED(반지름 0.185m)와 COB 매립등(문 맞은편 벽 쪽 z≈-0.48m)을
   피해서 왼쪽·문 쪽 구석에 비켜 놓습니다. 규격이 작아 구석까지 거리가 모자라면
   LED와 여유 간격이 살아날 때까지 개구부를 조금씩 줄입니다. */
const PROJ_SIZE = 0.6;     // 표준 프로젝트창 한 변(m)
const PROJ_INSET = 0.04;   // 천장 안쪽 면에서 띄우는 값(m)
const PROJ_CLEAR = 0.26;   // 중앙 LED 중심 ~ 개구부 모서리 최소 거리(m)
function projectWindowRect(W, D){
  const x0 = -W/2 + PROJ_INSET;
  const z1 = D/2 - PROJ_INSET;
  let s = Math.min(PROJ_SIZE, W - PROJ_INSET*2, D - PROJ_INSET*2);
  s = Math.round(s * 100) / 100;
  while (s > 0.34){
    if (Math.hypot(x0 + s, z1 - s) >= PROJ_CLEAR) break;
    s = Math.round((s - 0.02) * 100) / 100;
  }
  return { x0, z0: Math.round((z1 - s) * 1000) / 1000, w: s, d: s };
}

function addProjectWindow(parent, h){
  const g = new THREE.Group();
  const cx = h.x0 + h.w/2, cz = h.z0 + h.d/2;
  const fw = 0.032, depth = SKIN + 0.024;
  const frameMat = trimsMat();
  const y = H + SKIN/2;
  [[h.w + fw*2, fw, cx, h.z0 - fw/2], [h.w + fw*2, fw, cx, h.z0 + h.d + fw/2],
   [fw, h.d, h.x0 - fw/2, cz], [fw, h.d, h.x0 + h.w + fw/2, cz]].forEach(([bw, bd, bx, bz]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, depth, bd), frameMat);
    m.position.set(bx, y, bz);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  });
  // 개구부 안쪽 밝은 리빌
  const reveal = new THREE.Mesh(
    new THREE.BoxGeometry(h.w, 0.01, h.d),
    new THREE.MeshStandardMaterial({ color: 0xF6F2E8, emissive: 0xFFF6E4, emissiveIntensity: 0.35, roughness: 0.8 })
  );
  reveal.position.set(cx, H + 0.004, cz);
  g.add(reveal);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(h.w - 0.012, h.d - 0.012), glassMaterial());
  glass.rotation.x = Math.PI / 2;
  glass.position.set(cx, H + 0.002, cz);
  g.add(glass);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, h.w * 0.8, 16), metalMat());
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(cx, H + SKIN - 0.03, h.z0 + 0.02);
  g.add(hinge);
  const knob = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.013, 0.013), metalMat());
  knob.position.set(cx, H + 0.014, h.z0 + h.d - 0.07);
  g.add(knob);
  parent.add(g);
  parts.projectAnchor = new THREE.Vector3(cx, H + 0.03, cz);
  return g;
}

/* ---- 치수선 ---- */
let dimGroup = null;
function spriteLabel(text){
  const c = cv2d(384, 96);
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
  seg(p(-W/2 - T, zf), p(W/2 + T, zf));
  seg(p(-W/2 - T, zf - 0.07), p(-W/2 - T, zf + 0.03));
  seg(p(W/2 + T, zf - 0.07), p(W/2 + T, zf + 0.03));
  const l1 = spriteLabel(fmt(state.w) + ' mm');
  l1.position.set(0, y + 0.02, zf + 0.15);
  g.add(l1);
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
function buildHotspots(walls, slatName, doorName, perp, winWall){
  const slat = walls[slatName];
  if (slat){
    const inward = new THREE.Vector3(0,0,1).applyQuaternion(slat.quaternion);
    addHotspot(wallPoint(slatName, 0, 1.5, T/2).addScaledVector(wallInward(slatName), 0.05), '1면 라인타공', 'in');
  }
  if (parts.lightAnchor){
    addHotspot(parts.lightAnchor.clone(), state.light === 'rail' ? '레일등' : 'COB 매립등', 'in');
  }
  const dw = walls[doorName];
  if (dw){
    addHotspot(wallPoint(doorName, doorX0Of() + DOOR_W/2, 1.25, T/2).addScaledVector(wallInward(doorName), 0.06), '시스템도어', 'out');
  }
  if (state.window !== 'none'){
    const wSpec = pick(WINDOWS, state.window);
    const wLabel = wSpec.isDouble ? '이중창 1,200×800' : `시창 ${wSpec.label}`;
    const wall = winWall || perp[0];
    addHotspot(wallPoint(wall, 0, 1.52, T/2).addScaledVector(wallInward(wall), 0.05), wLabel);
  }
  if (state.project === 'in' && parts.projectAnchor) addHotspot(parts.projectAnchor.clone(), '프로젝트창', 'in');
  if (state.ac){
    const sw = wallDesc(perp[0]).innerW;
    addHotspot(wallPoint(perp[0], sw * 0.3, 1.9, T/2).addScaledVector(wallInward(perp[0]), 0.05), '에어컨 라인 매설', 'in');
  }
}

/* ---- 시점 ---- */
const cam = { theta: 0.62, phi: 1.14, r: 6, ty: 0.9, fov: 38, tx: 0, tz: 0 };
const camTarget = { ...cam };
let camAnim = 0;
let dragging = false;

function aspectFactor(){
  const a = camera.aspect;
  return a >= 1 ? 1 : Math.pow(1/a, 0.86);
}
function slatWallOfDoor(){ return 'back'; }
function doorCenterX(){ return -(doorX0Of() + DOOR_W/2); }
function interiorSetup(){
  /* 문 쪽에 서서 타공판 벽을 바라보는 구도 — 타공판이 옆벽이면 그 벽을 향해 돕니다. */
  const W = state.w/1000, D = state.d/1000;
  const ty = 1.31;               // 눈높이 아래를 살짝 내려다보는 타깃
  const phi = 1.472;
  const slat = state.slatPos || 'back';
  if (slat === 'back'){
    const tz = -(D/2 - 0.06);    // 라인타공 벽면 살짝 앞
    const camZ = D/2 - 0.26;     // 문 쪽에 선 카메라
    const r = Math.max(0.6, (camZ - tz) / Math.sin(phi));
    return { theta: 0.0, phi, r, ty, tx: 0, tz, fov: isSmall() ? 78 : 70 };
  }
  const side = slat === 'left' ? -1 : 1;
  const tx = side * (W/2 - 0.12);                  // 타공판 벽면 가운데를 조준
  const dx = -side * (0.72 * (W/2) + (W/2 - 0.12)); // 반대쪽 뒤 코너에 서서
  const dz = -(D/2 - 0.35);
  const dy = 0.46;
  const r = Math.hypot(dx, dz, dy);
  return { theta: Math.atan2(dx, dz), phi: Math.acos(dy / r), r, ty: 1.14, tx, tz: 0, fov: isSmall() ? 84 : 76 };
}
/* 시점 중심에서 방 안을 벗어나지 않는 최대 반경 */
function maxInsideR(theta, phi, tx, ty, tz){
  const W = state.w/1000, D = state.d/1000;
  const dir = new THREE.Vector3(
    Math.sin(theta) * Math.sin(phi),
    Math.cos(phi),
    Math.cos(theta) * Math.sin(phi)
  );
  const lo = { x: -W/2 + 0.13, y: 0.24, z: -D/2 + 0.13 };
  const hi = { x: W/2 - 0.13, y: H - 0.15, z: D/2 - 0.13 };
  const t0 = { x: tx, y: ty, z: tz };
  let tmax = Infinity;
  ['x','y','z'].forEach(ax => {
    const dv = dir[ax];
    if (Math.abs(dv) < 1e-5) return;
    const tv = dv > 0 ? (hi[ax] - t0[ax]) / dv : (lo[ax] - t0[ax]) / dv;
    if (tv > 0) tmax = Math.min(tmax, tv);
  });
  return isFinite(tmax) ? Math.max(0.35, tmax - 0.05) : 2.4;
}
function viewSettings(name){
  const W = state.w/1000, D = state.d/1000;
  const S = Math.hypot(W, D) * 0.94;
  const base = (S * 2.7 + 1.4) * aspectFactor() * (isSmall() ? 0.93 : 1);
  const dx = doorCenterX();
  switch (name){
    case 'interior': return interiorSetup();
    case 'door':     return { theta: 0.0, phi: 1.445, r: base * 0.86, ty: 1.0, tx: dx, tz: 0, fov: 30 };
    case 'top':      return { theta: 0.45, phi: 0.20, r: base * 0.98, ty: 0.35, tx: 0, tz: 0, fov: 36 };
    default:         return { theta: 0.62, phi: 1.13, r: base * 1.0, ty: 0.92, tx: 0, tz: 0, fov: 38 };
  }
}
/* ---- 실사 보기: 실제 시공 사진(interior-academy.jpg) 기반 실시간 컬러 체인저 ---- */
const photoCache = { ready: false, loading: false, w: 1500, h: 1125, orig: null, cov: null };
function photoHexToRgb(hex){
  const n = parseInt(String(hex || '#D8C6A6').replace('#',''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const photoWinImgs = {};
function preloadPhotoWins(){
  const map = {
    '600x800': 'assets/win-600.png?v=8',
    '800x800': 'assets/win-800.png?v=8',
    '1200x800': 'assets/win-1200.png?v=8',
    'double1200': 'assets/win-double.png?v=8',
    'rail_ceiling': 'assets/ceiling-rail.png?v=9',
    'slat_nocob': 'assets/slat-nocob.png?v=4',
    'side_left': 'assets/side-slat-left.png?v=2',
    'side_right': 'assets/side-slat-right.png?v=2',
    'back_art': 'assets/back-artboard.png?v=2',
    'back_600x800': 'assets/win-600x800-back.png?v=4',
    'back_800x800': 'assets/win-800x800-back.png?v=4',
    'back_1200x800': 'assets/win-1200x800-back.png?v=4',
    'back_double1200': 'assets/win-double-back.png?v=4',
    'ceiling_clean': 'assets/ceiling-clean.webp?v=1',
    'side_light_left': 'assets/side-light-left.webp?v=1',
    'side_light_right': 'assets/side-light-right.webp?v=1',
    'side_rail_left': 'assets/side-rail-left.webp?v=2',
    'side_rail_right': 'assets/side-rail-right.webp?v=2',
    'glow_back_rail': 'assets/wallglow-back-rail.png?v=2'
  };
  const dataTargets = {
    'slat_nocob': 'nocobOrig',
    'side_left': 'sideLeftOrig',
    'side_right': 'sideRightOrig',
    'back_art': 'backArtOrig',
    'ceiling_clean': 'ceilCleanOrig'
  };
  Object.keys(map).forEach(k => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      if (dataTargets[k] && im.naturalWidth){
        const c = document.createElement('canvas');
        c.width = photoCache.w; c.height = photoCache.h;
        const cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(im, 0, 0, photoCache.w, photoCache.h);
        photoCache[dataTargets[k]] = cx.getImageData(0, 0, photoCache.w, photoCache.h).data;
      }
      if (state.view === 'photo') renderPhotoStage();
    };
    im.src = map[k];
    photoWinImgs[k] = im;
  });
}
function initPhotoCache(cb){
  if (photoCache.ready) return cb();
  if (photoCache.loading) return;
  photoCache.loading = true;
  preloadPhotoWins();
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const W = photoCache.w, H = photoCache.h;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, W, H);
    photoCache.orig = ctx.getImageData(0, 0, W, H).data;

    /* 영역별 커버리지를 따로 뽑아 경계를 흐리게(페더링) — 픽셀 계단 없이 색이 얹힙니다 */
    const REGIONS = {
      art:   [[[0,0],[1,0],[0.6407,0.3511],[0.3753,0.3520]],
              [[0,0],[0.3753,0.3520],[0.3760,0.6667],[0.1020,1],[0,1]]],   // 천장 + 좌벽
      back:  [[[0.3753,0.3520],[0.6407,0.3511],[0.6407,0.6667],[0.3760,0.6667]]],  // 정면 뒷벽
      floor: [[[0.3760,0.6667],[0.6407,0.6667],[0.9573,1],[0.1020,1]]],           // 강화마루
      right: [[[1,0],[0.6407,0.3511],[0.6407,0.6667],[0.9573,1],[1,1]]]            // 우벽
    };
    const EXCL = [
      [[0.4520,0.1129],[0.5880,0.1129],[0.5660,0.2222],[0.4747,0.2222]],  // 중앙 LED등
      [[0.5340,0.6089],[0.5447,0.6089],[0.5447,0.6338],[0.5340,0.6338]]   // 뒷벽 콘센트
    ];
    const trace = (x, pts) => {
      x.beginPath();
      pts.forEach(([px, py], i) => i ? x.lineTo(px * W, py * H) : x.moveTo(px * W, py * H));
      x.closePath();
    };
    const buildCov = (polys, excl = true) => {
      const raw = document.createElement('canvas'); raw.width = W; raw.height = H;
      const rx = raw.getContext('2d', { willReadFrequently: true });
      rx.fillStyle = '#fff';
      polys.forEach(pts => { trace(rx, pts); rx.fill(); });
      if (excl){
        rx.fillStyle = '#000';
        EXCL.forEach(pts => { trace(rx, pts); rx.fill(); });
      }
      const bl = document.createElement('canvas'); bl.width = W; bl.height = H;
      const bx = bl.getContext('2d', { willReadFrequently: true });
      bx.filter = 'blur(2px)';
      bx.drawImage(raw, 0, 0);
      const d = bx.getImageData(0, 0, W, H).data;
      const cov = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) cov[i] = d[i * 4];
      return cov;
    };
    photoCache.cov = {
      art: buildCov(REGIONS.art),
      back: buildCov(REGIONS.back),
      backFull: buildCov(REGIONS.back, false),
      floor: buildCov(REGIONS.floor),
      right: buildCov(REGIONS.right)
    };
    photoCache.ready = true;
    photoCache.loading = false;
    cb();
  };
  img.src = 'assets/interior-academy-clean.jpg?v=3';
}
function drawPhotoCeilingLight(ctx, W, H){
  /* 천장 조명: 후면 타공판이면 사진 원본의 COB 2구를 그대로 쓰고,
     옆벽 타공판이면 후면 COB를 지운 천장 패치 위에 그 벽 천장용 조명을 얹습니다 */
  const pos = state.slatPos || 'back';
  const rail = state.light === 'rail';
  if (pos === 'back'){
    if (!rail) return;                       // COB 2구는 원본 사진에 이미 있습니다
    const bar = photoWinImgs.rail_ceiling;
    if (bar && bar.complete && bar.naturalWidth) ctx.drawImage(bar, 0, 0, W, H);
    const g = photoWinImgs.glow_back_rail;
    if (g && g.complete && g.naturalWidth){
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.62;
      ctx.drawImage(g, 0, 0, W, H);
      ctx.restore();
    }
    return;
  }
  const im = photoWinImgs[`side_${rail ? 'rail' : 'light'}_${pos}`];
  if (im && im.complete && im.naturalWidth) ctx.drawImage(im, 0, 0, W, H);
}
function drawPhotoWindow(ctx, W, H, winVal){
  if (!winVal || winVal === 'none') return;
  /* 시창 위치: 좌측은 오른쪽 벽용 원본을 좌우 반대로, 후면은 후면 벽용으로 미리 만든 이미지를 썺니다 */
  const pos = state.winPos || 'left';
  const im = photoWinImgs[pos === 'back' ? `back_${winVal}` : winVal];
  if (!im || !im.complete || !im.naturalWidth) return;
  ctx.save();
  if (winVal === 'double1200') ctx.filter = 'drop-shadow(-4px 4px 6px rgba(0,0,0,0.28))';
  else ctx.filter = 'drop-shadow(-2px 2px 3px rgba(0,0,0,0.14))';
  if (pos === 'left'){
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(im, 0, 0, W, H);
  ctx.restore();
}
function renderPhotoStage(){
  const cvs = $('#photoStage');
  if (!cvs) return;
  initPhotoCache(() => {
    const W = photoCache.w, H = photoCache.h;
    if (cvs.width !== W || cvs.height !== H){ cvs.width = W; cvs.height = H; }
    const ctx = cvs.getContext('2d');
    const out = ctx.createImageData(W, H);
    const dst = out.data;
    const src = photoCache.orig;
    const nocob = (state.light === 'rail' && photoCache.nocobOrig) ? photoCache.nocobOrig : null;
    const slatPos = state.slatPos || 'back';
    const sideL = (slatPos === 'left' && photoCache.sideLeftOrig) ? photoCache.sideLeftOrig : null;
    const sideR = (slatPos === 'right' && photoCache.sideRightOrig) ? photoCache.sideRightOrig : null;
    const backArt = (slatPos !== 'back' && photoCache.backArtOrig) ? photoCache.backArtOrig : null;
    /* 후면 COB 2구를 쓰지 않는 조합에서는 천장에서 그 구멍·빛혼적을 지운 패치를 먼저 씌웁니다 */
    const ceilClean = ((slatPos !== 'back' || state.light === 'rail') && photoCache.ceilCleanOrig) ? photoCache.ceilCleanOrig : null;
    const cA = photoCache.cov.art, cB = (backArt ? photoCache.cov.backFull : photoCache.cov.back), cF = photoCache.cov.floor, cR = photoCache.cov.right;

    const aRgb = photoHexToRgb(pick(ARTBOARD, state.artboard).hex);
    const sRgb = photoHexToRgb(pick(SLAT, state.slat).hex);
    const fRgb = photoHexToRgb(pick(FLOOR, state.floor).hex);
    const isPine = state.floor === 'pine';
    const n = W * H;

    for (let i = 0, p = 0; i < n; i++, p += 4){
      const wA = cA[i], wB = cB[i], wF = cF[i], wR = cR[i];
      if (!(wA | wB | wF | wR)){
        dst[p] = src[p]; dst[p+1] = src[p+1]; dst[p+2] = src[p+2]; dst[p+3] = 255;
        continue;
      }
      const sr = src[p], sg = src[p+1], sb = src[p+2];
      let tr = 0, tg = 0, tb = 0, tw = 0;
      let wArt = 0, wSlat = 0, wFloor = 0;

      /* 천장 + 좌벽 (아트보드 / 슬랫 오버레이가 있으면 그 픽셀은 슬랫) */
      if (wA){
        let r = sr, g = sg, b = sb, k = 0;
        if (sideL){ const a = sideL[p+3]; if (a){ k = a / 255; r = r*(1-k) + sideL[p]*k; g = g*(1-k) + sideL[p+1]*k; b = b*(1-k) + sideL[p+2]*k; } }
        if (ceilClean){ const a = ceilClean[p+3]; if (a){ const kc = a / 255; r = r*(1-kc) + ceilClean[p]*kc; g = g*(1-kc) + ceilClean[p+1]*kc; b = b*(1-kc) + ceilClean[p+2]*kc; } }
        wArt += wA * (1-k); wSlat += wA * k;
        tr += wA*r; tg += wA*g; tb += wA*b; tw += wA;
      }
      /* 우벽 */
      if (wR){
        let r = sr, g = sg, b = sb, k = 0;
        if (sideR){ const a = sideR[p+3]; if (a){ k = a / 255; r = r*(1-k) + sideR[p]*k; g = g*(1-k) + sideR[p+1]*k; b = b*(1-k) + sideR[p+2]*k; } }
        wArt += wR * (1-k); wSlat += wR * k;
        tr += wR*r; tg += wR*g; tb += wR*b; tw += wR;
      }
      /* 정면 뒷벽 (기본 슬랫 / 아트보드 오버레이 / 레일등용 COB 제거 패치) */
      if (wB){
        let r = sr, g = sg, b = sb, kA = 0;
        if (backArt){
          const a = backArt[p+3];
          if (a){ kA = a / 255; r = r*(1-kA) + backArt[p]*kA; g = g*(1-kA) + backArt[p+1]*kA; b = b*(1-kA) + backArt[p+2]*kA; }
        } else if (nocob){
          const a = nocob[p+3];
          if (a){ const k = a / 255; r = r*(1-k) + nocob[p]*k; g = g*(1-k) + nocob[p+1]*k; b = b*(1-k) + nocob[p+2]*k; }
        }
        wArt += wB * kA; wSlat += wB * (1-kA);
        tr += wB*r; tg += wB*g; tb += wB*b; tw += wB;
      }
      /* 바닥 */
      if (wF){
        wFloor += wF;
        tr += wF*sr; tg += wF*sg; tb += wF*sb; tw += wF;
      }

      if (tw > 0){ tr /= tw; tg /= tw; tb /= tw; }
      wArt /= 255; wSlat /= 255; wFloor /= 255;
      const nw = wArt + wSlat + wFloor || 1;
      wArt /= nw; wSlat /= nw; wFloor /= nw;

      const lum = (0.299 * tr + 0.587 * tg + 0.114 * tb) / 255;
      let orr = 0, og = 0, ob = 0;

      if (wArt > 0.002){
        /* 아트보드: 기본 사진 밝기(~0.68)를 기준으로 목표 색상 입히기 (질감·조명 보존) */
        const gain = Math.min(1.42, lum / 0.68);
        orr += wArt * aRgb[0] * gain; og += wArt * aRgb[1] * gain; ob += wArt * aRgb[2] * gain;
      }
      if (wSlat > 0.002){
        /* 라인타공: 어두운 틈새(lum < 0.28)는 유지하고 나무 살만 톤 변경 */
        if (lum < 0.28){
          orr += wSlat * tr; og += wSlat * tg; ob += wSlat * tb;
        } else {
          const gain = Math.min(1.45, lum / 0.52);
          orr += wSlat * (tr * 0.22 + sRgb[0] * gain * 0.78);
          og  += wSlat * (tg * 0.22 + sRgb[1] * gain * 0.78);
          ob  += wSlat * (tb * 0.22 + sRgb[2] * gain * 0.78);
        }
      }
      if (wFloor > 0.002){
        if (!isPine){
          orr += wFloor * tr; og += wFloor * tg; ob += wFloor * tb;
        } else {
          const gain = Math.min(1.45, lum / 0.55);
          orr += wFloor * (tr * 0.18 + fRgb[0] * gain * 0.82);
          og  += wFloor * (tg * 0.18 + fRgb[1] * gain * 0.82);
          ob  += wFloor * (tb * 0.18 + fRgb[2] * gain * 0.82);
        }
      }
      dst[p]   = orr > 255 ? 255 : orr;
      dst[p+1] = og > 255 ? 255 : og;
      dst[p+2] = ob > 255 ? 255 : ob;
      dst[p+3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    drawPhotoCeilingLight(ctx, W, H);
    drawPhotoWindow(ctx, W, H, state.window);
  });
}

function setView(name, force = false){
  state.view = name;
  const isPhotoIn = name === 'photo';
  const isPhotoOut = name === 'photo-out';
  const isAnyPhoto = isPhotoIn || isPhotoOut;
  const activeMode = isAnyPhoto ? 'photo' : '3d';
  document.querySelectorAll('#modeSwitch button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === activeMode ? 'true' : 'false'));
  document.querySelectorAll('#subViews button').forEach(b => {
    b.style.display = b.dataset.group === activeMode ? '' : 'none';
    b.setAttribute('aria-pressed', b.dataset.view === name ? 'true' : 'false');
  });
  const ps = $('#photoStage');
  const po = $('#photoOutStage');
  if (ps) { ps.hidden = !isPhotoIn; ps.style.display = isPhotoIn ? 'block' : 'none'; }
  if (po) { po.hidden = !isPhotoOut; po.style.display = isPhotoOut ? 'block' : 'none'; }
  const hs = $('#hsLayer');
  if (hs) hs.style.display = isAnyPhoto ? 'none' : '';
  ['doorToggle', 'hsToggle', 'resetView'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isAnyPhoto ? 'none' : '';
  });
  const vw = document.querySelector('.views-wrap');
  if (vw) vw.style.bottom = isAnyPhoto ? '16px' : '58px';
  const hint = document.querySelector('.stage-foot .hint');
  if (hint) hint.style.display = isAnyPhoto ? 'none' : '';
  if (isPhotoIn){
    renderPhotoStage();
    return;
  }
  if (isPhotoOut) return;
  const v = viewSettings(name);
  camTarget.theta = v.theta; camTarget.phi = v.phi; camTarget.r = v.r;
  camTarget.ty = v.ty; camTarget.fov = v.fov; camTarget.tx = v.tx || 0; camTarget.tz = v.tz || 0;
  if (force){
    Object.assign(cam, camTarget);
    camAnim = 0;
  } else {
    camAnim = performance.now();
  }
  applyViewState();
}
function fitCamera(immediate){
  if (!camera) return;
  const v = viewSettings(state.view);
  camTarget.r = v.r;
  camTarget.ty = v.ty;
  camTarget.tx = v.tx || 0;
  camTarget.tz = v.tz || 0;
  camTarget.theta = cam.theta;
  camTarget.phi = cam.phi;
  camTarget.fov = v.fov;
  if (immediate){
    cam.r = v.r; cam.ty = v.ty; cam.tx = camTarget.tx; cam.tz = camTarget.tz; camAnim = 0;
  } else {
    camAnim = performance.now();
  }
}
function updateCameraState(){
  const inside = state.view === 'interior';
  const phiMin = inside ? 0.55 : 0.08;
  const phiMax = inside ? 1.70 : 1.52;
  cam.phi = Math.max(phiMin, Math.min(phiMax, cam.phi));
  const v = cam;
  const sp = Math.sin(v.phi);
  camera.position.set(
    v.tx + Math.sin(v.theta) * sp * v.r,
    v.ty + Math.cos(v.phi) * v.r,
    v.tz + Math.cos(v.theta) * sp * v.r
  );
  camera.lookAt(v.tx, v.ty, v.tz);
  if (Math.abs(camera.fov - cam.fov) > 0.01){
    const kf = 1 - Math.exp(-tickDt / 95);
    camera.fov += (cam.fov - camera.fov) * kf;
    if (Math.abs(camera.fov - cam.fov) < 0.1) camera.fov = cam.fov;
    camera.updateProjectionMatrix();
  }
}
function applyViewState(){
  if (!parts.doorWall) return;
  const interior = state.view === 'interior';
  const top = state.view === 'top';
  if (parts.ceiling) parts.ceiling.visible = !top;
  if (parts.cap) parts.cap.visible = !top && !interior;
  if (parts.ceilFrame) parts.ceilFrame.visible = top;
  if (parts.projectGroup) parts.projectGroup.visible = true;
  if (dimGroup) dimGroup.visible = top;
  if (parts.lightGroup) parts.lightGroup.visible = true;
  if (!interior && parts.walls){
    Object.keys(parts.walls).forEach(k => {
      const g = parts.walls[k];
      if (!g) return;
      g.visible = true;
      if (g.userData.outer) g.userData.outer.visible = true;
      if (g.userData.outerTrims) g.userData.outerTrims.visible = true;
    });
  }
  if (interior) updateInteriorVisibility();
  if (parts.fillLight){
    parts.fillLight.intensity = interior ? TUNE.interiorFill : TUNE.interiorFill * 0.16;
    parts.fillLight.position.set(0, 1.35, 0);
  }
  if (parts.keyLight) parts.keyLight.intensity = interior ? TUNE.key * 0.55 : TUNE.key;
  if (parts.hemi) parts.hemi.intensity = interior ? TUNE.hemi * 0.7 : TUNE.hemi;
}


/* ---- 내부 보기: 카메라와 방 중심 사이를 가로막는 벽만 숨김 (360° 컷어웨이) ---- */
const _camW = new THREE.Vector3();
function updateInteriorVisibility(){
  const walls = parts.walls;
  if (!walls) return;
  const W = state.w/1000, D = state.d/1000;
  ['front','back','left','right'].forEach(name => {
    const g = walls[name];
    if (!g) return;
    // 방 안쪽 면 기준 — 카메라가 그 벽의 실내면을 벗어나면(= 벽을 사이에 두고 바깥에 있으면) 숨김
    const inward = wallInward(name);
    const inner = wallPoint(name, 0, 0, T/2);
    const d = inward.dot(_camW.copy(camera.position).sub(inner));
    g.visible = d > 0.14;   // 실내면에 닿기 전에 미리 걷어 벽 속을 들여다보는 프레임이 없도록
    // 안쪽 시점에서는 바깥쪽 흰 알판·외부 몰딩을 벗겨 단면처럼 보이게 합니다
    if (g.userData.outer) g.userData.outer.visible = false;
    if (g.userData.outerTrims) g.userData.outerTrims.visible = false;
  });
  // 카메라가 천장 위로 올라가면 천장도 숨김
  if (parts.ceiling) parts.ceiling.visible = camera.position.y < H - 0.22;
  if (parts.projectGroup) parts.projectGroup.visible = camera.position.y < H - 0.22;
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
  if (state.view === 'interior'){
    const lim = maxInsideR(cam.theta, cam.phi, cam.tx, cam.ty, cam.tz);
    return Math.max(0.34, Math.min(lim * 1.75, r));
  }
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
    // 레티나 대응 — 픽셀 상한만 두고 최대 2.5배까지 올립니다
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cap = isSmall() ? 3.0e6 : 5.6e6;
    const pr = Math.min(dpr, Math.sqrt(cap / (w * h)));
    renderer.setPixelRatio(Math.max(1, pr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fitCamera(true);
  });
}

/* ---- 루프 ---- */
const tmpV = new THREE.Vector3();
let firstFrame = true;
let lastTick = performance.now();
let tickDt = 16;
function tick(){
  requestAnimationFrame(tick);
  const nowT = performance.now();
  const dt = Math.min(120, Math.max(1, nowT - lastTick));
  lastTick = nowT;
  tickDt = dt;
  if (camAnim){
    const t = Math.min(1, (nowT - camAnim) / 900);
    // 프레임률과 무관하게 수렴하도록 시간 기반 보간
    const k = 1 - Math.exp(-dt / 95);
    cam.theta += (camTarget.theta - cam.theta) * k;
    cam.phi += (camTarget.phi - cam.phi) * k;
    cam.r += (camTarget.r - cam.r) * k;
    cam.ty += (camTarget.ty - cam.ty) * k;
    cam.fov += (camTarget.fov - cam.fov) * k;
    cam.tx += (camTarget.tx - cam.tx) * k;
    cam.tz += (camTarget.tz - cam.tz) * k;
    if (t >= 1){ camAnim = 0; Object.assign(camTarget, { theta: cam.theta, phi: cam.phi, r: cam.r, ty: cam.ty, fov: cam.fov, tx: cam.tx, tz: cam.tz }); }
  }
  updateCameraState();
  if (state.view === 'interior') updateInteriorVisibility();
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
  setView('photo', true);
  tick();
  window.__beo = { THREE, scene, camera, state, rebuild, setView, cam, camTarget, get booth(){ return booth; }, get parts(){ return parts; } };
}

start();
