import { useRef } from "react"

type Props = {
  power: boolean
  onChange: (power: boolean) => Promise<boolean>
}

export default function PowerToggle({ power, onChange }: Props) {
  const errorRef = useRef<HTMLParagraphElement>(null)

  const togglePower = async () => {
    if (errorRef.current) errorRef.current.hidden = true
    const didUpdate = await onChange(!power)
    if (!didUpdate && errorRef.current) errorRef.current.hidden = false
  }

  return (
    <div className="power-control">
      <div className="power-row">
        <span className="t-label">LED {power ? "켜짐" : "꺼짐"}</span>
        <button
          className="power-switch"
          type="button"
          role="switch"
          aria-checked={power}
          aria-label="LED 전원"
          onClick={() => void togglePower()}
        >
          <span aria-hidden="true" />
        </button>
      </div>
      <p ref={errorRef} className="power-error t-caption" role="alert" hidden>
        전원 변경 실패, 다시 시도
      </p>
    </div>
  )
}
