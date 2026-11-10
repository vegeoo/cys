type Props = {
  active: boolean
  onToggle: () => void
}

export default function DemoModeToggle({ active, onToggle }: Props) {
  return (
    <button
      className="demo-mode-toggle"
      type="button"
      aria-pressed={active}
      onClick={onToggle}
    >
      <span className="demo-mode-indicator" aria-hidden="true" />
      <span className="demo-mode-copy">
        <strong className="t-label">데모 모드</strong>
        <small className="t-caption">{active ? "켜짐" : "꺼짐"}</small>
      </span>
    </button>
  )
}
