import type { Status } from "../lib/device"

const statusCopy: Record<Status, string> = {
  disconnected: "연결 안 됨",
  connecting: "연결 중",
  connected: "센서 연결됨",
  error: "연결 실패",
}

type Props = {
  status: Status
  demoMode: boolean
  onToggle: () => Promise<void>
}

export default function ConnectionControl({
  status,
  demoMode,
  onToggle,
}: Props) {
  const connected = status === "connected"

  if (demoMode) {
    return (
      <div className="connection-control">
        <p className="connection-status is-demo t-label" role="status">
          <span aria-hidden="true" />
          데모 모드
        </p>
        <p className="connection-detail t-caption">수동 습도 입력</p>
      </div>
    )
  }

  return (
    <div className="connection-control">
      <p className={`connection-status status-${status} t-label`} role="status">
        <span aria-hidden="true" />
        {statusCopy[status]}
      </p>
      <button
        className="text-button t-caption"
        type="button"
        disabled={status === "connecting"}
        onClick={() => void onToggle()}
      >
        {connected ? "연결 끊기" : "연결"}
      </button>
    </div>
  )
}
