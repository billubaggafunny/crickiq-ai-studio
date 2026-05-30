import React from 'react';
import { GoogleIcon } from '../constants';
import Header from './Header';
import CrickIQCard from './CrickIQCard';

interface HomeProps {
    onLogin: () => void;
    onGuest: () => void;
}

const Home: React.FC<HomeProps> = ({ onLogin, onGuest }) => {
    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Header />
            <div className="flex-1 flex flex-col justify-center items-center p-4 text-center">
                <CrickIQCard className="max-w-md w-full">
                    <p className="text-base md:text-lg text-text-secondary mb-6 font-bold">Your Ultimate Cricket Scorer & Analyst</p>
                    <main className="space-y-4">
                    <button
                        onClick={onLogin}
                        className="w-full bg-white text-gray-800 font-bold py-1.5 px-4 rounded-2xl shadow-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-4 transform hover:scale-105"
                        aria-label="Sign in with Google"
                    >
                        <GoogleIcon />
                        Sign in with Google
                    </button>
                    <button
                        onClick={onGuest}
                        className="w-full bg-brand-gradient text-white font-bold py-1.5 px-4 rounded-2xl shadow-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105"
                    >
                        Continue as Guest
                    </button>
                </main>

                <footer className="mt-12">
                    <p className="text-caption text-text-secondary px-4">
                        By signing in, you agree to our terms of service. Guest data is stored locally.
                    </p>
                </footer>
                </CrickIQCard>
            </div>
        </div>
    );
};

export default Home;