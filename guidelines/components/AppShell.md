# AppShell

전체 화면 레이아웃과 상태 관리다.

## 레이아웃

- `<main>`은 `100svh` 이상이며 화면 전체가 하나의 유리창이다.
- `ProductHeader`는 좌상단, `HumidityDisplay`와 `ConnectionControl`은 우상단에 둔다.
- `BreathGlass`는 전체 화면을 덮고 콘텐츠보다 뒤에 놓는다.
- `DemoControl`, `PowerToggle`, `SensorChart`는 하단에 여백으로 묶고 `DemoModeToggle`은 오른쪽 끝에 둔다. 카드로 감싸지 않는다.
- 모바일에서는 상단 정보를 세로로 배치하고 하단 컨트롤이 화면 폭을 넘지 않게 한다.

## 상태

```ts
const [sensorStatus, setSensorStatus] = useState<Status>('disconnected');
const [power, setPower] = useState(false);
const [sensorReadings, setSensorReadings] = useState<Reading[]>([]);
const [demoReadings, setDemoReadings] = useState<Reading[]>([]);
const [demoMode, setDemoMode] = useState(false);
```

- 실제 센서 상태와 사용자 선택 데모 상태는 서로 독립적이다.
- 실제 센서와 데모 슬라이더는 각각 별도 readings를 유지한다.
- 화면은 `demoMode`에 따라 활성 readings를 선택한다.
- 최신값은 활성 readings의 마지막 `value`이고 0부터 100으로 clamp한다.
- 최근값은 `MAX_POINTS`개만 유지한다.
- 센서 오류는 데모 readings와 슬라이더를 비활성화하지 않는다.
- 언마운트 시 `disconnectSensor()`를 호출한다.
