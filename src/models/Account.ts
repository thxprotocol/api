import bcrypt from 'bcrypt-nodejs';
import mongoose from 'mongoose';
import { encryptString } from '../util/encrypt';

export type AccountDocument = mongoose.Document & {
    active: boolean;
    email: string;
    password: string;
    signupToken: string;
    signupTokenExpires: number;
    authenticationToken: string;
    authenticationTokenExpires: number;
    passwordResetToken: string;
    passwordResetExpires: number;
    registrationAccessTokens: string[];
    acceptTermsPrivacy: boolean;
    acceptUpdates: boolean;
    address: string;
    privateKey: string;
    tokens: AuthToken[];
    burnProofs: string[];
    memberships: string[];
    privateKeys: { [address: string]: string };
    comparePassword: Function;
};

export interface AuthToken {
    accessToken: string;
    kind: string;
}

const accountSchema = new mongoose.Schema(
    {
        active: Boolean,
        email: { type: String, unique: true },
        password: String,
        signupToken: String,
        signupTokenExpires: Date,
        authenticationToken: String,
        authenticationTokenExpires: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        registrationAccessTokens: Array,
        acceptTermsPrivacy: Boolean,
        acceptUpdates: Boolean,
        address: String,
        privateKey: String,
        tokens: Array,
        burnProofs: Array,
        memberships: Array,
        privateKeys: Map,
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

    if (account.privateKey) {
        account.privateKey = encryptString(account.privateKey, account.password);
    }

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

const comparePassword = function (candidatePassword: string) {
    try {
        const isMatch = bcrypt.compareSync(candidatePassword, this.password);
        return { isMatch };
    } catch (error) {
        return { error };
    }
};

accountSchema.methods.comparePassword = comparePassword;

export const Account = mongoose.model<AccountDocument>('Account', accountSchema);
