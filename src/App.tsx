import { useEffect, useState, type CSSProperties } from "react"
import BreathGlass from "./components/BreathGlass"
import ConnectionControl from "./components/ConnectionControl"
import DemoControl from "./components/DemoControl"
import HumidityDisplay from "./components/HumidityDisplay"
import PowerToggle from "./components/PowerToggle"
import ProductHeader from "./components/ProductHeader"
import SensorChart from "./components/SensorChart"
import {
  connectSensor,
  disconnectSensor,
  loadPower,
  setLedPower,
  type Reading,
  type Status,
} from "./lib/device"
import { IS_DEMO_MODE } from "./lib/supabase"
import { MAX_POINTS, SENSOR_MAX, SENSOR_MIN } from "./product"

const initialDemoReading: Reading = {
  value: 38,
  created_at: new Date().toISOString(),
}

export default function App() {
  const [status, setStatus] = useState<Status>("disconnected")
  const [power, setPower] = useState(false)
  const [readings, setReadings] = useState<Reading[]>(
    IS_DEMO_MODE ? [initialDemoReading] : [],
  )

  const addReading = (row: Reading) => {
    const normalizedRow = {
      ...row,
      value: Math.min(SENSOR_MAX, Math.max(SENSOR_MIN, Number(row.value))),
    }
    setReadings((current) => [...current, normalizedRow].slice(-MAX_POINTS))
  }

  const startConnection = async () => {
    await connectSensor({
      onInit: (rows) =>
        setReadings(
          rows.map((row) => ({
            ...row,
            value: Math.min(
              SENSOR_MAX,
              Math.max(SENSOR_MIN, Number(row.value)),
            ),
          })),
        ),
      onReading: addReading,
      onStatus: setStatus,
    })
  }

  useEffect(() => {
    void loadPower().then(setPower)
    if (!IS_DEMO_MODE) void startConnection()
    return () => {
      void disconnectSensor()
    }
  }, [])

  const handleConnectionToggle = async () => {
    if (status === "connected") {
      await disconnectSensor()
      setStatus("disconnected")
      return
    }
    await startConnection()
  }

  const handlePowerChange = async (nextPower: boolean) => {
    const previousPower = power
    setPower(nextPower)
    const didUpdate = await setLedPower(nextPower)
    if (!didUpdate) setPower(previousPower)
    return didUpdate
  }

  const handleDemoHumidity = (value: number) => {
    addReading({ value, created_at: new Date().toISOString() })
  }

  const humidity = readings.at(-1)?.value
  const level = humidity === undefined ? 0 : humidity / SENSOR_MAX

  return (
    <main
      className="breath-app"
      style={{ "--humidity-level": level } as CSSProperties}
    >
      <BreathGlass level={level} />

      <div className="experience">
        <div className="top-layout">
          <ProductHeader />
          <div className="live-data">
            <HumidityDisplay value={humidity} />
            <ConnectionControl
              status={status}
              demoMode={IS_DEMO_MODE}
              onToggle={handleConnectionToggle}
            />
          </div>
        </div>

        <div className="bottom-layout">
          <div className="interaction-controls">
            {IS_DEMO_MODE && (
              <DemoControl
                value={humidity ?? initialDemoReading.value}
                onChange={handleDemoHumidity}
              />
            )}
            <PowerToggle power={power} onChange={handlePowerChange} />
          </div>
          <SensorChart readings={readings} />
        </div>
      </div>
    </main>
  )
}
