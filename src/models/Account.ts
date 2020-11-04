import bcrypt from 'bcrypt-nodejs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { encryptString } from '../util/encrypt';

export type AccountDocument = mongoose.Document & {
    email: string;
    password: string;
    passwordResetToken: string;
    passwordResetExpires: Date;
    address: string;
    privateKey: string;
    tokens: AuthToken[];
    profile: {
        firstName: string;
        lastName: string;
        gender: string;
        location: string;
        picture: string;
        burnProofs: string[];
        assetPools: string[];
    };

    comparePassword: comparePasswordFunction;
    gravatar: (size: number) => string;
};

type comparePasswordFunction = (candidatePassword: string, cb: (err: any, isMatch: any) => {}) => void;

export interface AuthToken {
    accessToken: string;
    kind: string;
}

const accountSchema = new mongoose.Schema(
    {
        email: { type: String, unique: true },
        password: String,
        passwordResetToken: String,
        passwordResetExpires: Date,
        address: String,
        privateKey: String,
        tokens: Array,
        profile: {
            firstName: String,
            lastName: String,
            gender: String,
            location: String,
            picture: String,
            burnProofs: Array,
            assetPools: Array,
        },
    },
    { timestamps: true },
);

/**
 * Password hash middleware.
 */
accountSchema.pre('save', function save(next) {
    const account = this as AccountDocument;

    if (!account.isModified('password')) {
        return next();
    }

    // Skip if the password has not been mofified. This will
    // not be the case when save is executed first time
    // Make sure to decrypt private key and encrypt again using
    // new password if still stored in db
    account.privateKey = encryptString(account.privateKey, account.password);

    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        bcrypt.hash(account.password, salt, undefined, (err: mongoose.Error, hash) => {
            if (err) {
                return next(err);
            }
            account.password = hash;
            next();
        });
    });
});

const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
        cb(err, isMatch);
    });
};

accountSchema.methods.comparePassword = comparePassword;

/**
 * Helper method for getting user's gravatar.
 */
accountSchema.methods.gravatar = function (size: number = 200) {
    if (!this.email) {
        return `https://gravatar.com/avatar/?s=${size}&d=retro`;
    }
    const md5 = crypto.createHash('md5').update(this.email).digest('hex');
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

export const Account = mongoose.model<AccountDocument>('Account', accountSchema);
