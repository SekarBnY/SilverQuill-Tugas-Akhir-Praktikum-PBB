import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Star, Plus, X, Quote, Image as ImageIcon, Loader2, Sparkles, Tag } from 'lucide-react';

const AddBook = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Data State
    const [formData, setFormData] = useState({
        title: '', author: '', status: 'Reading', rating_overall: 0, review_text: '', total_pages: ''
    });
    const [quotes, setQuotes] = useState(['']);
    
    // Tag State
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);

    // Image State
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('tags').select('*').eq('user_id', user.id);
            if (data) setAvailableTags(data);
        }
    };

    const toggleTag = (tagId) => {
        if (selectedTags.includes(tagId)) {
            setSelectedTags(selectedTags.filter(id => id !== tagId));
        } else {
            setSelectedTags([...selectedTags, tagId]);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    // Quote Helpers
    const handleQuoteChange = (index, value) => { const newQ = [...quotes]; newQ[index] = value; setQuotes(newQ); };
    const addQuoteField = () => setQuotes([...quotes, '']);
    const removeQuoteField = (index) => setQuotes(quotes.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            const { data: guestData, error: guestError } = await supabase.auth.signInAnonymously();
            if (guestError) {
                if(confirm("Guest login is disabled. Login manually?")) navigate('/login');
                setLoading(false); return;
            }
            user = guestData.user;
        }

        // 1. Upload Image
        let finalCoverUrl = null;
        if (coverFile) {
            const fileExt = coverFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('covers').upload(filePath, coverFile);
            if (!uploadError) {
                const { data: urlData } = supabase.storage.from('covers').getPublicUrl(filePath);
                finalCoverUrl = urlData.publicUrl;
            }
        }

        // 2. Insert Book
        const { data: bookData, error: bookError } = await supabase.from('books').insert([{
            ...formData,
            user_id: user.id,
            cover_url: finalCoverUrl,
            total_pages: parseInt(formData.total_pages) || 0,
            current_page: 0
        }]).select().single();

        if (bookError) { alert("Error: " + bookError.message); setLoading(false); return; }

        // 3. Insert Quotes & Tags
        const validQuotes = quotes.filter(q => q.trim() !== '');
        if (validQuotes.length > 0) {
            await supabase.from('quotes').insert(validQuotes.map(q => ({ book_id: bookData.id, user_id: user.id, quote_text: q })));
        }
        if (selectedTags.length > 0) {
            await supabase.from('book_tags').insert(selectedTags.map(tagId => ({ book_id: bookData.id, tag_id: tagId })));
        }

        navigate('/'); 
        setLoading(false);
    };

    return (
        <div className={`pb-24 min-h-screen ${theme.bg} ${theme.text} transition-colors duration-500`}>
            
            {/* Top Bar */}
            <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-gray-100 px-4 py-4 mb-6 flex items-center gap-4 shadow-sm">
                <button onClick={() => navigate(-1)} className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${theme.text}`}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-serif font-bold">New Journal Entry</h1>
            </header>

            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    
                    {/* LEFT COLUMN: Cover & Visuals */}
                    <div className="w-full md:w-1/3 flex flex-col items-center sticky top-24">
                        <label className={`group relative w-48 h-72 rounded-lg border-2 border-dashed ${theme.border} flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-gray-50 hover:bg-gray-100 transition-all shadow-inner hover:shadow-lg hover:-translate-y-1`}>
                            {coverPreview ? (
                                <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-4">
                                    <ImageIcon className="text-gray-300 mx-auto mb-3" size={40} />
                                    <span className="text-sm text-gray-400 font-bold">Upload Cover</span>
                                    <p className="text-xs text-gray-300 mt-1">(Tap to browse)</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                            
                            {/* Overlay on Hover */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white font-bold flex items-center gap-2"><Sparkles size={16} /> Change</span>
                            </div>
                        </label>

                        {/* Rating (Moved under cover for aesthetic balance) */}
                        <div className="mt-6 text-center">
                            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.subtext}`}>My Rating</p>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} type="button" onClick={() => setFormData({...formData, rating_overall: star})} className="hover:scale-110 transition-transform">
                                        <Star size={32} className={`transition-colors ${star <= formData.rating_overall ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: The Form Details */}
                    <div className="w-full md:w-2/3 space-y-6">
                        
                        {/* Title & Author */}
                        <div className={`p-6 rounded-3xl ${theme.surface} border ${theme.border} shadow-sm`}>
                            <div className="space-y-4">
                                <div>
                                    <label className={`text-xs font-bold ml-1 mb-1 block ${theme.subtext}`}>BOOK TITLE</label>
                                    <input required placeholder="e.g. The Great Gatsby" className={`w-full text-2xl font-serif font-bold p-3 rounded-xl bg-transparent border-b-2 border-gray-100 focus:border-blue-400 focus:bg-gray-50 outline-none transition-all placeholder-gray-300`}
                                        value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                </div>
                                <div>
                                    <label className={`text-xs font-bold ml-1 mb-1 block ${theme.subtext}`}>AUTHOR</label>
                                    <input required placeholder="e.g. F. Scott Fitzgerald" className={`w-full p-3 rounded-xl bg-transparent border-b-2 border-gray-100 focus:border-blue-400 focus:bg-gray-50 outline-none transition-all`}
                                        value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* Status & Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-2xl ${theme.surface} border ${theme.border} shadow-sm`}>
                                <label className={`text-xs font-bold mb-2 block ${theme.subtext}`}>STATUS</label>
                                <select className={`w-full p-2 bg-transparent font-bold outline-none cursor-pointer ${theme.text}`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                    <option value="Reading">📖 Currently Reading</option>
                                    <option value="Read">✅ Finished</option>
                                    <option value="Want to Read">🔖 Want to Read</option>
                                    <option value="DNF">🚫 Did Not Finish</option>
                                </select>
                            </div>
                            <div className={`p-4 rounded-2xl ${theme.surface} border ${theme.border} shadow-sm`}>
                                <label className={`text-xs font-bold mb-2 block ${theme.subtext}`}>TOTAL PAGES</label>
                                <input type="number" placeholder="0" className={`w-full p-2 bg-transparent font-bold outline-none`} value={formData.total_pages} onChange={e => setFormData({...formData, total_pages: e.target.value})} />
                            </div>
                        </div>

                        {/* Tags */}
                        {availableTags.length > 0 && (
                            <div className={`p-6 rounded-2xl ${theme.surface} border ${theme.border} shadow-sm`}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Tag size={16} className={theme.accent} />
                                    <span className="text-sm font-bold">Tags</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {availableTags.map(tag => {
                                        const isSelected = selectedTags.includes(tag.id);
                                        return (
                                            <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border-2 hover:brightness-95`}
                                                style={{ backgroundColor: isSelected ? tag.color : 'transparent', borderColor: tag.color, color: isSelected ? '#fff' : tag.color }}>
                                                {tag.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Review Area */}
                        <div className={`p-6 rounded-2xl ${theme.surface} border ${theme.border} shadow-sm`}>
                            <label className={`text-xs font-bold mb-3 block ${theme.subtext} uppercase tracking-widest`}>Your Thoughts</label>
                            <textarea className={`w-full p-4 rounded-xl bg-gray-50/50 border-none h-40 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none leading-relaxed`}
                                placeholder="How did this book make you feel? What will you remember?" value={formData.review_text} onChange={e => setFormData({...formData, review_text: e.target.value})} />
                        </div>

                        {/* Quotes */}
                        <div className={`p-6 rounded-2xl ${theme.surface} border ${theme.border} shadow-sm space-y-4`}>
                            <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-widest text-gray-400"><Quote size={14}/> Memorable Quotes</h3>
                            {quotes.map((quote, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="flex-1 relative">
                                        <div className="absolute left-3 top-3 text-gray-300 font-serif text-xl">"</div>
                                        <textarea placeholder="Enter quote here..." rows={2} className={`w-full pl-8 p-3 rounded-xl bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm italic font-serif`} value={quote} onChange={(e) => handleQuoteChange(index, e.target.value)} />
                                    </div>
                                    {quotes.length > 1 && <button type="button" onClick={() => removeQuoteField(index)} className="p-3 text-red-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"><X size={18} /></button>}
                                </div>
                            ))}
                            <button type="button" onClick={addQuoteField} className={`text-xs font-bold flex items-center gap-1 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors ${theme.accent}`}><Plus size={14} /> Add Another</button>
                        </div>

                        {/* Save Button */}
                        <div className="pt-4 pb-12">
                            <button type="submit" disabled={loading} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 ${theme.primary} ${theme.primaryText} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                {loading ? <><Loader2 className="animate-spin" size={24} /> Saving Entry...</> : <>Save to Journal <Sparkles size={20} /></>}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddBook;