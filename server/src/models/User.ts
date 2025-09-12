import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  dateOfBirth?: Date;
  profilePicture?: string;
  age?: number;
  bio?: string;
  location?: {
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  photos?: string[];
  preferences?: {
    ageRange: {
      min: number;
      max: number;
    };
    maxDistance: number;
    interestedIn: 'men' | 'women' | 'both';
  };
  isVerified: boolean;
  isActive: boolean;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  dateOfBirth: {
    type: Date
  },
  profilePicture: {
    type: String
  },
  age: {
    type: Number,
    min: 13,
    max: 100
  },
  bio: {
    type: String,
    maxlength: 500
  },
  location: {
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  photos: [{
    type: String
  }],
  preferences: {
    ageRange: {
      min: {
        type: Number,
        default: 18
      },
      max: {
        type: Number,
        default: 35
      }
    },
    maxDistance: {
      type: Number,
      default: 50 // kilometers
    },
    interestedIn: {
      type: String,
      enum: ['men', 'women', 'both'],
      default: 'both'
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for location-based queries
UserSchema.index({ 'location.coordinates': '2dsphere' });

// Index for email lookup
UserSchema.index({ email: 1 });

// Index for active users
UserSchema.index({ isActive: 1, lastActive: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);