import { NextFunction, Response } from "express";
import { HttpRequest, HttpError } from "../../models/Error";
import { VERSION } from "../../util/secrets";
import ISolutionArtifact from "../../../src/artifacts/contracts/contracts/interfaces/ISolution.sol/ISolution.json";
import { parseLogs } from "../../util/events";

/**
 * @swagger
 * /members:
 *   post:
 *     tags:
 *       - Members
 *     description: Add a member to the asset pool
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: address
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '302':
 *          description: Redirect to `GET /members/:address`
 *          headers:
 *             Location:
 *                type: string
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
export const postMember = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const result = await req.solution.isMember(req.body.address);

        if (result) {
            next(new HttpError(400, "Address is member already."));
            return;
        }

        try {
            const tx = await (await req.solution.addMember(req.body.address)).wait();
            try {
                const events = await parseLogs(ISolutionArtifact.abi, tx.logs);
                const event = events.filter((e: { name: string }) => e && e.name === "RoleGranted")[0];
                const memberid = event.args.member;
                const address = await req.solution.getAddressByMember(memberid);

                res.redirect(`/${VERSION}/members/${address}`);
            } catch (err) {
                next(new HttpError(500, "Parse logs failed.", err));
                return;
            }
        } catch (err) {
            next(new HttpError(502, "Asset Pool addMember failed.", err));
        }
    } catch (err) {
        next(new HttpError(502, "Asset Pool isMember failed.", err));
    }
};
