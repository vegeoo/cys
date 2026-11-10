import type { RealtimeChannel } from "@supabase/supabase-js"
import { DEVICE_ID, MAX_POINTS } from "../product"
import { db, IS_DEMO_MODE } from "./supabase"

export type Reading = {
  value: number
  created_at: string
}
export type Status = "disconnected" | "connecting" | "connected" | "error"

type ConnectOptions = {
  onInit: (rows: Reading[]) => void
  onReading: (row: Reading) => void
  onStatus: (status: Status) => void
}

let channel: RealtimeChannel | null = null
let demoPower = false

function isReading(value: unknown): value is Reading {
  if (!value || typeof value !== "object") return false
  const row = value as Record<string, unknown>
  return (
    Number.isFinite(Number(row.value)) && typeof row.created_at === "string"
  )
}

export async function connectSensor(opts: ConnectOptions): Promise<void> {
  await disconnectSensor()
  opts.onStatus("connecting")

  if (IS_DEMO_MODE) {
    opts.onInit([])
    opts.onStatus("connected")
    return
  }

  const { data, error } = await db
    .from("sensor_readings")
    .select("value, created_at")
    .eq("device_id", DEVICE_ID)
    .order("created_at", { ascending: false })
    .limit(MAX_POINTS)

  if (error) {
    opts.onStatus("error")
    return
  }

  const rows = (data ?? []).filter(isReading).reverse()
  opts.onInit(rows)

  channel = db
    .channel(`sensor-readings-${DEVICE_ID}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "sensor_readings",
        filter: `device_id=eq.${DEVICE_ID}`,
      },
      (payload) => {
        if (isReading(payload.new)) {
          opts.onReading({
            value: Number(payload.new.value),
            created_at: payload.new.created_at,
          })
        }
      },
    )
    .subscribe((realtimeStatus) => {
      if (realtimeStatus === "SUBSCRIBED") opts.onStatus("connected")
      if (
        realtimeStatus === "CHANNEL_ERROR" ||
        realtimeStatus === "TIMED_OUT"
      ) {
        opts.onStatus("error")
      }
    })
}

export async function disconnectSensor(): Promise<void> {
  if (channel) {
    await db.removeChannel(channel)
    channel = null
  }
}

export async function setLedPower(on: boolean): Promise<boolean> {
  if (IS_DEMO_MODE) {
    demoPower = on
    return true
  }

  const { error } = await db
    .from("device_state")
    .update({ led_on: on, updated_at: new Date().toISOString() })
    .eq("device_id", DEVICE_ID)
  return !error
}

export async function loadPower(): Promise<boolean> {
  if (IS_DEMO_MODE) return demoPower

  const { data, error } = await db
    .from("device_state")
    .select("led_on")
    .eq("device_id", DEVICE_ID)
    .maybeSingle()
  return error ? false : Boolean(data?.led_on)
}
