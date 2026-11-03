import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Metric = 'total' | 'male' | 'female'
type Region = {
  province: string
  name: string
  total: number
  male: number
  female: number
  type: '시' | '군' | '구' | '기타'
}

const metricLabel: Record<Metric, string> = { total: '총계', male: '남성', female: '여성' }
const colors: Record<Metric, string> = { total: '#52A3A7', male: '#7E8BB5', female: '#C34083' }
const nf = new Intl.NumberFormat('ko-KR')

function parseLine(line: string) {
  return (line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map((v) => v.replace(/^"|"$/g, '').trim())
}

function regionType(name: string): Region['type'] {
  if (name.endsWith('시')) return '시'
  if (name.endsWith('군')) return '군'
  if (name.endsWith('구')) return '구'
  return '기타'
}

function Icon({ name }: { name: 'search' | 'people' | 'chart' | 'pin' }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V2" /><path d="M2 19h22" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function SparkLine({
  data,
  metric,
  normalized = false,
}: {
  data: Region[]
  metric: Metric
  normalized?: boolean
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [pinned, setPinned] = useState<number | null>(null)
  const width = 900
  const height = 260
  const pad = { x: 44, top: 24, bottom: 46 }
  const values = useMemo(() => data.map((r) => r[metric]), [data, metric])
  const max = normalized ? 1 : Math.max(...values, 1)
  const min = normalized ? 0 : 0
  const x = (i: number) => pad.x + (i * (width - pad.x * 2)) / Math.max(values.length - 1, 1)
  const y = (v: number) => pad.top + ((max - v) * (height - pad.top - pad.bottom)) / Math.max(max - min, 1)
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const ticks = [1, 0.75, 0.5, 0.25, 0]
  const active = hovered ?? pinned
  const tooltipX = active === null ? 0 : Math.min(Math.max(x(active) - 75, 8), width - 158)
  const tooltipY = active === null ? 0 : Math.max(y(values[active]) - 70, 8)

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${metricLabel[metric]} 꺾은선 그래프`}
        onClick={() => setPinned(null)}
      >
        {data.map((region, i) => {
          const showLabel = i % Math.ceil(data.length / 8) === 0 || i === data.length - 1
          return showLabel ? (
            <g key={`guide-${region.name}-${i}`}>
              <line x1={x(i)} y1={pad.top} x2={x(i)} y2={height - pad.bottom} className="vertical-guide" />
              <text x={x(i) + 4} y="13" textAnchor="start" className="axis-text top-label">
                {region.name.replace(/특별자치|광역/g, '')}
              </text>
            </g>
          ) : null
        })}
        {ticks.map((tick) => {
          const value = normalized ? tick : max * tick
          return <g key={tick}>
            <line x1={pad.x} y1={y(value)} x2={width - pad.x} y2={y(value)} className="gridline" />
            <text x={pad.x - 10} y={y(value) + 4} textAnchor="end" className="axis-text">
              {normalized ? value.toFixed(value === 0 || value === 1 ? 0 : 2) : value >= 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value)}
            </text>
          </g>
        })}
        <polyline points={points} fill="none" stroke={colors[metric]} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {values.map((value, i) => (
          <g key={`${data[i].name}-${i}`}>
            <circle
              cx={x(i)}
              cy={y(value)}
              r={active === i ? 6 : 4}
              fill={colors[metric]}
              stroke="none"
              className="chart-point"
              tabIndex={0}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              onClick={(event) => {
                event.stopPropagation()
                setPinned((current) => current === i ? null : i)
              }}
            />
          </g>
        ))}
        {active !== null && (
          <g className="chart-tooltip" pointerEvents="none">
            <rect x={tooltipX} y={tooltipY} width="150" height="52" rx="12" />
            <text x={tooltipX + 12} y={tooltipY + 20}>{data[active].name}</text>
            <text x={tooltipX + 12} y={tooltipY + 39} className="tooltip-value" style={{ fill: colors[metric] }}>
              {metricLabel[metric]} {normalized ? values[active].toFixed(3) : `${nf.format(values[active])}명`}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

function Ranking({ data, selected, onSelect }: { data: Region[]; selected: string; onSelect: (r: Region) => void }) {
  const max = data[0]?.total || 1
  return <div className="ranking">
    {data.map((region, index) => (
      <button className={`rank-row ${selected === region.name ? 'active' : ''}`} key={`${region.province}-${region.name}`} onClick={() => onSelect(region)}>
        <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
        <span className="rank-name"><b>{region.name}</b><small>{region.province}</small></span>
        <span className="bar-track"><span style={{ width: `${(region.total / max) * 100}%` }} /></span>
        <strong>{nf.format(region.total)}</strong>
      </button>
    ))}
  </div>
}

type SensorPoint = { label: string; temperature: number; humidity: number }
type Reading = { id: string | number; value: number; created_at: string }
type SerialPort = {
  readable: ReadableStream<Uint8Array> | null
  open: (options: { baudRate: number }) => Promise<void>
  close: () => Promise<void>
}
type WebSerialApi = { requestPort: () => Promise<SerialPort> }
type SerialStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting'

type SupabaseStatus = 'loading' | 'connected' | 'error'

function parseReading(value: unknown): Reading | null {
  if (typeof value !== 'object' || value === null) return null
  const row = value as Record<string, unknown>
  const id = row.id
  if (
    (typeof row.value !== 'number' && typeof row.value !== 'string') ||
    (typeof row.value === 'string' && !row.value.trim())
  ) return null
  const readingValue = Number(row.value)
  const createdAt = row.created_at
  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    !Number.isFinite(readingValue) ||
    typeof createdAt !== 'string' ||
    !Number.isFinite(Date.parse(createdAt))
  ) return null
  return { id, value: readingValue, created_at: createdAt }
}

function readingTime(timestamp: string, includeDate = false) {
  return new Intl.DateTimeFormat('ko-KR', {
    ...(includeDate ? { month: '2-digit', day: '2-digit' } : {}),
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))
}

function RawReadingsChart({ data }: { data: Reading[] }) {
  const [active, setActive] = useState<number | null>(null)
  const width = 1100
  const height = 330
  const pad = { left: 58, right: 24, top: 42, bottom: 45 }
  const values = data.map((reading) => reading.value)
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  const padding = max === min ? Math.max(Math.abs(min) * 0.05, 1) : (max - min) * 0.1
  const domainMin = min - padding
  const domainMax = max + padding
  const x = (index: number) => pad.left + (index * (width - pad.left - pad.right)) / Math.max(data.length - 1, 1)
  const y = (value: number) => pad.top + ((domainMax - value) / (domainMax - domainMin)) * (height - pad.top - pad.bottom)
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ')
  const labelStep = Math.max(1, Math.ceil(data.length / 7))
  const tooltipX = active === null ? 0 : Math.min(Math.max(x(active) - 75, 8), width - 158)
  const tooltipY = active === null ? 0 : Math.max(y(values[active]) - 70, 8)

  return (
    <div className="sensor-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Supabase 최근 센서 원시값 선 그래프">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = domainMax - ratio * (domainMax - domainMin)
          const tickY = pad.top + ratio * (height - pad.top - pad.bottom)
          return <g key={ratio}>
            <line x1={pad.left} y1={tickY} x2={width - pad.right} y2={tickY} className="gridline" />
            <text x={pad.left - 10} y={tickY + 4} textAnchor="end" className="axis-text">{nf.format(value)}</text>
          </g>
        })}
        {data.map((reading, index) => index % labelStep === 0 || index === data.length - 1 ? (
          <g key={reading.id}>
            <line x1={x(index)} y1={pad.top} x2={x(index)} y2={height - pad.bottom} className="vertical-guide" />
            <text x={x(index)} y={height - 18} textAnchor="middle" className="axis-text">{readingTime(reading.created_at)}</text>
          </g>
        ) : null)}
        {data.length > 1 && <polyline points={points} fill="none" stroke="#52A3A7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {data.map((reading, index) => (
          <g key={`point-${reading.id}`} className="sensor-hit-area" onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)} onClick={() => setActive(index)}>
            <circle cx={x(index)} cy={y(reading.value)} r={active === index ? 6 : 4} fill="#52A3A7" />
          </g>
        ))}
        {active !== null && (
          <g className="sensor-tooltip" pointerEvents="none">
            <rect x={tooltipX} y={tooltipY} width="150" height="52" rx="12" />
            <text x={tooltipX + 12} y={tooltipY + 20}>{readingTime(data[active].created_at, true)}</text>
            <text x={tooltipX + 12} y={tooltipY + 40} className="humidity-value">원시 센서값 {nf.format(values[active])}</text>
          </g>
        )}
        {data.length === 0 && <text x={width / 2} y={height / 2} textAnchor="middle" className="axis-text">Supabase에서 센서 데이터를 기다리는 중입니다.</text>}
      </svg>
    </div>
  )
}

function SensorChart({ data, live = false }: { data: SensorPoint[]; live?: boolean }) {
  const [active, setActive] = useState<number | null>(null)
  const width = 1100
  const height = 330
  const pad = { left: 48, right: 48, top: 42, bottom: 45 }
  const x = (i: number) => pad.left + (i * (width - pad.left - pad.right)) / Math.max(data.length - 1, 1)
  const temperatureValues = data.map((point) => point.temperature)
  const humidityValues = data.map((point) => point.humidity)
  const getDomain = (values: number[], fallback: [number, number], minimumPadding: number): [number, number] => {
    if (!live || values.length === 0) return fallback
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = Math.max((max - min) * 0.1, minimumPadding)
    return [Math.floor(min - padding), Math.ceil(max + padding)]
  }
  const [tempMin, tempMax] = getDomain(temperatureValues, [18, 28], 1)
  const [humidityMin, humidityMax] = getDomain(humidityValues, [30, 70], 2)
  const tempY = (value: number) => pad.top + ((tempMax - value) / (tempMax - tempMin)) * (height - pad.top - pad.bottom)
  const humidityY = (value: number) => pad.top + ((humidityMax - value) / (humidityMax - humidityMin)) * (height - pad.top - pad.bottom)
  const tempPoints = data.map((point, i) => `${x(i)},${tempY(point.temperature)}`).join(' ')
  const humidityPoints = data.map((point, i) => `${x(i)},${humidityY(point.humidity)}`).join(' ')
  const tooltipX = active === null ? 0 : Math.min(Math.max(x(active) - 75, 8), width - 158)

  return (
    <div className="sensor-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="시간별 온도와 습도 변화">
        {data.map((point, i) => (
          <g key={point.label}>
            <line x1={x(i)} y1={pad.top} x2={x(i)} y2={height - pad.bottom} className="vertical-guide" />
            <text x={x(i)} y={height - 18} textAnchor="middle" className="axis-text">{point.label}</text>
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = pad.top + ratio * (height - pad.top - pad.bottom)
          const temperatureTick = tempMax - ratio * (tempMax - tempMin)
          const humidityTick = humidityMax - ratio * (humidityMax - humidityMin)
          return <g key={ratio}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} className="gridline" />
            <text x={pad.left - 10} y={y + 4} textAnchor="end" className="axis-text">{temperatureTick.toFixed(live ? 1 : 0)}°</text>
            <text x={width - pad.right + 10} y={y + 4} textAnchor="start" className="axis-text">{humidityTick.toFixed(live ? 1 : 0)}%</text>
          </g>
        })}
        <polyline points={humidityPoints} fill="none" stroke="#52A3A7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={tempPoints} fill="none" stroke="#C34083" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((point, i) => (
          <g
            key={`points-${point.label}`}
            className="sensor-hit-area"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onClick={() => setActive(i)}
          >
            <rect x={x(i) - 18} y={pad.top} width="36" height={height - pad.top - pad.bottom} fill="transparent" />
            <circle cx={x(i)} cy={humidityY(point.humidity)} r={active === i ? 6 : 4} fill="#52A3A7" />
            <circle cx={x(i)} cy={tempY(point.temperature)} r={active === i ? 6 : 4} fill="#C34083" />
          </g>
        ))}
        {active !== null && (
          <g className="sensor-tooltip" pointerEvents="none">
            <rect x={tooltipX} y="4" width="150" height="64" rx="12" />
            <text x={tooltipX + 12} y="23">{data[active].label}</text>
            <text x={tooltipX + 12} y="41" className="temp-value">온도 {data[active].temperature}°C</text>
            <text x={tooltipX + 12} y="57" className="humidity-value">습도 {data[active].humidity}%</text>
          </g>
        )}
        {data.length === 0 && (
          <text x={width / 2} y={height / 2} textAnchor="middle" className="axis-text">온도,습도 데이터를 기다리는 중입니다.</text>
        )}
      </svg>
    </div>
  )
}

function SensorDashboard() {
  const [chartSource, setChartSource] = useState<'supabase' | 'serial'>('supabase')
  const [readings, setReadings] = useState<Reading[]>([])
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>('loading')
  const [supabaseError, setSupabaseError] = useState('')
  const [serialStatus, setSerialStatus] = useState<SerialStatus>('disconnected')
  const [serialError, setSerialError] = useState('')
  const [livePoints, setLivePoints] = useState<SensorPoint[]>([])
  const [rawSensorValue, setRawSensorValue] = useState<number | null>(null)
  const [lastUpdated, setLastUpdated] = useState('')
  const readingsRef = useRef<Reading[]>([])
  const portRef = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const mountedRef = useRef(false)
  const latestReading = readings[readings.length - 1] ?? null
  const latestSerialClimate = livePoints[livePoints.length - 1] ?? null

  function mergeReadings(incoming: Reading[]) {
    const byId = new Map<string, Reading>()
    for (const reading of [...readingsRef.current, ...incoming]) byId.set(String(reading.id), reading)
    const next = [...byId.values()]
      .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
      .slice(-100)
    readingsRef.current = next
    setReadings(next)
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      const reader = readerRef.current
      const port = portRef.current
      if (reader) {
        void reader.cancel().catch((error: unknown) => console.error('시리얼 리더 종료 실패:', error))
      } else if (port) {
        void port.close().catch((error: unknown) => console.error('시리얼 포트 종료 실패:', error))
      }
    }
  }, [])

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      setSupabaseStatus('error')
      setSupabaseError('VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다.')
      return
    }

    let active = true
    let realtimeSyncStarted = false
    const supabase = createClient(url, anonKey)
    const loadLatestReadings = async () => {
      const { data, error } = await supabase
        .from('readings')
        .select('id, value, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!active) return
      if (error) {
        setSupabaseStatus('error')
        setSupabaseError(`센서 기록 조회 실패: ${error.message}`)
        return
      }

      const rows = Array.isArray(data) ? data.map(parseReading).filter((row): row is Reading => row !== null) : []
      mergeReadings(rows)
      setSupabaseStatus('connected')
      setSupabaseError('')
    }

    const channel = supabase
      .channel('sensor-readings-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'readings' }, (payload) => {
        if (!active) return
        const reading = parseReading(payload.new)
        if (reading) mergeReadings([reading])
      })
      .subscribe((status, error) => {
        if (!active) return
        if (status === 'SUBSCRIBED') {
          setSupabaseStatus('connected')
          if (!realtimeSyncStarted) {
            realtimeSyncStarted = true
            void loadLatestReadings()
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setSupabaseStatus('error')
          setSupabaseError(error?.message || `Supabase Realtime 구독 상태: ${status}`)
        }
      })
    void loadLatestReadings()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [])

  function updateFromSerialLine(line: string) {
    const fields = line.trim().split(',').map((field) => field.trim())
    if (fields.length === 1 && fields[0] !== '') {
      const value = Number(fields[0])
      if (!Number.isFinite(value)) {
        setSerialError(`숫자로 읽을 수 없는 데이터입니다: ${line.trim()}`)
        return
      }
      setRawSensorValue(value)
    } else if (fields.length === 2 && fields.every((field) => field !== '')) {
      const [temperature, humidity] = fields.map(Number)
      if (!Number.isFinite(temperature) || !Number.isFinite(humidity)) {
        setSerialError(`온도,습도 CSV 형식이 아닙니다: ${line.trim()}`)
        return
      }
      const label = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date())
      setLivePoints((current) => [...current, { label, temperature, humidity }].slice(-100))
      setRawSensorValue(null)
    } else {
      if (line.trim()) setSerialError(`한 줄 숫자 또는 온도,습도 형식만 지원합니다: ${line.trim()}`)
      return
    }
    setSerialError('')
    setLastUpdated(new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()))
  }

  async function readSerial(port: SerialPort) {
    if (!port.readable) throw new Error('시리얼 포트에서 데이터를 읽을 수 없습니다.')
    const reader = port.readable.getReader()
    readerRef.current = reader
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (value) {
          buffer += decoder.decode(value, { stream: !done })
          const lines = buffer.split(/\r?\n/)
          buffer = lines.pop() ?? ''
          lines.forEach(updateFromSerialLine)
        }
        if (done) break
      }
      if (buffer.trim()) updateFromSerialLine(buffer)
    } finally {
      reader.releaseLock()
      readerRef.current = null
      if (portRef.current === port) portRef.current = null
      await port.close()
      if (mountedRef.current) setSerialStatus('disconnected')
    }
  }

  async function connectSerial() {
    setSerialError('')
    setSerialStatus('connecting')
    let port: SerialPort | null = null
    try {
      const serial = (navigator as Navigator & { serial?: WebSerialApi }).serial
      if (!serial) throw new Error('Web Serial API를 지원하는 Chrome 또는 Edge 브라우저에서 연결해 주세요.')
      port = await serial.requestPort()
      if (!mountedRef.current) return
      portRef.current = port
      await port.open({ baudRate: 9600 })
      if (!mountedRef.current) {
        portRef.current = null
        await port.close()
        return
      }
      setSerialStatus('connected')
      await readSerial(port)
    } catch (error) {
      if (mountedRef.current) {
        const message = error instanceof DOMException && error.name === 'NotFoundError'
          ? '시리얼 포트 선택이 취소되었습니다.'
          : error instanceof Error ? error.message : String(error)
        setSerialError(message)
        setSerialStatus('disconnected')
      }
      if (port && portRef.current === port && !readerRef.current) {
        portRef.current = null
        try {
          await port.close()
        } catch (closeError) {
          if (mountedRef.current) {
            setSerialError(`${error instanceof Error ? error.message : String(error)} (포트 종료 실패: ${closeError instanceof Error ? closeError.message : String(closeError)})`)
          } else {
            console.error('시리얼 포트 종료 실패:', closeError)
          }
        }
      }
    }
  }

  function disconnectSerial() {
    const reader = readerRef.current
    if (!reader) return
    setSerialStatus('disconnecting')
    void reader.cancel().catch((error: unknown) => {
      if (mountedRef.current) setSerialError(error instanceof Error ? error.message : String(error))
    })
  }

  return (
    <main className="sensor-main">
      <section className="sensor-intro">
        <div>
          <p className="eyebrow">INDOOR CLIMATE MONITOR</p>
          <h1>온습도 센서<br /><em>실시간 모니터링</em></h1>
        </div>
        <div className="sensor-status">
          <span className={`sensor-status-dot ${supabaseStatus === 'connected' ? 'connected' : supabaseStatus === 'loading' ? 'connecting' : 'disconnected'}`} />
          <div className="sensor-status-copy">
            <strong>{supabaseStatus === 'connected' ? 'Supabase 실시간 연결됨' : supabaseStatus === 'loading' ? 'Supabase 연결 중' : 'Supabase 연결 오류'}</strong>
            <small>{latestReading ? `마지막 기록 ${readingTime(latestReading.created_at, true)}` : supabaseStatus === 'connected' ? '센서 데이터 대기 중' : 'readings 테이블을 확인해 주세요.'}</small>
          </div>
          <div className="sensor-serial-actions">
            {serialStatus === 'connected'
              ? <button className="sensor-serial-button secondary" onClick={disconnectSerial}>연결 해제</button>
              : <button className="sensor-serial-button" onClick={connectSerial} disabled={serialStatus !== 'disconnected'}>시리얼 연결</button>}
          </div>
        </div>
      </section>

      <section className="sensor-values">
        <article className="sensor-value-card temperature">
          <div className="sensor-card-top"><span>현재 원시 센서값</span><b>{latestReading ? '실시간' : supabaseStatus === 'loading' ? '조회 중' : '대기'}</b></div>
          <strong>{latestReading ? nf.format(latestReading.value) : '—'}</strong>
          <div className="sensor-card-bottom"><span>최근 표시 <b>{readings.length} / 100개</b></span><span>측정 시각 <b>{latestReading ? readingTime(latestReading.created_at) : '—'}</b></span></div>
        </article>
        <article className="sensor-value-card humidity">
          <div className="sensor-card-top"><span>USB 시리얼 값</span><b>{serialStatus === 'connected' ? '연결됨' : '연결 안 됨'}</b></div>
          <strong>{rawSensorValue !== null ? nf.format(rawSensorValue) : latestSerialClimate ? 'CSV' : '—'}{rawSensorValue !== null && <small>원시</small>}</strong>
          <div className="sensor-card-bottom">
            {latestSerialClimate
              ? <><span>온도 <b>{latestSerialClimate.temperature}°C</b></span><span>습도 <b>{latestSerialClimate.humidity}%</b></span></>
              : <><span>통신 속도 <b>9600 baud</b></span><span>최근 수신 <b>{lastUpdated || '—'}</b></span></>}
          </div>
        </article>
        <article className="sensor-summary">
          <div><span>데이터 테이블</span><strong>readings</strong></div>
          <div><span>Realtime</span><strong>{supabaseStatus === 'connected' ? '구독 중' : supabaseStatus === 'loading' ? '연결 중' : '연결 오류'}</strong></div>
          <div><span>저장 방식</span><strong>Supabase</strong></div>
        </article>
      </section>

      <section className="sensor-chart-card">
        <div className="sensor-chart-head">
          <div><span className="section-number">01</span><h2>센서값 추이</h2><p>{chartSource === 'supabase' ? 'readings 테이블의 최근 100개 원시값' : 'USB 시리얼에서 받은 온도와 습도 CSV'}</p></div>
          <div className="sensor-chart-actions">
            <div className="sensor-legend">
              {chartSource === 'supabase'
                ? <><span className="humidity-dot" />원시 센서값</>
                : <><span className="temp-dot" />온도 <span className="humidity-dot" />습도</>}
            </div>
            <div className="segmented" aria-label="그래프 데이터 소스">
              <button className={chartSource === 'supabase' ? 'active' : ''} onClick={() => setChartSource('supabase')}>Supabase</button>
              <button className={chartSource === 'serial' ? 'active' : ''} onClick={() => setChartSource('serial')} disabled={livePoints.length === 0}>USB CSV</button>
            </div>
          </div>
        </div>
        {chartSource === 'supabase'
          ? <RawReadingsChart data={readings} />
          : <SensorChart data={livePoints} live />}
        {supabaseError && <p className="sensor-serial-error" role="status">{supabaseError}</p>}
        {serialError && <p className="sensor-serial-error" role="status">{serialError}</p>}
        <div className="sensor-chart-note">
          <span>{chartSource === 'supabase' ? 'Supabase 실제 데이터' : 'Web Serial 데이터'}</span>
          <small>{chartSource === 'supabase' ? '시간순으로 정렬된 최신 100개 value · 실제 숫자를 변환하지 않습니다.' : 'CSV 온도·습도는 입력된 값을 그대로 표시합니다.'}</small>
        </div>
      </section>

      <footer><span>환경 센서 대시보드</span><span>Supabase readings · 최근 100개</span></footer>
    </main>
  )
}

export default function App() {
  const [view, setView] = useState<'regions' | 'sensor'>('regions')
  const [regions, setRegions] = useState<Region[]>([])
  const [metric, setMetric] = useState<Metric>('total')
  const [province, setProvince] = useState('경기도')
  const [selected, setSelected] = useState<Region | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/marriage-immigrants.csv')
      .then((r) => r.text())
      .then((text) => {
        const rows = text.split(/\r?\n/).slice(2).map(parseLine)
        const parsed = rows
          .filter((r) => r.length >= 5 && r[1] !== '소계')
          .map((r) => ({
            province: r[0],
            name: r[1],
            total: Number(r[2].replaceAll(',', '')) || 0,
            male: Number(r[3].replaceAll(',', '')) || 0,
            female: Number(r[4].replaceAll(',', '')) || 0,
            type: regionType(r[1]),
          }))
        setRegions(parsed)
        setSelected(parsed.find((r) => r.province === '경기도') || parsed[0] || null)
      })
      .finally(() => setLoading(false))
  }, [])

  const provinces = useMemo(() => [...new Set(regions.map((r) => r.province))], [regions])
  const provinceData = useMemo(() => regions.filter((r) => r.province === province), [regions, province])
  const rankings = useMemo(() => [...regions].sort((a, b) => b.total - a.total).slice(0, 10), [regions])
  const searchResults = useMemo(() => {
    const q = query.trim()
    return q ? regions.filter((r) => `${r.province} ${r.name}`.includes(q)).slice(0, 8) : []
  }, [regions, query])
  const totals = useMemo(() => regions.reduce((a, r) => ({ total: a.total + r.total, male: a.male + r.male, female: a.female + r.female }), { total: 0, male: 0, female: 0 }), [regions])
  const normalizedData = useMemo(() => {
    const limits = new Map<Region['type'], [number, number]>()
    ;(['시', '군', '구'] as const).forEach((type) => {
      const vals = regions.filter((r) => r.type === type).map((r) => r[metric])
      limits.set(type, [Math.min(...vals), Math.max(...vals)])
    })
    return provinceData.map((r) => {
      const [min, max] = limits.get(r.type) || [r[metric], r[metric]]
      return { ...r, [metric]: max === min ? 0.5 : (r[metric] - min) / (max - min) }
    })
  }, [regions, provinceData, metric])

  function chooseRegion(region: Region) {
    setSelected(region)
    setProvince(region.province)
    setQuery('')
  }

  if (loading) return <main className="loading">데이터를 불러오는 중입니다.</main>

  return (
    <div className="app-shell">
      <header>
        <div className="brand-mark"><Icon name="chart" /></div>
        <div className="brand"><strong>{view === 'regions' ? '결혼이민자 현황' : '온습도 모니터'}</strong><span>DATA MONITORING DASHBOARD</span></div>
        <nav className="view-nav" aria-label="대시보드 전환">
          <button className={view === 'regions' ? 'active' : ''} onClick={() => setView('regions')}>지역 통계</button>
          <button className={view === 'sensor' ? 'active' : ''} onClick={() => setView('sensor')}>온습도 센서</button>
        </nav>
        <div className="data-badge"><span /> {view === 'regions' ? '2025년 기준 · 단위: 명' : '온습도 센서 · 9600 baud'}</div>
      </header>

      {view === 'sensor' ? <SensorDashboard /> : <main>
        <section className="intro">
          <div>
            <p className="eyebrow">MARRIAGE IMMIGRANTS IN KOREA</p>
            <h1>지역별 결혼이민자 현황을<br /><em>한눈에 살펴보세요.</em></h1>
            <p>전국 시군구 데이터를 검색하고, 지역 간 규모와 성별 분포를 비교할 수 있습니다.</p>
          </div>
          <div className="search-area">
            <label><Icon name="search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="시·군·구 검색 (예: 수원시)" /></label>
            {searchResults.length > 0 && <div className="search-results">
              {searchResults.map((r) => <button key={`${r.province}-${r.name}`} onClick={() => chooseRegion(r)}><span>{r.name}<small>{r.province}</small></span><strong>{nf.format(r.total)}명</strong></button>)}
            </div>}
          </div>
        </section>

        <section className="stats">
          <article><div className="stat-icon blue"><Icon name="people" /></div><div><span>전국 결혼이민자</span><strong>{nf.format(totals.total)}<small>명</small></strong></div><i>100%</i></article>
          <article><div className="stat-icon purple"><Icon name="people" /></div><div><span>남성</span><strong>{nf.format(totals.male)}<small>명</small></strong></div><i>{((totals.male / totals.total) * 100).toFixed(1)}%</i></article>
          <article><div className="stat-icon pink"><Icon name="people" /></div><div><span>여성</span><strong>{nf.format(totals.female)}<small>명</small></strong></div><i>{((totals.female / totals.total) * 100).toFixed(1)}%</i></article>
          <article className="selected-stat"><div className="stat-icon green"><Icon name="pin" /></div><div><span>선택 지역</span><strong>{selected?.name || '-'}</strong><small>{selected ? `${nf.format(selected.total)}명 · ${selected.province}` : ''}</small></div></article>
        </section>

        <section className="dashboard-grid">
          <article className="card trend-card">
            <div className="card-head">
              <div><span className="section-number">01</span><h2>지역별 현황</h2><p>선택한 시도의 시군구별 인원을 비교합니다.</p></div>
              <div className="controls">
                <select value={province} onChange={(e) => setProvince(e.target.value)} aria-label="시도 선택">{provinces.map((p) => <option key={p}>{p}</option>)}</select>
                <div className="segmented">{(['total', 'male', 'female'] as Metric[]).map((m) => <button key={m} className={metric === m ? 'active' : ''} style={metric === m ? { background: colors[m] } : undefined} onClick={() => setMetric(m)}>{metricLabel[m]}</button>)}</div>
              </div>
            </div>
            <SparkLine data={provinceData} metric={metric} />
            <div className="legend"><span style={{ background: colors[metric] }} /> {metricLabel[metric]} 인원 <small>점을 올리면 정확한 값을 확인할 수 있습니다.</small></div>
          </article>

          <article className="card rank-card">
            <div className="card-head"><div><span className="section-number">02</span><h2>지역 순위</h2><p>전국 시군구 총계 상위 10곳</p></div><span className="unit">단위: 명</span></div>
            <Ranking data={rankings} selected={selected?.name || ''} onSelect={chooseRegion} />
          </article>

          <article className="card normalized-card">
            <div className="card-head">
              <div><span className="section-number">03</span><h2>정규화 비교</h2><p>시·군·구 유형별 최솟값 0, 최댓값 1로 변환했습니다.</p></div>
              <div className="type-legend"><span className="city">시</span><span className="county">군</span><span className="district">구</span></div>
            </div>
            <SparkLine data={normalizedData} metric={metric} normalized />
            <div className="legend"><span className="green-dot" style={{ background: colors[metric] }} /> 유형 내 상대적 규모 <small>지역 유형이 다른 경우 절대 인원이 아닌 상대 위치를 비교하세요.</small></div>
          </article>
        </section>

        <footer><span>자료: 통계청 국가통계포털(KOSIS)</span><span>행정구역(시군구)별 결혼이민자 현황 · 2025</span></footer>
      </main>}
    </div>
  )
}
