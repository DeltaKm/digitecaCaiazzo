"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

interface SimpleImageViewerProps {
  images: Array<{
    url: string
    format: string
  }>
  documentTitle: string
}

export default function SimpleImageViewer({ images, documentTitle }: SimpleImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [zoom, setZoom] = useState(100)

  const currentImage = images[currentIndex]

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50))
  }

  const handleFitToScreen = () => {
    setZoom(100)
  }

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>Pagina {currentIndex + 1} di {images.length}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="rounded p-2 text-gray-300 hover:bg-gray-700"
            title="Riduci zoom"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          
          <span className="min-w-16 text-center text-sm text-gray-300">
            {zoom}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="rounded p-2 text-gray-300 hover:bg-gray-700"
            title="Aumenta zoom"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleFitToScreen}
            className="rounded p-2 text-gray-300 hover:bg-gray-700"
            title="Adatta allo schermo"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>

        {images.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="rounded p-2 text-gray-300 hover:bg-gray-700"
              title="Pagina precedente"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleNext}
              className="rounded p-2 text-gray-300 hover:bg-gray-700"
              title="Pagina successiva"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Image Container */}
      <div className="relative flex flex-1 items-center justify-center overflow-auto p-4">
        <img
          src={currentImage.url}
          alt={`${documentTitle} - Pagina ${currentIndex + 1}`}
          className="max-h-full object-contain transition-transform"
          style={{ transform: `scale(${zoom / 100})` }}
          crossOrigin="anonymous"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-t border-gray-700 bg-gray-800 p-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 overflow-hidden rounded border-2 transition-all ${
                index === currentIndex
                  ? 'border-blue-500'
                  : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <img
                src={img.url}
                alt={`Pagina ${index + 1}`}
                className="h-20 w-auto object-cover"
                crossOrigin="anonymous"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
