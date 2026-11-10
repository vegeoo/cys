import { useEffect, useState, type CSSProperties } from "react"
import BreathGlass from "./components/BreathGlass"
import ConnectionControl from "./components/ConnectionControl"
import DemoControl from "./components/DemoControl"
import DemoModeToggle from "./components/DemoModeToggle"
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
  const [sensorStatus, setSensorStatus] = useState<Status>("disconnected")
  const [power, setPower] = useState(false)
  const [sensorReadings, setSensorReadings] = useState<Reading[]>([])
  const [demoReadings, setDemoReadings] = useState<Reading[]>([
    initialDemoReading,
  ])
  const [demoMode, setDemoMode] = useState(IS_DEMO_MODE)

  const normalizeReading = (row: Reading) => ({
    ...row,
    value: Math.min(SENSOR_MAX, Math.max(SENSOR_MIN, Number(row.value))),
  })

  const addSensorReading = (row: Reading) => {
    const normalizedRow = normalizeReading(row)
    setSensorReadings((current) =>
      [...current, normalizedRow].slice(-MAX_POINTS),
    )
  }

  const addDemoReading = (row: Reading) => {
    const normalizedRow = {
      ...row,
      value: Math.min(SENSOR_MAX, Math.max(SENSOR_MIN, Number(row.value))),
    }
    setDemoReadings((current) => [...current, normalizedRow].slice(-MAX_POINTS))
  }

  const startConnection = async () => {
    await connectSensor({
      onInit: (rows) =>
        setSensorReadings(rows.map((row) => normalizeReading(row))),
      onReading: addSensorReading,
      onStatus: setSensorStatus,
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
    if (sensorStatus === "connected") {
      await disconnectSensor()
      setSensorStatus("disconnected")
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
    addDemoReading({ value, created_at: new Date().toISOString() })
  }

  const handleDemoModeToggle = () => {
    if (!demoMode) {
      setDemoMode(true)
      return
    }

    setDemoMode(false)
    if (
      !IS_DEMO_MODE &&
      sensorStatus !== "connected" &&
      sensorStatus !== "connecting"
    ) {
      void startConnection()
    }
  }

  const activeReadings = demoMode ? demoReadings : sensorReadings
  const humidity = activeReadings.at(-1)?.value
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
              status={sensorStatus}
              demoMode={demoMode}
              sensorConfigured={!IS_DEMO_MODE}
              onToggle={handleConnectionToggle}
            />
          </div>
        </div>

        <div className="bottom-layout">
          <div className="interaction-controls">
            {demoMode && (
              <DemoControl
                value={humidity ?? initialDemoReading.value}
                onChange={handleDemoHumidity}
              />
            )}
            <PowerToggle power={power} onChange={handlePowerChange} />
          </div>
          <SensorChart readings={activeReadings} />
          <DemoModeToggle active={demoMode} onToggle={handleDemoModeToggle} />
        </div>
      </div>
    </main>
  )
}
