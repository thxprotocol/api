/**
 * @swagger
 * /promo_codes/:
 *   get:
 *     tags:
 *       - PromoCodes
 *     produces:
 *       - application/json
 *     parameters:
 *     responses:
 *       '200':
 *         description: Ok
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to make this call.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */
