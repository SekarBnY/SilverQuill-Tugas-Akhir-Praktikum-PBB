import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { BookCard } from '../components/BookCard';
import { Plus, Search, Tag } from 'lucide-react';
import { Mascot } from '../components/Mascot';

const Home = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    
    const [books, setBooks] = useState([]);
    const [allTags, setAllTags] = useState([]); // For the filter bar
    const [loading, setLoading] = useState(true);
    
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All'); // Can be status OR tag ID

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // 1. Fetch User Tags for Filter Bar
        const { data: tagsData } = await supabase.from('tags').select('*').eq('user_id', user.id);
        if (tagsData) setAllTags(tagsData);

        // 2. Fetch Books with Tags Joined
        // We use a deep select to get the book_tags, then the actual tag details
        const { data: booksData, error } = await supabase
            .from('books')
            .select(`
                *,
                book_tags (
                    tags (
                        id, 
                        name, 
                        color
                    )
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching books:', error);
        else {
            // 3. Transform Data: Flatten the nested structure
            // From: book.book_tags[0].tags.name
            // To:   book.tags[0].name
            const processedBooks = booksData.map(book => ({
                ...book,
                tags: book.book_tags.map(bt => bt.tags).filter(t => t !== null)
            }));
            setBooks(processedBooks);
        }
        
        setLoading(false);
    };

    // Filter Logic
    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(search.toLowerCase()) || 
                              book.author.toLowerCase().includes(search.toLowerCase());
        
        let matchesFilter = true;

        if (filter !== 'All') {
            // Check if filter is a Status (like "Reading")
            const isStatus = ['Reading', 'Read', 'Want to Read', 'DNF'].includes(filter);
            
            if (isStatus) {
                matchesFilter = book.status === filter;
            } else {
                // Check if filter is a Tag ID
                // We check if ANY of the book's tags matches the filter ID
                matchesFilter = book.tags && book.tags.some(t => t.id === filter);
            }
        }
        
        return matchesSearch && matchesFilter;
    });

    return (
        <div className={`min-h-screen pb-24 ${theme.bg} ${theme.text}`}>
            {/* Header Area */}
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold">My Library</h1>
                    <p className={`text-sm ${theme.subtext}`}>Welcome back, Traveler.</p>
                </div>
                <div className="md:hidden">
                    <Mascot mood="happy" size={48} />
                </div>
            </header>

            {/* Search & Filter Bar */}
            <div className="space-y-4 mb-8">
                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar items-center">
                    {['All', 'Reading', 'Read', 'Want to Read', 'DNF'].map(status => (
                        <button 
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                                filter === status 
                                    ? `${theme.primary} ${theme.primaryText} border-transparent` 
                                    : `${theme.surface} ${theme.text} ${theme.border}`
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                    
                    {/* Separator for Tags */}
                    {allTags.length > 0 && <div className={`w-px h-6 ${theme.border} border-r mx-1`}></div>}

                    {/* Custom Tags Filters */}
                    {allTags.map(tag => {
                        const isActive = filter === tag.id;
                        return (
                            <button 
                                key={tag.id}
                                onClick={() => setFilter(tag.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1`}
                                style={{
                                    backgroundColor: isActive ? tag.color : 'transparent',
                                    borderColor: tag.color,
                                    color: isActive ? '#fff' : tag.color
                                }}
                            >
                                <Tag size={10} /> {tag.name}
                            </button>
                        );
                    })}
                </div>

                {/* Search Input */}
                <div className="relative">
                    <Search className={`absolute left-3 top-3 ${theme.subtext}`} size={18} />
                    <input 
                        type="text" 
                        placeholder="Search title or author..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none border focus:ring-2 ${theme.surface} ${theme.border} ${theme.text}`}
                    />
                </div>
            </div>

            {/* Book Grid */}
            {loading ? (
                <div className="text-center py-20">Loading your library...</div>
            ) : filteredBooks.length === 0 ? (
                // Empty State
                <div className="text-center py-12 flex flex-col items-center">
                    <Mascot mood="reading" size={120} className="mb-6" />
                    <h3 className="text-lg font-bold mb-2">
                        {filter === 'All' ? "Your shelves are empty" : "No books match this filter"}
                    </h3>
                    <p className={`mb-6 max-w-xs ${theme.subtext}`}>
                        "Every empty shelf is just a story waiting to happen."
                    </p>
                    {filter === 'All' && (
                        <button 
                            onClick={() => navigate('/add')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-transform active:scale-95 ${theme.primary} ${theme.primaryText}`}
                        >
                            <Plus size={20} /> Log your first book
                        </button>
                    )}
                </div>
            ) : (
                // The Grid
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBooks.map(book => (
                        <BookCard 
                            key={book.id} 
                            book={book} 
                            onClick={() => navigate(`/book/${book.id}`)} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Home;