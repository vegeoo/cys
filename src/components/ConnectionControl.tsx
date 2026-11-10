import type { Status } from "../lib/device"

const statusCopy: Record<Status, string> = {
  disconnected: "연결 안 됨",
  connecting: "연결 중…",
  connected: "연결됨",
  error: "연결 실패, 다시 시도",
}

type Props = {
  status: Status
  onToggle: () => Promise<void>
}

export default function ConnectionControl({ status, onToggle }: Props) {
  const connected = status === "connected"
  return (
    <div className="control-row">
      <div>
        <p className="control-name t-label">센서</p>
        <p
          className={`connection-status t-label status-${status}`}
          role="status"
        >
          <span aria-hidden="true" />
          {statusCopy[status]}
        </p>
      </div>
      <button
        className={`action-button t-label ${connected ? "secondary" : ""}`}
        type="button"
        disabled={status === "connecting"}
        onClick={() => void onToggle()}
      >
        {connected ? "연결 끊기" : "센서 연결"}
      </button>
    </div>
  )
}
