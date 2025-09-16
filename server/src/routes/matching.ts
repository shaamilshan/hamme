import express, { Request, Response } from 'express'
import { User } from '../models/User'
import { ProfileView } from '../models/ProfileView'
import { Match } from '../models/Match'
import { authenticateToken, optionalAuth } from '../middleware/auth'

const router = express.Router()

// Get public profile by user ID (for shared links)
router.get('/public/:userId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user?._id
    
    const user = await User.findById(userId).select('-password -email')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      })
    }

    // Compute age from dateOfBirth if not present
    let computedAge: number | undefined = user.age
    if (!computedAge && user.dateOfBirth) {
      const today = new Date()
      const dobDate = new Date(user.dateOfBirth)
      let a = today.getFullYear() - dobDate.getFullYear()
      const monthDiff = today.getMonth() - dobDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        a--
      }
      computedAge = a
    }

    // Check if current user has already voted for this profile
    let existingVote = null
    if (currentUserId) {
      const profileView = await ProfileView.findOne({
        viewerId: currentUserId,
        viewedUserId: userId
      })
      
      if (profileView) {
        // Check if vote is still valid (within 24 hours)
        const voteAge = Date.now() - profileView.createdAt.getTime()
        const twentyFourHours = 24 * 60 * 60 * 1000
        
        if (voteAge < twentyFourHours) {
          existingVote = {
            choice: profileView.choice,
            votedAt: profileView.createdAt,
            expiresAt: new Date(profileView.createdAt.getTime() + twentyFourHours)
          }
        }
      }
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        age: computedAge,
        profilePicture: user.profilePicture,
        bio: user.bio
      },
      existingVote
    })

  } catch (error) {
    console.error('Error fetching public profile:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Submit choice for a profile (requires authentication)
router.post('/choice', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { targetUserId, choice } = req.body
    const viewerId = req.user._id

    if (!targetUserId || !choice) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID and choice are required'
      })
    }

    if (!['date', 'friends', 'reject'].includes(choice)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid choice. Must be date, friends, or reject'
      })
    }

    // Don't allow viewing own profile
    if (viewerId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot interact with your own profile'
      })
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId)
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      })
    }

    // Create or update profile view
    await ProfileView.findOneAndUpdate(
      { viewerId, viewedUserId: targetUserId },
      { choice },
      { upsert: true }
    )

    let matchResult = null

    // If not reject, check for mutual match
    if (choice !== 'reject') {
      const reciprocalView = await ProfileView.findOne({
        viewerId: targetUserId,
        viewedUserId: viewerId,
        choice: choice // Same choice type
      })

      if (reciprocalView) {
        // Create match if both chose the same option
        const existingMatch = await Match.findOne({
          $or: [
            { user1Id: viewerId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: viewerId }
          ],
          status: 'active'
        })

        if (!existingMatch) {
          const newMatch = new Match({
            user1Id: viewerId,
            user2Id: targetUserId,
            // Populate legacy fields for compatibility with existing DB index
            userId: viewerId,
            targetUserId: targetUserId,
            matchType: choice
          })
          
          await newMatch.save()
          
          matchResult = {
            matched: true,
            matchType: choice,
            matchId: newMatch._id
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Choice "${choice}" recorded successfully`,
      match: matchResult
    })

  } catch (error) {
    console.error('Error submitting choice:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get pending profile views (profiles that viewed current user)
router.get('/pending', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user._id

    // Find users who viewed current user but haven't been responded to
    const pendingViews = await ProfileView.find({
      viewedUserId: userId,
      choice: { $ne: 'reject' }
    }).populate('viewerId', '-password -email')

    // Filter out users current user has already responded to
    const respondedToUsers = await ProfileView.find({
      viewerId: userId
    }).select('viewedUserId')

    const respondedIds = respondedToUsers.map(r => r.viewedUserId.toString())
    
    const pendingProfiles = pendingViews.filter(view => 
      !respondedIds.includes(view.viewerId._id.toString())
    )

    res.json({
      success: true,
      profiles: pendingProfiles.map(view => ({
        user: view.viewerId,
        choice: view.choice,
        viewedAt: view.createdAt
      }))
    })

  } catch (error) {
    console.error('Error fetching pending views:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get user's matches (expire after 24 hours)
router.get('/matches', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user._id

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Expire old matches (best-effort)
    await Match.updateMany(
      {
        $or: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: 'active',
        createdAt: { $lt: cutoff }
      },
      { $set: { status: 'unmatched' } }
    )

    // Fetch active, non-expired matches
    const matches = await Match.find({
      $or: [
        { user1Id: userId },
        { user2Id: userId }
      ],
      status: 'active',
      createdAt: { $gte: cutoff }
    }).populate('user1Id user2Id', '-password -email')

    const formattedMatches = matches.map(match => {
      const otherUser = match.user1Id._id.toString() === userId.toString() 
        ? match.user2Id 
        : match.user1Id

      return {
        matchId: match._id,
        user: otherUser,
        matchType: match.matchType,
        createdAt: match.createdAt
      }
    })

    res.json({
      success: true,
      matches: formattedMatches
    })

  } catch (error) {
    console.error('Error fetching matches:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

export default router