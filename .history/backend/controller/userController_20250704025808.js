import User from '../models/User.js';
import UserBook from '../models/.js';
import Review from '../models/Review.js';

// Get user profile
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        
        const user = await User.findById(userId)
            .select('-password')
            .populate('friends', 'username avatar');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get reading statistics
        const currentYear = new Date().getFullYear();
        const stats = await ReadingProgress.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    createdAt: { 
                        $gte: new Date(`${currentYear}-01-01`),
                        $lt: new Date(`${currentYear + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const reviewCount = await Review.countDocuments({ user: userId });

        res.json({
            user,
            stats: {
                booksRead: stats.find(s => s._id === 'finished')?.count || 0,
                currentlyReading: stats.find(s => s._id === 'reading')?.count || 0,
                wantToRead: stats.find(s => s._id === 'want-to-read')?.count || 0,
                reviewsWritten: reviewCount
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile', error: error.message });
    }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;

        // Remove sensitive fields
        delete updates.password;
        delete updates.email;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

// Follow/unfollow user
export const toggleFollow = async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.id;

        if (followerId === followingId) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        const follower = await User.findById(followerId);
        const following = await User.findById(followingId);

        if (!following) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isFollowing = follower.friends.includes(followingId);

        if (isFollowing) {
            follower.friends.pull(followingId);
            following.friends.pull(followerId);
        } else {
            follower.friends.push(followingId);
            following.friends.push(followerId);
        }

        await follower.save();
        await following.save();

        res.json({
            message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
            isFollowing: !isFollowing
        });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling follow', error: error.message });
    }
};

// Get user's activity feed
export const getActivityFeed = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const user = await User.findById(userId);
        const friendIds = user.friends;

        // Get recent reading progress updates from friends
        const recentProgress = await ReadingProgress.find({
            user: { $in: friendIds },
            updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        })
        .populate('user', 'username avatar')
        .populate('book', 'title authors coverImage')
        .sort({ updatedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        // Get recent reviews from friends
        const recentReviews = await Review.find({
            user: { $in: friendIds },
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
        .populate('user', 'username avatar')
        .populate('book', 'title authors coverImage')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        res.json({
            recentProgress,
            recentReviews
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching activity feed', error: error.message });
    }
};