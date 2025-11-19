import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { Mascot } from '../components/Mascot';
import { Quote, Copy } from 'lucide-react';

const Quotes = () => {
    const { theme } = useTheme();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // JOIN Query: Get Quotes + Book Title/Author
        const { data, error } = await supabase
            .from('quotes')
            .select(`
                id, 
                quote_text, 
                books (title, author)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
        if (error) console.error(error);
        else setQuotes(data);
        
        setLoading(false);
    };

    const copyToClipboard = (text, book) => {
        navigator.clipboard.writeText(`"${text}" - ${book.title}`);
        alert("Copied!");
    };

    return (
        <div className={`min-h-screen pb-24 ${theme.bg} ${theme.text}`}>
            <header className="mb-8">
                <h1 className="text-2xl font-serif font-bold">Quote Library</h1>
                <p className={theme.subtext}>Words worth keeping.</p>
            </header>

            {loading ? <div className="p-8 text-center">Loading...</div> : quotes.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center">
                    <Mascot mood="write" size={100} className="mb-6" />
                    <h3 className="font-bold mb-2">No quotes yet</h3>
                    <p className={`max-w-xs ${theme.subtext}`}>
                        Use the "Log Book" page to add your favorite lines.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quotes.map(item => (
                        <div key={item.id} className={`p-6 rounded-2xl border shadow-sm relative group ${theme.surface} ${theme.border}`}>
                            <Quote className={`absolute top-4 left-4 opacity-10 ${theme.text}`} size={48} />
                            <div className="relative z-10">
                                <p className={`font-serif text-lg italic mb-6 leading-relaxed`}>
                                    "{item.quote_text}"
                                </p>
                                <div className="flex justify-between items-end border-t pt-4 border-gray-100">
                                    <div>
                                        <p className="font-bold text-sm">{item.books?.title}</p>
                                        <p className={`text-xs ${theme.subtext}`}>{item.books?.author}</p>
                                    </div>
                                    <button onClick={() => copyToClipboard(item.quote_text, item.books)} className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${theme.subtext}`}>
                                        <Copy size={16} />
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