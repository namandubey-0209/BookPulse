import React, { useState } from 'react';
import { Eye, EyeOff, BookOpen, Users, Target } from 'lucide-react';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    favoriteGenres: []
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const genres = [
    'Fiction', 'Mystery', 'Romance', 'Science Fiction', 'Fantasy', 'Thriller',
    'Horror', 'Biography', 'History', 'Self Help', 'Business', 'Poetry',
    'Philosophy', 'Memoir', 'Adventure', 'Classics', 'Young Adult', 'Non-Fiction'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleGenreToggle = (genre) => {
    setFormData(prev => {
      const currentGenres = prev.favoriteGenres;
      const isSelected = currentGenres.includes(genre);
      
      if (isSelected) {
        return {
          ...prev,
          favoriteGenres: currentGenres.filter(g => g !== genre)
        };
      } else if (currentGenres.length < 10) {
        return {
          ...prev,
          favoriteGenres: [...currentGenres, genre]
        };
      }
      return prev;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3 || formData.username.length > 30) {
      newErrors.username = 'Username must be between 3 and 30 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage('Account created successfully! Redirecting...');
        // In a real app, you'd handle token storage and routing differently
        localStorage.setItem('token', data.token);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        setErrors({ general: data.message || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Gradient border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">BookVerse</h1>
          </div>
          <p className="text-gray-600">Start your reading journey today</p>
        </div>

        <div className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                errors.username ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Enter your username"
              maxLength={30}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                errors.email ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                  errors.password ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Favorite Genres */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favorite Genres (Optional)
            </label>
            <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">
                Select up to 10 genres you enjoy reading
              </p>
              <div className="grid grid-cols-2 gap-2">
                {genres.map((genre) => {
                  const isSelected = formData.favoriteGenres.includes(genre);
                  const isDisabled = !isSelected && formData.favoriteGenres.length >= 10;
                  
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreToggle(genre)}
                      disabled={isDisabled}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left
                        ${isSelected 
                          ? 'bg-indigo-600 text-white transform -translate-y-0.5 shadow-md' 
                          : isDisabled 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-100 hover:transform hover:-translate-y-0.5 shadow-sm'
                        }
                      `}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.favoriteGenres.length} genre{formData.favoriteGenres.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={`
              w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200
              ${isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:transform hover:-translate-y-0.5 hover:shadow-lg'
              }
            `}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          {/* Error Messages */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{successMessage}</p>
            </div>
          )}
        </div>

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Sign in
            </a>
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <BookOpen className="w-5 h-5 text-indigo-600 mb-1" />
            <p className="text-xs text-gray-600">Track Books</p>
          </div>
          <div className="flex flex-col items-center">
            <Target className="w-5 h-5 text-indigo-600 mb-1" />
            <p className="text-xs text-gray-600">Set Goals</p>
          </div>
          <div className="flex flex-col items-center">
            <Users className="w-5 h-5 text-indigo-600 mb-1" />
            <p className="text-xs text-gray-600">Connect</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;