import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for Comment Document (for TypeScript typing)
interface IComment extends Document {
  text: string;
  userName: string;
  musicBlogId: mongoose.Schema.Types.ObjectId;
  timestamp: Date;
}

// Comment Schema
const commentSchema: Schema<IComment> = new Schema({
  text: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  musicBlogId: {
    type: Schema.Types.ObjectId,
    ref: 'MusicBlog', 
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create and export the Comment model
const Comment: Model<IComment> = mongoose.model<IComment>('Comment', commentSchema);
export default Comment;
