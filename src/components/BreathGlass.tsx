import CondensationCanvas from "./CondensationCanvas"

export default function BreathGlass({ level }: { level: number }) {
  const imageUrl = `${import.meta.env.BASE_URL}images/breath-landscape.webp`

  return (
    <div className="breath-glass" aria-hidden="true">
      <img className="landscape" src={imageUrl} alt="" />
      <div className="landscape-veil" />
      <CondensationCanvas level={level} />
      <div className="glass-reflection" />
      <div className="glass-grain" />
    </div>
  )
}
