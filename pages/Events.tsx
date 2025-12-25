
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, Calendar, MapPin, Info, Bell, X, Lock, 
  CreditCard, ChevronRight, CheckCircle2, Share2, Copy, 
  Radar, Loader2, Target, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { eventsData } from '../data/events';
import { CelestialEvent } from '../types';
import { usePremium } from '../context/PremiumContext';
import { fetchNearEarthObjects } from '../services/nasaApi';

const NEO_IMAGE = "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?auto=format&fit=crop&q=80&w=1200";

const Events: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium } = usePremium();
  const [filter, setFilter] = useState<'Upcoming' | 'Past' | 'Ongoing' | 'All'>('Upcoming');
  const [selectedEvent, setSelectedEvent] = useState<CelestialEvent | any | null>(null);
  const [showPremiumWarning, setShowPremiumWarning] = useState(false);
  const [notifiedEvents, setNotifiedEvents] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<CelestialEvent[]>([]);
  const [neos, setNeos] = useState<any[]>([]);
  const [loadingNeos, setLoadingNeos] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    setEvents(eventsData);
    fetchNearEarthObjects()
      .then(setNeos)
      .catch(console.error)
      .finally(() => setLoadingNeos(false));
  }, []);

  const handleShare = async (e: React.MouseEvent, event: any) => {
    e.stopPropagation();
    const eventId = event.id || event.neo_reference_id;
    const shareUrl = `${window.location.origin}/#/events?event=${eventId}`;
    const shareData = {
      title: `SpaceScope: ${event.name}`,
      text: `Tracking ${event.name} near Earth!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setIsSharing(true);
      setTimeout(() => setIsSharing(false), 2000);
    }
  };

  const handleNotify = (e: React.MouseEvent, event: any) => {
    e.stopPropagation();
    if (!isPremium) {
      setShowPremiumWarning(true);
      return;
    }
    const eventId = event.id || event.neo_reference_id;
    setNotifiedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const filteredEvents = filter === 'All' 
    ? events 
    : events.filter(e => e.status === filter);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-orbitron font-bold mb-2 tracking-tight">Celestial Events</h1>
          <p className="text-gray-400">Never miss a cosmic phenomenon.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white/5 p-1 rounded-lg flex border border-white/10">
            {['Upcoming', 'Past', 'All'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-md text-sm transition-all font-semibold ${
                  filter === f ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* NASA Live Asteroid Feed */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <Radar className="text-cyan-400" size={24} />
          <h2 className="text-xl font-orbitron font-bold">Live Asteroid Tracker (NeoWs)</h2>
          <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-bold uppercase tracking-widest rounded-full">NASA API Stream</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingNeos ? (
             Array(4).fill(0).map((_, i) => <div key={i} className="h-40 glass-card rounded-2xl animate-pulse" />)
          ) : neos.slice(0, 4).map((neo: any) => (
            <motion.div 
              key={neo.id}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedEvent(neo)}
              className="glass-card p-6 rounded-2xl border-white/5 cursor-pointer hover:border-cyan-500/30 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${neo.is_potentially_hazardous_asteroid ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                  <Target size={18} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => handleShare(e, neo)} 
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-gray-400 transition-colors"
                  >
                    <Share2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => handleNotify(e, neo)}
                    className={`p-1.5 rounded-md transition-all ${notifiedEvents.has(neo.id) ? 'bg-green-500 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}
                  >
                    <Bell size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-white mb-1 truncate">{neo.name}</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Miss Dist: {Math.round(neo.close_approach_data[0].miss_distance.kilometers).toLocaleString()} km</p>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-cyan-400">
                <span>View Specs</span>
                <ChevronRight size={14} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEvents.map((event) => (
          <motion.div
            layoutId={event.id}
            key={event.id}
            whileHover={{ y: -5 }}
            className="glass-card rounded-2xl overflow-hidden group border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
            onClick={() => setSelectedEvent(event)}
          >
            <div className="h-48 overflow-hidden relative">
              <img 
                src={event.image} 
                alt={event.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute top-4 left-4 bg-cyan-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter shadow-lg">
                {event.type}
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={(e) => handleShare(e, event)}
                  className="p-2 bg-black/50 text-white rounded-full hover:bg-cyan-500 transition-all shadow-lg"
                >
                  <Share2 size={16} />
                </button>
                <button 
                  onClick={(e) => handleNotify(e, event)}
                  className={`p-2 rounded-full shadow-lg transition-all ${notifiedEvents.has(event.id) ? 'bg-green-500 text-white' : 'bg-black/50 text-white hover:bg-cyan-500'}`}
                >
                  <Bell size={16} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-2 uppercase tracking-widest">
                <Calendar size={14} />
                {event.date}
              </div>
              <h3 className="text-xl font-bold mb-3">{event.name}</h3>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                <MapPin size={14} />
                {event.location}
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                <span className="text-xs text-white/40">Status: {event.status}</span>
                <span className="text-cyan-400 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Learn More <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              layoutId={selectedEvent.id || selectedEvent.neo_reference_id}
              className="relative w-full max-w-2xl glass-card rounded-[2.5rem] overflow-hidden z-10 border-white/20 shadow-2xl"
            >
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-6 right-6 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-all z-30"
              >
                <X size={20} />
              </button>
              
              <div className="p-10 pb-6">
                 {/* Detail Header Section */}
                 <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      {selectedEvent.neo_reference_id ? <Radar className="text-cyan-400" size={32} /> : null}
                      <h2 className="text-3xl font-orbitron font-bold neon-text">{selectedEvent.name}</h2>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleShare(e, selectedEvent)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-cyan-400 transition-all border border-white/10"
                      >
                        <Share2 size={20} />
                      </button>
                      <button 
                        onClick={(e) => handleNotify(e, selectedEvent)}
                        className={`p-3 rounded-xl transition-all border ${notifiedEvents.has(selectedEvent.id || selectedEvent.neo_reference_id) ? 'bg-green-500 text-white border-green-400' : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/10'}`}
                      >
                        <Bell size={20} />
                      </button>
                    </div>
                 </div>

                 {/* Event Photo - Moved below the title name */}
                 <div className="w-full h-56 rounded-2xl overflow-hidden mb-6 border border-white/10 shadow-2xl relative">
                    <img 
                      src={selectedEvent.neo_reference_id ? NEO_IMAGE : selectedEvent.image} 
                      alt={selectedEvent.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                 </div>

                 {selectedEvent.neo_reference_id ? (
                   /* NEO Details */
                   <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Max Diameter</p>
                          <p className="text-lg font-bold text-white">{Math.round(selectedEvent.estimated_diameter.kilometers.estimated_diameter_max * 100) / 100} km</p>
                       </div>
                       <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Relative Velocity</p>
                          <p className="text-lg font-bold text-white">{Math.round(selectedEvent.close_approach_data[0].relative_velocity.kilometers_per_hour).toLocaleString()} km/h</p>
                       </div>
                     </div>
                     <div className={`p-6 rounded-2xl border ${selectedEvent.is_potentially_hazardous_asteroid ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                        <div className="flex items-center gap-2 mb-2">
                           {selectedEvent.is_potentially_hazardous_asteroid ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                           <h4 className="font-bold uppercase tracking-widest text-xs">Hazard Level: {selectedEvent.is_potentially_hazardous_asteroid ? 'POTENTIAL THREAT' : 'SAFE'}</h4>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          This object is categorized based on its proximity and size relative to Earth's orbit. 
                          Currently tracking at {selectedEvent.close_approach_data[0].miss_distance.lunar} Lunar Distances.
                        </p>
                     </div>
                   </div>
                 ) : (
                   /* Standard Event Details */
                   <>
                    <p className="text-gray-300 mb-6 leading-relaxed text-lg">{selectedEvent.description}</p>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Visibility</p>
                          <p className="text-sm text-gray-300">{selectedEvent.visibility}</p>
                       </div>
                       <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Date</p>
                          <p className="text-sm text-gray-300 font-bold text-cyan-400">{selectedEvent.date}</p>
                       </div>
                    </div>
                   </>
                 )}

                <div className="flex gap-4">
                  <button 
                    onClick={(e) => handleNotify(e, selectedEvent)}
                    className={`flex-1 px-8 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${notifiedEvents.has(selectedEvent.id || selectedEvent.neo_reference_id) ? 'bg-green-600 text-white shadow-green-900/40' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40'}`}
                  >
                    {notifiedEvents.has(selectedEvent.id || selectedEvent.neo_reference_id) ? <CheckCircle2 size={20} /> : <Bell size={20} />}
                    {notifiedEvents.has(selectedEvent.id || selectedEvent.neo_reference_id) ? 'Notified' : 'Notify Me'}
                  </button>
                  <button 
                    onClick={(e) => handleShare(e, selectedEvent)}
                    className="flex-1 px-8 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40"
                  >
                    <Share2 size={20} /> {isSharing ? 'Copied Link' : 'Share Intel'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Upgrade Modal */}
      <AnimatePresence>
        {showPremiumWarning && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPremiumWarning(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md glass-card rounded-[2rem] p-8 text-center border-purple-500/30 shadow-[0_0_50px_rgba(154,77,255,0.2)]"
            >
              <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-orbitron font-bold mb-4">Pro Notifications Locked</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Unlock real-time push alerts and custom event tracking. Never miss a meteor shower or solar flare again.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/premium-alerts')}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  Go Pro for ₹49/mo
                </button>
                <button 
                  onClick={() => setShowPremiumWarning(false)}
                  className="w-full py-3 bg-transparent text-gray-500 hover:text-white transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Copied Notification */}
      <AnimatePresence>
        {isSharing && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 bg-cyan-500 text-white rounded-full font-bold shadow-2xl flex items-center gap-2"
          >
            <Copy size={16} /> Link Copied to Clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Events;
