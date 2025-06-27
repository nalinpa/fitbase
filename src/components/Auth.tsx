import React, { useState, FormEvent, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { cloudFunctionsService } from '../services/cloudFunctionsService';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Spinner from './ui/Spinner';


function Auth() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
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
    setShowForgotPassword(false);
    setError('');
    setSuccess('');
  }, [location.pathname]);

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in with Firebase Auth directly
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      } else {
        // Use Cloud Function to create user
        try {
          await cloudFunctionsService.createUser(email, password);
          
          // Then sign them in with Firebase Auth
          await signInWithEmailAndPassword(auth, email, password);
          navigate('/dashboard');
        } catch (backendError: any) {
          console.error("Cloud Function error:", backendError);
          
          // Handle Cloud Function specific errors
          if (backendError.code) {
            switch (backendError.code) {
              case 'already-exists':
              case 'auth/email-already-exists':
                setError('Email is already registered');
                break;
              case 'invalid-argument':
                setError(backendError.message || 'Invalid email or password format');
                break;
              case 'unauthenticated':
                setError('Authentication failed');
                break;
              default:
                setError(backendError.message || 'Failed to create account');
            }
          } else {
            setError(backendError.message || 'Failed to create account');
          }
          throw backendError; // Re-throw to prevent further execution
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      
      // Only handle Firebase Auth errors if we haven't already set an error from Cloud Functions
      if (!error) {
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
            if (!error) { // Only set if we haven't already set an error
              setError(err.message || 'An error occurred. Please try again.');
            }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await cloudFunctionsService.initiatePasswordReset(email);
      setSuccess('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
    } catch (err: any) {
      console.error("Password reset error:", err);
      
      if (err.code === 'not-found') {
        setError('No account found with this email address');
      } else if (err.code === 'invalid-argument') {
        setError('Please enter a valid email address');
      } else {
        setError(err.message || 'Failed to send password reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
    setShowForgotPassword(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md px-4">
      <div className="w-full text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          {showForgotPassword ? 'Reset your password' : 
           isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>
        {!showForgotPassword && (
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <button 
              onClick={() => {
                navigate(isLogin ? '/register' : '/login');
                resetForm();
              }} 
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {isLogin ? 'create an account' : 'sign in instead'}
            </button>
          </p>
        )}
      </div>

      <div className="w-full p-8 mt-8 space-y-6 bg-white rounded-lg shadow-md">
        <form className="space-y-6" onSubmit={showForgotPassword ? handleForgotPassword : handleAuth}>
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-700 bg-green-100 border border-green-300 rounded-md">
              {success}
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

            {!showForgotPassword && (
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
            )}
          </div>

          <div>
            <Button 
              type="submit"
              disabled={loading}
              className="relative w-full justify-center py-3 mt-4 font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Spinner size="lg" color="white" />
                </span>
              )}
              {showForgotPassword ? 'Send Reset Email' : 
               isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </div>

          {/* Forgot Password and Back Links */}
          <div className="text-center">
            {isLogin && !showForgotPassword && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
                </button>
            )}
            {showForgotPassword && (
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                  setSuccess('');
                }}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Back to sign in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default Auth;