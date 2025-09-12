import mongoose, { Document, Schema } from 'mongoose';

export interface IMatch extends Document {
  user1Id: mongoose.Types.ObjectId;
  user2Id: mongoose.Types.ObjectId;
  // Legacy field names kept for backward compatibility with existing DB indexes
  userId?: mongoose.Types.ObjectId;
  targetUserId?: mongoose.Types.ObjectId;
  matchType: 'date' | 'friends';
  status: 'active' | 'unmatched';
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema: Schema = new Schema({
  user1Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Legacy fields to satisfy existing unique index userId_1_targetUserId_1
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  matchType: {
    type: String,
    enum: ['date', 'friends'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'unmatched'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Compound index for match lookups
MatchSchema.index({ user1Id: 1, user2Id: 1 });
MatchSchema.index({ user1Id: 1, status: 1 });
MatchSchema.index({ user2Id: 1, status: 1 });
// Legacy index alignment (do not declare unique here to avoid conflicts during migration)
MatchSchema.index({ userId: 1, targetUserId: 1 });

export const Match = mongoose.model<IMatch>('Match', MatchSchema);