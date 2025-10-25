import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

/** Unique constraint on email */
/** index collation on email -> abc@email.com and Abc@email.com will leave only one record */
UserSchema.index(
  { email: 1 },
  {
    unique: true,
    collation: {
      locale: 'en',
      strength: 2,
    },
  },
);

/** Instance method(work on document) to compare password */
UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(String(password || ''), this.passwordHash);
};

/** Static method(work on whole model) to hash password */
UserSchema.statics.hashPassword = function (password) {
  const saltRounds = 12;
  return bcrypt.hash(String(password || ''), saltRounds);
};

const User = mongoose.model('User', UserSchema);

export default User;
