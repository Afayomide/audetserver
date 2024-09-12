import mongoose, { Document, Schema } from "mongoose";

interface IUser extends Document {
  fullname: string;
  username: string;
  email: string;
  password: string;
  resetPasswordToken?: string,
  resetPasswordExpires?: Date
}

// Define the schema for Customer
const UserSchema: Schema<IUser> = new Schema({
  fullname: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetPasswordToken:{
    type: String,
    required: false, 
  },
  resetPasswordExpires: {
    type: Date,
    required: false
  }
});

const User = mongoose.model<IUser>('Customer', UserSchema);

export default User;
