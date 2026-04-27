'use client'

import { useState } from 'react'
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'

interface VideoViewerProps {
  videoUrl: string
  documentTitle: string
  metadata?: any
}

export default function VideoViewer({ videoUrl, documentTitle, metadata }: VideoViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)

  const handlePlayPause = () => {
    const video = document.getElementById('main-video') as HTMLVideoElement
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleMute = () => {
    const video = document.getElementById('main-video') as HTMLVideoElement
    if (video) {
      video.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleFullscreen = () => {
    const video = document.getElementById('main-video') as HTMLVideoElement
    if (video) {
      if (video.requestFullscreen) {
        video.requestFullscreen()
      }
    }
  }

  return (
    <div className="flex h-full bg-black">
      {/* Video Player */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <video
            id="main-video"
            src={videoUrl}
            className="max-w-full max-h-full"
            controls
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onVolumeChange={(e) => setIsMuted((e.target as HTMLVideoElement).muted)}
          />
        </div>

        {/* Custom Controls */}
        <div className="bg-gray-900 p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayPause}
                className="flex items-center justify-center w-10 h-10 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              <button
                onClick={handleMute}
                className="flex items-center justify-center w-8 h-8 hover:bg-gray-700 rounded"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded"
              >
                {showMetadata ? 'Nascondi' : 'Mostra'} Info
              </button>

              <button
                onClick={handleFullscreen}
                className="flex items-center justify-center w-8 h-8 hover:bg-gray-700 rounded"
              >
                <Maximize className="w-5 h-5" />
              </button>
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
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Metadati Video</h4>
                  <div className="space-y-2 text-sm">
                    {metadata.format && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Formato:</span>
                        <span>{metadata.format.toUpperCase()}</span>
                      </div>
                    )}
                    {metadata.width && metadata.height && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Risoluzione:</span>
                        <span>{metadata.width} × {metadata.height}</span>
                      </div>
                    )}
                    {metadata.duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Durata:</span>
                        <span>{Math.round(metadata.duration)} secondi</span>
                      </div>
                    )}
                  </div>
                </div>

                {metadata.exif && Object.keys(metadata.exif).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Informazioni EXIF</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(metadata.exif).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                          <span className="text-right max-w-32 wrap-break-word">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
