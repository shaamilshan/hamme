import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key') as any
    
    // Find user and attach to request
    const user = await User.findById(decoded.userId).select('-password')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key') as any
      const user = await User.findById(decoded.userId).select('-password')
      if (user) {
        req.user = user
      }
    }
    
    next()
  } catch (error) {
    // Continue without auth if token is invalid
    next()
  }
}