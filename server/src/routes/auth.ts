import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'

const router = express.Router()

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    })

    await newUser.save()

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        dateOfBirth: newUser.dateOfBirth,
        profilePicture: newUser.profilePicture,
        createdAt: newUser.createdAt
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      })
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Update last active
    user.lastActive = new Date()
    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        profilePicture: user.profilePicture,
        // Removed age field which might not be calculated
        lastActive: user.lastActive
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Logout user (client-side implementation, just for consistency)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  })
})

export default router