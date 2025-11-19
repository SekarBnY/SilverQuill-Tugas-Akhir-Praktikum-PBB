import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { THEMES } from '../constants/themes';
import { supabase } from '../lib/supabase';
import { User, Palette, LogIn, LogOut, Tag, Plus, X, Info } from 'lucide-react';

const Profile = () => {
    const { theme, changeTheme, currentThemeKey } = useTheme();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    
    // Tag State
    const [tags, setTags] = useState([]);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3b82f6'); // Default Blue

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) fetchTags(user.id);
    };

    const fetchTags = async (userId) => {
        const { data } = await supabase.from('tags').select('*').eq('user_id', userId);
        if (data) setTags(data);
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        const { data, error } = await supabase.from('tags').insert([{
            user_id: user.id,
            name: newTagName,
            color: newTagColor
        }]).select().single();

        if (data) {
            setTags([...tags, data]);
            setNewTagName('');
        }
    };

    const handleDeleteTag = async (id) => {
        await supabase.from('tags').delete().eq('id', id);
        setTags(tags.filter(t => t.id !== id));
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className={`min-h-screen pb-24 ${theme.bg} ${theme.text}`}>
            <h1 className="text-2xl font-serif font-bold mb-6">Profile & Settings</h1>

            {/* User Card */}
            <div className={`p-6 rounded-2xl border mb-8 flex items-center gap-4 ${theme.surface} ${theme.border}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${theme.bg}`}>
                    <User size={32} className={theme.accent} />
                </div>
                <div>
                    <h3 className="font-bold text-lg">
                        {user?.is_anonymous ? "Guest Traveler" : (user?.email || "Traveler")}
                    </h3>
                    <p className={`text-sm ${theme.subtext}`}>
                        {user?.is_anonymous ? "Data saved locally." : "Member of SilverQuill."}
                    </p>
                </div>
            </div>

            {/* Tag Manager (Only show if logged in/guest) */}
            {user && (
                <section className="mb-8">
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${theme.subtext}`}>Your Tags</h3>
                    <div className={`p-4 rounded-xl border ${theme.surface} ${theme.border}`}>
                        <div className="flex gap-2 mb-4">
                            <input 
                                placeholder="New Tag Name" 
                                className={`flex-1 p-2 rounded-lg border bg-transparent ${theme.border}`} 
                                value={newTagName} 
                                onChange={e => setNewTagName(e.target.value)} 
                            />
                            <input 
                                type="color" 
                                className="h-10 w-10 rounded cursor-pointer border-none bg-transparent" 
                                value={newTagColor} 
                                onChange={e => setNewTagColor(e.target.value)} 
                            />
                            <button onClick={handleCreateTag} className={`px-4 rounded-lg font-bold text-white ${theme.primary}`}>
                                <Plus />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tags.map(t => (
                                <div key={t.id} className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold text-white shadow-sm" style={{ backgroundColor: t.color }}>
                                    <span>{t.name}</span>
                                    <button onClick={() => handleDeleteTag(t.id)} className="hover:text-black/50"><X size={14} /></button>
                                </div>
                            ))}
                            {tags.length === 0 && <p className="text-xs opacity-50 italic">No tags created yet.</p>}
                        </div>
                    </div>
                </section>
            )}

            {/* Account Actions */}
            <section className="mb-8">
                 <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${theme.subtext}`}>Account</h3>
                 {user?.is_anonymous ? (
                    <button onClick={() => navigate('/login')} className={`w-full flex items-center gap-3 p-4 rounded-xl border ${theme.surface} ${theme.border} hover:bg-blue-50 transition-colors`}>
                        <LogIn size={20} className="text-blue-500" />
                        <div className="text-left">
                            <span className="block font-bold text-blue-600">Log In / Sign Up</span>
                            <span className="text-xs opacity-70">Save your books to the cloud</span>
                        </div>
                    </button>
                 ) : (
                    <button onClick={handleLogout} className={`w-full flex items-center gap-3 p-4 rounded-xl border ${theme.surface} ${theme.border} hover:bg-red-50 transition-colors`}>
                        <LogOut size={20} className="text-red-500" />
                        <span className="font-bold text-red-600">Sign Out</span>
                    </button>
                 )}
            </section>

            {/* Theme Switcher */}
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Palette size={18} className={theme.subtext} />
                    <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.subtext}`}>App Theme</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.keys(THEMES).map((key) => (
                        <button
                            key={key}
                            onClick={() => changeTheme(key)}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${currentThemeKey === key ? `ring-2 ring-offset-2 ${theme.border}` : `${theme.surface} border-transparent`}`}
                            style={{ borderColor: currentThemeKey === key ? theme.mascotColor : 'transparent' }}
                        >
                            <div className={`w-6 h-6 rounded-full ${THEMES[key].primary}`}></div>
                            <span className="font-medium">{THEMES[key].name}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* About App Section */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Info size={18} className={theme.subtext} />
                    <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.subtext}`}>Tentang Aplikasi</h3>
                </div>
                <div className={`p-4 rounded-xl border ${theme.surface} ${theme.border}`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.primary} text-white text-2xl`}>
                            🦉
                        </div>
                        <div>
                            <h4 className={`font-bold ${theme.text}`}>SilverQuill</h4>
                            <p className={`text-xs ${theme.subtext}`}>Versi 1.0.0</p>
                        </div>
                    </div>
                    
                    <p className={`text-sm leading-relaxed mb-4 ${theme.text} opacity-80`}>
                        SilverQuill adalah jurnal buku digital yang dirancang untuk membantu Anda mencatat perjalanan membaca, menyimpan kutipan favorit, dan mengatur koleksi buku Anda dengan antarmuka yang tenang dan nyaman.
                    </p>

                    <div className={`text-xs ${theme.subtext} border-t ${theme.border} pt-3 flex flex-col gap-1`}>
                        <p><strong>Pengembang:</strong> Sekar Bestari Nindita Yasmin / 21120123130072</p>
                        <p><strong>Dibuat untuk:</strong> Tugas Akhir Praktikum PPB</p>
                        <p>© 2025 SilverQuill Book Journal. All rights reserved.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Profile;