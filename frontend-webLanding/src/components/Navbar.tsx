

const Navbar = () => {
    return (
        <header className="fixed top-5 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto w-full border border-[#FF611A]/30 bg-[#0a0502]/80 backdrop-blur-md shadow-[0_4px_30px_rgba(255,97,26,0.1)] font-orbitron">
            <div className="flex items-center gap-2">
                <img src="/privypay.png" alt="PrivyPay Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(255,97,26,0.5)]" />
                <span className="text-lg font-bold tracking-widest text-white">PrivyPay</span>
            </div>

            <a
                href="https://drive.google.com/file/d/1R31f36srpuL_7tyNyUxRT_hkosL2qmK3/view?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-privy/10 border border-privy hover:bg-privy hover:text-white text-privy px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 shadow-[0_0_10px_rgba(255,97,26,0.2)] hover:shadow-[0_0_20px_rgba(255,97,26,0.6)] tracking-wider uppercase"
            >
                Download
            </a>
        </header>
    );
};

export default Navbar;
