import mongoose, { Document, Schema } from 'mongoose';

export interface IProfileView extends Document {
  viewerId: mongoose.Types.ObjectId;
  viewedUserId: mongoose.Types.ObjectId;
  choice: 'date' | 'friends' | 'reject';
  createdAt: Date;
}

const ProfileViewSchema: Schema = new Schema({
  viewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  choice: {
    type: String,
    enum: ['date', 'friends', 'reject'],
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate views
ProfileViewSchema.index({ viewerId: 1, viewedUserId: 1 }, { unique: true });

export const ProfileView = mongoose.model<IProfileView>('ProfileView', ProfileViewSchema);