import { create } from 'zustand'
import type { Track, Beat, Segment } from '../types'

interface PlayerStore {
  token: string | null
  player: Spotify.Player | null
  deviceId: string | null
  currentTrack: Track | null
  isPlaying: boolean
  position: number
  duration: number
  loopStart: number | null
  loopEnd: number | null
  isLooping: boolean
  loopDelay: number
  bpm: number | null
  beats: Beat[]
  waveform: number[]
  volume: number
  searchQuery: string
  searchResults: Track[]
  isSearching: boolean
  isDraggingLoop: boolean

  setToken: (token: string | null) => void
  setPlayer: (player: Spotify.Player | null) => void
  setDeviceId: (id: string | null) => void
  setCurrentTrack: (track: Track | null) => void
  setIsPlaying: (playing: boolean) => void
  setPosition: (position: number) => void
  setDuration: (duration: number) => void
  setLoopStart: (position: number | null) => void
  setLoopEnd: (position: number | null) => void
  setIsLooping: (looping: boolean) => void
  setLoopDelay: (delay: number) => void
  setBpm: (bpm: number | null) => void
  setBeats: (beats: Beat[]) => void
  setWaveform: (waveform: number[]) => void
  setVolume: (volume: number) => void
  setSearchQuery: (query: string) => void
  setSearchResults: (results: Track[]) => void
  setIsSearching: (searching: boolean) => void
  setIsDraggingLoop: (dragging: boolean) => void
  logout: () => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  token: null,
  player: null,
  deviceId: null,
  currentTrack: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  loopStart: null,
  loopEnd: null,
  isLooping: false,
  loopDelay: 0,
  bpm: null,
  beats: [],
  waveform: [],
  volume: 0.5,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  isDraggingLoop: false,

  setToken: (token) => set({ token }),
  setPlayer: (player) => set({ player }),
  setDeviceId: (id) => set({ deviceId: id }),
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setLoopStart: (position) => set({ loopStart: position }),
  setLoopEnd: (position) => set({ loopEnd: position }),
  setIsLooping: (looping) => set({ isLooping: looping }),
  setLoopDelay: (delay) => set({ loopDelay: delay }),
  setBpm: (bpm) => set({ bpm }),
  setBeats: (beats) => set({ beats }),
  setWaveform: (waveform) => set({ waveform }),
  setVolume: (volume) => set({ volume }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  setIsDraggingLoop: (dragging) => set({ isDraggingLoop: dragging }),
  logout: () =>
    set({
      token: null,
      player: null,
      deviceId: null,
      currentTrack: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      loopStart: null,
      loopEnd: null,
      isLooping: false,
      loopDelay: 0,
      bpm: null,
      beats: [],
      waveform: [],
      volume: 0.5,
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      isDraggingLoop: false,
    }),
}))
