import { useState, useEffect } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import { getUserPlaylists, getLikedSongs, getPlaylistTracks } from '../lib/spotify'
import { playTrack } from '../lib/player'

function formatDuration(ms: number): string {
  const t = Math.floor(ms / 1000)
  return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`
}

interface PlaylistItem {
  id: string
  name: string
  description: string
  imageUrl: string
  trackCount: number
  uri: string
  ownerName: string
}

interface TrackItem {
  id: string
  name: string
  artists: string
  albumImage: string
  duration_ms: number
  uri: string
}

export function LibraryView() {
  const token = usePlayerStore((s) => s.token)
  const deviceId = usePlayerStore((s) => s.deviceId)

  const [subTab, setSubTab] = useState<'playlists' | 'liked'>('playlists')
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([])
  const [likedSongs, setLikedSongs] = useState<TrackItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistItem | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<TrackItem[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    setError(null)
    getUserPlaylists(token)
      .then((items) =>
        setPlaylists(
          items.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            imageUrl: p.images?.[0]?.url ?? '',
            trackCount: p.tracks?.total ?? 0,
            uri: p.uri,
            ownerName: p.owner?.display_name ?? 'Unknown',
          }))
        )
      )
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load playlists'))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!token || subTab !== 'liked') return
    setLoading(true)
    setError(null)
    getLikedSongs(token)
      .then((items) =>
        setLikedSongs(
          items.map((t) => ({
            id: t.id,
            name: t.name,
            artists: t.artists.map((a) => a.name).join(', '),
            albumImage: t.album.images?.[2]?.url ?? t.album.images?.[0]?.url ?? '',
            duration_ms: t.duration_ms,
            uri: t.uri,
          }))
        )
      )
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load liked songs'))
      .finally(() => setLoading(false))
  }, [token, subTab])

  const openPlaylist = async (playlist: PlaylistItem) => {
    if (!token) return
    setSelectedPlaylist(playlist)
    setLoadingTracks(true)
    setError(null)

    const testFetch = async (url: string) => {
      try {
        const res = await fetch(`https://api.spotify.com/v1${url}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const body = await res.text()
        console.log(`DIAG ${res.status} ${url} —`, body.slice(0, 200))
      } catch (e) {
        console.log(`DIAG ERROR ${url} —`, e)
      }
    }

    await testFetch('/me')
    await testFetch(`/playlists/${playlist.id}`)
    await testFetch(`/playlists/${playlist.id}/tracks?limit=1`)

    getPlaylistTracks(playlist.id, token)
      .then((items) =>
        setPlaylistTracks(
          items.map((t) => ({
            id: t.id,
            name: t.name,
            artists: t.artists.map((a) => a.name).join(', '),
            albumImage: t.album.images?.[2]?.url ?? t.album.images?.[0]?.url ?? '',
            duration_ms: t.duration_ms,
            uri: t.uri,
          }))
        )
      )
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load tracks'))
      .finally(() => setLoadingTracks(false))
  }

  return (
    <div className="mb-6">
      <div className="flex gap-1 mb-4 border-b border-gray-700">
        <button
          onClick={() => { setSubTab('playlists'); setSelectedPlaylist(null) }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            subTab === 'playlists'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Playlists
        </button>
        <button
          onClick={() => setSubTab('liked')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            subTab === 'liked'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Liked Songs
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm text-center py-3 bg-red-900/20 rounded-lg mb-4">
          {error}
          {error.includes('403') && (
            <p className="mt-1 text-gray-400">
              Try logging out and back in to refresh your permissions.
            </p>
          )}
        </div>
      )}

      {subTab === 'playlists' && (
        <>
          {selectedPlaylist ? (
            <div>
              <button
                onClick={() => setSelectedPlaylist(null)}
                className="text-gray-400 hover:text-white text-sm mb-3 transition-colors"
              >
                &larr; Back to playlists
              </button>
              <h3 className="text-white font-semibold mb-2">{selectedPlaylist.name}</h3>
              {loadingTracks ? (
                <div className="text-gray-400 text-center py-4">Loading tracks...</div>
              ) : (
                <div className="space-y-1">
                  {playlistTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => playTrack(track.uri)}
                      disabled={!deviceId}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors text-left disabled:opacity-50"
                    >
                      <img src={track.albumImage} alt="" className="w-10 h-10 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm truncate">{track.name}</div>
                        <div className="text-gray-400 text-xs truncate">{track.artists}</div>
                      </div>
                      <div className="text-gray-500 text-xs">{formatDuration(track.duration_ms)}</div>
                    </button>
                  ))}
                  {!loadingTracks && playlistTracks.length === 0 && (
                    <div className="text-gray-400 text-center py-4">No tracks found</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {loading ? (
                <div className="text-gray-400 text-center py-4">Loading playlists...</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => openPlaylist(playlist)}
                      className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors text-left"
                    >
                      <img
                        src={playlist.imageUrl}
                        alt=""
                        className="w-full aspect-square rounded object-cover mb-2"
                      />
                      <div className="text-white text-sm font-medium truncate">{playlist.name}</div>
                      <div className="text-gray-400 text-xs">{playlist.trackCount} tracks</div>
                      <div className="text-gray-600 text-[10px] truncate">{playlist.ownerName}</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {subTab === 'liked' && (
        <>
          {loading ? (
            <div className="text-gray-400 text-center py-4">Loading liked songs...</div>
          ) : (
            <div className="space-y-1">
              {likedSongs.map((track) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track.uri)}
                  disabled={!deviceId}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors text-left disabled:opacity-50"
                >
                  <img src={track.albumImage} alt="" className="w-10 h-10 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{track.name}</div>
                    <div className="text-gray-400 text-xs truncate">{track.artists}</div>
                  </div>
                  <div className="text-gray-500 text-xs">{formatDuration(track.duration_ms)}</div>
                </button>
              ))}
              {likedSongs.length === 0 && (
                <div className="text-gray-400 text-center py-4">No liked songs found</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
