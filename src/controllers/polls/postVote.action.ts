import qrcode from "qrcode";
import { HttpError } from "../../models/Error";
import { NextFunction, Request, Response } from "express";

/**
 * @swagger
 * /polls/:address/vote:
 *   post:
 *     tags:
 *       - Polls
 *     description: Get a quick response image to vote.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: address
 *         in: path
 *         required: true
 *         type: string
 *       - name: agree
 *         in: body
 *         required: true
 *         type: integer
 *     responses:
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               base64:
 *                  type: string
 *                  description: Base64 string representing function call
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postVote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                assetPoolAddress: req.header("AssetPool"),
                contractAddress: req.params.address,
                contract: "BasePoll",
                method: "vote",
                params: {
                    agree: req.body.agree,
                },
            }),
        );
        res.json({ base64 });
    } catch (err) {
        next(new HttpError(500, "QR data encoding failed.", err));
    }
};
