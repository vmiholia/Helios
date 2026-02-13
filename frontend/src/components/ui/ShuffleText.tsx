import React, { useEffect, useState, useRef } from 'react';

interface ShuffleTextProps {
    text: string;
    className?: string;
    trigger?: boolean;
}

const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~';

export const ShuffleText: React.FC<ShuffleTextProps> = ({ text, className, trigger = true }) => {
    const [displayText, setDisplayText] = useState(text);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startShuffle = () => {
        let iteration = 0;
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setDisplayText(() =>
                text
                    .split('')
                    .map((_, index) => {
                        if (index < iteration) {
                            return text[index];
                        }
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    })
                    .join('')
            );

            if (iteration >= text.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
            }

            iteration += 1 / 3;
        }, 30);
    };

    useEffect(() => {
        if (trigger) {
            startShuffle();
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    }, [trigger]);

    return (
        <span
            className={className}
            onMouseEnter={() => startShuffle()}
        >
            {displayText}
        </span>
    );
};
