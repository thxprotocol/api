import async from "async";
import nodemailer from "nodemailer";
import { Account, AccountDocument } from "../../models/Account";
import { Request, Response, NextFunction } from "express";
import { HttpError } from "../../models/Error";

/**
 * @swagger
 * /reset/:token:
 *   post:
 *     tags:
 *       - Authentication
 *     description: Resets your password based on token in url.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         in: body
 *         required: true
 *         type: string
 *       - name: password
 *         in: body
 *         required: true
 *         type: string
 *       - name: confirmPassword
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Password reset token is invalid or has expired.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postReset = async (req: Request, res: Response, next: NextFunction) => {
    async.waterfall(
        [
            function resetPassword(done: Function) {
                Account.findOne({ passwordResetToken: req.params.token })
                    .where("passwordResetExpires")
                    .gt(Date.now())
                    .exec((err: Error, account: AccountDocument) => {
                        if (err) {
                            next(new HttpError(502, "Account find passwordResetExpires failed.", err));
                            return;
                        }
                        if (!account) {
                            next(new HttpError(403, "Password reset token is invalid or has expired.", err));
                            return;
                        }
                        account.password = req.body.password;
                        account.passwordResetToken = undefined;
                        account.passwordResetExpires = undefined;
                        account.save((err: Error) => {
                            if (err) {
                                next(new HttpError(502, "Account save failed.", err));
                                return;
                            }
                            done(err, account);
                        });
                    });
            },
            function sendResetPasswordEmail(account: AccountDocument, done: Function) {
                const transporter = nodemailer.createTransport({
                    service: "SendGrid",
                    auth: {
                        user: process.env.SENDGRID_USER,
                        pass: process.env.SENDGRID_PASSWORD,
                    },
                });
                const mailOptions = {
                    to: account.email,
                    from: "peter@thxprotocol.com",
                    subject: "Your password has been changed",
                    text: `Hello,\n\nThis is a confirmation that the password for your account ${account.email} has just been changed.\n`,
                };
                transporter.sendMail(mailOptions, (err) => {
                    res.json({ message: "Success! Your password has been changed." });
                    done(err);
                });
            },
        ],
        (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect("/");
        },
    );
};
