import React from 'react';
import { Link, useLocation } from 'wouter';
import { LOGO_PATH } from '../constants/logo';


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [location] = useLocation();

    const navItems = [
        { href: '/dashboard', label: 'Home', icon: 'account_balance_wallet' },
        { href: '/swap', label: 'Swap', icon: 'swap_horiz' },
        { href: '/activity', label: 'Activity', icon: 'shield', central: true },
        { href: '/send', label: 'Send', icon: 'send' },
        { href: '/settings', label: 'Settings', icon: 'settings' },
    ];

    const isAppPage = ['/dashboard', '/swap', '/activity', '/send', '/settings', '/receive', '/profile'].includes(location);

    if (location === '/') return <>{children}</>;

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#121212]">
            <div className={`flex-1 overflow-y-auto no-scrollbar ${isAppPage ? 'pb-24' : ''}`}>
                {children}
            </div>

            {isAppPage && (
                <nav className="fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 pb-safe pt-2 px-4 z-50 h-[80px]">
                    <div className="flex justify-around items-center h-full pb-4 text-gray-400">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <a className={`flex flex-col items-center gap-1 transition-colors group w-16 relative ${location === item.href ? 'text-brand-orange' : 'hover:text-white'}`}>
                                    {item.central ? (
                                        <>
                                            <div className="absolute -top-10 rounded-full p-[2px] bg-gradient-to-b from-brand-orange to-brand-orange-light shadow-[0_0_20px_rgba(255,97,26,0.4)]">
                                                <div className="bg-dark-bg rounded-full p-0.5 border border-white/10">
                                                    <img src={LOGO_PATH} alt="Activity" className="size-[50px] object-contain " />
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
            )}
        </div>
    );
};

export default Layout;
