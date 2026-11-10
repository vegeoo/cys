# DemoControl

Supabase가 연결되지 않은 개발 환경에서 결로를 직접 시험하는 슬라이더다.

- 데모 모드에서만 보인다.
- `input type="range"`, 최소 0, 최대 100, step 1
- 라벨은 `데모 습도`, 현재 퍼센트를 함께 표시한다.
- 변경 시 실제 Reading과 같은 `{ value, created_at }`을 App에 전달한다.
- 키보드 조작과 44px 터치 영역을 지원한다.
