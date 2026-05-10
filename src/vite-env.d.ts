/// <reference types="vite/client" />

interface Window {
  onSpotifyWebPlaybackSDKReady?: () => void
  Spotify: {
    Player: new (config: {
      name: string
      getOAuthToken: (cb: (token: string) => void) => void
      volume?: number
    }) => Spotify.Player
  }
}

declare namespace Spotify {
  interface Player {
    connect(): Promise<boolean>
    disconnect(): void
    pause(): Promise<void>
    resume(): Promise<void>
    seek(positionMs: number): Promise<void>
    setVolume(volume: number): Promise<void>
    getVolume(): Promise<number>
    addListener(event: 'ready', cb: (data: { device_id: string }) => void): void
    addListener(event: 'not_ready', cb: (data: { device_id: string }) => void): void
    addListener(event: 'player_state_changed', cb: (state: PlaybackState | null) => void): void
    addListener(event: 'autoplay_failed', cb: () => void): void
  }

  interface PlaybackState {
    position: number
    duration: number
    paused: boolean
    loading: boolean
    track_window: {
      current_track: TrackInfo
      previous_tracks: TrackInfo[]
      next_tracks: TrackInfo[]
    }
  }

  interface TrackInfo {
    id: string
    uri: string
    name: string
    type: string
    artists: { name: string; uri: string }[]
    album: {
      name: string
      uri: string
      images: { url: string; width: number; height: number }[]
    }
    duration_ms: number
  }
}
