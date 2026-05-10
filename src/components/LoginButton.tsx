import { redirectToAuth } from '../lib/spotify'

export function LoginButton() {
  const handleLogin = async () => {
    try {
      await redirectToAuth()
    } catch (e) {
      console.error('Login failed:', e)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-20">
      <h1 className="text-3xl font-bold text-white">Music Practice App</h1>
      <p className="text-gray-400">Connect your Spotify account to start practicing</p>
      <button
        onClick={handleLogin}
        className="bg-green-500 hover:bg-green-400 text-black font-semibold px-8 py-3 rounded-full transition-colors"
      >
        Connect Spotify
      </button>
    </div>
  )
}
