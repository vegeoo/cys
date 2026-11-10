# Tokens

모든 색, 크기, 간격과 전환 시간은 `styles/globals.css`의 CSS 변수로 정의한다.

## Color

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--sage-deep` | #26382f | 가장 어두운 자연색, 본문 대비 |
| `--sage` | #708779 | 상태, 슬라이더, 식생 색 |
| `--sage-soft` | #a9b8ad | 보조 정보 |
| `--mist` | #d8ddd8 | 유리 김, 흐린 텍스트 |
| `--ivory` | #f3f0e7 | 제목, 주요 정보 |
| `--glass` | rgba(232, 237, 232, .2) | 기본 유리막 |
| `--glass-fog` | rgba(232, 237, 232, .82) | 최대 결로 |
| `--reflection` | rgba(255, 255, 255, .32) | 유리 반사광 |
| `--status-on` | #dcebdc | 연결됨 |
| `--danger` | #ffd4c8 | 오류 |

자연광 그라데이션, Canvas 안개와 물방울 RGB도 `--shade-*`, `--reflection-*`, `--fog-rgb`, `--drop-*-rgb`, `--clear-rgb` 토큰으로 정의한다. 컴포넌트 안에 색을 직접 쓰지 않는다.

## Type

- 메인 폰트 Pretendard 400, 500, 600
- 디스플레이 폰트 Rising CHAI 800, 사용할 수 없으면 Pretendard 600
- 수치는 tabular-nums

| 이름 | 크기 | 굵기 | 용도 |
| --- | --- | --- | --- |
| display | clamp(44px, 9vw, 112px) | 800 | BREATH |
| concept | clamp(18px, 2.4vw, 30px) | 500 | 숨의 흔적 |
| quote | clamp(14px, 1.6vw, 18px) | 400 | 작품 문장 |
| value | clamp(38px, 6vw, 72px) | 500 | 현재 습도 |
| label | 13px | 500 | 상태, 컨트롤 |
| caption | 12px | 400 | 보조 정보 |

## Spacing

`--space-1` 4, `--space-2` 8, `--space-3` 12, `--space-4` 16, `--space-6` 24, `--space-8` 32, `--space-12` 48, `--space-16` 64

## Motion

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--ease-glass` | cubic-bezier(.22, .61, .36, 1) | 김 서림과 맑아짐 |
| `--duration-glass` | 1600ms | 유리 상태 변화 |
| `--duration-control` | 180ms | 버튼과 컨트롤 |

## Breakpoint

- 768px 미만은 정보와 컨트롤을 세로 배치한다.
- 768px 이상은 작품 정보 좌상단, 습도와 상태 우상단, 컨트롤 하단에 배치한다.
- 전체 화면 최소 높이는 100svh이고 375px에서 가로 스크롤이 없어야 한다.
