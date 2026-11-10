# BREATH — 숨의 흔적

DHT22 습도 센서에 닿은 사람의 숨을 유리창 위 결로로 번역하는 반응형 웹 작품이다. 평상시에는 초록빛 자연이 보이고, 습도가 오르면 유리에 김이 서리고 물방울이 흐른다. 데이터 흐름은 DHT22 → ESP32 → Supabase → 이 웹앱이다.

이 문서가 최상위 규칙이다. Setup, Tokens, styles, `components/` 문서를 함께 따른다.

## 반드시 지킬 시각 규칙

1. **화면 전체가 하나의 유리창이다.** 자연 풍경 위에 결로 Canvas와 반사광을 겹친다. 카드나 대시보드 박스를 만들지 않는다.
2. **텍스트는 유리 표면 위에 직접 놓는다.** 정보 배경용 사각 패널을 만들지 않는다. 읽기 어려운 영역은 위치와 색 대비로 해결한다.
3. **색은 Sage Green, Mist Gray, Soft Ivory 범위로 제한한다.** 모든 색은 Tokens의 CSS 변수로 참조한다.
4. **테두리와 구분선은 최소화한다.** 컨트롤의 현재 범위를 알려 주는 슬라이더 트랙과 키보드 포커스만 예외다.
5. **그림자와 그라데이션은 카드 장식에 사용하지 않는다.** 유리 반사, 자연광, 결로의 물성 표현에만 제한적으로 허용한다.
6. **텍스트는 최소화한다.** `BREATH`, `숨의 흔적`, 인용문, 현재 습도, 연결 상태와 필요한 컨트롤 이름만 노출한다.
7. **타이포그래피는 여백으로 위계를 만든다.** 제목은 넓은 공간을 두고 배치하고, 상태와 수치는 작고 간결하게 표시한다.
8. **실사에 가까운 질감을 유지한다.** 자연 풍경, 반투명 유리, 결로, 크기와 속도가 다른 물방울을 사용한다. 이모지와 장식 아이콘은 사용하지 않는다.

## 반드시 지킬 동작 규칙

1. `sensor_readings.value`는 DHT22 상대 습도 퍼센트로 해석하고 `clamp(value / 100, 0, 1)`로 정규화한다.
2. Level 0은 맑은 유리, Level 0.5는 옅은 김과 작은 물방울, Level 1은 짙은 김과 다수의 흐르는 물방울을 표현한다.
3. 습도가 내려가면 김과 물방울이 갑자기 사라지지 않고 부드럽게 감소한다.
4. 물방울은 Canvas에서 지속적으로 움직인다. 크기, 속도, 생성 위치를 달리하고 지나간 자리는 잠시 맑아진다.
5. Canvas 애니메이션 데이터는 React state에 프레임마다 기록하지 않는다. `requestAnimationFrame`, ref, ResizeObserver를 사용하고 언마운트 시 모두 정리한다.
6. 센서 상태와 LED 상태는 색만으로 알리지 않고 글자로 함께 표시한다.
7. 버튼과 슬라이더 터치 영역은 최소 44px이며 375px에서 가로 스크롤이 없어야 한다.
8. `prefers-reduced-motion`에서는 물방울 이동을 크게 줄이되 습도에 따른 정적 결로 상태는 유지한다.
9. Supabase에는 anon(publishable) 키만 사용한다. 테이블 이름과 필드는 변경하지 않는다.

## 제품 정의

제품 정보는 `src/product.ts`의 `PRODUCT`에서만 정의하고 화면은 이 값을 읽는다.

| 슬롯 | 값 |
| --- | --- |
| Product Name | `BREATH` |
| Concept | `숨의 흔적` |
| Description | `보이지 않는 숨이 공간에 남기는 흔적` |
| 주요 컬러 | Sage Green, Mist Gray, Soft Ivory |
| Imagery | 자연 풍경, 반투명 유리, 결로, 물방울 |
| Motion | 습도에 따른 김 서림, 물방울 생성과 흐름 |

## 기능

| 기능 | 컴포넌트 | 데이터 |
| --- | --- | --- |
| 유리창과 습도 반응 결로 | BreathGlass | 최신 `sensor_readings.value` |
| 움직이는 물방울과 맑아지는 자국 | CondensationCanvas | 정규화된 humidity level |
| 현재 습도 표시 | HumidityDisplay | 최신 `sensor_readings.value` |
| 센서 연결 상태와 연결, 해제 | ConnectionControl | realtime 채널 상태 |
| 데모 습도 조절 | DemoControl | Supabase 자리표시일 때만 노출 |
| 최근 습도 추이 | SensorChart | 최근 60개와 realtime INSERT |
| LED 전원 on/off | PowerToggle | `device_state.led_on` 업데이트 |
| 제품 정보 | ProductHeader | `PRODUCT` |

센서 연결은 Supabase realtime 구독이며 블루투스나 시리얼을 사용하지 않는다. URL이 자리표시이면 데모 모드가 되고 슬라이더가 센서값과 동일한 데이터 흐름을 만든다.

## 데이터 계약과 응용 범위

- 유지: `sensor_readings`의 `device_id`, `value`, `created_at`
- 유지: `device_state`의 `device_id`, `led_on`, `updated_at`
- 유지: 기존 Supabase 연결 함수, LED 제어, 최근값 플롯, GitHub Pages 배포 base
- 변경 가능: 자연 풍경 이미지, 결로 강도 곡선, 물방울 개수와 속도, 텍스트 배치
- 변경 금지: Supabase 테이블 이름과 필드, anon 키 원칙, 데모 대체 경로, 상태의 글자 표시
