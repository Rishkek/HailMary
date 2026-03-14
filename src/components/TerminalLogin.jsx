import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function TerminalLogin({ onLogin }) {
  const [officer, setOfficer] = useState('');
  const [role, setRole] = useState('ADMIN'); // Default role state added
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!officer.trim()) return;
    setLoading(true);
    // Pass both the officer name and their selected role back to App.jsx
    setTimeout(() => onLogin(officer.trim(), role), 2500);
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md pointer-events-auto"
      >
        {/* Scanline decoration */}
        <motion.div
          className="mb-6 flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#14b870]/40" />
          <span className="font-['Orbitron',_sans-serif] text-[10px] tracking-[0.35em] text-[#628475] uppercase">
            Secure Access
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#14b870]/40" />
        </motion.div>

        {/* Main card */}
        <div className="bg-[#050f0a]/60 backdrop-blur-[24px] saturate-[1.2] border border-[#173528] rounded-lg p-8 shadow-[0_0_20px_rgba(20,184,112,0.4),0_0_60px_rgba(20,184,112,0.1)]">
          {/* Icon */}
          <motion.div
            className="mb-6 flex justify-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="relative">
              <ShieldAlert className="h-10 w-10 text-[#14b870]" />
              <div className="absolute inset-0 blur-lg">
                <ShieldAlert className="h-10 w-10 text-[#14b870] opacity-60" />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <h1 className="font-['Orbitron',_sans-serif] text-sm tracking-[0.25em] text-[#c2e4d4] [text-shadow:0_0_10px_rgba(20,184,112,0.6),0_0_30px_rgba(20,184,112,0.2)] mb-2">
              CLINICAL DASHBOARD
            </h1>
            <p className="text-[10px] tracking-[0.35em] text-[#628475] uppercase">
              Terminal Authentication Required
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-[10px] tracking-[0.25em] text-[#628475] uppercase mb-2">
                Authorized Medical Officer
              </label>
              <input
                type="text"
                value={officer}
                onChange={(e) => setOfficer(e.target.value)}
                placeholder="ENTER OFFICER ID"
                disabled={loading}
                className="w-full bg-[#152820]/50 border border-[#173528] rounded px-4 py-3 text-xs font-['JetBrains_Mono',_monospace] tracking-widest text-[#c2e4d4] placeholder:text-[#628475]/40 focus:outline-none focus:border-[#14b870] focus:ring-1 focus:ring-[#14b870]/30 transition-all disabled:opacity-50"
              />
            </div>

            {/* Clearance Level Dropdown */}
            <div>
              <label className="block text-[10px] tracking-[0.25em] text-[#628475] uppercase mb-2">
                Clearance Level
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                className="w-full bg-[#152820]/50 border border-[#173528] rounded px-4 py-3 text-xs font-['JetBrains_Mono',_monospace] tracking-widest text-[#c2e4d4] focus:outline-none focus:border-[#14b870] focus:ring-1 focus:ring-[#14b870]/30 transition-all disabled:opacity-50 appearance-none cursor-pointer"
              >
                <option value="ADMIN">LEVEL 01: SYSTEM ADMIN</option>
                <option value="MEDICAL_OFFICER">LEVEL 02: MEDICAL OFFICER</option>
                <option value="LOGISTICS">LEVEL 03: LOGISTICS COORD</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !officer.trim()}
              className="w-full relative overflow-hidden bg-[#14b870]/10 border border-[#14b870]/40 rounded px-4 py-3 font-['Orbitron',_sans-serif] text-xs tracking-[0.25em] text-[#14b870] hover:bg-[#14b870]/20 hover:border-[#14b870]/60 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(20,184,112,0.4),0_0_60px_rgba(20,184,112,0.1)]"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    GETTING DASHBOARD READY
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    INITIATE TERMINAL
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </motion.form>

          {/* Footer decoration */}
          <motion.div
            className="mt-6 flex items-center justify-center gap-2 text-[9px] tracking-[0.25em] text-[#628475]/80 uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-[#14b870]/60 animate-pulse" />
            System Online — Awaiting Credentials
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}