import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Star, Plus, X, Quote, Image as ImageIcon, Loader2 } from 'lucide-react';

const EditBook = () => {
    const { id } = useParams();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '', author: '', status: 'Reading', rating_overall: 0, review_text: '', total_pages: ''
    });
    const [quotes, setQuotes] = useState(['']);
    
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);


    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [existingCoverUrl, setExistingCoverUrl] = useState(null);

    useEffect(() => {
        fetchBookData();
        fetchTags();
    }, [id]);

    const fetchBookData = async () => {
        const { data: book, error } = await supabase.from('books').select('*').eq('id', id).single();
        if (error) {
            console.error(error);
            navigate('/');
            return;
        }

        setFormData({
            title: book.title,
            author: book.author,
            status: book.status,
            rating_overall: book.rating_overall,
            review_text: book.review_text || '',
            total_pages: book.total_pages
        });
        setExistingCoverUrl(book.cover_url);
        setCoverPreview(book.cover_url);

        const { data: quoteData } = await supabase.from('quotes').select('quote_text').eq('book_id', id);
        if (quoteData && quoteData.length > 0) {
            setQuotes(quoteData.map(q => q.quote_text));
        }

        const { data: tagData } = await supabase.from('book_tags').select('tag_id').eq('book_id', id);
        if (tagData) {
            setSelectedTags(tagData.map(t => t.tag_id));
        }

        setLoading(false);
    };

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

    const handleQuoteChange = (index, value) => { const newQ = [...quotes]; newQ[index] = value; setQuotes(newQ); };
    const addQuoteField = () => setQuotes([...quotes, '']);
    const removeQuoteField = (index) => setQuotes(quotes.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        let finalCoverUrl = existingCoverUrl;
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

        await supabase.from('books').update({
            ...formData,
            cover_url: finalCoverUrl,
            total_pages: parseInt(formData.total_pages) || 0,
        }).eq('id', id);

        await supabase.from('quotes').delete().eq('book_id', id);
        const validQuotes = quotes.filter(q => q.trim() !== '');
        if (validQuotes.length > 0) {
            await supabase.from('quotes').insert(validQuotes.map(q => ({
                book_id: id, user_id: user.id, quote_text: q
            })));
        }

        await supabase.from('book_tags').delete().eq('book_id', id);
        if (selectedTags.length > 0) {
            const tagInserts = selectedTags.map(tagId => ({ book_id: id, tag_id: tagId }));
            await supabase.from('book_tags').insert(tagInserts);
        }

        navigate(`/book/${id}`);
        setSaving(false);
    };

    if (loading) return <div className="p-8 text-center">Loading book data...</div>;

    return (
        <div className={`pb-24 min-h-screen ${theme.bg} ${theme.text}`}>
            <header className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className={`p-2 rounded-full ${theme.surface} border ${theme.border}`}><ChevronLeft size={20} /></button>
                <h1 className="text-2xl font-serif font-bold">Edit Entry</h1>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
                {/* Image Uploader */}
                <div className="flex justify-center">
                    <label className={`relative w-32 h-48 rounded-xl border-2 border-dashed ${theme.border} flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors`}>
                        {coverPreview ? (
                            <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <ImageIcon className="text-gray-400 mb-2" size={24} />
                                <span className="text-xs text-gray-400 font-bold text-center px-2">Change Cover</span>
                            </>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold">Change</span>
                        </div>
                    </label>
                </div>

                {/* Book Info */}
                <div className={`p-6 rounded-2xl ${theme.surface} border ${theme.border} shadow-sm space-y-4`}>
                    <input required placeholder="Title" className={`w-full p-3 rounded-xl bg-transparent border ${theme.border}`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    <input required placeholder="Author" className={`w-full p-3 rounded-xl bg-transparent border ${theme.border}`} value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
                    <div className="flex gap-4">
                        <select className={`flex-1 p-3 rounded-xl bg-transparent border ${theme.border}`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                            <option value="Reading">Reading</option><option value="Read">Read</option><option value="Want to Read">Want to Read</option><option value="DNF">DNF</option>
                        </select>
                        <input type="number" placeholder="Pages" className={`w-24 p-3 rounded-xl bg-transparent border ${theme.border}`} value={formData.total_pages} onChange={e => setFormData({...formData, total_pages: e.target.value})} />
                    </div>
                    {/* Tags */}
                    {availableTags.length > 0 && (
                        <div className="pt-2">
                            <p className={`text-xs font-bold uppercase mb-2 ${theme.subtext}`}>Tags</p>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map(tag => {
                                    const isSelected = selectedTags.includes(tag.id);
                                    return (
                                        <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all border-2`}
                                            style={{ backgroundColor: isSelected ? tag.color : 'transparent', borderColor: tag.color, color: isSelected ? '#fff' : tag.color }}>
                                            {tag.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Review */}
                <div className={`p-6 rounded-2xl ${theme.surface} border ${theme.border} shadow-sm space-y-6`}>
                    <div className="flex justify-between items-center">
                        <span>Overall Rating</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} type="button" onClick={() => setFormData({...formData, rating_overall: star})}>
                                    <Star size={24} className={star <= formData.rating_overall ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <textarea className={`w-full p-4 rounded-xl bg-transparent border ${theme.border} h-32 focus:outline-none`} placeholder="What did you think?" value={formData.review_text} onChange={e => setFormData({...formData, review_text: e.target.value})} />
                </div>

                {/* Quotes */}
                <div className={`p-6 rounded-2xl ${theme.surface} border ${theme.border} shadow-sm space-y-4`}>
                    <h3 className="font-bold flex items-center gap-2"><Quote size={18}/> Quotes</h3>
                    {quotes.map((quote, index) => (
                        <div key={index} className="flex gap-2">
                            <input placeholder="Quote..." className={`flex-1 p-3 rounded-xl bg-transparent border ${theme.border}`} value={quote} onChange={(e) => handleQuoteChange(index, e.target.value)} />
                            {quotes.length > 1 && <button type="button" onClick={() => removeQuoteField(index)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl"><X size={20} /></button>}
                        </div>
                    ))}
                    <button type="button" onClick={addQuoteField} className={`text-sm font-bold flex items-center gap-1 ${theme.accent}`}><Plus size={16} /> Add Another Quote</button>
                </div>

                <button type="submit" disabled={saving} className={`w-full py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${theme.primary} ${theme.primaryText} disabled:opacity-50`}>
                    {saving ? <><Loader2 className="animate-spin" size={20} /> Saving...</> : "Update Entry"}
                </button>
            </form>
        </div>
    );
};

export default EditBook;