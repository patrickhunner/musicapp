import { useState } from 'react'
import { searchTracks } from '../lib/spotify'
import { usePlayerStore } from '../stores/playerStore'

export function SearchBar() {
  const [error, setError] = useState<string | null>(null)
  const token = usePlayerStore((s) => s.token)
  const query = usePlayerStore((s) => s.searchQuery)
  const setQuery = usePlayerStore((s) => s.setSearchQuery)
  const setIsSearching = usePlayerStore((s) => s.setIsSearching)
  const setSearchResults = usePlayerStore((s) => s.setSearchResults)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || !token) return

    setError(null)
    setIsSearching(true)
    try {
      const items = await searchTracks(query, token)
      setSearchResults(
        items.map((item) => ({
          id: item.id,
          name: item.name,
          artists: item.artists,
          album: item.album,
          duration_ms: item.duration_ms,
          uri: item.uri,
        }))
      )
      if (items.length === 0) {
        setError('No results found')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('Search failed:', msg)
      setError(msg)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs..."
          className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-green-500"
        />
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Search
        </button>
      </form>
      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
    </div>
  )
}
