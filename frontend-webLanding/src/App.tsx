import React, { useEffect, useState } from 'react';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import CircuitBoard from './components/CircuitBoard';
import Navbar from './components/Navbar';
import TypewriterEffect from './components/TypewriterEffect';

const LandingPage = () => {
  // Mouse movement effect for the spotlight
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#020403] text-white relative overflow-hidden font-orbitron selection:bg-privy/30">
      {/* Background Grain & Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,#1a0903_0%,#000000_100%)] opacity-80" />
      <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Interactive Spotlight */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 97, 26, 0.04), transparent 40%)`
        }}
      />

      {/* Top Spotlight */}
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(255,97,26,0.08)_0%,transparent_60%)] blur-[120px] pointer-events-none" />

      {/* Header */}
      <Navbar />

      <main className="relative z-10 pt-40 pb-20 flex flex-col items-center px-4 w-full max-w-7xl mx-auto">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-3xl md:text-5xl font-bold font-orbitron text-center mb-6 tracking-tight text-white drop-shadow-2xl"
        >
          PROTECTED AND ANONYMOUS
        </motion.h1>

        {/* Typewriter Animation */}
        <div className="mb-8">
          <TypewriterEffect words={["SAFE", "SECURE", "PRIVATE", "ANONYMOUS!"]} />
        </div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-gray-400 text-center max-w-lg mb-12 text-base leading-relaxed"
        >
          “Pay without giving away who you are.”
          <br />
          “Move money without leaving your identity behind.”
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex items-center gap-4 mb-24"
        >
          <button className="flex items-center gap-3 bg-privy bg-white/5 hover:bg-privy-light text-white pl-6 pr-2 py-2 border border-white/10 backdrop-blur-sm rounded-xl font-semibold text-sm transition-all shadow-[0_0_25px_rgba(255,97,26,0.25)] hover:shadow-[0_0_35px_rgba(255,97,26,0.4)] group">
            Try Free
            <div className=" p-1.5 rounded-lg group-hover:scale-105 transition-transform">
              <ChevronRight className="w-4 h-4 text-privy" strokeWidth={3} />
            </div>
          </button>

          <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-privy pl-6 pr-2 py-2 rounded-xl font-semibold text-sm border border-white/10 backdrop-blur-sm transition-all group">
            EXTENSION
            <div className="p-1.5 rounded-lg group-hover:bg-white/20 transition-colors">
              <LayoutGrid className="w-4 h-4 text-privy" />
            </div>
          </button>
        </motion.div>
      </main>
      {/* Circuit Board Component */}
      <CircuitBoard />
    </div>
  );
};

export default LandingPage;
