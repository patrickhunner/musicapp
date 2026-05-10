export interface Track {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string; width: number; height: number }[]
  }
  duration_ms: number
  uri: string
}

export interface Beat {
  start: number
  duration: number
  confidence: number
}

export interface Segment {
  start: number
  duration: number
  loudness_max: number
}
