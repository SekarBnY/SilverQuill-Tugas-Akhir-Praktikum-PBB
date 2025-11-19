import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Navigation } from './components/Navigation';

// Import Pages
import Home from './pages/Home';
import AddBook from './pages/AddBook';
import Saved from './pages/Saved';
import Profile from './pages/Profile';
import BookDetail from './pages/BookDetail';
import Login from './pages/Login';
import Wishlist from './pages/Wishlist';
import Quotes from './pages/Quotes';
import EditBook from './pages/EditBook'; // <--- Ensure this file exists

// Layout Component: Wraps pages with the Theme and Navigation
const Layout = ({ children }) => {
    const { theme } = useTheme();
    
    // Safety check to prevent crash before theme loads
    if (!theme) return <div className="p-4">Loading Theme...</div>;

    return (
        <div className={`min-h-screen flex flex-col md:flex-row ${theme.bg} transition-colors duration-500`}>
            <Navigation />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen w-full">
                <div className="max-w-4xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

function App() {
  return (
    <BrowserRouter>
        <ThemeProvider>
            <Layout>
                <Routes>
                    {/* Login Route */}
                    <Route path="/login" element={<Login />} />
                    
                    {/* Main Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/add" element={<AddBook />} />
                    <Route path="/saved" element={<Saved />} />
                    <Route path="/profile" element={<Profile />} />
                    
                    {/* Detail & Edit Routes */}
                    <Route path="/book/:id" element={<BookDetail />} />
                    <Route path="/edit/:id" element={<EditBook />} />
                    
                    {/* Collection Routes */}
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/quotes" element={<Quotes />} />
                </Routes>
            </Layout>
        </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;