import React, { useState } from 'react';
import { Shield, Key, Activity, Lock, Cpu } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [key, setKey] = useState('');

  return (
    <div className="login-viewport">
      {/* ANIMATED BACKGROUND ENGINE */}
      <div className="bg-hologram">
        <div className="hologram-orb orb-teal"></div>
        <div className="hologram-orb orb-magenta"></div>
        <div className="cyber-grid"></div>
      </div>

      {/* FLOATING COMMAND TERMINAL */}
      <div className="login-card hud-panel animate-pop-in">
        {/* TOP STATUS BAR */}
        <div className="flex justify-between items-center mb-10 opacity-60">
           <div className="flex items-center gap-2 text-[8px] font-mono teal-glow">
              <Cpu size={10}/> SECURE_CORE_ACTIVE
           </div>
           <div className="text-[8px] font-mono magenta-glow">V4.0_STABILITY_PROTOCOL</div>
        </div>

        {/* LOGO SECTION */}
        <div className="flex flex-col items-center mb-12">
          <div className="shield-container mb-6">
             <Shield size={50} className="text-teal-400 drop-shadow-[0_0_15px_rgba(0,242,255,0.8)]" />
          </div>
          <h1 className="text-4xl font-black tracking-[12px] cyber-title mb-2">BLOOD-LINK</h1>
          <div className="h-0.5 w-24 bg-gradient-to-r from-teal-500 to-magenta-500 rounded-full"></div>
        </div>

        {/* INPUT STACK */}
        <div className="space-y-6">
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500/40 group-focus-within:text-teal-400 transition-all" size={18} />
            <input
              type="password"
              placeholder="ENTER_ENCRYPTION_KEY"
              className="w-full bg-black/80 border-b-2 border-teal-500/20 py-4 pl-12 pr-4 text-[11px] font-mono text-teal-400 outline-none focus:border-teal-400 focus:bg-teal-500/5 transition-all tracking-[4px]"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>

          <button
            onClick={onLogin}
            className="w-full py-5 bg-gradient-to-r from-teal-600 via-blue-600 to-magenta-600 text-white font-black text-[12px] tracking-[8px] uppercase hover:brightness-125 transition-all shadow-[0_0_40px_rgba(0,242,255,0.2)] flex items-center justify-center gap-3 active:scale-95"
          >
            INITIALIZE_GRID <Activity size={18} className="animate-pulse" />
          </button>
        </div>

        {/* FOOTER METRICS */}
        <div className="mt-12 pt-6 border-t border-white/5 flex justify-between items-center opacity-40">
           <div className="text-[8px] font-mono flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div> ENCRYPTION_SECURE
           </div>
           <span className="text-[8px] font-mono tracking-widest">PES_HEALATHON_2026</span>
        </div>
      </div>
    </div>
  );
};

export default Login;