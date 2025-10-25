import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revoked: {
      type: Date,
      default: null,
    },
    replacedByHash: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: false,
  },
);

/** Unique constraint on tokenHash */
RefreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
/** Inline shortcut (unique: true) -> add unique index */

/** TTL(time to live) index on expiresAt -> automcatically delete document after certain time */
/** No need to create CRON job to delete documents */
RefreshTokenSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  },
);

/** Compound index on revoked and user */
RefreshTokenSchema.index(
  {
    user: 1,
    revoked: 1,
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
