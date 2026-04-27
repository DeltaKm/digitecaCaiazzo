'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Play, Pause, Volume2, VolumeX, RotateCcw, SkipBack, SkipForward } from 'lucide-react'

interface AudioViewerProps {
  audioUrl: string
  documentTitle: string
  metadata?: any
}

export default function AudioViewer({ audioUrl, documentTitle, metadata }: AudioViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('play', () => setIsPlaying(true))
    audio.addEventListener('pause', () => setIsPlaying(false))
    audio.addEventListener('ended', () => setIsPlaying(false))

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('play', () => setIsPlaying(true))
      audio.removeEventListener('pause', () => setIsPlaying(false))
      audio.removeEventListener('ended', () => setIsPlaying(false))
    }
  }, [])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (audio) {
      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (audio) {
      const newTime = (parseFloat(e.target.value) / 100) * duration
      audio.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const handleMute = () => {
    const audio = audioRef.current
    if (audio) {
      if (isMuted) {
        audio.volume = volume
        setIsMuted(false)
      } else {
        audio.volume = 0
        setIsMuted(true)
      }
    }
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
    }
  }

  const restart = () => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = 0
    }
  }

  return (
    <div className="flex h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Audio Player */}
      <div className="flex-1 flex flex-col">
        {/* Visualizzatore Centrale */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            {/* Album Art Placeholder */}
            <div className="w-64 h-64 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
              <div className="text-white">
                <Volume2 className="w-24 h-24 mx-auto mb-4" />
                <p className="text-lg font-medium">Audio</p>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-2">{documentTitle}</h2>
            <p className="text-gray-300">Documento audio</p>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="bg-black/50 backdrop-blur-sm border-t border-white/10 p-6">
          <audio ref={audioRef} src={audioUrl} preload="metadata" />

          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-700 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-300 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={restart}
                className="flex items-center justify-center w-10 h-10 hover:bg-white/10 rounded-full transition-colors"
              >
                <RotateCcw className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={() => skip(-10)}
                className="flex items-center justify-center w-10 h-10 hover:bg-white/10 rounded-full transition-colors"
              >
                <SkipBack className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={handlePlayPause}
                className="flex items-center justify-center w-14 h-14 bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-black" />
                ) : (
                  <Play className="w-6 h-6 text-black ml-1" />
                )}
              </button>

              <button
                onClick={() => skip(10)}
                className="flex items-center justify-center w-10 h-10 hover:bg-white/10 rounded-full transition-colors"
              >
                <SkipForward className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className="px-4 py-2 text-sm bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                {showMetadata ? 'Nascondi' : 'Mostra'} Info
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMute}
                  className="flex items-center justify-center w-8 h-8 hover:bg-white/10 rounded transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume * 100}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-700 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Panel */}
      {showMetadata && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <button
                onClick={() => setShowMetadata(false)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Chiudi</span>
              </button>
            </div>

            <h3 className="text-lg font-semibold mb-4">{documentTitle}</h3>

            {metadata && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Metadati Audio</h4>
                  <div className="space-y-2 text-sm">
                    {metadata.format && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Formato:</span>
                        <span>{metadata.format.toUpperCase()}</span>
                      </div>
                    )}
                    {metadata.duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Durata:</span>
                        <span>{formatTime(metadata.duration)}</span>
                      </div>
                    )}
                    {metadata.bitrate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Bitrate:</span>
                        <span>{metadata.bitrate} kbps</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 2px solid #4f46e5;
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 2px solid #4f46e5;
        }
      `}</style>
    </div>
  )
}
