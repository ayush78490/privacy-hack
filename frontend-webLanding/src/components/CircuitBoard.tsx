
import { Bitcoin, CircleDollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

// Custom Solana Icon Component
const SolIcon = ({ className, strokeWidth = 1.5 }: { className?: string, strokeWidth?: number }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 7h15l2-4H5l-2 4z" />
        <path d="M21 11H6l-2 4h15l2-4z" />
        <path d="M3 17h15l2-4H5l-2 4z" />
    </svg>
);

// Custom Ethereum Icon Component
const EthIcon = ({ className, strokeWidth = 1.5 }: { className?: string, strokeWidth?: number }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2L4.5 13.5L12 22L19.5 13.5L12 2Z" />
        <path d="M12 2V22" />
        <path d="M4.5 13.5H19.5" />
    </svg>
);

const CircuitBoard = () => {
    return (
        <div className="relative mt-[-130px] w-full h-[500px] flex items-center justify-center pointer-events-none select-none">
            {/* SVG Circuit Canvas */}
            <svg className="absolute w-full h-full max-w-[1400px]" viewBox="0 0 1400 500" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="circuit-gradient-left" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(255, 97, 26, 0.05)" />
                        <stop offset="50%" stopColor="rgba(255, 97, 26, 0.6)" />
                        <stop offset="100%" stopColor="rgba(255, 97, 26, 0.05)" />
                    </linearGradient>
                    <linearGradient id="circuit-gradient-right" x1="100%" y1="0%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="rgba(255, 97, 26, 0.05)" />
                        <stop offset="50%" stopColor="rgba(255, 97, 26, 0.6)" />
                        <stop offset="100%" stopColor="rgba(255, 97, 26, 0.05)" />
                    </linearGradient>
                    <filter id="glow-node" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* LEFT SIDE CIRCUITS - Converging Pattern */}
                <g className="circuit-left" stroke="url(#circuit-gradient-left)" fill="none" strokeWidth="1.5">

                    {/* Top Group - Converging Down */}
                    {/* Line 1 (Outer Top) */}
                    <path d="M50,100 L150,100 L250,150 L350,150" className="opacity-30" />
                    <path d="M50,100 L150,100 L250,150 L350,150" stroke="#FF611A" strokeOpacity="0.8" strokeDasharray="60 400" strokeDashoffset="460">
                        <animate attributeName="stroke-dashoffset" from="460" to="0" dur="4s" repeatCount="indefinite" />
                    </path>
                    <circle cx="50" cy="100" r="2" fill="#FF611A" opacity="0.5" />

                    {/* Line 2 (Inner Top) - Feeds Top-Left (Bitcoin) */}
                    <path d="M80,140 L180,140 L230,170 L320,170" className="opacity-30" />
                    <path d="M80,140 L180,140 L230,170 L320,170" stroke="#FF611A" strokeOpacity="0.8" strokeDasharray="40 300" strokeDashoffset="340">
                        <animate attributeName="stroke-dashoffset" from="340" to="0" dur="3s" repeatCount="indefinite" />
                    </path>
                    <circle cx="80" cy="140" r="2" fill="#FF611A" opacity="0.5" />
                    {/* Connection to Bitcoin */}
                    <path d="M280,170 L310,130" className="opacity-40" strokeWidth="1" />
                    <circle cx="310" cy="130" r="2.5" fill="#FF611A" filter="url(#glow-node)" />

                    {/* Bottom Group - Converging Up */}
                    {/* Line 3 (Outer Bottom) */}
                    <path d="M50,400 L150,400 L250,350 L350,350" className="opacity-30" />
                    <path d="M50,400 L150,400 L250,350 L350,350" stroke="#FF611A" strokeOpacity="0.8" strokeDasharray="60 400" strokeDashoffset="460">
                        <animate attributeName="stroke-dashoffset" from="460" to="0" dur="4s" repeatCount="indefinite" />
                    </path>
                    <circle cx="50" cy="400" r="2" fill="#FF611A" opacity="0.5" />

                    {/* Line 4 (Inner Bottom) - Feeds Bottom-Left (Solana) */}
                    <path d="M80,360 L180,360 L230,330 L320,330" className="opacity-30" />
                    <path d="M80,360 L180,360 L230,330 L320,330" stroke="#FF611A" strokeOpacity="0.8" strokeDasharray="40 300" strokeDashoffset="340">
                        <animate attributeName="stroke-dashoffset" from="340" to="0" dur="3.5s" repeatCount="indefinite" />
                    </path>
                    <circle cx="80" cy="360" r="2" fill="#FF611A" opacity="0.5" />
                    {/* Connection to Solana */}
                    <path d="M280,330 L310,370" className="opacity-40" strokeWidth="1" />
                    <circle cx="310" cy="370" r="2.5" fill="#FF611A" filter="url(#glow-node)" />

                    {/* Center Merging Line */}
                    <path d="M350,250 L480,250" className="opacity-30" strokeWidth="1" />
                    <path d="M350,250 L480,250" stroke="#FF611A" strokeOpacity="0.8" strokeDasharray="30 130" strokeDashoffset="160">
                        <animate attributeName="stroke-dashoffset" from="160" to="0" dur="2s" repeatCount="indefinite" />
                    </path>
                    <circle cx="480" cy="250" r="2" fill="#FF611A" filter="url(#glow-node)" opacity="0.8" />

                    {/* Diagonal feeds to center */}
                    <path d="M350,150 L400,250" className="opacity-20" />
                    <path d="M350,350 L400,250" className="opacity-20" />
                </g>

                {/* RIGHT SIDE CIRCUITS - Converging Pattern (Mirrored) */}
                <g className="circuit-right" stroke="url(#circuit-gradient-right)" fill="none" strokeWidth="1.5">

                    {/* Top Group - Converging Down */}
                    {/* Line 1 (Outer Top) */}
                    <path d="M1350,100 L1250,100 L1150,150 L1050,150" className="opacity-30" />
                    <path d="M1350,100 L1250,100 L1150,150 L1050,150" stroke="#FF611A" strokeOpacity="0.8" strokeDasharray="60 400" strokeDashoffset="460">
                        <animate attributeName="stroke-dashoffset" from="460" to="0" dur="4s" repeatCount="indefinite" />
                    </path>
                    <circle cx="1350" cy="100" r="2" fill="#FF611A" opacity="0.5" />

                    {/* Line 2 (Inner Top) - Feeds Top-Right (Ethereum) */}
                    <path d="M1320,140 L1220,140 L1170,170 L1080,170" className="opacity-30" />
                    <path d="M1320,140 L1220,140 L1170,170 L1080,170" stroke="#FF611A" strokeOpacity="0.8" strokeDasharray="40 300" strokeDashoffset="340">
                        <animate attributeName="stroke-dashoffset" from="340" to="0" dur="3s" repeatCount="indefinite" />
                    </path>
                    <circle cx="1320" cy="140" r="2" fill="#FF611A" opacity="0.5" />
                    {/* Connection to Ethereum */}
                    <path d="M1120,170 L1090,130" className="opacity-40" strokeWidth="1" />
                    <circle cx="1090" cy="130" r="2.5" fill="#FF611A" filter="url(#glow-node)" />

                    {/* Bottom Group - Converging Up */}
                    {/* Line 3 (Outer Bottom) */}
                    <path d="M1350,400 L1250,400 L1150,350 L1050,350" className="opacity-30" />
                    <path d="M1350,400 L1250,400 L1150,350 L1050,350" stroke="#FF611A" strokeOpacity="0.8" strokeDasharray="60 400" strokeDashoffset="460">
                        <animate attributeName="stroke-dashoffset" from="460" to="0" dur="4s" repeatCount="indefinite" />
                    </path>
                    <circle cx="1350" cy="400" r="2" fill="#FF611A" opacity="0.5" />

                    {/* Line 4 (Inner Bottom) - Feeds Bottom-Right (USDC) */}
                    <path d="M1320,360 L1220,360 L1170,330 L1080,330" className="opacity-30" />
                    <path d="M1320,360 L1220,360 L1170,330 L1080,330" stroke="#FF611A" strokeOpacity="0.8" strokeDasharray="40 300" strokeDashoffset="340">
                        <animate attributeName="stroke-dashoffset" from="340" to="0" dur="3.5s" repeatCount="indefinite" />
                    </path>
                    <circle cx="1320" cy="360" r="2" fill="#FF611A" opacity="0.5" />
                    {/* Connection to USDC */}
                    <path d="M1120,330 L1090,370" className="opacity-40" strokeWidth="1" />
                    <circle cx="1090" cy="370" r="2.5" fill="#FF611A" filter="url(#glow-node)" />

                    {/* Center Merging Line */}
                    <path d="M1050,250 L920,250" className="opacity-30" strokeWidth="1" />
                    <path d="M1050,250 L920,250" stroke="#FF611A" strokeOpacity="0.8" strokeDasharray="30 130" strokeDashoffset="160">
                        <animate attributeName="stroke-dashoffset" from="160" to="0" dur="2s" repeatCount="indefinite" />
                    </path>
                    <circle cx="920" cy="250" r="2" fill="#FF611A" filter="url(#glow-node)" opacity="0.8" />

                    {/* Diagonal feeds to center */}
                    <path d="M1050,150 L1000,250" className="opacity-20" />
                    <path d="M1050,350 L1000,250" className="opacity-20" />
                </g>
            </svg>

            {/* FLOATING ICONS CONTAINER */}
            <div className="absolute inset-0 w-full h-full max-w-[1400px] mx-auto pointer-events-none">

                {/* Left Top - Bitcoin */}
                <div className="absolute left-[21%] top-[24%]">
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="p-3 rounded-xl bg-[#0a0502]/80 border border-[#FF611A]/30 backdrop-blur-md shadow-[0_0_20px_rgba(255,97,26,0.15)]"
                    >
                        <Bitcoin className="w-5 h-5 text-orange-50" strokeWidth={1.5} />
                    </motion.div>
                </div>

                {/* Left Bottom - Solana */}
                <div className="absolute left-[21%] bottom-[24%]">
                    <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        className="p-3 rounded-xl bg-[#0a0502]/80 border border-[#FF611A]/30 backdrop-blur-md shadow-[0_0_20px_rgba(255,97,26,0.15)]"
                    >
                        <SolIcon className="w-5 h-5 text-orange-50" strokeWidth={1.5} />
                    </motion.div>
                </div>

                {/* Right Top - Ethereum */}
                <div className="absolute right-[21%] top-[24%]">
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        className="p-3 rounded-xl bg-[#0a0502]/80 border border-[#FF611A]/30 backdrop-blur-md shadow-[0_0_20px_rgba(255,97,26,0.15)]"
                    >
                        <EthIcon className="w-5 h-5 text-orange-50" strokeWidth={1.5} />
                    </motion.div>
                </div>

                {/* Right Bottom - USDC */}
                <div className="absolute right-[21%] bottom-[24%]">
                    <motion.div
                        animate={{ y: [0, 9, 0] }}
                        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                        className="p-3 rounded-xl bg-[#0a0502]/80 border border-[#FF611A]/30 backdrop-blur-md shadow-[0_0_20px_rgba(255,97,26,0.15)]"
                    >
                        <CircleDollarSign className="w-5 h-5 text-orange-50" strokeWidth={1.5} />
                    </motion.div>
                </div>

                {/* CENTRAL CORE */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 flex items-center justify-center">

                    {/* Outer Thin Ring */}
                    <div className="absolute w-[340px] h-[340px] rounded-full border border-white/5 opacity-50" />

                    {/* Radar Tick Marks Ring - 60 ticks */}
                    <svg className="absolute w-[300px] h-[300px] animate-[spin_80s_linear_infinite]" viewBox="0 0 300 300">
                        {Array.from({ length: 60 }).map((_, i) => (
                            <line
                                key={i}
                                x1="150" y1="0" x2="150" y2="10"
                                transform={`rotate(${i * 6} 150 150)`}
                                stroke={i % 5 === 0 ? "rgba(255, 97, 26, 0.8)" : "rgba(255, 255, 255, 0.1)"}
                                strokeWidth={i % 5 === 0 ? 2 : 1}
                                strokeLinecap="round"
                            />
                        ))}
                    </svg>

                    {/* Middle Rotating Segments */}
                    <svg className="absolute w-[260px] h-[260px] animate-[spin_30s_linear_infinite_reverse]" viewBox="0 0 260 260">
                        <defs>
                            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="rgba(255, 97, 26, 0)" />
                                <stop offset="50%" stopColor="rgba(255, 97, 26, 0.5)" />
                                <stop offset="100%" stopColor="rgba(255, 97, 26, 0)" />
                            </linearGradient>
                        </defs>
                        <circle cx="130" cy="130" r="128" stroke="white" strokeOpacity="0.05" strokeWidth="1" fill="none" />
                        <path d="M130,2 A128,128 0 0,1 258,130" stroke="url(#ring-gradient)" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <path d="M130,258 A128,128 0 0,1 2,130" stroke="url(#ring-gradient)" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>

                    {/* Inner Dashed Ring */}
                    <div className="absolute w-[200px] h-[200px] rounded-full border border-[#FF611A]/10" />
                    <svg className="absolute w-[210px] h-[210px] animate-[spin_15s_linear_infinite]" viewBox="0 0 210 210">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <circle
                                key={i}
                                cx="105" cy="5" r="1.5"
                                transform={`rotate(${i * 30} 105 105)`}
                                fill="rgba(255, 97, 26, 0.6)"
                            />
                        ))}
                    </svg>

                    {/* Core Shield */}
                    <div className="relative w-44 h-44 rounded-full bg-gradient-to-br from-white/10 to-[#FF611A]/5 backdrop-blur-2xl border border-[#FF611A]/30 flex items-center justify-center shadow-[0_0_100px_rgba(255,97,26,0.25)] z-20 group">
                        {/* Core pulse animation */}
                        <div className="absolute inset-0 rounded-full bg-[#FF611A]/20 animate-pulse" />
                        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_70%)]" />

                        {/* Shield Icon Replacement */}
                        <img
                            src="/privypay.png"
                            alt="PrivyPay Logo"
                            className="w-24 h-24 object-contain drop-shadow-[0_0_30px_rgba(255,97,26,0.8)] transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CircuitBoard;
