const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1'
const REDIRECT_URI = window.location.origin + '/musicapp/'

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64url(array.buffer)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64url(digest)
}

function getScopes(): string {
  return [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
  ].join(' ')
}

export async function redirectToAuth(): Promise<void> {
  const verifier = generateCodeVerifier()
  localStorage.setItem('spotify_code_verifier', verifier)
  const challenge = await generateCodeChallenge(verifier)

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_SPOTIFY_CLIENT_ID not set in .env')
  }

  console.log('Requesting scopes:', getScopes())

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: getScopes(),
  })

  const authUrl = `${SPOTIFY_AUTH_URL}?${params.toString()}`
  console.log('Redirecting to:', authUrl)
  window.location.href = authUrl
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const verifier = localStorage.getItem('spotify_code_verifier')
  if (!verifier) throw new Error('No code verifier found')

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  if (!clientId) throw new Error('VITE_SPOTIFY_CLIENT_ID not set')

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${await response.text()}`)
  }

  const data = await response.json()
  localStorage.removeItem('spotify_code_verifier')
  localStorage.setItem('spotify_access_token', data.access_token)
  if (data.refresh_token) {
    localStorage.setItem('spotify_refresh_token', data.refresh_token)
  }
  console.log('Token scopes granted:', data.scope)
  return data.access_token
}

export function clearStoredToken(): void {
  localStorage.removeItem('spotify_access_token')
  localStorage.removeItem('spotify_refresh_token')
  localStorage.removeItem('spotify_code_verifier')
}

export function getStoredToken(): string | null {
  return localStorage.getItem('spotify_access_token')
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('spotify_refresh_token')
  if (!refreshToken) return null

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  if (!clientId) return null

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  localStorage.setItem('spotify_access_token', data.access_token)
  if (data.refresh_token) {
    localStorage.setItem('spotify_refresh_token', data.refresh_token)
  }

  const { setToken } = await import('../stores/playerStore').then(m => m.usePlayerStore.getState())
  setToken(data.access_token)

  return data.access_token
}

async function apiFetch<T>(endpoint: string, token: string): Promise<T> {
  const url = `${SPOTIFY_API_URL}${endpoint}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    if (response.status === 401) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        return apiFetch(endpoint, newToken)
      }
    }
    const body = await response.text()
    console.error(`API ${response.status} for ${endpoint}:`, body)
    throw new Error(`API error ${response.status}: ${body}`)
  }
  return response.json()
}

interface SpotifyTrackItem {
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

interface SpotifySearchResponse {
  tracks: { items: SpotifyTrackItem[] }
}

export interface SpotifyBeat {
  start: number
  duration: number
  confidence: number
}

interface SpotifyAudioFeaturesResponse {
  tempo: number
  time_signature: number
}

interface SpotifyAudioAnalysisResponse {
  beats: SpotifyBeat[]
  segments: {
    start: number
    duration: number
    loudness_max: number
  }[]
}

export async function searchTracks(query: string, token: string): Promise<SpotifyTrackItem[]> {
  const params = new URLSearchParams({ q: query, type: 'track' })
  const data = await apiFetch<SpotifySearchResponse>(`/search?${params}`, token)
  return data.tracks.items
}

export async function getAudioFeatures(id: string, token: string): Promise<SpotifyAudioFeaturesResponse> {
  return apiFetch<SpotifyAudioFeaturesResponse>(`/audio-features/${id}`, token)
}

export async function getAudioAnalysis(id: string, token: string): Promise<SpotifyAudioAnalysisResponse> {
  return apiFetch<SpotifyAudioAnalysisResponse>(`/audio-analysis/${id}`, token)
}

interface SpotifyPlaylistItem {
  id: string
  name: string
  description: string
  images: { url: string }[]
  tracks: { total: number }
  uri: string
  owner: { display_name: string }
}

interface SpotifyPlaylistsResponse {
  items: SpotifyPlaylistItem[]
}

interface SpotifyTracksResponse {
  items: {
    track: SpotifyTrackItem
  }[]
}

export async function getUserPlaylists(token: string): Promise<SpotifyPlaylistItem[]> {
  const data = await apiFetch<SpotifyPlaylistsResponse>('/me/playlists?limit=50', token)
  return data.items
}

export async function getLikedSongs(token: string): Promise<SpotifyTrackItem[]> {
  const data = await apiFetch<SpotifyTracksResponse>('/me/tracks?limit=50', token)
  return data.items.map(i => i.track)
}

export async function getPlaylistTracks(playlistId: string, token: string): Promise<SpotifyTrackItem[]> {
  const data = await apiFetch<SpotifyTracksResponse>(
    `/playlists/${playlistId}/tracks?limit=50`,
    token
  )
  return data.items.map(i => i.track)
}
