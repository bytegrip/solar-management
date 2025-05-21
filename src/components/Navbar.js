import { LastRefresh } from './LastRefresh'

export function Navbar({ lastUpdateTime }) {
  return (
    <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
            Solar Management Dashboard
          </h1>
          {lastUpdateTime && (
            <div className="flex items-center gap-2 text-gray-400">
              <LastRefresh timestamp={lastUpdateTime} />
            </div>
          )}
        </div>
      </div>
    </nav>
  )
} 