export default function Loader({ message = "Caricamento..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
      <div className="rounded-lg bg-white p-8 shadow-2xl border border-gray-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-lg font-semibold text-gray-900">{message}</p>
        </div>
      </div>
    </div>
  )
}
