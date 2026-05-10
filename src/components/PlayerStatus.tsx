import { usePlayerStore } from '../stores/playerStore'

export function PlayerStatus() {
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const bpm = usePlayerStore((s) => s.bpm)
  const position = usePlayerStore((s) => s.position)
  const duration = usePlayerStore((s) => s.duration)

  if (!currentTrack) return null

  const formatTime = (ms: number) => {
    const t = Math.floor(ms / 1000)
    return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg mb-4">
      <img
        src={currentTrack.album.images?.[1]?.url ?? currentTrack.album.images?.[0]?.url}
        alt=""
        className="w-14 h-14 rounded object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold truncate">{currentTrack.name}</div>
        <div className="text-gray-400 text-sm truncate">
          {currentTrack.artists.map((a) => a.name).join(', ')}
        </div>
        <div className="text-gray-500 text-xs mt-1">
          {formatTime(position)} / {formatTime(duration)}
        </div>
      </div>
      {bpm && (
        <div className="text-green-400 font-mono text-sm px-3 py-1 bg-gray-700 rounded">
          {bpm.toFixed(1)} BPM
        </div>
      )}
    </div>
  )
}
