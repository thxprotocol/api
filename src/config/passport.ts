// import passport from 'passport';
// import passportLocal from 'passport-local';
// import _ from 'lodash';

// import { Account, AccountDocument } from '../models/Account';
// import { Request, Response, NextFunction } from 'express';

// const LocalStrategy = passportLocal.Strategy;

// passport.serializeUser<any, any>((account, done) => {
//     done(undefined, account.id);
// });

// passport.deserializeUser((id, done) => {
//     Account.findById(id, (err, account) => {
//         done(err, account);
//     });
// });

// /**
//  * Sign in using Email and Password.
//  */
// passport.use(
//     new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
//         Account.findOne({ email: email.toLowerCase() }, (err, user: any) => {
//             if (err) {
//                 return done(err);
//             }
//             if (!user) {
//                 return done(undefined, false, { message: `Email ${email} not found.` });
//             }
//             user.comparePassword(password, (err: Error, isMatch: boolean) => {
//                 if (err) {
//                     return done(err);
//                 }
//                 if (isMatch) {
//                     return done(undefined, user);
//                 }
//                 return done(undefined, false, { message: 'Invalid email or password.' });
//             });
//         });
//     }),
// );

// /**
//  * OAuth Strategy Overview
//  *
//  * - User is already logged in.
//  *   - Check if there is an existing account with a provider id.
//  *     - If there is, return an error message. (Account merging not supported)
//  *     - Else link new OAuth account with currently logged-in user.
//  * - User is not logged in.
//  *   - Check if it's a returning user.
//  *     - If returning user, sign in and we are done.
//  *     - Else check if there is an existing account with user's email.
//  *       - If there is, return an error message.
//  *       - Else create a new account.
//  */

// /**
//  * Login Required middleware.
//  */
// export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
//     if (req.isAuthenticated()) {
//         return next();
//     }
//     res.status(401).end();
// };
