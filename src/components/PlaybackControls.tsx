import { togglePlay } from '../lib/player'
import { usePlayerStore } from '../stores/playerStore'

export function PlaybackControls() {
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const isLooping = usePlayerStore((s) => s.isLooping)
  const loopDelay = usePlayerStore((s) => s.loopDelay)
  const loopStart = usePlayerStore((s) => s.loopStart)
  const loopEnd = usePlayerStore((s) => s.loopEnd)
  const setIsLooping = usePlayerStore((s) => s.setIsLooping)
  const setLoopDelay = usePlayerStore((s) => s.setLoopDelay)

  const canLoop = loopStart !== null && loopEnd !== null && loopEnd > loopStart

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={togglePlay}
        className="bg-green-500 hover:bg-green-400 text-black w-10 h-10 rounded-full flex items-center justify-center transition-colors"
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="8,5 19,12 8,19" />
          </svg>
        )}
      </button>

      <button
        onClick={() => canLoop && setIsLooping(!isLooping)}
        disabled={!canLoop}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
          isLooping
            ? 'bg-green-500 text-black'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {isLooping ? 'Looping' : 'Loop'}
      </button>

      {isLooping && (
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <span>Delay:</span>
          <input
            type="number"
            value={loopDelay}
            onChange={(e) => setLoopDelay(Math.max(0, Number(e.target.value)))}
            min={0}
            max={10000}
            step={100}
            className="w-16 bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-center"
          />
          <span>ms</span>
        </label>
      )}
    </div>
  )
}
