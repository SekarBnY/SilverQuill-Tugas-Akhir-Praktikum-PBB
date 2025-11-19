import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { BookCard } from '../components/BookCard';
import { Heart, Bookmark } from 'lucide-react';

const Saved = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' or 'bookmarks'

    useEffect(() => {
        fetchSavedBooks();
    }, []);

    const fetchSavedBooks = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('books')
            .select('*')
            .eq('user_id', user.id);
            
        if (data) setBooks(data);
    };

    const displayBooks = books.filter(b => activeTab === 'favorites' ? b.is_favorite : b.is_bookmarked);

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
            <header className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Collections</h1>
                <p className={theme.subtext}>Your curated library.</p>
            </header>

            {/* Tab Switcher */}
            <div className={`flex p-1 rounded-xl border mb-6 ${theme.surface} ${theme.border}`}>
                <button 
                    onClick={() => setActiveTab('favorites')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'favorites' ? `${theme.primary} ${theme.primaryText} shadow-sm` : 'hover:bg-gray-100/50'}`}
                >
                    <Heart size={16} /> Favorites
                </button>
                <button 
                    onClick={() => setActiveTab('bookmarks')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'bookmarks' ? `${theme.primary} ${theme.primaryText} shadow-sm` : 'hover:bg-gray-100/50'}`}
                >
                    <Bookmark size={16} /> Bookmarks
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-24">
                {displayBooks.map(book => (
                    <BookCard 
                        key={book.id} 
                        book={book} 
                        onClick={() => navigate(`/book/${book.id}`)} 
                    />
                ))}
                {displayBooks.length === 0 && (
                    <div className="text-center py-12 opacity-50">
                        No books found in this collection.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Saved;