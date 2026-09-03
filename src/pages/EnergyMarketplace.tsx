import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Zap,
  Sun,
  ShieldCheck,
  Building,
  CheckCircle,
  Clock,
  ArrowRight,
  Calculator,
  RefreshCw,
  PieChart,
  Percent,
  Sliders,
} from 'lucide-react';

interface TradeOrder {
  id: string;
  type: 'buy' | 'sell';
  buyerSeller: string;
  volumeMWh: number;
  priceINR: number;
  status: 'filled' | 'pending' | 'matching';
  timestamp: string;
}

export default function EnergyMarketplace() {
  const [activeTab, setActiveTab] = useState<'trading' | 'subsidy' | 'booking' | 'utilization'>('trading');
  const [systemSizeKW, setSystemSizeKW] = useState<number>(3);
  const [buyVolumeMWh, setBuyVolumeMWh] = useState<number>(2.5);
  const [targetCluster, setTargetCluster] = useState<string>('Mundra SEZ Industrial Corridor');
  const [recentTrades, setRecentTrades] = useState<TradeOrder[]>([
    {
      id: 'TRD-8821',
      type: 'buy',
      buyerSeller: 'Adani Ports & SEZ Mundra',
      volumeMWh: 5.0,
      priceINR: 3.22,
      status: 'filled',
      timestamp: '10:42 AM',
    },
    {
      id: 'TRD-8820',
      type: 'sell',
      buyerSeller: 'Kutch Hybrid Park (KT-WT-01 to 04)',
      volumeMWh: 8.5,
      priceINR: 3.24,
      status: 'filled',
      timestamp: '10:39 AM',
    },
    {
      id: 'TRD-8819',
      type: 'buy',
      buyerSeller: 'Banas Dairy Processing Cluster',
      volumeMWh: 3.5,
      priceINR: 3.25,
      status: 'filled',
      timestamp: '10:31 AM',
    },
    {
      id: 'TRD-8818',
      type: 'buy',
      buyerSeller: 'Deendayal Port Authority Kandla',
      volumeMWh: 2.0,
      priceINR: 3.24,
      status: 'filled',
      timestamp: '10:15 AM',
    },
  ]);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Subsidy calculations based on PM Surya Ghar & Gujarat Solar Policy
  const getSubsidyDetails = (kw: number) => {
    let centralSubsidy = 0;
    let baseCost = kw * 48000;

    if (kw <= 1) {
      centralSubsidy = 30000;
    } else if (kw <= 2) {
      centralSubsidy = 60000;
    } else {
      centralSubsidy = 78000; // Max central cap
    }

    const netCost = Math.max(0, baseCost - centralSubsidy);
    const monthlyUnits = Math.round(kw * 135);
    const monthlySavingsINR = Math.round(monthlyUnits * 7.2); // avg domestic tariff
    const paybackYears = Number((netCost / (monthlySavingsINR * 12)).toFixed(1));

    return {
      baseCost,
      centralSubsidy,
      netCost,
      monthlyUnits,
      monthlySavingsINR,
      paybackYears,
    };
  };

  const subsidy = getSubsidyDetails(systemSizeKW);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrade: TradeOrder = {
      id: `TRD-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'buy',
      buyerSeller: targetCluster,
      volumeMWh: buyVolumeMWh,
      priceINR: 3.24,
      status: 'filled',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setRecentTrades([newTrade, ...recentTrades]);
    setBookingSuccess(`Successfully booked and matched ${buyVolumeMWh} MWh for ${targetCluster} at ₹3.24/kWh.`);
    setTimeout(() => setBookingSuccess(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                Green Energy Marketplace
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                PM Surya Ghar Muft Bijli Yojana
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                Gujarat Green Open Access (GEOA)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Renewable Energy Trading, Subsidy &amp; Capacity Booking Hub
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Buy and sell green power in real-time at market clearing spot rates, calculate government rooftop subsidies for Kutch &amp; Banaskantha, and book advance Green Open Access transmission contracts.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-lg border border-slate-800 shrink-0">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Live Green Spot Price</span>
              <div className="text-xl font-bold text-emerald-400">
                ₹3.24 <span className="text-xs text-slate-400 font-normal">/ kWh</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">GETCO Headroom</span>
              <div className="text-xl font-bold text-cyan-400">
                32.4 <span className="text-xs text-slate-400 font-normal">MW</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800 pt-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('trading')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              activeTab === 'trading'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>P2P Green Energy Trading</span>
          </button>
          <button
            onClick={() => setActiveTab('subsidy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              activeTab === 'subsidy'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Government Subsidy &amp; Rooftop Solar</span>
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              activeTab === 'booking'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Capacity Booking (GEOA)</span>
          </button>
          <button
            onClick={() => setActiveTab('utilization')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              activeTab === 'utilization'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Real-Time Creation &amp; Utilization</span>
          </button>
        </div>
      </div>

      {bookingSuccess && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{bookingSuccess}</span>
        </div>
      )}

      {/* ── TAB 1: P2P GREEN ENERGY TRADING ── */}
      {activeTab === 'trading' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Placement Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Instant Green Power Booking</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Order
              </span>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Off-Taker / Consumer Cluster</label>
                <select
                  value={targetCluster}
                  onChange={(e) => setTargetCluster(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Mundra SEZ Industrial Corridor">Mundra SEZ Industrial Corridor</option>
                  <option value="Deendayal Port Authority Kandla">Deendayal Port Authority Kandla</option>
                  <option value="Banas Dairy Processing Cluster">Banas Dairy Processing Cluster</option>
                  <option value="Morbi Ceramic Industrial Cluster">Morbi Ceramic Industrial Cluster</option>
                  <option value="Palanpur Agro & Cold Storage Facility">Palanpur Agro &amp; Cold Storage Facility</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">
                  Energy Volume to Purchase: <strong className="text-white">{buyVolumeMWh} MWh</strong>
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={10.0}
                  step={0.5}
                  value={buyVolumeMWh}
                  onChange={(e) => setBuyVolumeMWh(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0.5 MWh</span>
                  <span>5.0 MWh</span>
                  <span>10.0 MWh</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Green Power Spot Rate:</span>
                  <span className="font-semibold text-white">₹3.24 / kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Contract Value:</span>
                  <span className="font-bold text-emerald-400">₹{(buyVolumeMWh * 1000 * 3.24).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated CO₂ Displaced:</span>
                  <span className="font-semibold text-teal-300">{Math.round(buyVolumeMWh * 1000 * 0.71).toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Open Access Surcharge Waiver:</span>
                  <span className="font-semibold text-emerald-400">100% Waived (Gujarat 2024 Policy)</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Execute Green Power Purchase Order
              </button>
            </form>
          </div>

          {/* Recent Market Trades & Order Book */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Live Continuous Double Auction (Order Book)</span>
              </h2>
              <span className="text-xs text-slate-500 font-mono">GERC Approved Exchange</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">Trade ID</th>
                    <th className="py-2 px-3">Entity</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Volume</th>
                    <th className="py-2 px-3">Price</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {recentTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400">{trade.id}</td>
                      <td className="py-2.5 px-3 font-sans text-white font-medium">{trade.buyerSeller}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            trade.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {trade.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">{trade.volumeMWh} MWh</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">₹{trade.priceINR}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-emerald-400 flex items-center gap-1 font-sans">
                          <CheckCircle className="w-3 h-3" /> {trade.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{trade.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: GOVERNMENT SUBSIDY CALCULATOR ── */}
      {activeTab === 'subsidy' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>Rooftop Solar Subsidy Calculator</span>
            </h2>
            <p className="text-xs text-slate-400">
              Calculate exact DBT government subsidy under PM Surya Ghar Muft Bijli Yojana &amp; Gujarat Solar Policy 2024.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-2 font-medium text-xs">
                  Choose System Size: <strong className="text-amber-400">{systemSizeKW} kW</strong>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 5, 10].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setSystemSizeKW(kw)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        systemSizeKW === kw
                          ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {kw} kW
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross System Cost:</span>
                  <span className="text-white font-medium">₹{subsidy.baseCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Central DBT Subsidy:</span>
                  <span>- ₹{subsidy.centralSubsidy.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
                  <span>Net Consumer Investment:</span>
                  <span className="text-amber-400">₹{subsidy.netCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-emerald-300">
                  <span>Monthly Generation:</span>
                  <span className="font-semibold">~{subsidy.monthlyUnits} kWh (Units)</span>
                </div>
                <div className="flex justify-between text-emerald-300">
                  <span>Monthly Bill Savings:</span>
                  <span className="font-semibold">₹{subsidy.monthlySavingsINR.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white font-bold pt-1 border-t border-emerald-500/20">
                  <span>Estimated Payback Period:</span>
                  <span className="text-amber-300">{subsidy.paybackYears} Years</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Gujarat Regional DISCOM &amp; Subsidy Policy Guide</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">Kutch Region (PGVNL)</h3>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px]">Active</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Interconnected via <strong>Paschim Gujarat Vij Company Ltd (PGVNL)</strong>. High solar insolation (5.8 kWh/m²/day) makes Kutch rooftops among the highest generating in India.
                </p>
                <ul className="text-slate-300 space-y-1 pt-2 border-t border-slate-800">
                  <li>• Net Metering Settlement: Banking allowed up to 100% of sanctioned load</li>
                  <li>• Surplus Buyback Tariff: ₹2.25/kWh paid by PGVNL</li>
                  <li>• Average Payback: 2.6 years</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">Banaskantha Region (UGVNL)</h3>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px]">Active</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Interconnected via <strong>Uttar Gujarat Vij Company Ltd (UGVNL)</strong>. Palanpur, Deesa, and agricultural dairy feeders eligible for PM-KUSUM feeder solarization.
                </p>
                <ul className="text-slate-300 space-y-1 pt-2 border-t border-slate-800">
                  <li>• Agro-Solar Feeder Subsidy: Up to 90% capital grant under KUSUM-C</li>
                  <li>• Dairy Cold Chain Integration: Zero peak power penalty</li>
                  <li>• Average Payback: 2.8 years</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <h4 className="font-bold text-white">How to Apply for Direct Benefit Transfer (DBT):</h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Register on national portal: <code>pmsuryaghar.gov.in</code> using your PGVNL/UGVNL consumer number.</li>
                <li>Select empanelled vendor in Kutch/Banaskantha district.</li>
                <li>DISCOM conducts technical feasibility inspection within 15 days.</li>
                <li>Installation, bi-directional net meter commissioning, and direct subsidy credit to bank account within 30 days.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: GREEN ENERGY OPEN ACCESS (GEOA) BOOKING ── */}
      {activeTab === 'booking' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-400" />
                <span>Green Energy Open Access (GEOA) Capacity Reservation</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Under Gujarat Green Open Access regulations, any consumer with 100 kW+ connected load can contractually reserve generation from our Kutch &amp; Banaskantha parks.
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              100 kW Minimum Threshold
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-500 uppercase font-semibold">Total Contracted Capacity</span>
              <div className="text-2xl font-bold text-white">12.0 MW</div>
              <p className="text-[11px] text-slate-400">Reserved by major industrial anchors across Gujarat.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-500 uppercase font-semibold">Available for Spot Booking</span>
              <div className="text-2xl font-bold text-cyan-400">25.8 MW</div>
              <p className="text-[11px] text-slate-400">Cleared through GETCO 66kV transmission headroom.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-500 uppercase font-semibold">Transmission Losses</span>
              <div className="text-2xl font-bold text-emerald-400">2.1%</div>
              <p className="text-[11px] text-slate-400">State-of-the-art 66kV/220kV low-loss evacuation corridor.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: REAL-TIME CREATION & UTILIZATION METER ── */}
      {activeTab === 'utilization' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span>Real-Time Creation &amp; Demand-Response Utilization</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Current Park Creation (Generation)</h3>
              <div className="text-3xl font-bold text-emerald-400">
                17.7 <span className="text-sm font-normal text-slate-400">MW Produced</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live output generated by 5 wind turbines and 8 solar PV arrays across Kutch and Banaskantha based on real Open-Meteo weather.
              </p>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Connected Consumer Utilization (Demand)</h3>
              <div className="text-3xl font-bold text-cyan-400">
                13.8 <span className="text-sm font-normal text-slate-400">MW Consumed</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                77.9% of generated energy is immediately consumed locally by industrial off-takers; the remaining 3.9 MW surplus is automatically stored in BESS.
              </p>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: '77.9%' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
