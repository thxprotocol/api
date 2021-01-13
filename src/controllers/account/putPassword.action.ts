import { Account, AccountDocument } from "../../models/Account";
import { Request, Response, NextFunction } from "express";
import { HttpError, HttpRequest } from "../../models/Error";

/**
 * @swagger
 * /account/password:
 *   put:
 *     tags:
 *       - Account
 *     description: Update current password.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         description: Email to use for login.
 *         in: body
 *         required: true
 *         type: string
 *       - name: password
 *         description: Password to use for login.
 *         in: body
 *         required: true
 *         type: string
 *       - name: confirmPassword
 *         description: Password to use for confirmation.
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect to `GET /logout`
 *          headers:
 *             Location:
 *                type: string
 *       '400':
 *         description: Bad Request. Could indicate incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const putPassword = async (req: HttpRequest, res: Response, next: NextFunction) => {
    Account.findById(req.user.sub, (err: Error, account: AccountDocument) => {
        if (err) {
            next(new HttpError(502, "Account find failed.", err));
            return;
        }
        account.password = req.body.password;
        account.save((err) => {
            if (err) {
                next(new HttpError(502, "Account save failed.", err));
                return;
            }
            res.redirect("logout");
        });
    });
};
