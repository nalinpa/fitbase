import React, { useState, FormEvent, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { isAxiosError } from 'axios';
import { useLocation, useNavigate } from 'react-router-dom'; 

import apiClient from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';

const CREATE_USER_ENDPOINT = "/createUser";

interface ErrorResponse { error: string; }

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

function Auth() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate(); 
  const location = useLocation();
  const auth = getAuth();

  useEffect(() => {
    if (location.pathname === '/register') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [location.pathname]);

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in with Firebase Auth directly
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      } else {
        // First create user in our backend (this creates the Firestore document)
        try {
          await apiClient.post(CREATE_USER_ENDPOINT, { email, password });
          
          // Then sign them in with Firebase Auth
          await signInWithEmailAndPassword(auth, email, password);
          navigate('/dashboard');
        } catch (backendError: any) {
          if (isAxiosError(backendError)) {
            throw new Error(backendError.response?.data?.error || 'Failed to create account');
          }
          throw backendError;
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      
      // Handle Firebase Auth errors
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/email-already-in-use':
          setError('Email is already registered');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection');
          break;
        default:
          setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md px-4">
      <div className="w-full text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{' '}
          <button 
            onClick={() => navigate(isLogin ? '/register' : '/login')} 
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isLogin ? 'create an account' : 'sign in instead'}
          </button>
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full p-8 mt-8 space-y-6 bg-white rounded-lg shadow-md">
        <form className="space-y-6" onSubmit={handleAuth}>
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={isLogin ? "Enter your password" : "Choose a password (min 6 characters)"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <Button 
              type="submit"
              disabled={loading}
              className="relative w-full justify-center py-3 mt-4 font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Spinner />
                </span>
              )}
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Auth;