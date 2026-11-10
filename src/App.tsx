import { useEffect, useState } from "react"
import ConnectionControl from "./components/ConnectionControl"
import PowerToggle from "./components/PowerToggle"
import ProductHeader from "./components/ProductHeader"
import SensorChart from "./components/SensorChart"
import SensorMoon from "./components/SensorMoon"
import {
  connectSensor,
  disconnectSensor,
  loadPower,
  setLedPower,
  type Reading,
  type Status,
} from "./lib/device"
import { MAX_POINTS } from "./product"

export default function App() {
  const [status, setStatus] = useState<Status>("disconnected")
  const [power, setPower] = useState(false)
  const [readings, setReadings] = useState<Reading[]>([])

  useEffect(() => {
    void loadPower().then(setPower)
    return () => {
      void disconnectSensor()
    }
  }, [])

  const handleConnect = async () => {
    if (status === "connected") {
      await disconnectSensor()
      setStatus("disconnected")
      return
    }

    await connectSensor({
      onInit: setReadings,
      onReading: (row) => {
        setReadings((current) => [...current, row].slice(-MAX_POINTS))
      },
      onStatus: setStatus,
    })
  }

  const handlePowerChange = async (nextPower: boolean) => {
    const previousPower = power
    setPower(nextPower)
    const didUpdate = await setLedPower(nextPower)
    if (!didUpdate) setPower(previousPower)
    return didUpdate
  }

  const latestValue = readings.at(-1)?.value

  return (
    <main className="app-shell">
      <ProductHeader />
      <SensorMoon value={latestValue} power={power} />
      <div className="dashboard-grid">
        <section className="controls" aria-label="기기 제어">
          <ConnectionControl status={status} onToggle={handleConnect} />
          <PowerToggle power={power} onChange={handlePowerChange} />
        </section>
        <SensorChart readings={readings} />
      </div>
    </main>
  )
}
