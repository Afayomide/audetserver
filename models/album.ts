import { Schema, model, Document, Types } from 'mongoose';

// Interface for Album Document
interface Album extends Document {
  title: string;
  artist: string;
  cover: string;
  releaseDate: Date;
  coverImage: string; // URL to the album cover image
  songs: Types.ObjectId[]; // Array of Song IDs
  genre: string;
  description: string;
  latest: boolean;
  trending: boolean
}

const albumSchema = new Schema<Album>({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  cover: {type: String, required: true},
  releaseDate: { type: Date, default: Date.now },
  coverImage: { type: String, required: true },
  songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }], // Array of Song references
  genre: { type: String, required: true },
  description: {type: String, required: true},
  latest:{type: Boolean, default: true},
  trending: {type: Boolean, default: false},
}, {
  timestamps: true,
});

const Album = model<Album>('Album', albumSchema);

export default Album;
