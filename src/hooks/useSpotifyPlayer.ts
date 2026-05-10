import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import { refreshAccessToken } from '../lib/spotify'
import { getAudioAnalysis, getAudioFeatures } from '../lib/spotify'

export function useSpotifyPlayer() {
  const token = usePlayerStore((s) => s.token)
  const setPlayer = usePlayerStore((s) => s.setPlayer)
  const setDeviceId = usePlayerStore((s) => s.setDeviceId)
  const setPosition = usePlayerStore((s) => s.setPosition)
  const setDuration = usePlayerStore((s) => s.setDuration)
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying)
  const setCurrentTrack = usePlayerStore((s) => s.setCurrentTrack)
  const setBpm = usePlayerStore((s) => s.setBpm)
  const setBeats = usePlayerStore((s) => s.setBeats)
  const setWaveform = usePlayerStore((s) => s.setWaveform)
  const setLoopStart = usePlayerStore((s) => s.setLoopStart)
  const setLoopEnd = usePlayerStore((s) => s.setLoopEnd)

  const lastUpdateRef = useRef({ position: 0, timestamp: 0, playing: false })

  useEffect(() => {
    if (!token) return

    let isMounted = true
    let player: Spotify.Player | null = null

    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true

    window.onSpotifyWebPlaybackSDKReady = () => {
      if (!isMounted) return

      player = new window.Spotify.Player({
        name: 'Music Practice App',
        getOAuthToken: async (cb) => {
          let currentToken = usePlayerStore.getState().token
          if (!currentToken) {
            currentToken = await refreshAccessToken()
            if (currentToken) {
              usePlayerStore.getState().setToken(currentToken)
            }
          }
          cb(currentToken ?? '')
        },
        volume: 0.5,
      })

      player.addListener('ready', ({ device_id }) => {
        console.log('Player ready:', device_id)
        setDeviceId(device_id)
      })

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Player not ready:', device_id)
      })

      player.addListener('player_state_changed', (state) => {
        if (!state || !isMounted) return

        const now = Date.now()
        lastUpdateRef.current = { position: state.position, timestamp: now, playing: !state.paused }

        setPosition(state.position)
        setDuration(state.duration)
        setIsPlaying(!state.paused)

        const track = state.track_window.current_track
        if (track) {
          const store = usePlayerStore.getState()
          if (store.currentTrack?.id !== track.id) {
            const trackData = {
              id: track.id,
              name: track.name,
              artists: track.artists.map((a) => ({ name: a.name })),
              album: {
                name: track.album.name,
                images: track.album.images.map((i) => ({
                  url: i.url,
                  width: i.width,
                  height: i.height,
                })),
              },
              duration_ms: track.duration_ms,
              uri: track.uri,
            }
            setCurrentTrack(trackData)
            setLoopStart(0)
            setLoopEnd(track.duration_ms)

            getAudioFeatures(track.id, token)
              .then((features) => setBpm(features.tempo))
              .catch(console.error)

            getAudioAnalysis(track.id, token)
              .then((analysis) => {
                setBeats(analysis.beats)

                const numBars = 300
                const barDuration = track.duration_ms / 1000 / numBars
                const waveform = new Array(numBars).fill(0)
                for (let i = 0; i < numBars; i++) {
                  const barStart = i * barDuration
                  const barEnd = barStart + barDuration
                  let maxLoudness = -100
                  for (const seg of analysis.segments) {
                    const segStart = seg.start
                    const segEnd = seg.start + seg.duration
                    if (segStart < barEnd && segEnd > barStart) {
                      if (seg.loudness_max > maxLoudness) {
                        maxLoudness = seg.loudness_max
                      }
                    }
                  }
                  waveform[i] = maxLoudness > -60 ? (maxLoudness + 60) / 60 : 0
                }
                setWaveform(waveform)
              })
              .catch(() => {
                console.log('Audio analysis unavailable, using placeholder waveform')
                const numBars = 300
                const placeholder = new Array(numBars).fill(0).map((_, i) => {
                  const phase = (i / numBars) * Math.PI * 6
                  return 0.15 + Math.sin(phase) * 0.15 + Math.random() * 0.3
                })
                setWaveform(placeholder)

                getAudioFeatures(track.id, token)
                  .then((features) => {
                    const bpm = features.tempo
                    const beatInterval = 60000 / bpm
                    const numBeats = Math.floor(track.duration_ms / beatInterval)
                    const estimatedBeats = Array.from({ length: numBeats }, (_, i) => ({
                      start: (i * beatInterval) / 1000,
                      duration: beatInterval / 1000,
                      confidence: 0.5,
                    }))
                    setBeats(estimatedBeats)
                  })
                  .catch(() => {})
              })
          }
        }
      })

      player.addListener('autoplay_failed', () => {
        console.log('Autoplay failed')
      })

      player.connect().then((success) => {
        if (success && isMounted) {
          console.log('Player connected')
          setPlayer(player)
        } else if (isMounted) {
          console.error('Player failed to connect')
        }
      })
    }

    document.body.appendChild(script)

    return () => {
      isMounted = false
      if (player) {
        player.disconnect()
      }
      const s = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')
      if (s && s.parentNode) {
        s.parentNode.removeChild(s)
      }
      if (window.onSpotifyWebPlaybackSDKReady) {
        window.onSpotifyWebPlaybackSDKReady = undefined
      }
    }
  }, [token])

  useEffect(() => {
    const interval = setInterval(() => {
      const { position, timestamp, playing } = lastUpdateRef.current
      if (playing && timestamp > 0) {
        setPosition(position + (Date.now() - timestamp))
      }
    }, 100)
    return () => clearInterval(interval)
  }, [setPosition])
}
