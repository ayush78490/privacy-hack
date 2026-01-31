import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypewriterEffectProps {
    words: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseDuration?: number;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
    words,
    typingSpeed = 150,
    deletingSpeed = 100,
    pauseDuration = 2000,
}) => {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const handleTyping = () => {
            const fullText = words[currentWordIndex];

            if (isDeleting) {
                setCurrentText(fullText.substring(0, currentText.length - 1));
            } else {
                setCurrentText(fullText.substring(0, currentText.length + 1));
            }

            if (!isDeleting && currentText === fullText) {
                setTimeout(() => setIsDeleting(true), pauseDuration);
            } else if (isDeleting && currentText === '') {
                setIsDeleting(false);
                setCurrentWordIndex((prev) => (prev + 1) % words.length);
            }
        };

        const timer = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);

        return () => clearTimeout(timer);
    }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

    return (
        <div className="flex items-center justify-center font-orbitron text-[#FF611A] text-2xl md:text-3xl font-bold tracking-widest h-12">
            <span>{currentText}</span>
            <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="inline-block w-1 h-8 ml-1 bg-[#FF611A]"
            />
        </div>
    );
};

export default TypewriterEffect;
