// controllers/authController.js
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// import { sendEmail } from '../utils/emailService.js';

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// Register new user
export const register = async (req, res) => {
    try {
        const { username, email, password, confirmPassword, firstName, lastName } = req.body;

        // Validation
        if (!username || !email || !password || !confirmPassword || !firstName || !lastName) {
            return res.status(400).json({ 
                message: 'All fields are required' 
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ 
                message: 'Passwords do not match' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters long' 
            });
        }

        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({ 
                message: 'Username must be between 3 and 30 characters' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            const field = existingUser.email === email ? 'email' : 'username';
            return res.status(400).json({ 
                message: `User with this ${field} already exists` 
            });
        }

        // Create user (password will be hashed by pre-save middleware)
        const user = new User({
            username,
            email,
            password,
            firstName,
            lastName
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
                readingGoal: user.readingGoal,
                favoriteGenres: user.favoriteGenres,
                joinDate: user.joinDate
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error registering user', 
            error: error.message 
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email and password are required' 
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Check password using the model method
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
                readingGoal: user.readingGoal,
                favoriteGenres: user.favoriteGenres,
                joinDate: user.joinDate
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error logging in', 
            error: error.message 
        });
    }
};

// Logout user (if using token blacklisting)
export const logout = async (req, res) => {
    try {
        // If you're using token blacklisting, add token to blacklist here
        // const token = req.headers.authorization?.split(' ')[1];
        // await BlacklistedToken.create({ token });

        res.json({ 
            message: 'Logged out successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error logging out', 
            error: error.message 
        });
    }
};

// Get current user
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('friends', 'username firstName lastName');

        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        res.json({
            user
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching user', 
            error: error.message 
        });
    }
};

// Refresh token
export const refreshToken = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        const token = generateToken(user._id);

        res.json({
            message: 'Token refreshed successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
                readingGoal: user.readingGoal,
                favoriteGenres: user.favoriteGenres
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error refreshing token', 
            error: error.message 
        });
    }
};

// Forgot password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                message: 'Email is required' 
            });
        }

        const user = await User.findOne({ email });
        
        if (!user) {
            // Don't reveal if email exists or not for security
            return res.json({ 
                message: 'If an account with that email exists, we have sent a password reset link' 
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        
        res.json({ 
            message: 'If an account with that email exists, we have sent a password reset link' 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error processing forgot password', 
            error: error.message 
        });
    }
};

// Reset password
export const resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({ 
                message: 'All fields are required' 
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ 
                message: 'Passwords do not match' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                message: 'Invalid or expired reset token' 
            });
        }

        // Update user (password will be hashed by pre-save middleware)
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Generate new token
        const authToken = generateToken(user._id);

        res.json({
            message: 'Password reset successfully',
            token: authToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
                readingGoal: user.readingGoal,
                favoriteGenres: user.favoriteGenres
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error resetting password', 
            error: error.message 
        });
    }
};

// Change password (for logged-in users)
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                message: 'All fields are required' 
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                message: 'New passwords do not match' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Find user
        const user = await User.findById(req.user.id);
        
        // Check current password using the model method
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ 
                message: 'Current password is incorrect' 
            });
        }

        // Update user (password will be hashed by pre-save middleware)
        user.password = newPassword;
        await user.save();

        res.json({ 
            message: 'Password changed successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error changing password', 
            error: error.message 
        });
    }
};

