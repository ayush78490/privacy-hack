import React from 'react';
import { Link, useLocation } from 'wouter';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [location] = useLocation();

    const navItems = [
        { href: '/dashboard', label: 'Home', icon: 'account_balance_wallet' },
        { href: '/swap', label: 'Swap', icon: 'swap_horiz' },
        { href: '/activity', label: 'Activity', icon: 'shield', central: true },
        { href: '/send', label: 'Send', icon: 'send' },
        { href: '/settings', label: 'Settings', icon: 'settings' },
    ];

    if (location === '/') return <>{children}</>;

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-1 pb-20">
                {children}
            </div>

            <nav className="fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 pb-safe pt-2 px-4 z-50 h-[80px]">
                <div className="flex justify-around items-center h-full pb-4 text-gray-400">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <a className={`flex flex-col items-center gap-1 transition-colors group w-16 relative ${location === item.href ? 'text-white' : 'hover:text-white'}`}>
                                {item.central ? (
                                    <>
                                        <div className="absolute -top-10 rounded-full p-[2px] bg-gradient-to-b from-cyan-500 to-emerald-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                                            <div className="bg-dark-bg rounded-full p-3 border border-white/10">
                                                <span className={`material-symbols-outlined text-white text-[28px] drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] ${location === item.href ? 'filled' : ''}`}>
                                                    {item.icon}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold mt-8 tracking-wide">{item.label}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${location === item.href ? 'filled' : ''}`}>
                                            {item.icon}
                                        </span>
                                        <span className="text-[10px] font-medium">{item.label}</span>
                                    </>
                                )}
                            </a>
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default Layout;
