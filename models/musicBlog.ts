import mongoose from "mongoose"
// Interface for Song Document
export interface musicBlog {
  title: string;
  artist: string;
  type: string;
  blogTitle: string;
  featuredArtists: string;
  cover: string
  duration: string; // duration in seconds
  // album: mongoose.Types.ObjectId; // Reference to Album
  album: string;
  genre: string;
  releaseDate: string;
  plays: number;
  description: string[];  
  highlights: string[];
  latest: boolean;
  trending: boolean;
  musicFilePath: string;
}

const musicBlogSchema = new mongoose.Schema<musicBlog>({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  type: {type: String, required: true},
  blogTitle: {type: String, required: true},
  featuredArtists: {type:String, required: false},
  cover: {type: String, required: true},
  duration: { type: String, required: false }, // In seconds
  // album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' }, // Reference to Album
  album: { type: String, ref: 'Album' },
  genre: { type: String, required: true },
  // releaseDate: { type: Date, default: Date.now },
  releaseDate: { type: String },
  plays: { type: Number, default: 0 },
  description: {type: [String], required: true} ,
  highlights: {type: [String], required: false} ,
  latest:{type: Boolean, default: true},
  trending: {type: Boolean, default: true},
  musicFilePath: { type: String, required: false }, // Store the path or URL to the music file

}, {
  timestamps: true,
}
  
);

// export default mongoose.model<Song>('Song', songSchema);
const MusicBlog = mongoose.model<musicBlog>('MusicBlog', musicBlogSchema);

export default MusicBlog;
