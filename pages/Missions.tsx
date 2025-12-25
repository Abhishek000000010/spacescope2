
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  Rocket, Target, Flag, CheckCircle2, AlertCircle, 
  Clock, X, ChevronRight, Loader2, Sparkles, Shield, 
  Database, Cpu, History, Zap, Globe, Info, Activity
} from 'lucide-react';
import { missionsData } from '../data/missions';
import { SpaceMission } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface MissionAnalysis {
  title: string;
  scientificBreakthroughs: string[];
  technicalChallenges: { title: string; description: string }[];
  legacyImpact: string;
  telemetrySim: { sensor: string; value: string }[];
}

const Missions: React.FC = () => {
  const [selectedMission, setSelectedMission] = useState<SpaceMission | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MissionAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({
    container: scrollContainerRef
  });

  const scaleX = useSpring(scrollXProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const analyzeMission = async (mission: SpaceMission) => {
    setIsAnalyzing(true);
    setShowAnalysis(true);
    setAnalysisResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Perform a deep technical and scientific analysis of the space mission: ${mission.mission_name} (${mission.year}). Provide historical context, key breakthroughs, and engineering hurdles.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              scientificBreakthroughs: { type: Type.ARRAY, items: { type: Type.STRING } },
              technicalChallenges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "description"]
                }
              },
              legacyImpact: { type: Type.STRING },
              telemetrySim: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sensor: { type: Type.STRING },
                    value: { type: Type.STRING }
                  },
                  required: ["sensor", "value"]
                }
              }
            },
            required: ["title", "scientificBreakthroughs", "technicalChallenges", "legacyImpact", "telemetrySim"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const closeAnalysis = () => {
    setShowAnalysis(false);
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col bg-[#02000c] overflow-hidden">
      {/* Background HUD Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,transparent_100%)]" />
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 mb-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col md:flex-row items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                <History size={20} />
              </div>
              <span className="text-xs font-bold text-cyan-500 uppercase tracking-[0.4em]">Chronological Archive</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-orbitron font-bold text-white tracking-tighter leading-none mb-4">
              Missions <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Timeline</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl font-light max-w-2xl leading-relaxed">
              Decades of exploration, from the first steps on the Moon to the search for life on the Red Planet.
            </p>
          </div>
          
          <div className="hidden lg:flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
             <Activity className="text-cyan-400 animate-pulse" size={24} />
             <div className="text-left">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Temporal Drift</p>
                <p className="text-sm font-orbitron font-bold text-white">NOMINAL</p>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Horizontal Timeline Scroller */}
      <div className="relative flex-1 flex items-center mb-12">
        {/* Animated Background Line */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 transform -translate-y-1/2" />
        <motion.div 
          style={{ scaleX }}
          className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 shadow-[0_0_20px_rgba(0,232,255,0.5)] origin-left transform -translate-y-1/2 z-0"
        />

        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto overflow-y-hidden no-scrollbar px-[10vw] gap-24 items-center h-[550px] relative z-10"
        >
          {missionsData.map((mission, idx) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="relative shrink-0 w-80 lg:w-96 group"
            >
              {/* Year Marker */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                 <motion.div 
                    whileHover={{ scale: 1.4 }}
                    className="w-5 h-5 bg-white rounded-full border-4 border-[#02000c] shadow-[0_0_15px_white] z-20 transition-all cursor-help"
                 />
                 <div className={`absolute ${idx % 2 === 0 ? 'top-8' : 'bottom-8'} font-orbitron font-bold text-xl text-white/20 group-hover:text-cyan-400 transition-colors`}>
                   {mission.year}
                 </div>
              </div>

              {/* Card Container */}
              <div className={`${idx % 2 === 0 ? 'mt-72' : 'mb-72'}`}>
                <motion.div
                  whileHover={{ y: idx % 2 === 0 ? -15 : 15, scale: 1.02 }}
                  onClick={() => setSelectedMission(mission as SpaceMission)}
                  className="glass-card rounded-[2.5rem] border-white/5 hover:border-cyan-500/30 overflow-hidden cursor-pointer shadow-2xl transition-all p-6 group/card"
                >
                  <div className="relative h-48 rounded-2xl overflow-hidden mb-6">
                    <img 
                      src={mission.photo} 
                      alt={mission.mission_name} 
                      className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-1000" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                       <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.2em]">{mission.country}</span>
                       <div className={`p-1.5 rounded-lg ${mission.status === 'Success' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {mission.status === 'Success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                       </div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-orbitron font-bold text-white mb-2 group-hover/card:text-cyan-400 transition-colors truncate">
                    {mission.mission_name}
                  </h3>
                  <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed mb-6 font-light">
                    {mission.objective}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{mission.year} A.D.</span>
                    <div className="flex items-center gap-1 text-cyan-400 text-[10px] font-bold uppercase tracking-widest group-hover/card:gap-3 transition-all">
                       Details <ChevronRight size={14} />
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
          
          {/* Ending Spacer */}
          <div className="shrink-0 w-80" />
        </div>
      </div>

      {/* Scroll Hint */}
      <div className="max-w-7xl mx-auto px-6 w-full flex justify-center pb-8 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Shift-Scroll to traverse</div>
          <div className="w-16 h-[2px] bg-white/5 overflow-hidden rounded-full">
            <motion.div 
              animate={{ x: [-64, 64] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1/2 h-full bg-cyan-500/50"
            />
          </div>
        </div>
      </div>

      {/* Analysis Terminal Modal */}
      <AnimatePresence>
        {showAnalysis && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-6xl glass-card rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] border-cyan-500/30 shadow-[0_0_80px_rgba(0,232,255,0.1)]"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center bg-cyan-950/20">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-cyan-500/20 rounded-2xl text-cyan-400 shadow-[inset_0_0_15px_rgba(0,232,255,0.2)]">
                    <Database size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-orbitron font-bold tracking-tight text-white uppercase">Deep Archive Retrieval</h2>
                    <p className="text-[10px] uppercase tracking-[0.5em] text-cyan-500/60 font-bold">CORE ACCESS LEVEL 5 // MISSION LOG</p>
                  </div>
                </div>
                <button onClick={closeAnalysis} className="p-3 text-gray-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto no-scrollbar flex-1 bg-[#010008]">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-40 gap-8">
                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-40 h-40 border-2 border-cyan-500/10 border-t-cyan-500 rounded-full"
                      />
                      <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400"
                      >
                        <Zap size={48} />
                      </motion.div>
                    </div>
                    <div className="text-center space-y-3">
                      <h3 className="text-2xl font-orbitron font-bold text-white tracking-[0.3em] animate-pulse">Syncing Telemetry</h3>
                      <p className="text-gray-500 text-sm font-mono">RECONSTRUCTING DATA FROM {selectedMission?.year} ARCHIVE...</p>
                    </div>
                  </div>
                ) : analysisResult ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                    {/* Header Summary */}
                    <div className="p-12 rounded-[2.5rem] bg-gradient-to-br from-cyan-600/10 to-transparent border border-cyan-500/20">
                      <h3 className="text-5xl font-orbitron font-bold text-white mb-8 leading-tight">{analysisResult.title}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {analysisResult.telemetrySim.map((stat, i) => (
                          <div key={i} className="p-6 bg-[#030014] rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">{stat.sensor}</p>
                            <p className="text-xl font-orbitron font-bold text-cyan-400">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-10">
                        {/* Breakthroughs */}
                        <div className="space-y-6">
                           <h4 className="text-xl font-orbitron font-bold text-white flex items-center gap-3">
                              <Sparkles className="text-cyan-400" size={24} /> 
                              Scientific Milestones
                           </h4>
                           <div className="space-y-4">
                             {analysisResult.scientificBreakthroughs.map((b, i) => (
                               <motion.div 
                                 key={i}
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: i * 0.1 }}
                                 className="flex gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 text-gray-300 group hover:border-cyan-500/20 transition-all"
                               >
                                  <div className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0 mt-1">
                                    <CheckCircle2 size={14} />
                                  </div>
                                  <p className="text-sm leading-relaxed">{b}</p>
                               </motion.div>
                             ))}
                           </div>
                        </div>

                        {/* Legacy */}
                        <div className="p-10 rounded-[2.5rem] bg-purple-500/5 border border-purple-500/20">
                          <h4 className="text-xs font-bold text-purple-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                             <History size={18} /> Historical Legacy
                          </h4>
                          <p className="text-gray-300 italic leading-relaxed text-lg font-light">
                            "{analysisResult.legacyImpact}"
                          </p>
                        </div>
                      </div>

                      {/* Technical Challenges */}
                      <div className="space-y-8">
                        <h4 className="text-xl font-orbitron font-bold text-white flex items-center gap-3">
                           <Cpu className="text-purple-400" size={24} /> 
                           Engineering Constraints
                        </h4>
                        <div className="space-y-6">
                           {analysisResult.technicalChallenges.map((challenge, i) => (
                             <div key={i} className="p-8 glass-card rounded-3xl border-white/5 bg-white/5 hover:bg-white/10 transition-all relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform">
                                   <Zap size={60} />
                                </div>
                                <h5 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                                  {challenge.title}
                                </h5>
                                <p className="text-sm text-gray-400 leading-relaxed relative z-10">{challenge.description}</p>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Basic Info Modal */}
      <AnimatePresence>
        {selectedMission && !showAnalysis && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMission(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl glass-card rounded-[3rem] overflow-hidden z-10 border-white/20 shadow-2xl"
            >
              <button 
                onClick={() => setSelectedMission(null)}
                className="absolute top-8 right-8 p-3 bg-black/60 text-white rounded-full hover:bg-white/20 transition-all z-20"
              >
                <X size={24} />
              </button>
              
              <div className="h-80 w-full relative">
                <img src={selectedMission.photo} alt={selectedMission.mission_name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#02000c] via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="px-3 py-1 bg-cyan-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-md">
                      {selectedMission.year}
                    </span>
                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${selectedMission.status === 'Success' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {selectedMission.status}
                    </span>
                  </div>
                  <h2 className="text-5xl font-orbitron font-bold text-white neon-text">{selectedMission.mission_name}</h2>
                </div>
              </div>

              <div className="p-12 pt-8">
                <div className="space-y-10">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.4em] mb-4">Core Objective</h4>
                    <p className="text-gray-300 leading-relaxed text-2xl font-light">
                      {selectedMission.objective}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
                       <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                         <Globe size={24} />
                       </div>
                       <div>
                         <p className="text-[10px] text-gray-500 font-bold uppercase">Nation</p>
                         <p className="text-sm font-bold text-white">{selectedMission.country}</p>
                       </div>
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
                       <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400">
                         <Target size={24} />
                       </div>
                       <div>
                         <p className="text-[10px] text-gray-500 font-bold uppercase">Designation</p>
                         <p className="text-sm font-bold text-white">Class-A Explorer</p>
                       </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => analyzeMission(selectedMission)}
                    className="w-full py-6 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-[2rem] font-bold text-white text-lg transition-all shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-4 group"
                  >
                    Initiate Scientific Analysis <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Missions;
