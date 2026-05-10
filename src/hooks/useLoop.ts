import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../stores/playerStore'

export function useLoop() {
  const player = usePlayerStore((s) => s.player)
  const position = usePlayerStore((s) => s.position)
  const loopStart = usePlayerStore((s) => s.loopStart)
  const loopEnd = usePlayerStore((s) => s.loopEnd)
  const isLooping = usePlayerStore((s) => s.isLooping)
  const loopDelay = usePlayerStore((s) => s.loopDelay)
  const isDraggingLoop = usePlayerStore((s) => s.isDraggingLoop)

  const prevPositionRef = useRef<number>(0)
  const isWaitingRef = useRef(false)
  const wasLoopingRef = useRef(false)

  useEffect(() => {
    if (!player || !isLooping || loopStart === null || loopEnd === null || isWaitingRef.current || isDraggingLoop) {
      prevPositionRef.current = position
      return
    }

    const loopJustToggledOn = isLooping && !wasLoopingRef.current
    wasLoopingRef.current = isLooping

    if (loopJustToggledOn) {
      wasLoopingRef.current = true
      if (position < loopStart || position >= loopEnd) {
        player.seek(loopStart)
        prevPositionRef.current = loopStart
        return
      }
    }

    if (position < loopStart) {
      player.seek(loopStart)
      prevPositionRef.current = loopStart
      return
    }

    const prevPos = prevPositionRef.current
    if (prevPos < loopEnd && position >= loopEnd) {
      isWaitingRef.current = true

      if (loopDelay > 0) {
        player.pause().then(() => {
          setTimeout(() => {
            player.seek(loopStart).then(() => {
              player.resume().then(() => {
                isWaitingRef.current = false
              })
            })
          }, loopDelay)
        })
      } else {
        player.seek(loopStart).then(() => {
          isWaitingRef.current = false
        })
      }
    }

    prevPositionRef.current = position
  }, [player, position, loopStart, loopEnd, isLooping, loopDelay, isDraggingLoop])
}
