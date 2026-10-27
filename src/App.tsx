import { useEffect, useMemo, useState } from 'react'

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

export default function App() {
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
        <div className="brand"><strong>결혼이민자 현황</strong><span>KOSIS 지역 데이터 대시보드</span></div>
        <div className="data-badge"><span /> 2025년 기준 · 단위: 명</div>
      </header>

      <main>
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
      </main>
    </div>
  )
}
