import React from 'react';
import { Star, BookOpen, Heart, Bookmark } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ProgressBar } from './ProgressBar';

export const BookCard = ({ book, onClick }) => {
    const { theme } = useTheme();

    return (
        <div 
            onClick={onClick}
            className={`group relative ${theme.surface} rounded-2xl p-4 border ${theme.border} cursor-pointer flex gap-4 transition-all hover:-translate-y-1 hover:shadow-md`}
        >
            {/* Cover Image Area */}
            <div className={`w-24 h-36 flex-shrink-0 rounded-lg ${theme.bg} flex items-center justify-center overflow-hidden shadow-inner relative`}>
                {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                    <BookOpen className={`${theme.subtext} opacity-30`} size={32} />
                )}

                {/* Mini Badges */}
                <div className="absolute top-1 right-1 flex flex-col gap-1">
                    {book.is_favorite && (
                        <div className="bg-white/90 p-1 rounded-full shadow-sm">
                            <Heart size={12} className="text-red-500 fill-current" />
                        </div>
                    )}
                    {book.is_bookmarked && (
                        <div className="bg-white/90 p-1 rounded-full shadow-sm">
                            <Bookmark size={12} className="text-blue-500 fill-current" />
                        </div>
                    )}
                </div>
            </div>

            {/* Info Area */}
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <h3 className={`font-serif font-bold text-lg leading-tight mb-1 ${theme.text} line-clamp-2`}>
                        {book.title}
                    </h3>
                    <p className={`text-sm ${theme.subtext} mb-2 line-clamp-1`}>
                        {book.author}
                    </p>

                    {/* TAGS DISPLAY */}
                    {book.tags && book.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                            {book.tags.slice(0, 3).map(tag => (
                                <span 
                                    key={tag.id} 
                                    className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
                                    style={{
                                        color: tag.color, 
                                        borderColor: tag.color + '40', 
                                        backgroundColor: tag.color + '10'
                                    }}
                                >
                                    {tag.name}
                                </span>
                            ))}
                            {book.tags.length > 3 && (
                                <span className={`text-[10px] px-1 ${theme.subtext}`}>+{book.tags.length - 3}</span>
                            )}
                        </div>
                    )}
                    
                    <div className="flex gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <Star 
                                key={i} 
                                size={16} 
                                className={i < book.rating_overall ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} 
                            />
                        ))}
                    </div>

                    {/* Progress Bar */}
                    {book.total_pages > 0 && (
                        <ProgressBar current={book.current_page} total={book.total_pages} mini />
                    )}
                </div>

                {/* Status Badge */}
                <div className="flex justify-between items-end mt-2">
                    <span className={`text-xs px-2 py-1 rounded-md ${theme.bg} ${theme.accent}`}>
                        {book.status}
                    </span>
                </div>
            </div>
        </div>
    );
};