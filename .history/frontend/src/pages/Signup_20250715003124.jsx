import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleGenre = (genre) => {
    setFormData((prev) => {
      const selected = prev.favoriteGenres.includes(genre);
      if (selected) {
        return { ...prev, favoriteGenres: prev.favoriteGenres.filter((g) => g !== genre) };
      } else if (prev.favoriteGenres.length < 10) {
        return { ...prev, favoriteGenres: [...prev.favoriteGenres, genre] };
      }
      return prev;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const res = await axios.post('/api/auth/register', formData);
      setSuccessMessage('Account created successfully! Redirecting...');
      localStorage.setItem('token', res.data.token);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Registration failed' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timeout = setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [successMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">BookVerse</h1>
          </div>
          <p className="text-gray-600">Start your reading journey today</p>
        </div>

        <div className="space-y-5">
          {['username', 'email'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {field}
              </label>
              <input
                name={field}
                type={field === 'email' ? 'email' : 'text'}
                value={formData[field]}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-indigo-500 ${
                  errors[field] ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors[field] && <p className="text-red-500 text-sm">{errors[field]}</p>}
            </div>
          ))}

          {/* Password */}
          {['password', 'confirmPassword'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {field.replace('Password', ' Password')}
              </label>
              <div className="relative">
                <input
                  type={
                    field === 'password' ? (showPassword ? 'text' : 'password') : (showConfirmPassword ? 'text' : 'password')
                  }
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-10 border-2 rounded-xl focus:ring-indigo-500 ${
                    errors[field] ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() =>
                    field === 'password'
                      ? setShowPassword((s) => !s)
                      : setShowConfirmPassword((s) => !s)
                  }
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {(field === 'password' ? showPassword : showConfirmPassword) ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors[field] && <p className="text-red-500 text-sm">{errors[field]}</p>}
            </div>
          ))}

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favorite Genres (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 border border-gray-200 p-3 rounded-xl">
              {genres.map((genre) => {
                const selected = formData.favoriteGenres.includes(genre);
                const disabled = !selected && formData.favoriteGenres.length >= 10;
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    disabled={disabled}
                    className={`px-3 py-2 rounded text-sm ${
                      selected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : disabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
              <p className="col-span-2 text-xs text-gray-500 mt-2">
                {formData.favoriteGenres.length} genre{formData.favoriteGenres.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full py-3 rounded-xl text-white font-semibold ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
            }`}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          {errors.general && (
            <div className="p-3 bg-red-100 text-red-700 rounded">{errors.general}</div>
          )}
          {successMessage && (
            <div className="p-3 bg-green-100 text-green-700 rounded">{successMessage}</div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 hover:underline">
              Sign in
            </a>
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-6 text-center text-sm text-gray-600">
          <div><BookOpen className="mx-auto text-indigo-600" size={20} />Track Books</div>
          <div><Target className="mx-auto text-indigo-600" size={20} />Set Goals</div>
          <div><Users className="mx-auto text-indigo-600" size={20} />Connect</div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
