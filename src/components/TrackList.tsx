import { usePlayerStore } from '../stores/playerStore'
import { playTrack } from '../lib/player'

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function TrackList() {
  const searchResults = usePlayerStore((s) => s.searchResults)
  const isSearching = usePlayerStore((s) => s.isSearching)
  const deviceId = usePlayerStore((s) => s.deviceId)

  if (isSearching) {
    return <div className="text-gray-400 text-center py-4">Searching...</div>
  }

  if (searchResults.length === 0) return null

  return (
    <div className="space-y-1 mb-6">
      {searchResults.map((track) => (
        <button
          key={track.id}
          onClick={() => playTrack(track.uri)}
          disabled={!deviceId}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors text-left disabled:opacity-50"
        >
          <img
            src={track.album.images?.[2]?.url ?? track.album.images?.[0]?.url}
            alt=""
            className="w-10 h-10 rounded object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium truncate">{track.name}</div>
            <div className="text-gray-400 text-sm truncate">
              {track.artists.map((a) => a.name).join(', ')}
            </div>
          </div>
          <div className="text-gray-500 text-sm">{formatDuration(track.duration_ms)}</div>
        </button>
      ))}
    </div>
  )
}
