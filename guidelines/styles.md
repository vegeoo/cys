# styles/globals.css 규칙

폰트 선언과 토큰은 파일 맨 위에 둔다. 기존 Pretendard 로컬 파일을 유지하고 Rising CHAI가 없을 때 Pretendard로 안전하게 대체한다.

```css
@font-face { font-family: "Pretendard"; src: url("/fonts/Pretendard-Regular.woff2") format("woff2"); font-weight: 400; font-display: swap; }
@font-face { font-family: "Pretendard"; src: url("/fonts/Pretendard-Medium.woff2") format("woff2"); font-weight: 500; font-display: swap; }
@font-face { font-family: "Pretendard"; src: url("/fonts/Pretendard-SemiBold.woff2") format("woff2"); font-weight: 600; font-display: swap; }

:root {
  --font-sans: Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif;
  --font-display: "Rising CHAI", Pretendard, sans-serif;
  --sage-deep: #26382f;
  --sage: #708779;
  --sage-soft: #a9b8ad;
  --mist: #d8ddd8;
  --ivory: #f3f0e7;
  --glass: rgba(232, 237, 232, .2);
  --glass-fog: rgba(232, 237, 232, .82);
  --reflection: rgba(255, 255, 255, .32);
  --status-on: #dcebdc;
  --danger: #ffd4c8;
}
```

## 레이어 순서

1. `.landscape`: 화면을 덮는 자연 풍경 이미지
2. `.landscape-veil`: 습도에 따라 blur와 밝기가 변하는 자연광
3. `.glass-fog`: 습도에 따라 opacity가 변하는 반투명 결로
4. `CondensationCanvas`: 물방울, 흐른 자국, 맑아진 흔적
5. `.glass-reflection`: 가장자리와 비스듬한 반사광
6. 콘텐츠와 접근 가능한 컨트롤

풍경 blur, 결로 opacity, 반사광은 `--humidity-level`을 사용하고 `--duration-glass` 동안 부드럽게 전환한다. Canvas는 실제 습도값을 ref로 받아 목표 밀도에 천천히 접근한다.

## 이미지

- `public/images/breath-landscape.webp`
- 초록빛 숲이나 정원의 실사 사진
- 화면을 `cover`하고 중심부에 잎과 빛의 깊이가 보이도록 위치한다.
- 외부 네트워크 요청 없이 미리보기와 GitHub Pages에서 동작하도록 로컬 파일로 저장한다.
