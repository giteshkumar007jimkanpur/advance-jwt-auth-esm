/**
 * User Model: name, email, passwordHash
 */

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      lowercase: true,
      required: true,
      trim: true,
      type: String,
    },
    name: {
      default: '',
      trim: true,
      type: String,
    },
    passwordHash: {
      required: true,
      select: false,
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

/** Unique contraint on email */
/** index collation on email -> abc@email.com and Abc@email.com will consume one document */
UserSchema.index(
  { email: 1 },
  {
    collation: {
      locale: 'en',
      strength: 2,
    },
    unique: true,
  },
);

/** Instance method to compare password */
UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(String(password || ''), this.passwordHash);
};

/** Static method to hash password */
UserSchema.statics.hashPassword = function (password) {
  const saltRounds = 12;
  return bcrypt.hash(String(password || ''), saltRounds);
};

const User = mongoose.model('User', UserSchema);

export default User;
