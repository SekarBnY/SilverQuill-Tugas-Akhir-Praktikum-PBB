import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mascot } from '../components/Mascot';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false); // Toggle state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (isSignUp) {
            // REGISTER Logic
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) {
                alert("Sign up failed: " + error.message);
            } else {
                alert("Account created! You are now logged in.");
                navigate('/');
            }
        } else {
            // LOGIN Logic
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                alert("Login failed: " + error.message);
            } else {
                navigate('/');
            }
        }
        setLoading(false);
    };

    const handleGuestLogin = async () => {
        setLoading(true);
        
        // 1. Try the standard Guest Login
        const { error } = await supabase.auth.signInAnonymously();
        
        if (error) {
            console.warn("Standard Guest Login failed. Attempting Stealth Mode...", error);
            
            // 2. FALLBACK: Create a "Stealth" Email Account automatically
            // This creates a unique fake user so you can still enter without typing.
            const uniqueId = Date.now();
            const fakeEmail = `guest_${uniqueId}@silverquill.temp`;
            const fakePassword = `guest_pass_${uniqueId}`;

            const { error: stealthError } = await supabase.auth.signUp({
                email: fakeEmail,
                password: fakePassword,
            });

            if (stealthError) {
                alert("Login system unavailable. Please create an account manually.");
            } else {
                // Success!
                navigate('/');
            }
        } else {
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-slate-100">
                
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <Mascot mood="happy" size={80} className="mb-4" />
                    <h1 className="text-3xl font-serif font-bold text-slate-800">SilverQuill</h1>
                    <p className="text-slate-500 text-sm">Your reading journey begins here.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button 
                        onClick={() => setIsSignUp(false)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Log In
                    </button>
                    <button 
                        onClick={() => setIsSignUp(true)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Sign Up
                    </button>
                </div>
                
                {/* Form */}
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Email</label>
                        <input 
                            type="email" 
                            required 
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={email} 
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Password</label>
                        <input 
                            type="password" 
                            required 
                            placeholder="Min. 6 characters"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={password} 
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 px-4 bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50 mt-2"
                    >
                        {loading ? "Processing..." : (isSignUp ? "Create Account" : "Welcome Back")}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Or</span></div>
                </div>

                {/* Guest Button */}
                <button 
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="w-full py-2 text-sm text-slate-500 font-medium hover:text-slate-800 transition-colors"
                >
                    Continue as Guest
                </button>
            </div>
        </div>
    );
};

export default Login;