import bcrypt from 'bcrypt-nodejs';
import mongoose, { Schema } from 'mongoose';
import { NetworkProvider } from '../util/network';
import { encryptString } from '../util/encrypt';

export interface IAccount {
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
    erc20: ERC20Token[];
    burnProofs: string[];
    memberships: string[];
    privateKeys: { [address: string]: string };
    comparePassword: Function;
    recoveryPhrase: string;
}

export interface IAccountUpdates {
    acceptTermsPrivacy?: boolean;
    acceptUpdates?: boolean;
}

export type AccountDocument = mongoose.Document & IAccount;

export interface ERC20Token {
    network: NetworkProvider;
    address: string;
}

export interface AuthToken {
    accessToken: string;
    kind: string;
}

const ERC20TokenSchema = new Schema({ network: Number, address: String });
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
        registrationAccessTokens: [String],
        acceptTermsPrivacy: Boolean,
        acceptUpdates: Boolean,
        address: String,
        privateKey: String,
        tokens: [String],
        erc20: [ERC20TokenSchema],
        burnProofs: [String],
        memberships: [String],
        privateKeys: Map,
        recoveryPhrase: String,
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
