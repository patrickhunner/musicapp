import { useRef, useCallback, useState, useEffect } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import { seekTo } from '../lib/player'

function msToTimestamp(ms: number): string {
  const totalSec = ms / 1000
  const min = Math.floor(totalSec / 60)
  const sec = Math.floor(totalSec % 60)
  const frac = Math.floor((totalSec % 1) * 1000)
  return `${min}:${sec.toString().padStart(2, '0')}.${frac.toString().padStart(3, '0')}`
}

function timestampToMs(str: string): number | null {
  const parts = str.split(':')
  if (parts.length !== 2) return null
  const min = parseInt(parts[0], 10)
  if (isNaN(min)) return null
  const secParts = parts[1].split('.')
  const sec = parseInt(secParts[0], 10)
  if (isNaN(sec)) return null
  const ms = secParts[1] ? parseInt(secParts[1].padEnd(3, '0').slice(0, 3), 10) : 0
  if (isNaN(ms)) return null
  return min * 60000 + sec * 1000 + ms
}

export function LoopEditor() {
  const position = usePlayerStore((s) => s.position)
  const duration = usePlayerStore((s) => s.duration)
  const loopStart = usePlayerStore((s) => s.loopStart)
  const loopEnd = usePlayerStore((s) => s.loopEnd)
  const isLooping = usePlayerStore((s) => s.isLooping)
  const beats = usePlayerStore((s) => s.beats)
  const waveform = usePlayerStore((s) => s.waveform)
  const setLoopStart = usePlayerStore((s) => s.setLoopStart)
  const setLoopEnd = usePlayerStore((s) => s.setLoopEnd)
  const setIsDraggingLoop = usePlayerStore((s) => s.setIsDraggingLoop)
  const isDragging = useRef(false)

  const timelineRef = useRef<HTMLDivElement>(null)

  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')

  useEffect(() => {
    if (loopStart !== null) setStartInput(msToTimestamp(loopStart))
  }, [loopStart])

  useEffect(() => {
    if (loopEnd !== null) setEndInput(msToTimestamp(loopEnd))
  }, [loopEnd])

  const snapToBeat = useCallback(
    (ms: number): number => {
      if (beats.length === 0) return ms
      const beatMs = beats.map((b) => b.start * 1000)
      let nearest = beatMs[0]
      let minDiff = Math.abs(ms - nearest)
      for (const bms of beatMs) {
        const diff = Math.abs(ms - bms)
        if (diff < minDiff) {
          minDiff = diff
          nearest = bms
        }
      }
      return nearest
    },
    [beats]
  )

  const constrainToLoop = useCallback(
    (ms: number): number => {
      if (!isLooping || loopStart === null || loopEnd === null) return ms
      return Math.max(loopStart, Math.min(ms, loopEnd))
    },
    [isLooping, loopStart, loopEnd]
  )

  const msFromEvent = useCallback(
    (clientX: number): number => {
      const timeline = timelineRef.current
      if (!timeline) return 0
      const rect = timeline.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return pct * duration
    },
    [duration]
  )

  const startDrag = useCallback(
    (e: React.MouseEvent, handle: 'start' | 'end') => {
      e.preventDefault()
      e.stopPropagation()
      const timeline = timelineRef.current
      if (!timeline) return

      setIsDraggingLoop(true)
      const rect = timeline.getBoundingClientRect()

      const onMouseMove = (e: MouseEvent) => {
        const x = e.clientX - rect.left
        const pct = Math.max(0, Math.min(1, x / rect.width))
        let ms = pct * duration

        ms = snapToBeat(ms)

        if (handle === 'start') {
          const max = loopEnd ?? duration
          setLoopStart(Math.min(ms, max))
        } else {
          const min = loopStart ?? 0
          setLoopEnd(Math.max(ms, min))
        }
      }

      const onMouseUp = () => {
        setIsDraggingLoop(false)
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [duration, loopStart, loopEnd, snapToBeat, setLoopStart, setLoopEnd, setIsDraggingLoop]
  )

  const handleTimelineMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return

      const rect = timelineRef.current?.getBoundingClientRect()
      if (!rect) return

      isDragging.current = false
      const startX = e.clientX

      const onMouseMove = (e: MouseEvent) => {
        isDragging.current = true
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        let ms = pct * duration
        if (isLooping && loopStart !== null && loopEnd !== null) {
          ms = Math.max(loopStart, Math.min(ms, loopEnd))
        }
        seekTo(ms)
      }

      const onMouseUp = (e: MouseEvent) => {
        if (!isDragging.current) {
          let ms = msFromEvent(e.clientX)
          ms = constrainToLoop(ms)
          seekTo(ms)
        }
        isDragging.current = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [duration, isLooping, loopStart, loopEnd, constrainToLoop, msFromEvent]
  )

  const handleStartInputBlur = useCallback(() => {
    const ms = timestampToMs(startInput)
    if (ms !== null && loopEnd !== null) {
      setLoopStart(Math.min(ms, loopEnd))
    } else if (loopStart !== null) {
      setStartInput(msToTimestamp(loopStart))
    }
  }, [startInput, loopStart, loopEnd, setLoopStart])

  const handleEndInputBlur = useCallback(() => {
    const ms = timestampToMs(endInput)
    if (ms !== null && loopStart !== null) {
      setLoopEnd(Math.max(ms, loopStart))
    } else if (loopEnd !== null) {
      setEndInput(msToTimestamp(loopEnd))
    }
  }, [endInput, loopStart, loopEnd, setLoopEnd])

  const adjustStart = useCallback((delta: number) => {
    if (loopStart === null) return
    const newVal = Math.max(0, Math.min(loopEnd ?? duration, loopStart + delta))
    setLoopStart(snapToBeat(newVal))
  }, [loopStart, loopEnd, duration, snapToBeat, setLoopStart])

  const adjustEnd = useCallback((delta: number) => {
    if (loopEnd === null) return
    const newVal = Math.max(loopStart ?? 0, Math.min(duration, loopEnd + delta))
    setLoopEnd(snapToBeat(newVal))
  }, [loopEnd, loopStart, duration, snapToBeat, setLoopEnd])

  if (duration === 0) return null

  const startPct = loopStart !== null ? (loopStart / duration) * 100 : 0
  const endPct = loopEnd !== null ? (loopEnd / duration) * 100 : 100
  const posPct = (position / duration) * 100

  return (
    <div className="mb-4">
      <div
        ref={timelineRef}
        className="relative h-16 bg-gray-800 rounded-lg select-none cursor-pointer overflow-hidden"
        onMouseDown={handleTimelineMouseDown}
      >
        {waveform.length > 0 && (
          <div className="absolute inset-0 flex items-end gap-px pointer-events-none z-0 px-0.5">
            {waveform.map((val, i) => (
              <div
                key={i}
                className="flex-1 bg-gray-600 rounded-t"
                style={{ height: `${Math.max(4, val * 100)}%` }}
              />
            ))}
          </div>
        )}

        <div
          className="absolute top-0 bottom-0 bg-green-500/20 pointer-events-none z-[1]"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-green-400 z-10 pointer-events-none"
          style={{ left: `${posPct}%` }}
        />

        <div
          className="absolute top-0 bottom-0 w-3 bg-white/80 rounded-full -ml-1.5 z-30 cursor-ew-resize hover:bg-white transition-colors flex items-center justify-center"
          style={{ left: `${startPct}%` }}
          onMouseDown={(e) => startDrag(e, 'start')}
        >
          <div className="w-0.5 h-4 bg-gray-800 rounded" />
        </div>

        <div
          className="absolute top-0 bottom-0 w-3 bg-white/80 rounded-full -ml-1.5 z-30 cursor-ew-resize hover:bg-white transition-colors flex items-center justify-center"
          style={{ left: `${endPct}%` }}
          onMouseDown={(e) => startDrag(e, 'end')}
        >
          <div className="w-0.5 h-4 bg-gray-800 rounded" />
        </div>
      </div>

        <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-1 flex-1">
          <span className="text-xs text-gray-400">A:</span>
          <button
            onClick={() => adjustStart(-1000)}
            className="px-1.5 py-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            -1s
          </button>
          <input
            type="text"
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            onBlur={handleStartInputBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleStartInputBlur()}
            className="w-24 bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700 font-mono focus:outline-none focus:border-green-500 text-center"
          />
          <button
            onClick={() => adjustStart(1000)}
            className="px-1.5 py-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            +1s
          </button>
        </div>
        <div className="flex items-center gap-1 text-green-400 font-mono text-xs shrink-0">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="8,5 19,12 8,19" />
          </svg>
          <span>{msToTimestamp(position)}</span>
        </div>
        <div className="flex items-center gap-1 flex-1">
          <span className="text-xs text-gray-400">B:</span>
          <button
            onClick={() => adjustEnd(-1000)}
            className="px-1.5 py-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            -1s
          </button>
          <input
            type="text"
            value={endInput}
            onChange={(e) => setEndInput(e.target.value)}
            onBlur={handleEndInputBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleEndInputBlur()}
            className="w-24 bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700 font-mono focus:outline-none focus:border-green-500 text-center"
          />
          <button
            onClick={() => adjustEnd(1000)}
            className="px-1.5 py-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            +1s
          </button>
        </div>
      </div>
    </div>
  )
}
