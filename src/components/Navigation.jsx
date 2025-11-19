import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Mascot } from './Mascot';
import { Book, Plus, User, Star, List, Quote } from 'lucide-react';

export const Navigation = () => {
    const { theme } = useTheme();
    const location = useLocation();
    const currentPath = location.pathname;

    const NavItem = ({ to, icon: Icon, label }) => {
        const isActive = currentPath === to;
        return (
            <Link to={to} className={`flex flex-col md:flex-row items-center md:gap-3 p-2 rounded-xl transition-all ${isActive ? `${theme.primary} ${theme.primaryText}` : `${theme.subtext} hover:bg-gray-100/10`}`}>
                <Icon size={24} />
                <span className="text-[10px] md:text-sm font-medium">{label}</span>
            </Link>
        );
    };

    return (
        <nav className={`fixed bottom-0 left-0 right-0 md:static md:h-screen md:w-64 md:flex-col border-t md:border-t-0 md:border-r flex justify-between p-2 md:p-4 z-50 shadow-lg md:shadow-none transition-colors duration-500 ${theme.surface} ${theme.border}`}>
            {/* Mascot Area (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-3 mb-8 px-2">
                <Mascot mood="neutral" size={40} />
                <span className={`text-xl font-serif font-bold ${theme.text}`}>SilverQuill</span>
            </div>

            {/* Links - Scrollable on mobile if needed */}
            <div className="flex w-full justify-between md:justify-start md:flex-col md:gap-2 overflow-x-auto">
                <NavItem to="/" icon={Book} label="Library" />
                <NavItem to="/quotes" icon={Quote} label="Quotes" />
                <NavItem to="/wishlist" icon={List} label="TBR" />
                <NavItem to="/add" icon={Plus} label="Log" />
                <NavItem to="/saved" icon={Star} label="Saved" />
                <NavItem to="/profile" icon={User} label="Profile" />
            </div>
        </nav>
    );
};