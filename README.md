# 베오방음 홈페이지 시안 (`website/`)

2026-11-19 작성 · 2026-11-21 **5차 개편(슬림 메인 + 6탭 구조, 중고 매물·위탁 탭 추가) · GitHub Pages 배포 완료**. `handoffs/🌐-베오방음-홈페이지-시안-제작`, `🌐-홈페이지-시안-사진-번호-벽구조-점검`, `🌐-홈페이지-실제-벽체-구조-반영`, `🌐-베오방음-홈페이지-슬림-멀티탭-구조-전면-개편`, `🏷️-홈페이지-중고매물-위탁-섹션-추가-및-배포` 작업 결과물입니다.
**라이브: https://dltldud12345-cmd.github.io/beosoundproof/** (배포 저장소 `tmp/gh-deploy-beo/`, 브랜치 `main`).

## 파일

- `index.html` — 단일 HTML(내장 CSS·JS). 외부 라이브러리·폰트 CDN 없이 시스템 폰트로 렌더합니다.
- `assets/` — 시공 사진·스펙 이미지·로고

### 2026-11-21 4차 개편 구조 (사장님 최종 확정)

**가벼운 메인 + 상단 6개 탭 분리**, 해시 라우팅 SPA입니다.

| 해시 | 탭 | 내용 |
| --- | --- | --- |
| `#home` | (로고) | 히어로 → 대표 시공사례 6 → 제품 4카드 → **중고 위탁·매칭 티저** → FAQ 6 |
| `#about` | 회사소개 | 경력·실적, 보청기 전문 센터 레퍼런스, 다른 점 5가지 |
| `#portfolio` | 시공사례 | 전체 / 신규 설치 / 이전·재설치 필터, 사진 15장 |
| `#products` | 제품안내 | 라인업 4, 규격, 기본 포함 6가지, 시그니처 내부, **프로젝트창 사진 피처** + 선택 옵션 3, 견적 안내 |
| `#used` | 중고매물 | **위탁·매칭 접수 현황**, 내 부스 위탁·처분 신청 / 중고 구매·이전설치 문의, 위탁이 유리한 이유 3가지, 4단계 절차, 이전설치 안내 |
| `#reviews` | 사용후기 | 대표 후기 4 + 숨고 링크(상·하단) |
| `#contact` | 상담문의 | 절차 3단계, 전화·상담신청서·채널, 이전·해체 안내 |

