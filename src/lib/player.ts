import { usePlayerStore } from '../stores/playerStore'
import { refreshAccessToken } from './spotify'

async function apiFetchWithRefresh(url: string, options: RequestInit, token: string): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return fetch(url, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
      })
    }
  }
  return res
}

export async function playTrack(trackUri: string): Promise<void> {
  const state = usePlayerStore.getState()
  const { deviceId } = state
  let token = state.token
  if (!deviceId || !token) return

  const res = await apiFetchWithRefresh(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [trackUri] }),
    },
    token
  )
  if (!res.ok) {
    console.error('Playback failed:', res.status, await res.text())
  }
}

export async function togglePlay(): Promise<void> {
  const { player, isPlaying, deviceId } = usePlayerStore.getState()
  if (!player) {
    console.error('togglePlay: no player connected')
    return
  }
  if (!deviceId) {
    console.error('togglePlay: no deviceId')
  }

  try {
    if (isPlaying) {
      await player.pause()
    } else {
      await player.resume()
    }
  } catch (e) {
    console.error('togglePlay error:', e)
  }
}

export async function seekTo(positionMs: number): Promise<void> {
  const { player } = usePlayerStore.getState()
  if (!player) return
  await player.seek(positionMs)
}
