/**
 * @swagger
 * /relay/upgrade_address:
 *   post:
 *     tags:
 *       - RelayHub
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: newAddress
 *         in: body
 *         required: true
 *         type: string
 *       - name: call
 *         in: body
 *         required: true
 *         type: string
 *       - name: nonce
 *         in: body
 *         required: true
 *         type: string
 *       - name: sig
 *         in: body
 *         required: true
 *         type: string
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
