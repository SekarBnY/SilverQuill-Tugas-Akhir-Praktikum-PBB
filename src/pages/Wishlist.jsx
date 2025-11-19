import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { Mascot } from '../components/Mascot';
import { Plus, Trash2, BookDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Wishlist = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState([]);
    const [newItem, setNewItem] = useState({ book_title: '', author: '', notes: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
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

        const { data, error } = await supabase
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
        await supabase.from('wishlist').delete().eq('id', id);
        setWishlist(wishlist.filter(item => item.id !== id));
    };

    const handleMoveToLibrary = async (item) => {
        if (!confirm("Move this book to your active library?")) return;

        const { data: { user } } = await supabase.auth.getUser();

        // 1. Add to Books table
        const { error } = await supabase.from('books').insert([{
            title: item.book_title,
            author: item.author,
            status: 'Want to Read', // Default status
            user_id: user.id,
            review_text: item.notes // Keep the notes!
        }]);

        if (!error) {
            // 2. Remove from Wishlist
            await handleDelete(item.id);
            navigate('/'); // Go to library to see it
        }
    };

    return (
        <div className={`min-h-screen pb-24 ${theme.bg} ${theme.text}`}>
            <header className="mb-8">
                <h1 className="text-2xl font-serif font-bold">To Be Read</h1>
                <p className={theme.subtext}>Books waiting for their turn.</p>
            </header>

            {/* Add Item Form */}
            <form onSubmit={handleAdd} className={`p-4 rounded-2xl border mb-8 ${theme.surface} ${theme.border}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input 
                        placeholder="Book Title" 
                        required
                        className={`p-3 rounded-xl bg-transparent border ${theme.border}`}
                        value={newItem.book_title}
                        onChange={e => setNewItem({...newItem, book_title: e.target.value})}
                    />
                    <input 
                        placeholder="Author" 
                        className={`p-3 rounded-xl bg-transparent border ${theme.border}`}
                        value={newItem.author}
                        onChange={e => setNewItem({...newItem, author: e.target.value})}
                    />
                </div>
                <div className="flex gap-3">
                    <input 
                        placeholder="Why do you want to read this?" 
                        className={`flex-1 p-3 rounded-xl bg-transparent border ${theme.border}`}
                        value={newItem.notes}
                        onChange={e => setNewItem({...newItem, notes: e.target.value})}
                    />
                    <button className={`px-6 rounded-xl font-bold ${theme.primary} ${theme.primaryText}`}>
                        <Plus />
                    </button>
                </div>
            </form>

            {/* List */}
            <div className="space-y-4">
                {loading ? <div className="text-center p-8">Loading...</div> : wishlist.length === 0 ? (
                    <div className="text-center py-12 opacity-50 flex flex-col items-center">
                        <Mascot mood="neutral" size={80} className="mb-4" />
                        <p>Your wishlist is empty.</p>
                    </div>
                ) : (
                    wishlist.map(item => (
                        <div key={item.id} className={`p-5 rounded-2xl border flex justify-between items-center group ${theme.surface} ${theme.border}`}>
                            <div>
                                <h3 className="font-bold text-lg">{item.book_title}</h3>
                                <p className={theme.subtext}>{item.author}</p>
                                {item.notes && <p className="text-sm mt-2 opacity-70 italic">"{item.notes}"</p>}
                            </div>
                            
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleMoveToLibrary(item)}
                                    className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    title="Move to Library"
                                >
                                    <BookDown size={20} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 rounded-full bg-red-50 text-red-400 hover:bg-red-100"
                                    title="Remove"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Wishlist;