import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Trash2, Heart, Bookmark, Star, Clock, BookOpen, Quote, Plus, Edit } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';

const BookDetail = () => {
    const { id } = useParams(); // Get ID from URL
    const navigate = useNavigate();
    const { theme } = useTheme();
    
    // State
    const [book, setBook] = useState(null);
    const [logs, setLogs] = useState([]);
    const [quotes, setQuotes] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    // Form Inputs
    const [newLog, setNewLog] = useState({ pages: '', minutes: '' });
    const [newQuote, setNewQuote] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        // 1. Fetch Book Details
        const { data: bookData, error: bookError } = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .single();
        
        if (bookError) {
            console.error(bookError);
            // If book doesn't exist, maybe redirect home
        } else {
            setBook(bookData);
        }

        // 2. Fetch Reading Logs
        const { data: logData } = await supabase
            .from('reading_logs')
            .select('*')
            .eq('book_id', id)
            .order('created_at', { ascending: false });
        
        if (logData) setLogs(logData);

        // 3. Fetch Quotes (from the new quotes table)
        const { data: quoteData } = await supabase
            .from('quotes')
            .select('*')
            .eq('book_id', id)
            .order('created_at', { ascending: true });
            
        if (quoteData) setQuotes(quoteData);

        setLoading(false);
    };

    // --- ACTIONS ---

    const handleAddQuote = async (e) => {
        e.preventDefault();
        if (!newQuote.trim()) return;
        
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data } = await supabase.from('quotes').insert([{
            book_id: id,
            user_id: user.id,
            quote_text: newQuote
        }]).select().single();

        if (data) {
            setQuotes([...quotes, data]);
            setNewQuote('');
        }
    };

    const handleAddLog = async (e) => {
        e.preventDefault();
        if (!newLog.pages || !newLog.minutes) return;
        
        const { data: { user } } = await supabase.auth.getUser();
        const pagesRead = parseInt(newLog.pages);
        const minutesRead = parseInt(newLog.minutes);

        // 1. Save Log
        const { data: savedLog } = await supabase.from('reading_logs').insert([{
            book_id: id, 
            user_id: user.id, 
            pages_read: pagesRead, 
            minutes_read: minutesRead
        }]).select().single();

        if (savedLog) {
            // 2. Update Book Progress
            const newCurrent = Math.min((book.current_page || 0) + pagesRead, book.total_pages);
            
            await supabase.from('books')
                .update({ current_page: newCurrent })
                .eq('id', id);

            // 3. Update UI
            setLogs([savedLog, ...logs]);
            setBook({ ...book, current_page: newCurrent });
            setNewLog({ pages: '', minutes: '' });
        }
    };

    const toggleAttribute = async (attr) => {
        // Optimistic update (update screen before DB)
        const newValue = !book[attr];
        setBook({ ...book, [attr]: newValue });
        
        await supabase.from('books')
            .update({ [attr]: newValue })
            .eq('id', id);
    };

    const deleteBook = async () => {
        if (!confirm("Are you sure you want to delete this journal entry? This cannot be undone.")) return;
        await supabase.from('books').delete().eq('id', id);
        navigate('/');
    };

    // --- RENDER ---

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!book) return <div className="p-8 text-center">Book not found.</div>;

    return (
        <div className={`min-h-screen pb-24 ${theme.bg} ${theme.text}`}>
            
            {/* Header Bar */}
            <header className="flex justify-between items-center mb-6">
                <button onClick={() => navigate(-1)} className={`p-2 rounded-full ${theme.surface} border ${theme.border}`}>
                    <ChevronLeft size={20} />
                </button>
                
                <div className="flex gap-2">
                    {/* Edit Button */}
                    <button 
                        onClick={() => navigate(`/edit/${id}`)} 
                        className={`p-2 rounded-full ${theme.surface} border ${theme.border} hover:bg-gray-100 transition-colors`}
                        title="Edit Book"
                    >
                        <Edit size={20} />
                    </button>
                    
                    {/* Delete Button */}
                    <button 
                        onClick={deleteBook} 
                        className="p-2 rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                        title="Delete Book"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </header>

            {/* Main Book Info Card */}
            <div className={`relative ${theme.surface} border ${theme.border} rounded-3xl p-6 shadow-sm mb-6`}>
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                    {/* Cover Image */}
                    <div className={`w-32 h-48 rounded-lg shadow-md flex-shrink-0 ${theme.primary} flex items-center justify-center overflow-hidden`}>
                        {book.cover_url ? (
                            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                            <BookOpen className="text-white opacity-50" size={32} />
                        )}
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-serif font-bold mb-1">{book.title}</h1>
                        <p className={`text-sm ${theme.subtext} mb-3`}>{book.author}</p>
                        
                        {/* Rating */}
                        <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <Star 
                                    key={i} 
                                    size={16} 
                                    className={i < book.rating_overall ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} 
                                />
                            ))}
                            <span className="ml-2 text-xs font-bold pt-0.5">{book.rating_overall}/5</span>
                        </div>

                        {/* Action Toggles */}
                        <div className="flex gap-2">
                            <button 
                                onClick={() => toggleAttribute('is_favorite')} 
                                className={`p-2 rounded-full border transition-colors ${book.is_favorite ? 'bg-red-50 border-red-200 text-red-500' : 'border-transparent bg-gray-100'}`}
                            >
                                <Heart size={18} className={book.is_favorite ? "fill-current" : ""} />
                            </button>
                            <button 
                                onClick={() => toggleAttribute('is_bookmarked')} 
                                className={`p-2 rounded-full border transition-colors ${book.is_bookmarked ? 'bg-blue-50 border-blue-200 text-blue-500' : 'border-transparent bg-gray-100'}`}
                            >
                                <Bookmark size={18} className={book.is_bookmarked ? "fill-current" : ""} />
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Progress Bar */}
                {book.total_pages > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold mb-1 opacity-70">
                            <span>Progress</span>
                            <span>{book.current_page} / {book.total_pages}</span>
                        </div>
                        <ProgressBar current={book.current_page} total={book.total_pages} />
                    </div>
                )}
                
                {/* Review Text */}
                <div className={`border-t pt-4 ${theme.border}`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {book.review_text || <span className="italic opacity-50">No review entry written.</span>}
                    </p>
                </div>
            </div>

            {/* Quotes Section */}
            <div className={`rounded-3xl p-6 ${theme.surface} border ${theme.border} mb-6`}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Quote size={18} className={theme.subtext} /> Quotes
                </h3>
                
                <div className="space-y-4 mb-4">
                    {quotes.map(q => (
                        <div key={q.id} className={`p-3 rounded-xl bg-gray-50/50 border-l-4 ${theme.border.replace('border', 'border-l')}`}>
                            <p className="italic text-sm">"{q.quote_text}"</p>
                        </div>
                    ))}
                    {quotes.length === 0 && <p className="text-xs text-gray-400">No quotes saved.</p>}
                </div>

                <form onSubmit={handleAddQuote} className="flex gap-2">
                    <input 
                        placeholder="Add a quote..." 
                        className={`flex-1 p-2 text-sm rounded-xl border ${theme.border} bg-transparent`} 
                        value={newQuote} 
                        onChange={e => setNewQuote(e.target.value)} 
                    />
                    <button className={`p-2 rounded-xl ${theme.primary} text-white`}>
                        <Plus size={18} />
                    </button>
                </form>
            </div>

            {/* Reading Log Section */}
            <div className={`rounded-3xl p-6 ${theme.surface} border ${theme.border}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Clock size={18} className={theme.subtext} /> Reading Log
                </h3>
                
                <form onSubmit={handleAddLog} className="flex gap-2 mb-4">
                    <input 
                        type="number" 
                        placeholder="Pgs" 
                        className={`w-16 p-2 text-sm rounded-xl border ${theme.border} bg-transparent`} 
                        value={newLog.pages} 
                        onChange={e => setNewLog({...newLog, pages: e.target.value})} 
                    />
                    <input 
                        type="number" 
                        placeholder="Min" 
                        className={`w-16 p-2 text-sm rounded-xl border ${theme.border} bg-transparent`} 
                        value={newLog.minutes} 
                        onChange={e => setNewLog({...newLog, minutes: e.target.value})} 
                    />
                    <button className={`px-4 py-2 rounded-xl text-sm font-bold ${theme.primary} text-white`}>
                        Log
                    </button>
                </form>
                
                <div className="space-y-2">
                    {logs.map(log => (
                        <div key={log.id} className="flex justify-between text-xs p-2 bg-gray-50 rounded-lg">
                            <span><b>{log.pages_read} pages</b> in {log.minutes_read}m</span>
                            <span className="text-gray-400">{new Date(log.created_at).toLocaleDateString()}</span>
                        </div>
                    ))}
                    {logs.length === 0 && <p className="text-xs text-gray-400 text-center">No reading sessions logged.</p>}
                </div>
            </div>
        </div>
    );
};

export default BookDetail;