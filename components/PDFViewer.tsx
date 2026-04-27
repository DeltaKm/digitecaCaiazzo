"use client"

interface PDFViewerProps {
  pdfUrl: string
  documentTitle: string
}

export default function PDFViewer({ pdfUrl, documentTitle }: PDFViewerProps) {
  return (
    <div className="h-full w-full bg-gray-900 flex flex-col">
      {/* PDF Embed */}
      <div className="flex-1 relative">
        <object
          data={pdfUrl}
          type="application/pdf"
          className="absolute inset-0 w-full h-full"
        >
          {/* Fallback per browser che non supportano object */}
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-white dark:text-gray-200">
            <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">Visualizzazione PDF</p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-blue-600 dark:bg-blue-500 px-6 py-3 text-white dark:text-gray-200 hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Apri PDF in una nuova scheda
            </a>
          </div>
        </object>
      </div>
    </div>
  )
}

