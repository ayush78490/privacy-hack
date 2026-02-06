import React from 'react';
import privypayLogo from '../assets/privypay.png';
import './SplashScreen.css';

interface SplashScreenProps {
    onComplete?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    React.useEffect(() => {
        // Auto-hide after animation completes
        const timer = setTimeout(() => {
            if (onComplete) {
                onComplete();
            }
        }, 2500);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="splash-screen">
            <div className="splash-content">
                <div className="splash-logo-container">
                    <img
                        src={privypayLogo}
                        alt="PrivyPay"
                        className="splash-logo"
                    />
                    <div className="splash-glow"></div>
                </div>
                <h1 className="splash-title">PrivyPay</h1>
                <p className="splash-tagline">Private. Secure. Decentralized.</p>
                <div className="splash-loader">
                    <div className="splash-loader-bar"></div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
