import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES } from '../constants/themes';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Default to 'silverMist'
    const [themeKey, setThemeKey] = useState('silverMist');

    // Helper function to change theme
    const changeTheme = (key) => {
        if (THEMES[key]) {
            setThemeKey(key);
            // Optional: Save to localStorage so it remembers on refresh
            localStorage.setItem('silverquill_theme', key);
        }
    };

    // Load saved theme on startup
    useEffect(() => {
        const saved = localStorage.getItem('silverquill_theme');
        if (saved && THEMES[saved]) {
            setThemeKey(saved);
        }
    }, []);

    // The "value" is what components will be able to access
    const value = {
        theme: THEMES[themeKey],
        currentThemeKey: themeKey,
        changeTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// A custom hook to make using the theme easier
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};