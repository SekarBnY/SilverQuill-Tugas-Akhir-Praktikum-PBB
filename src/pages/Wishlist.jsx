import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { Mascot } from '../components/Mascot';
import { Plus, Trash2, BookDown, Sparkles, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Wishlist = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState([]);
    const [newItem, setNewItem] = useState({ book_title: '', author: '', notes: '' });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('wishlist')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (data) setWishlist(data);
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('wishlist')
            .insert([{ ...newItem, user_id: user.id }])
            .select()
            .single();

        if (data) {
            setWishlist([data, ...wishlist]);
            setNewItem({ book_title: '', author: '', notes: '' });
        }
    };

    const handleDelete = async (id) => {
        if(!confirm("Remove from wishlist?")) return;
        await supabase.from('wishlist').delete().eq('id', id);
        setWishlist(wishlist.filter(item => item.id !== id));
    };

    const handleMoveToLibrary = async (item) => {
        if (!confirm(`Start reading "${item.book_title}"? This will move it to your library.`)) return;

        const { data: { user } } = await supabase.auth.getUser();

        // 1. Add to Books table
        const { error } = await supabase.from('books').insert([{
            title: item.book_title,
            author: item.author,
            status: 'Want to Read',
            user_id: user.id,
            review_text: item.notes // Transfer notes to review text
        }]);

        if (!error) {
            // 2. Remove from Wishlist
            await supabase.from('wishlist').delete().eq('id', item.id);
            navigate('/'); // Go to library
        }
    };

    // Filter Logic
    const filteredList = wishlist.filter(item => 
        item.book_title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`min-h-screen pb-24 ${theme.bg} ${theme.text} transition-colors duration-500`}>
            
            {/* Header & Search - Sticky Top */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/60 border-b border-gray-200/50 px-4 py-4 mb-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
                                To Be Read <span className="text-xs font-sans font-normal px-2 py-1 rounded-full bg-gray-200/50 text-gray-600">{wishlist.length}</span>
                            </h1>
                            <p className={theme.subtext}>Books waiting for their turn.</p>
                        </div>
                        <div className="hidden md:block">
                            <Mascot mood="happy" size={40} />
                        </div>
                    </div>

                    {/* Compact Quick Add Form */}
                    <form onSubmit={handleAdd} className="relative">
                        <div className={`p-2 rounded-2xl shadow-lg border flex flex-col md:flex-row gap-2 ${theme.surface} ${theme.border}`}>
                            <div className="flex-1 flex gap-2">
                                <input 
                                    placeholder="Book Title" 
                                    required
                                    className="flex-1 p-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-bold"
                                    value={newItem.book_title}
                                    onChange={e => setNewItem({...newItem, book_title: e.target.value})}
                                />
                                <input 
                                    placeholder="Author" 
                                    className="flex-1 p-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                                    value={newItem.author}
                                    onChange={e => setNewItem({...newItem, author: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    placeholder="Why? (Notes)" 
                                    className="flex-1 md:w-64 p-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                                    value={newItem.notes}
                                    onChange={e => setNewItem({...newItem, notes: e.target.value})}
                                />
                                <button className={`px-4 rounded-xl font-bold text-white shadow-md hover:scale-105 transition-transform flex items-center gap-2 ${theme.primary}`}>
                                    <Plus size={20} /> <span className="hidden md:inline">Add</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </header>

            {/* Search Bar (Only appears if you have items) */}
            {wishlist.length > 5 && (
                <div className="max-w-4xl mx-auto px-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            placeholder="Search your wishlist..." 
                            className={`w-full pl-10 pr-4 py-2 rounded-xl border bg-transparent outline-none focus:ring-2 ${theme.border}`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* List Grid */}
            <div className="max-w-4xl mx-auto px-4">
                {loading ? <div className="text-center p-8">Loading...</div> : filteredList.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center opacity-60">
                        <Mascot mood="neutral" size={100} className="mb-4" />
                        <h3 className="font-bold text-lg">Your list is empty</h3>
                        <p className="text-sm">Add books you discover here so you don't forget them.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredList.map(item => (
                            <div key={item.id} className={`group relative p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md flex justify-between gap-4 ${theme.surface} ${theme.border}`}>
                                
                                {/* Decorative Bookmark Tag */}
                                <div className={`absolute -top-1 left-6 w-8 h-8 rounded-b-lg opacity-20 ${theme.primary}`}></div>

                                <div className="flex-1 pt-2 pl-2">
                                    <h3 className="font-serif font-bold text-lg leading-tight">{item.book_title}</h3>
                                    <p className={`text-sm mb-3 ${theme.subtext}`}>{item.author}</p>
                                    
                                    {item.notes && (
                                        <div className="flex items-start gap-2 text-xs opacity-70 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                            <Sparkles size={12} className="mt-0.5 shrink-0 text-yellow-500" />
                                            <span className="italic">{item.notes}</span>
                                        </div>
                                    )}
                                    
                                    <div className="text-[10px] text-gray-300 mt-3 font-mono">
                                        Added {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Actions Vertical Strip */}
                                <div className="flex flex-col gap-2 justify-center border-l pl-4 border-gray-100">
                                    <button 
                                        onClick={() => handleMoveToLibrary(item)}
                                        className={`p-3 rounded-xl transition-colors hover:bg-blue-50 text-blue-400 hover:text-blue-600 shadow-sm border border-transparent hover:border-blue-100`}
                                        title="Start Reading (Move to Library)"
                                    >
                                        <BookDown size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="p-3 rounded-xl text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                                        title="Remove"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;