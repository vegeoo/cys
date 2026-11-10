# Setup

## 스택

- React, TypeScript, Vite, Tailwind CSS v4 구조를 유지한다.
- `@supabase/supabase-js` v2를 유지하고 UI 라이브러리나 유료 API를 추가하지 않는다.
- 결로와 물방울은 Canvas API, 최근 습도 추이는 SVG로 직접 그린다.

## 파일 구조

```text
src/
  product.ts
  lib/supabase.ts
  lib/device.ts
  components/
    ProductHeader.tsx
    BreathGlass.tsx
    CondensationCanvas.tsx
    HumidityDisplay.tsx
    ConnectionControl.tsx
    DemoControl.tsx
    PowerToggle.tsx
    SensorChart.tsx
  App.tsx
styles/globals.css
public/images/breath-landscape.webp
```

## product.ts

```ts
export const PRODUCT = {
  name: 'BREATH',
  concept: '숨의 흔적',
  description: '보이지 않는 숨이 공간에 남기는 흔적',
};
export const DEVICE_ID = 'lamp-01';
export const SENSOR_MIN = 0;
export const SENSOR_MAX = 100;
export const MAX_POINTS = 60;
```

`DEVICE_ID`와 기존 데이터 필드는 배포된 ESP32 설정에 맞춰 유지한다. `value`는 DHT22의 상대 습도 퍼센트다.

## Supabase

기존 연결 구조와 변수 이름을 유지한다. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 있으면 우선 사용하고, 없으면 수업용 상단 상수를 사용한다. service role 키는 사용하지 않는다.

### 테이블 계약

```sql
create table sensor_readings (
  id bigint generated always as identity primary key,
  device_id text not null,
  value int not null,
  created_at timestamptz not null default now()
);
create table device_state (
  device_id text primary key,
  led_on boolean not null default false,
  updated_at timestamptz not null default now()
);
```

테이블 이름과 필드는 변경하지 않는다.

### lib/device.ts 공개 함수

```ts
type Reading = { value: number; created_at: string };
type Status = 'disconnected' | 'connecting' | 'connected' | 'error';

connectSensor(opts: {
  onInit: (rows: Reading[]) => void;
  onReading: (row: Reading) => void;
  onStatus: (s: Status) => void;
}): Promise<void>;
disconnectSensor(): Promise<void>;
setLedPower(on: boolean): Promise<boolean>;
loadPower(): Promise<boolean>;
```

최근 `MAX_POINTS`개를 오래된 순으로 반환하고 `sensor_readings` INSERT를 `device_id` 필터로 구독한다.

## 데모 모드

Supabase URL이 비어 있거나 `<project>`를 포함하면 데모 모드다. 자동 사인파 대신 0부터 100까지의 범위를 가진 슬라이더를 사용한다. 슬라이더 값은 실제 `Reading`과 같은 형태로 `readings`에 추가되어 유리, 수치, 추이 차트를 동시에 갱신한다.
