import { useState, useEffect } from 'react'
import { usePlayerStore } from './stores/playerStore'
import { exchangeCodeForToken, getStoredToken, clearStoredToken } from './lib/spotify'
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer'
import { useLoop } from './hooks/useLoop'
import { LoginButton } from './components/LoginButton'
import { SearchBar } from './components/SearchBar'
import { TrackList } from './components/TrackList'
import { LibraryView } from './components/LibraryView'
import { PlayerStatus } from './components/PlayerStatus'
import { LoopEditor } from './components/LoopEditor'
import { PlaybackControls } from './components/PlaybackControls'

function App() {
  const token = usePlayerStore((s) => s.token)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const setToken = usePlayerStore((s) => s.setToken)
  const logout = usePlayerStore((s) => s.logout)
  const [tab, setTab] = useState<'search' | 'library' | 'playing'>('search')

  useSpotifyPlayer()
  useLoop()

  useEffect(() => {
    if (currentTrack) setTab('playing')
  }, [currentTrack])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      exchangeCodeForToken(code)
        .then((accessToken) => {
          setToken(accessToken)
          window.history.replaceState({}, '', '/')
        })
        .catch(console.error)
      return
    }

    const stored = getStoredToken()
    if (stored) {
      setToken(stored)
    }
  }, [setToken])

  if (!token) {
    return <LoginButton />
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-1 mb-6 border-b border-gray-700">
          <button
            onClick={() => setTab('search')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'search'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setTab('library')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'library'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            My Library
          </button>
          {currentTrack && (
            <button
              onClick={() => setTab('playing')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tab === 'playing'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Playing
            </button>
          )}
          <div className="ml-auto">
            <button
              onClick={() => { clearStoredToken(); logout(); }}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-400 rounded transition-colors"
            >
              Log out
            </button>
          </div>
        </div>

        {tab === 'search' && (
          <>
            <SearchBar />
            <TrackList />
          </>
        )}

        {tab === 'library' && <LibraryView />}

        {tab === 'playing' && currentTrack && (
          <>
            <PlayerStatus />
            <LoopEditor />
            <PlaybackControls />
          </>
        )}
      </div>
    </div>
  )
}

export default App
