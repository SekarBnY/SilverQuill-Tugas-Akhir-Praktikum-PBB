import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES } from '../constants/themes';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [themeKey, setThemeKey] = useState('silverMist');

    const changeTheme = (key) => {
        if (THEMES[key]) {
            setThemeKey(key);
            localStorage.setItem('silverquill_theme', key);
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem('silverquill_theme');
        if (saved && THEMES[saved]) {
            setThemeKey(saved);
        }
    }, []);

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

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};