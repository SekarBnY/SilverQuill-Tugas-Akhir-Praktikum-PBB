import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { Mascot } from '../components/Mascot';
import { Quote, Copy, Check } from 'lucide-react';

const Quotes = () => {
    const { theme } = useTheme();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null); // To show checkmark

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('quotes')
            .select(`
                id, 
                quote_text, 
                books (title, author, cover_url)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
        if (error) console.error(error);
        else setQuotes(data);
        
        setLoading(false);
    };

    const copyToClipboard = (id, text, book) => {
        navigator.clipboard.writeText(`"${text}" - ${book.title}`);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000); // Reset after 2s
    };

    return (
        <div className={`min-h-screen pb-24 ${theme.bg} ${theme.text} transition-colors duration-500`}>
            <header className="mb-8 px-4 pt-4">
                <h1 className="text-3xl font-serif font-bold mb-1">Quote Library</h1>
                <p className={theme.subtext}>Words worth keeping.</p>
            </header>

            {loading ? (
                <div className="p-8 text-center">Loading your collection...</div>
            ) : quotes.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center">
                    <Mascot mood="write" size={120} className="mb-6" />
                    <h3 className="font-bold text-xl mb-2">Your pages are silent</h3>
                    <p className={`max-w-xs ${theme.subtext} mb-6`}>
                        When you log a book, add your favorite lines to populate this library.
                    </p>
                </div>
            ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 px-4 space-y-6">
                    {quotes.map(item => (
                        <div 
                            key={item.id} 
                            className={`break-inside-avoid relative p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${theme.surface} border ${theme.border} group`}
                        >
                            {/* Decorative Watermark */}
                            <Quote className={`absolute top-4 left-4 opacity-5 ${theme.text}`} size={64} />
                            
                            <div className="relative z-10">
                                {/* The Quote */}
                                <p className={`font-serif text-xl italic mb-6 leading-relaxed ${theme.text}`}>
                                    "{item.quote_text}"
                                </p>
                                
                                {/* Footer: Book Info & Copy Button */}
                                <div className="flex justify-between items-end pt-4 border-t border-gray-100/50">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {/* Tiny Cover Thumbnail if available */}
                                        {item.books?.cover_url && (
                                            <img 
                                                src={item.books.cover_url} 
                                                alt="cover" 
                                                className="w-8 h-12 object-cover rounded shadow-sm"
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate pr-2">{item.books?.title}</p>
                                            <p className={`text-xs truncate ${theme.subtext}`}>{item.books?.author}</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => copyToClipboard(item.id, item.quote_text, item.books)}
                                        className={`p-2 rounded-full transition-all ${
                                            copiedId === item.id 
                                                ? "bg-green-500 text-white rotate-0" 
                                                : `hover:bg-gray-100 ${theme.subtext}`
                                        }`}
                                        title="Copy to clipboard"
                                    >
                                        {copiedId === item.id ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Quotes;