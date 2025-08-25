import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema(
  {
    createdAt: {
      default: Date.now,
      type: Date,
    },
    expiresAt: {
      required: true,
      type: Date,
    },
    ip: {
      default: null,
      type: String,
    },
    replacedByHash: {
      default: null,
      type: String,
    },
    revoked: {
      default: null,
      type: Date,
    },
    tokenHash: {
      required: true,
      type: String,
    },
    user: {
      ref: 'User',
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
    userAgent: {
      default: null,
      type: String,
    },
  },
  {
    timestamps: false,
  },
);

/** Unique index on tokenHash -> no duplicate tokenHash */
RefreshTokenSchema.index(
  {
    tokenHash: 1,
  },
  {
    unique: true,
  },
);
/** Inline shortcut (unique: true) -> add unique index */

/** TTL (time-to-live) index on expiresAt -> automatically deletes document after a certain time */
/** No need to create CRON Job to delete refresh tokens */
RefreshTokenSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  },
);
/** This functionality does not hinder global logout feature */

/** Compound index on user and revoked */
/** Fast query for active tokens per user */
RefreshTokenSchema.index(
  {
    revoked: 1,
    user: 1,
  },
  {},
);

/** Virtuals for quick checks (non-persistant) */

RefreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= (this.expiresAt ? this.expiresAt.getTime() : 0);
});

RefreshTokenSchema.virtual('isActive').get(function () {
  return !this.revoked && !this.isExpired;
});

const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);

export default RefreshToken;
