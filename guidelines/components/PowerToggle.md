# PowerToggle

기존 `device_state.led_on` 제어를 보존하는 보조 컨트롤이다.

- 하단 컨트롤 영역에 `LED 켜짐` 또는 `LED 꺼짐` 문구와 스위치를 함께 표시한다.
- 시각적 중심이 되지 않도록 작고 낮은 대비로 표현한다.
- 누르면 즉시 UI를 반영하고 `setLedPower` 실패 시 이전 상태로 되돌린 뒤 오류 문구를 표시한다.
- 센서 연결 여부와 무관하게 동작하고 앱 시작 시 `loadPower()`를 호출한다.
- 접근 가능한 `role="switch"`, `aria-checked`, 최소 44px 터치 영역을 유지한다.
