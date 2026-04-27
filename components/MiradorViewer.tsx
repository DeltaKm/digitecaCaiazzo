"use client"

import { useEffect, useRef, useState } from 'react'

interface MiradorViewerProps {
  manifestUrl: string
  documentTitle: string
  documentId: string
  images: Array<{
    id: string
    url: string
    width: number
    height: number
    format: string
  }>
}

export default function MiradorViewer({ manifestUrl, documentTitle, documentId, images }: MiradorViewerProps) {
  const miradorInstance = useRef<any>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const [Mirador, setMirador] = useState<any>(null)

  useEffect(() => {
    import('mirador').then((mod) => {
      setMirador(() => mod.default)
    })
  }, [])

  useEffect(() => {
    if (viewerRef.current && !miradorInstance.current && Mirador) {
      const config = {
        id: viewerRef.current.id,
        windows: [
          {
            manifestId: manifestUrl,
            thumbnailNavigationPosition: 'far-bottom',
            view: 'book',
          },
        ],
        window: {
          allowClose: false,
          allowMaximize: true,
          allowFullscreen: true,
          allowWindowSideBar: true,
          sideBarPanel: 'attribution',
          sideBarOpen: false,
          panels: {
            info: true,
            attribution: true,
            canvas: true,
            annotations: false,
            search: false,
          },
        },
        workspace: {
          showZoomControls: true,
          type: 'mosaic',
        },
        workspaceControlPanel: {
          enabled: true,
        },
        thumbnailNavigation: {
          defaultPosition: 'far-bottom',
          height: 130,
        },
      }

      miradorInstance.current = Mirador.viewer(config)
    }
  }, [manifestUrl, Mirador])

  if (!Mirador) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Caricamento viewer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={viewerRef}
        id="mirador-viewer"
        className="h-full w-full"
      />
    </div>
  )
}
