import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const ProgressBar = ({ current, total, mini = false }) => {
    const { theme } = useTheme();
    
    const pct = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

    if (mini) {
        return (
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${theme.primary}`} 
                    style={{ width: `${pct}%` }}
                ></div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 w-full">
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${theme.primary}`} 
                    style={{ width: `${pct}%` }}
                ></div>
            </div>
            <span className={`text-xs font-bold whitespace-nowrap ${theme.text}`}>
                {Math.round(pct)}%
            </span>
        </div>
    );
};