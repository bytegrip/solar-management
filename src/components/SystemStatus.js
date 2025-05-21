import { Card } from '@/components/ui/card'

export function SystemStatus({ data }) {
  const inverterTemp = data.inverter_heat_sink_temperature || 0
  const isLoadOn = data.is_load_on === 1
  const isSystemOn = data.is_switched_on === 1
  const isSccCharging = data.is_scc_charging_on === 1
  const isAcCharging = data.is_ac_charging_on === 1

  const getTemperatureColor = (temp) => {
    if (temp >= 60) return 'text-red-500'
    if (temp >= 45) return 'text-yellow-500'
    return 'text-emerald-500'
  }

  return (
    <Card className="h-full p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-white">System Status</h2>
      <div className="flex flex-col h-[calc(100%-3rem)]">
        <div className="bg-gray-700/50 p-3 rounded-lg backdrop-blur-sm mb-4">
          <p className="text-sm text-gray-400">Inverter Temperature</p>
          <p className={`text-lg font-semibold ${getTemperatureColor(inverterTemp)}`}>{inverterTemp}°C</p>
        </div>
        <div className="grid grid-cols-2 gap-3 flex-grow">
          <div className="bg-gray-700/50 p-3 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isLoadOn ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-300">Load Status</span>
            </div>
            <p className="text-lg font-semibold text-white mt-2">{isLoadOn ? 'On' : 'Off'}</p>
          </div>
          <div className="bg-gray-700/50 p-3 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isSystemOn ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-300">System Status</span>
            </div>
            <p className="text-lg font-semibold text-white mt-2">{isSystemOn ? 'On' : 'Off'}</p>
          </div>
          <div className="bg-gray-700/50 p-3 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isSccCharging ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-300">SCC Charging</span>
            </div>
            <p className="text-lg font-semibold text-white mt-2">{isSccCharging ? 'Active' : 'Inactive'}</p>
          </div>
          <div className="bg-gray-700/50 p-3 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isAcCharging ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-300">AC Charging</span>
            </div>
            <p className="text-lg font-semibold text-white mt-2">{isAcCharging ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      </div>
    </Card>
  )
} 