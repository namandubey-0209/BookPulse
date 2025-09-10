import mongoose from 'mongoose'
import User from '../models/User.js'
import UserBook from '../models/UserBook.js'
import Discussion from '../models/Discussion.js'

// Get user profile (public, including friends)
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id

    const user = await User.findById(userId)
      .select('-password')
      .populate('friends', 'username avatar')

    if (!user) return res.status(404).json({ message: 'User not found' })

    // Reading statistics for current year
    const currentYear = new Date().getFullYear()
    const stats = await UserBook.aggregate([
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
    ])

    // Count reviews written by this user
    const reviewCount = await Discussion.countDocuments({ user: userId })

    res.json({
      user,
      stats: {
        booksRead: stats.find(s => s._id === 'finished')?.count || 0,
        currentlyReading: stats.find(s => s._id === 'reading')?.count || 0,
        wantToRead: stats.find(s => s._id === 'want-to-read')?.count || 0,
        reviewsWritten: reviewCount
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error: error.message })
  }
}

// Update user profile (protected)
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const updates = { ...req.body }

    // Prevent sensitive fields update
    delete updates.password
    delete updates.email

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password')

    res.json({
      message: 'Profile updated successfully',
      user
    })
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message })
  }
}

// Follow/unfollow another user (protected)
export const toggleFollow = async (req, res) => {
  try {
    const followerId = req.user.id
    const followingId = req.params.id

    if (followerId === followingId)
      return res.status(400).json({ message: 'Cannot follow yourself' })

    const follower = await User.findById(followerId)
    const following = await User.findById(followingId)

    if (!following) return res.status(404).json({ message: 'User not found' })

    const isFollowing = follower.friends.includes(followingId)

    if (isFollowing) {
      follower.friends.pull(followingId)
      following.friends.pull(followerId)
    } else {
      follower.friends.push(followingId)
      following.friends.push(followerId)
    }

    await follower.save()
    await following.save()

    res.json({
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing
    })
  } catch (error) {
    res.status(500).json({ message: 'Error toggling follow', error: error.message })
  }
}

// Get user’s activity feed from friends (protected)
export const getActivityFeed = async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const friendIds = user.friends

    // Reading progress updates last 7 days from friends
    const recentProgress = await UserBook.find({
      user: { $in: friendIds },
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // last 7 days
    })
      .populate('user', 'username avatar')
      .populate('book', 'title authors coverImage')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)

    // Recent reviews from friends last 7 days
    const recentReviews = await Discussion.find({
      user: { $in: friendIds },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .populate('user', 'username avatar')
      .populate('book', 'title authors coverImage')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)

    res.json({
      recentProgress,
      recentReviews
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity feed', error: error.message })
  }
}

// Additional (optional) functions to keep controller holistic:

// Get friends list for user
export const getFriends = async (req, res) => {
  try {
    const userId = req.params.id
    const user = await User.findById(userId).populate('friends', 'username avatar')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ friends: user.friends })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching friends', error: error.message })
  }
}

// Search users by username or profile info
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.trim() === '') {
      return res.json({ users: [] })
    }

    // Case-insensitive partial match on username or name
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ],
    }).select('-password').limit(20)

    res.json({ users })
  } catch (error) {
    res.status(500).json({ message: 'Error searching users', error: error.message })
  }
}

// User stats by year (books read etc)
export const getUserStats = async (req, res) => {
  try {
    const userId = req.params.id
    const year = parseInt(req.query.year) || new Date().getFullYear()

    const stats = await UserBook.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      year,
      stats: stats.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {})
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user stats', error: error.message })
  }
}

// Reading goal (get)
export const getReadingGoal = async (req, res) => {
  try {
    const userId = req.params.id
    const user = await User.findById(userId).select('readingGoal')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ readingGoal: user.readingGoal || null })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reading goal', error: error.message })
  }
}

// Reading goal (update)
export const updateReadingGoal = async (req, res) => {
  try {
    const userId = req.user.id
    const { readingGoal } = req.body
    if (typeof readingGoal !== 'number' || readingGoal < 0) {
      return res.status(400).json({ message: 'Invalid reading goal' })
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { readingGoal },
      { new: true }
    ).select('readingGoal')
    res.json({ message: 'Reading goal updated', readingGoal: user.readingGoal })
  } catch (error) {
    res.status(500).json({ message: 'Error updating reading goal', error: error.message })
  }
}