- 상단 내비게이션(sticky): `회사소개 · 시공사례 · 제품안내 · 중고매물 · 사용후기 · 상담문의` + `무료 견적 상담` 버튼. 모바일은 햄버거 드로어.
- 플로팅 채널 버튼(우측 하단): 전화 `010-3001-5906` · 네이버 블로그 · 인스타그램 · 숨고. (스마트스토어는 아직 오픈 전이라 링크를 걸지 않았습니다.)
- 모바일 하단 고정 바: 블로그 · 인스타 · 숨고 · **전화 상담**.
- 라우팅은 `location.hash`만 사용하고, 페이지를 바꾸면 상단으로 스크롤합니다. `document.title`도 탭마다 바뀝니다. JS가 없을 때를 대비해 `<noscript>`에서 전체 페이지를 펼칩니다.
- 홈 길이: PC 5,112px(#home 섹션 합계, 중고 티저 700px 포함) · 모바일 7,287px. 전체 문서 기준 PC 5,590px · 모바일 7,900px.

#### 이번에 뺀 것 / 바꾼 것

- **메인에서 뺀 것**: 히어로 아래 4개 숫자(1,000건+ · 5.0 · 13건 · 수도권), 강점 5개 상세, 이전설치 다크 섹션, 규격표, 리뷰 4건 전체 → 각 탭으로 이동.
- **작은 숫자 전면 삭제**: `13건 중 9건`, `리뷰 55건`, `리뷰 4건`, `사진 리뷰 50건` 등 고정 숫자를 모두 뺐습니다. 경력은 **`11년 · 수백 건 · 직접 시공`** 톤으로만 적습니다.
- **리뷰**: 대표 후기 4건(사진 포함)만 보여주고, 상·하단에 `실시간으로 쌓이는 전체 후기는 숨고에서 바로 확인하세요` → `https://www.soomgo.com/profile/users/14549823`.
- **청력검사실**: 거래처 상호(`하나히어링`)를 공개 페이지에서 모두 빼고 **`전국 보청기 전문 센터 청력검사실 다수 시공`** 으로 표기. 상호는 상담 때만 구두 안내(브랜드 가이드 4장).
- **가격**: 신규·이전 모두 **금액 미노출**. `사진·부스 정보·위치 접수 후 정확한 견적` 문구로 통일했습니다. 방문 실측은 **신규 설치 · 수도권 한정 무료**로만 표기.
- **에어컨**: `에어컨 라인 벽체 매설 시공` + **필요 시 에어컨 설치 전문 협력업체 연계 가능**(2026-11-21 확정)을 제품 옵션·홈 FAQ·회사소개 05에 반영. `국내 유일` 같은 최상급 표현은 쓰지 않았습니다.
- **프로젝트창(2026-11-21 보완)**: `천장 개폐형 프로젝트창`으로 표기하고, **창을 열면 방 천장의 시스템에어컨 바람을 부스 안에서 그대로 쐬고, 닫으면 원래 방음 상태로 돌아간다**는 점을 사진 3컷(열림·닫힘·디테일)과 함께 읽히게 했습니다. 제품 페이지 옵션 블록은 `큰 사진 1 + 작은 사진 2 + 설명` 피처로, 나머지 옵션 3개는 3열 카드로 정리했습니다.
- **금지 표기 유지**: `환기/환기팬/공기순환구`, `보강 시공/이중구조/차음석고/미네랄울/고무차음판`, `110mm/120mm/9T/45T/스펀지`, `무상 A/S` — 본문·이미지·alt 어디에도 없습니다(grep 0건).

### 사진 (`assets/`)

| 파일 | 출처 | 쓰는 곳 |
| --- | --- | --- |
| `hero-main.jpg` | 숨고 #10 신규 설치 원본 `scratch/insta3/p10_01.jpg` 4:3 크롭 → 1600×1200, 노출 +12%·대비 +3% (`scratch/build_hero.py`) | 홈 히어로 |
| `exterior-home.jpg` | 같은 원본 크롭 → 1500×1125 | 홈 사례 카드·포트폴리오 |
| `exterior-complete.jpg` | 숨고 #4 수원 세류동 `p04_09` | 사례 카드 |
| `exterior-corner.jpg` | `p04_02` | 사례 카드·회사소개 01 |
| `exterior-hero`(구) `hero-exterior.jpg` | `p04_01` | 포트폴리오 '수원 세류동 · 정면' |
| `interior-academy.jpg` | `p04_03` | 회사소개 02·제품 규격 |
| `interior-door.jpg` | 숨고 #3 천안 `p03_main` | 사례 카드 |
| `interior-slat.jpg` | #10 `p10_05` | 사례 카드 |
| `interior-lab.jpg` | #2 인천 연수구 `p02_07` | 사례 카드 |
| `relocation-complete.jpg` | #14 고양 킨텍스→파주 운정 이전 `p14/08` | 사례 카드·회사소개 04 |
| `clinic-exterior.jpg` | 사장님 제공 `IMG_6258` | 홈 사례 카드·포트폴리오·회사소개 레퍼런스 |
| `clinic-interior-window.jpg` | `IMG_6264` | 포트폴리오 |
| `clinic-interior-slat.jpg` | `IMG_6322` | 포트폴리오 |
| `clinic-interior-cob.jpg` | `IMG_6004` | 포트폴리오 |
| `project-window-main.jpg` | 사장님 제공 `IMG_4224` | 제품 옵션 블록·포트폴리오(다크 톤+화이트 라인타공) |
| `project-window-open.jpg` | `IMG_7546` (창 쪽으로 크롭) | 제품 옵션 블록·포트폴리오(창 전체가 열린 컷) |
| `project-window-closed.jpg` | `IMG_7696` (천장 중심 크롭) | 제품 옵션 블록·포트폴리오(닫은 상태) |
| `included-options-grid.png` | `scratch/build_options.py` (세로 2구 콘센트 최신본) | 기본 포함 6가지 |
| `review-1~4.jpg` | 숨고 리뷰 사진 CDN | 사용후기 |
| `logo-*.png` | 구글 드라이브 `베오방음` 폴더 | 헤더·푸터 |

- **청력검사실 사진 4컷**: 상호·로고가 보이는 `IMG_5970`, `IMG_5999`는 공개용에서 제외했습니다. 나머지 4컷은 2048×1536 원본을 1500×1125로 줄여 EXIF를 제거했습니다(`scratch/build_clinic_photos.py`).
- 사진 재가공: `scratch/build_site_photos.py`(기존 8컷), `scratch/build_clinic_photos.py`(청력검사실 4컷), `scratch/build_project_window_photos.py`(프로젝트창 3컷), `scratch/build_hero.py`(히어로).
- 사진을 더 좋은 컷으로 바꿀 때는 **같은 파일명으로 덮어쓰면** HTML을 고칠 필요가 없습니다. 비율은 4:3(1500×1125), 히어로는 4:3 계열이면 됩니다.

### 검증 (2026-11-21)

- 금지어 grep 0건: `환기 · 공기순환구 · 보강 · 이중구조 · 차음석고 · 미네랄울 · 고무차음판 · 무상 · A/S · 110mm · 120mm · 9T · 45T · 스펀지 · 하나히어링 · 평몰딩 · 각재 · 55건 · 13건 · 4건 · 만 원`
- 가로 스크롤 없음: 360 / 390 / 480 / 768 / 820 / 1024 / 1280 / 1440px × 7개 화면(2026-11-21 `#used` 추가 후 재확인, 900·1120 포함 9개 폭) 전부 `scrollWidth ≤ innerWidth`.
- 탭 전환·필터·드로어·`aria-current`·`document.title` 동작 확인(Playwright 클릭 테스트).
- 외부 링크 5개 HTTP 200: 블로그 · 인스타 · 숨고 · 번개장터 · 상담신청서(forms.gle).
- `<img>` 전부 `alt` 보유, 참조 자산 전부 존재.

### 미리보기 다시 만들기

```bash
# 홈 PC / 모바일 (전체 높이)
LD_LIBRARY_PATH=/workspace/tmp/sysroot/usr/lib/x86_64-linux-gnu PLAYWRIGHT_BROWSERS_PATH=/workspace/tmp/pw TMPDIR=/workspace/tmp/pw-tmp \
  python3 tmp/shot_site.py "file:///workspace/website/index.html" downloads/website-preview-pc.png 1440 900 full
LD_LIBRARY_PATH=/workspace/tmp/sysroot/usr/lib/x86_64-linux-gnu PLAYWRIGHT_BROWSERS_PATH=/workspace/tmp/pw TMPDIR=/workspace/tmp/pw-tmp \
  python3 tmp/shot_site.py "file:///workspace/website/index.html" downloads/website-preview-mobile.png 390 844 full mobile
# 탭별 (제품·회사소개는 PC와 모바일 둘 다)
python3 tmp/shot_site.py "file:///workspace/website/index.html#products" downloads/website-preview-products-pc.png 1440 900 full
python3 tmp/shot_site.py "file:///workspace/website/index.html#about" downloads/website-preview-about-pc.png 1440 900 full
python3 tmp/shot_site.py "file:///workspace/website/index.html#products" downloads/website-preview-products-mobile.png 390 844 full mobile
python3 tmp/shot_site.py "file:///workspace/website/index.html#portfolio" downloads/website-preview-portfolio-pc.png 1440 900 full
```

### 2026-11-21 5차 보완 — 히어로 크로스페이드 + 모션/라이트박스

**호스팅 배포 없음.** `index.html` 한 장 안에서만 바뀌었습니다.

#### 히어로 슬라이드쇼 (`#home` 히어로)

| # | 파일 | 내용 |
| --- | --- | --- |
| 1 | `assets/hero-main.jpg` | 기존 대표 신규설치 컷(거실 창가 · 문 열린 부스) |
| 2 | `assets/clinic-exterior.jpg` | 청력검사실 외관(검사시창 + 시스템도어, 백색 알판) |
| 3 | `assets/project-window-main.jpg` | 프로젝트창 설치 현장 내부(차콜 아트보드 + 화이트 라인타공 + 천장 창) |
| 4 | `assets/interior-academy.jpg` | 수원 세류동 신규 내부 완성 컷(우드 라인타공 · 아트보드 · 창) |

- 4장을 `position:absolute; inset:0`으로 겹치고 `opacity` **1.4s ease-in-out** 크로스페이드, **4.5초**마다 자동 전환. 들어오는 슬라이드가 위로 올라와(opacity 합이 계속 1) 중간에 어두워지거나 깜빡이지 않습니다.
- 활성 슬라이드는 `scale(1.04) → scale(1)` **6s ease-out** 미세 줌. 나간 슬라이드는 6초에 걸쳐 천천히 되돌아가며 사라져 끊김이 없습니다.
- 히어로 하단 중앙에 점 인디케이터 4개(활성은 26px 알약형, 민트). 클릭으로 전환할 수 있고, 누르면 4.5초 타이머가 다시 시작됩니다.
- **3번은 `project-window-open.jpg` 대신 `project-window-main.jpg`를 썼습니다.** open 컷은 천장 창을 아래에서 올려다본 초근접 디테일 컷이라 풀블리드 히어로에서 무엇인지 읽히지 않습니다. 같은 현장의 맥락 컷(main)이 프로젝트창·아트보드·라인타공을 한 번에 보여줘서 골랐습니다. open 컷은 제품/포트폴리오에 그대로 있습니다.
- `prefers-reduced-motion: reduce`에서는 자동 전환·줌·페이드를 모두 끄고 첫 장만 정적으로 보여줍니다(점 클릭은 즉시 전환).
- 다른 탭으로 이동하거나 탭이 백그라운드로 가면 타이머를 멈추고, `#home`으로 돌아오면 다시 시작합니다.
- 슬라이드별 `object-position`을 따로 두어(모바일 포함) 인물·창이 잘리지 않게 크롭했습니다.

#### 그 밖의 모션·인터랙션

- **스크롤 리빌**: `.rv`가 `opacity:0` + `translateY(16px)`에서 **0.65s cubic-bezier(.22,1,.36,1)**로 나타납니다. 첫 로드/탭 전환 시 이미 화면에 걸친 블록은 애니메이션 없이 바로 표시(`.rv.instant`)됩니다. 포트폴리오 카드 15장과 회사소개 숫자 블록에도 `.rv`를 붙였습니다.
  - *같이 고친 버그*: 초기 `show(route,{keepScroll:true})`가 `revealAll()` 전에 return해서, 첫 진입 후 스크롤하면 아래 섹션이 계속 `opacity:0`으로 비어 보이던 문제. `revealAll()`을 항상 호출하도록 수정했습니다.
  - 인쇄(`@media print`)에서는 리빌을 무시하고 전부 표시합니다.
- **글래스 헤더**: `saturate(150%) blur(12px)` 반투명 + 헤어라인. 스크롤 8px부터 `.is-scrolled`가 붙어 배경이 조금 더 투명해지고 얇은 그림자가 생깁니다.
- **라이트박스**: `.shot`(홈 사례 6 + 포트폴리오 15) 사진을 누르면 다크 블러 배경 위에 원본 크기로 확대. 닫기는 **ESC · 바깥(사진 밖) 클릭 · X 버튼**, 이동은 **←/→ 버튼과 방향키**(필터로 걸러진 사진은 건너뜀, 1장뿐이면 화살표 숨김). 열려 있는 동안 본문 스크롤을 잠그고 초점은 X 버튼으로, 닫으면 원래 카드로 돌아갑니다. 키보드 Enter/Space로도 열립니다(카드에 `tabindex`/`role=button`).
- **탭 전환**: 페이지가 바뀌면 `pageIn` **0.28s** 페이드 인.
- **카드 호버 줌**: `scale(1.03)`(0.9s). 커서는 `zoom-in`.

#### 검증 (Playwright · Chromium)

- 히어로 1→2 전환 시 opacity가 1/0 → 0.73/0.27 → 0/1로 겹쳐 지나가고, 히어로 높이 720px·문서 폭 1440px 그대로(가로 스크롤 0).
- 리빌: 스크롤 후 화면에 걸친 `.rv`는 모두 opacity 1, 첫 로드에서 이미 보이는 블록은 즉시 표시.
- 라이트박스: 열기/캡션/화살표/ESC·바깥 클릭·버튼 닫기, 본문 스크롤 잠금·해제, 필터(이전·재설치 1장)에서 화살표 숨김, 포커스 트랩 확인.
- 탭 전환 `pageIn 0.28s`, 헤더 `.is-scrolled`, 호버 `matrix(1.03…)` 확인.
- 가로 스크롤 없음: PC 1440, 태블릿 820, 모바일 390 (scrollWidth == clientWidth).
- `prefers-reduced-motion`에서 자동 전환 정지·transition 0s 확인. 콘솔 에러 0건.
- 스크린샷: `downloads/website-preview-pc-hero-slide.png`(2번 슬라이드), `website-preview-pc.png`(홈 전체), `website-preview-pc-lightbox.png`, `website-preview-pc-lightbox-portfolio.png`, `website-preview-pc-reveal.png`, `website-preview-mobile-hero.png`, `website-preview-mobile-hero-slide2.png`, `website-preview-mobile-lightbox.png`, `website-preview-mobile-contact.png`.
- 재현 스크립트: `handoffs/✨-홈페이지-히어로-페이드인-아웃-슬라이드-적용/verify_all.py`, `verify_regression.py`, `final_shots.py` (`LD_LIBRARY_PATH=/workspace/tmp/libroot/usr/lib/x86_64-linux-gnu` 필요).

## 2026-11-21 6차 — 중고 매물·위탁 탭 (`#used`) + 배포

사장님 승인("중고매물 위탁으로 가자")에 따라 **매물을 지어내지 않고 접수·매칭 구조로** 만든 탭입니다. 확정 매물이 없을 때 화면이 비어 보이지 않도록, 상단에 `위탁·매칭 접수 중` 안내 띠를 두고 두 개의 신청 카드로 나눴습니다.

| 블록 | 내용 |
| --- | --- |
| 헤드 | `중고 방음부스, 옮기는 일까지 함께 넘깁니다` + 11년 타사 이전설치 연결 설명 |
| 접수 현황 띠 | `공개된 확정 매물은 아직 없습니다` — 가짜 카드·가격 없음 |
| 01 내 부스 위탁·처분 신청 | 보내실 것 4가지(브랜드·규격 / 위치·층수·엘리베이터 / 사진 3~5장 / 희망 금액·시기) + 전화·상담신청서·블로그·인스타·숨고 |
| 02 중고 부스 구매·이전설치 문의 | 규격·예산·지역·이전설치 여부를 남기면 매물 입고 시 우선 안내 + `#contact` 연결 |
| Why BEO | ① 타사 포함 11년 해체·재조립 ② 매물 연결부터 이전설치까지 ③ 현장 사진 기반 이전비 안내 |
| 유의 문구 | "매물을 직접 보증 판매하는 것이 아니라 연결·시공을 맡는다" + 상태·조건·위탁 진행 방식은 서면 안내 |
| Process | 접수 → 이전 가능 여부 확인 → 매물 정리·조건 안내(견적서) → 해체·운반·재설치 |
| Relocation | 중고 구매 전 이전 가능 여부 확인 안내 + 전화·상담신청서(다크 박스) |

- 홈(`#home`) 제품 카드 아래에 **중고 위탁·매칭 티저**(`#home-used`, 파실 때·구하실 때·옮길 때 3항목 + 접수 중 띠)를 넣어 탭 유입을 만들었습니다. PC 700px·모바일 930px.
- 상단 내비·드로어·푸터에 `중고매물`(`#used`) 추가, `ROUTES`/`META`에 `used` 등록(`document.title` = `중고 방음부스 매물·위탁 | 베오방음`).
- 푸터 마지막 줄을 `© 2026 BEO SOUNDPROOF. All rights reserved. · 시공 사진은 베오방음이 직접 시공한 현장을 촬영한 자료입니다. 중고 매물·위탁 정보와 견적은 접수 후 확인해 안내드립니다.`로 교체(시안 문구 삭제).
- 새 CSS는 `.used-status · .used-grid · .used-card · .used-list · .used-cta · .used-note · .used-points`뿐이고 기존 토큰·카드 톤을 그대로 씁니다. 1020px 이하 1열, 640px 이하 버튼 100% 폭.

### 검증

- 금지어 10종(`120mm·110mm·9T·45T·스펀지·보강·환기·무상·A/S·공기순환구`) grep **0건**.
- 가로 스크롤 없음 9개 폭(390·430·768·820·900·1024·1120·1280·1440) × `#used` — `scrollWidth == innerWidth`, 문서 폭 일치.
- 내비 6개 항목 900px에서도 한 줄 유지(넘침 0), 820px 이하 햄버거 전환.
- 탭 클릭 → `#used` 라우팅·`aria-current`·타이틀 변경, 모바일 드로어 링크 7개(중고매물 포함) 및 클릭 후 드로어 닫힘 확인.
- HTML 태그 균형 검사 오류 0건.
- 스크린샷: `downloads/website-used-consignment-pc.png`(1440, 섹션 전체 2,987px), `downloads/website-used-consignment-mobile.png`(390@2x, 섹션 전체 9,134px). 고정 플로팅·하단 바는 캡처 시에만 숨겼습니다.
- 재현 스크립트: `tmp/check-used.py`, `tmp/interact-used.py`, `tmp/shot-final.py` (`LD_LIBRARY_PATH=/workspace/tmp/libroot/usr/lib/x86_64-linux-gnu` 필요).

### 배포

- 저장소 `https://github.com/dltldud12345-cmd/beosoundproof`(브랜치 `main`), 커밋 `46e9121` "중고 매물·위탁 탭 신설 + 홈 중고 섹션·푸터 문구 정리".
- 라이브 `https://dltldud12345-cmd.github.io/beosoundproof/#used` 응답 200, 라이브 HTML이 로컬 `website/index.html`과 동일(120,691 bytes).

## 2026-11-21 7차 — 이전설치 간편 견적 페이지 (`relocation.html`)

이전설치 견적을 문자로 받던 7개 항목을 링크 하나로 받는 **모바일 전용 접수 페이지**입니다. 메인 사이트와 같은 토큰·톤을 쓰지만 별도 문서(단일 HTML)로, 링크를 문자·카카오톡으로 보냈을 때 미리보기가 깨끗하게 뜨도록 OG 태그를 넣었습니다.

- 라이브: `https://dltldud12345-cmd.github.io/beosoundproof/relocation.html` (관리자: `…/relocation.html#admin`)
- `베오방음 | 방음부스 이전설치 간편 견적` 제목 · `og:image` = `assets/relocation-complete.jpg`
- 고객 입력: ① 부스 유형(싱글·세미더블·더블·잘 모름) ② 제조사 칩(드림디자인·조용한청년들·소리지오·탐소리큐브·바른방음·직접입력/모름 — 타임트리 이전 실적 빈도 순) ③ 외부 크기 가로×세로×높이(mm) ④ 사진 1~2장(최대 6장, 앨범에서 1600px JPEG로 자동 축소) ⑤ 해체·설치 장소(동·구까지 주소 + 층 + 엘리베이터 있음/없음) ⑥ 희망 날짜 + 조율 가능 ⑦ 성함·연락처 + 개인정보 동의 → `견적 신청하기` → 접수 완료(접수번호·전화 링크)
- 하단 접힘: **문자로 보낼 7항목 양식** 복사 버튼 + `sms:` 링크
- 관리자(맨 아래 작은 `관리자`): 기존 키 `beo-by3hkmmyrev7gk` 공유, 기기에 기억. 최근 접수 순 목록 · 사진 썸네일(원본 열림) · 해체/설치 엘리베이터 · `tel:` 전화 · 상태(신규/연락완료/완료) · 삭제 · 탭 필터(신규·전체·연락완료·완료)
- 데이터: Supabase `relocation_quotes` + `relocation_submit` / `relocation_admin` (`supabase/04-relocation.sql`), 사진은 `listing-photos` 버킷 `relocation/` 경로
- 검증: 로컬·라이브 Playwright E2E 48+16항목 통과(접수→DB 저장→관리자 확인→상태 변경→삭제), 390/1440 가로 스크롤 0, 콘솔 에러 0, 테스트 데이터·사진 0건 정리
- 금지어(`120mm·110mm·9T·45T·스펀지·보강·환기·무상·A/S·공기순환구`) grep 0건

## 남긴 것 / 사장님 결정이 필요한 것

- **메인 사이트에서 이 페이지로 가는 링크**는 아직 넣지 않았습니다(문자·카톡으로 보내는 전용 링크). 필요하면 `#used`·`#contact`의 `이전설치 견적` 버튼에 연결하면 됩니다.
- **스마트스토어 링크**: 스토어가 아직 오픈 전이라 플로팅·상담 카드에 넣지 않았습니다. 오픈하면 `#contact` 채널 목록과 플로팅 버튼에 추가하면 됩니다.
- **이전·재설치 사진**: 공개용으로 쓸 수 있는 깨끗한 컷이 `relocation-complete.jpg` 1장뿐이라 `이전 · 재설치` 필터에 카드가 1개입니다. 이전 현장 사진이 생기면 `assets/`에 넣고 `#gallery`에 `data-kind="move"` 카드로 추가하세요.
- **신규 설치 사진**: 사장님이 "더 예쁜 컷"을 주시면 히어로(`hero-main.jpg`)·사례 카드부터 교체하는 게 효과가 큽니다.
- **청력검사실 상호**: 공개 페이지에는 쓰지 않습니다. 상담 때만 구두 안내(브랜드 가이드 4장).
- **푸터 마지막 줄**: 2026-11-21 중고 탭 작업에서 시안 문구를 지우고 공식 사업 정보 문구로 바꿨습니다.
- **호스팅**: 2026-11-21 GitHub Pages로 배포했습니다. 수정 시 `website/index.html` → `tmp/gh-deploy-beo/` 복사 → commit → push(`main`).

## 내용 근거

- 사양·옵션·후기·이전 실적: `docs/베오방음-브랜드-스타일-가이드.md`, `docs/베오방음-스마트스토어-상세페이지.md`
- 벽체 구조: 2026-11-21 사장님 확인 — 외부 백색 알판 / PB 액자틀 / 고밀도 흡음 2중 충진 + 벽체 사이 실링 / 내부 1면 라인타공·3면 아트보드.
- 사진 출처: 숨고 포트폴리오(`work/soomgo/portfolios.json`, 원본 `scratch/insta3/`, `work/soomgo/img/`) + 사장님 제공 청력검사실 사진(`attachments/2026-11-21/`).
- 사업자 정보: 명함·견적서 기준(상호·대표·사업자등록번호·주소·이메일). 전화는 사업용 `010-3001-5906`.
- 구조·톤 벤치마킹: 바라던방음(`baradun.co.kr`)의 4섹션 메인 + 탭 분리 + 플로팅 버튼, 지엘방음(`glsoundlab.kr`)의 여백·타이포 톤. 문구·이미지는 사용하지 않았습니다.

## 2026-11-21 — 3D 견적 시뮬레이터 (`configurator.html`)

신규 방음부스를 3D로 돌려보며 옵션을 바꾸고 사양·상담 문구를 바로 받는 페이지입니다.
**라이브: https://dltldud12345-cmd.github.io/beosoundproof/configurator.html** (메인 내비에는 아직 연결하지 않음)

| 파일 | 내용 |
| --- | --- |
| `configurator.html` | 페이지 마크업(상단바·스테이지·옵션 패널·사양 모달) |
| `assets/configurator.css` | 스타일(PC 2단 / 모바일 상단 고정 스테이지 + 하단 시트) |
| `assets/configurator.js` | 옵션 정의·견적 계산·Three.js 씬 |
| `assets/three.module.min.js` | Three.js r160 (CDN 없이 로컬 서빙, 670KB) |

- **단가 입력 지점**: `assets/configurator.js` 맨 위 `PRICE` 객체. `null`은 "상담 시 확정"으로 표시되고, 항목에 숫자(원)를 넣으면 그 항목부터 합산에 포함됩니다. 전 항목이 숫자가 되면 견적 박스가 총액 표시로 바뀝니다. `areaRate`는 ㎡당 단가입니다.
- **색·옵션 추가**: `ARTBOARD`·`SLAT`·`LIGHT`·`FLOOR` 배열에 한 줄 추가하면 패널·3D·사양 요약·복사 문구에 동시에 반영됩니다.
- **모델링 기준**: 내부 높이 2.0m, 벽체 두께 0.11m(화면에 수치 표기 없음), 외부 백색 알판 0.6m 판 이음, 내부 아트보드 0.9m 판 이음, 1면 라인타공(문 맞은편)·3면 아트보드, COB 매립등 + 중앙 LED등 또는 레일등, 강화마루, 시스템도어(바깥 열림·좌/우경첩).
- **시점**: 전체 외관 / 내부(앞벽·지붕 컷어웨이) / 문 쪽 / 위에서. `문 열기` 버튼으로 문이 바깥으로 열립니다.
- **상담 연결**: `이 사양으로 견적 상담` → 사양 텍스트 클립보드 복사 + 전화(010-3001-5906)·상담신청서(구글폼) 연결.
- 배포: `website/` → `tmp/gh-deploy-beo/` 복사 → commit → push(`main`).
