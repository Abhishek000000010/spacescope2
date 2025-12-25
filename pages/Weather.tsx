
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, Wind, Zap, Activity, Lock, 
  Radio, Globe, Navigation, Wifi, X,
  ArrowUpRight, Layers, Share2, MapPin, Eye, Cloud, Droplets,
  Terminal, ShieldAlert, Cpu, Loader2, Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePremium } from '../context/PremiumContext';
import LiveAuroraMap from '../components/LiveAuroraMap';
import { fetchSpaceWeather, fetchLocalWeather } from '../services/nasaApi';
import { GoogleGenAI, Type } from "@google/genai";

const Weather: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium } = usePremium();
  const [activeMetricTab, setActiveMetricTab] = useState<'flux' | 'wind'>('flux');
  const [nasaData, setNasaData] = useState<any[]>([]);
  const [localSky, setLocalSky] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);

  useEffect(() => {
    // 1. Fetch NASA Space Weather Alerts
    fetchSpaceWeather()
      .then(setNasaData)
      .catch(() => setNasaData([]))
      .finally(() => setLoading(false));

    // 2. Fetch Local atmospheric conditions via Geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const data = await fetchLocalWeather(position.coords.latitude, position.coords.longitude);
          setLocalSky(data.current);
        } catch (err) {
          console.error("Local weather fetch failed:", err);
        }
      }, (err) => console.warn("Geolocation denied:", err));
    }
  }, []);

  const runAIAnalysis = async () => {
    if (!isPremium) {
      navigate('/premium-alerts');
      return;
    }

    setIsAnalyzing(true);
    setAiReport(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const recentFeed = nasaData.slice(0, 3).map(n => n.messageBody).join(' ');
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this live NASA Mission Control Feed and provide a strategic impact assessment: ${recentFeed}. Use scientific and tactical terminology. Summary should be under 50 words.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hazardLevel: { type: Type.STRING },
              summary: { type: Type.STRING },
              impacts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    system: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    advice: { type: Type.STRING }
                  },
                  required: ["system", "severity", "advice"]
                }
              },
              auroraPrediction: { type: Type.STRING },
              technicalTelemetry: { type: Type.STRING }
            },
            required: ["hazardLevel", "summary", "impacts", "auroraPrediction", "technicalTelemetry"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      setAiReport(data);
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const solarData = [
    { time: '00:00', flux: 145, wind: 320 },
    { time: '04:00', flux: 152, wind: 340 },
    { time: '08:00', flux: 180, wind: 410 },
    { time: '12:00', flux: 165, wind: 390 },
    { time: '16:00', flux: 210, wind: 450 },
    { time: '20:00', flux: 195, wind: 430 },
    { time: '23:59', flux: 188, wind: 420 },
  ];

  return (
    <div className="min-h-screen pt-28 pb-32 px-4 max-w-7xl mx-auto relative z-10">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Solar Wind Speed", value: "428.5", unit: "km/s", trend: "+12%", color: "cyan", icon: <Wind size={20} /> },
          { label: "Proton Density", value: "5.22", unit: "p/cm³", trend: "-2%", color: "purple", icon: <Zap size={20} /> },
          { label: "Solar Flux (10.7cm)", value: "188", unit: "sfu", trend: "+5%", color: "orange", icon: <Sun size={20} /> },
          { label: "KP Index", value: "6.2", unit: "Storm", trend: "High", color: "red", icon: <Activity size={20} /> }
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="glass-card p-6 rounded-3xl border-white/5 relative group overflow-hidden"
          >
            <div className={`absolute top-0 right-0 p-4 opacity-5 text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-4">{stat.label}</p>
            <div className="flex items-end gap-2 mb-2">
              <span className={`text-4xl font-orbitron font-bold text-${stat.color}-400 neon-text`}>{stat.value}</span>
              <span className="text-gray-500 text-xs mb-1 font-bold">{stat.unit}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
               <ArrowUpRight size={12} className={stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'} />
               <span className={stat.trend.startsWith('+') ? 'text-green-500/60' : 'text-red-500/60'}>{stat.trend}</span>
               <span>from 24h average</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Dashboard */}
        <div className="lg:col-span-2 space-y-8">
          {/* Local Sky Widget */}
          <section className="glass-card p-8 rounded-[2.5rem] border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 to-transparent flex flex-col md:flex-row gap-8 items-center">
             <div className="shrink-0">
               <div className="w-20 h-20 bg-cyan-500/10 rounded-[2rem] flex items-center justify-center text-cyan-400 shadow-inner">
                  <MapPin size={32} />
               </div>
             </div>
             <div className="flex-1 text-center md:text-left">
               <h3 className="text-xl font-orbitron font-bold text-white mb-2">Local Observer Sky</h3>
               <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold mb-4">Real-time Atmospheric Telemetry</p>
               
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/5 rounded-lg text-cyan-400"><Cloud size={16} /></div>
                   <div>
                     <p className="text-[9px] text-gray-500 uppercase font-bold">Cloud Cover</p>
                     <p className="text-sm font-bold text-white">{localSky ? `${localSky.cloud_cover}%` : '--'}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/5 rounded-lg text-purple-400"><Eye size={16} /></div>
                   <div>
                     <p className="text-[9px] text-gray-500 uppercase font-bold">Visibility</p>
                     <p className="text-sm font-bold text-white">{localSky ? `${(localSky.visibility / 1000).toFixed(1)}km` : '--'}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/5 rounded-lg text-blue-400"><Droplets size={16} /></div>
                   <div>
                     <p className="text-[9px] text-gray-500 uppercase font-bold">Humidity</p>
                     <p className="text-sm font-bold text-white">{localSky ? `${localSky.relative_humidity_2m}%` : '--'}</p>
                   </div>
                 </div>
               </div>
             </div>
             <div className="px-6 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
               {localSky && localSky.cloud_cover < 30 ? "Clear Skies" : "Check Coverage"}
             </div>
          </section>

          {/* Chart Section */}
          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden">
             <div className="flex items-center justify-between mb-10 relative z-10">
               <div>
                 <h2 className="text-2xl font-orbitron font-bold text-white mb-1">Solar Dynamics</h2>
                 <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Spectral Telemetry</p>
               </div>
               <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                 {['flux', 'wind'].map((tab) => (
                   <button 
                    key={tab}
                    onClick={() => setActiveMetricTab(tab as any)}
                    className={`px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all ${activeMetricTab === tab ? 'bg-cyan-500 text-white' : 'text-gray-500'}`}
                   >
                     {tab}
                   </button>
                 ))}
               </div>
             </div>

             <div className="h-80 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={solarData}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E8FF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00E8FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="time" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} tick={{ dy: 10 }} />
                  <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} tick={{ dx: -10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090A0F', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '12px' }}
                    itemStyle={{ color: '#00E8FF', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey={activeMetricTab} stroke="#00E8FF" strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" />
                </AreaChart>
              </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-8">
          {/* NASA Mission Control */}
          <div className="glass-card p-8 rounded-[2.5rem] border-orange-500/20 flex flex-col bg-gradient-to-b from-orange-950/10 to-transparent">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-lg font-orbitron font-bold text-white">Mission Control</h3>
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">NASA Notifications</p>
                </div>
                <Terminal className="text-orange-400" size={18} />
             </div>

             <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                {loading ? (
                   Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)
                ) : (
                  nasaData.map((note, i) => (
                    <motion.div 
                      key={note.messageID || i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all"
                    >
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[8px] font-bold text-orange-400 uppercase tracking-widest px-2 py-0.5 bg-orange-500/10 rounded-md">
                             {note.messageType || "Bulletin"}
                          </span>
                       </div>
                       <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                          {note.messageBody.replace(/<\/?[^>]+(>|$)/g, "")}
                       </p>
                    </motion.div>
                  ))
                )}
             </div>

             <button 
                onClick={runAIAnalysis}
                className="w-full mt-8 py-4 bg-gradient-to-r from-orange-600 to-purple-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all"
              >
                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Threat Synthesis {!isPremium && <Lock size={12} className="opacity-50" />}
              </button>
          </div>
          
          {/* Live Aurora Feed - Adjusted to prevent footer collision */}
          <div className="glass-card p-8 rounded-[2.5rem] border-cyan-500/20 relative overflow-hidden flex flex-col min-h-[400px]">
            <div className="mb-6">
              <h3 className="text-xl font-orbitron font-bold text-white mb-1">Live Aurora Feed</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold flex items-center gap-2">
                <Globe size={12} /> Ionosphere Uplink
              </p>
            </div>
            
            <div className="flex-1 min-h-[220px] rounded-3xl overflow-hidden border border-white/5 relative">
              <LiveAuroraMap />
              {!isPremium && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-20">
                   <Lock size={24} className="text-purple-400 mb-4" />
                   <h4 className="text-sm font-orbitron font-bold mb-4">Pro Layer Locked</h4>
                   <button 
                    onClick={() => navigate('/premium-alerts')}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/40 transition-all"
                   >
                     Unlock Pro
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Modal */}
      <AnimatePresence>
        {aiReport && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="w-full max-w-4xl glass-card rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] border-orange-500/30"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center bg-orange-900/10">
                <div className="flex items-center gap-4">
                  <ShieldAlert className="text-orange-400" size={24} />
                  <h2 className="text-xl font-orbitron font-bold">Threat Briefing</h2>
                </div>
                <button onClick={() => setAiReport(null)} className="p-2 text-gray-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto no-scrollbar flex-1 space-y-8">
                <div className="p-8 rounded-[2rem] bg-red-500/10 border border-red-500/20">
                  <h3 className="text-2xl font-orbitron font-bold mb-4">{aiReport.summary}</h3>
                  <div className="p-4 bg-black/60 rounded-xl font-mono text-[10px] text-cyan-400">
                    TELEMETRY: {aiReport.technicalTelemetry}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Infrastucture Risks</h4>
                    {aiReport.impacts.map((imp: any, i: number) => (
                      <div key={i} className="p-4 glass-card rounded-xl border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-white">{imp.system}</span>
                          <span className="text-[9px] font-bold text-red-400 uppercase">{imp.severity}</span>
                        </div>
                        <p className="text-xs text-gray-400">{imp.advice}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">Aurora Projection</h4>
                    <p className="text-sm text-gray-300 leading-relaxed italic">"{aiReport.auroraPrediction}"</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Weather;
