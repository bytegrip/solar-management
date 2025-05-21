import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'

export function BatteryStatus({ data }) {
  const batteryLevel = data.battery_capacity || 0
  const batteryVoltage = data.battery_voltage || 0
  const chargingCurrent = data.battery_charging_current || 0
  const isCharging = data.is_charging_on === 1
  const isChargingToFloat = data.is_charging_to_float === 1
  const batteryVoltageFromScc = data.battery_voltage_from_scc || 0
  const batteryDischargeCurrent = data.battery_discharge_current || 0

  const getBatteryColor = (level) => {
    if (level >= 80) return 'bg-emerald-500'
    if (level >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getBatteryGradient = (level) => {
    if (level >= 80) return 'from-emerald-500 to-emerald-400'
    if (level >= 40) return 'from-yellow-500 to-yellow-400'
    return 'from-red-500 to-red-400'
  }

  return (
    <Card className="h-full p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-white">Battery Status</h2>
      <div className="flex flex-col h-[calc(100%-3rem)]">
        <div className="relative mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Battery Level</span>
            <span className="text-sm font-medium text-gray-300">{batteryLevel}%</span>
          </div>
          <div className="relative h-10 bg-gray-700/50 rounded-full overflow-hidden">
            <motion.div
              className={`absolute inset-0 bg-gradient-to-r ${getBatteryGradient(batteryLevel)}`}
              initial={{ width: 0 }}
              animate={{ width: `${batteryLevel}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
              animate={{
                x: ["0%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                width: "50%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              }}
            />
            {isCharging && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 text-white/80"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                </motion.svg>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 flex-grow">
          <div className="bg-gray-700/50 p-3 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-gray-400">Main Voltage</p>
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-semibold text-white">{batteryVoltage}</p>
              <p className="text-sm font-medium text-blue-400">V</p>
            </div>
          </div>
          <div className="bg-gray-700/50 p-3 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-gray-400">SCC Voltage</p>
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-semibold text-white">{batteryVoltageFromScc}</p>
              <p className="text-sm font-medium text-blue-400">V</p>
            </div>
          </div>
          <div className="bg-gray-700/50 p-3 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-gray-400">Charging Current</p>
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-semibold text-white">{chargingCurrent}</p>
              <p className="text-sm font-medium text-emerald-400">A</p>
            </div>
          </div>
          <div className="bg-gray-700/50 p-3 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-gray-400">Discharge Current</p>
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-semibold text-white">{batteryDischargeCurrent}</p>
              <p className="text-sm font-medium text-emerald-400">A</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isCharging ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-300">{isCharging ? 'Charging' : 'Not Charging'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isChargingToFloat ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-300">Float Mode</span>
          </div>
        </div>
      </div>
    </Card>
  )
} 