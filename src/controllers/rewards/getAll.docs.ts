/**
 * @swagger
 * /rewards/:id:
 *   get:
 *     tags:
 *       - Rewards
 *     description: Get information about a reward in the asset pool
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       '200':
 *         content: application/json
 *         schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                   description: Unique identifier of the reward.
 *                 withdrawAmount:
 *                   type: number
 *                   description: Current size of the reward
 *                 withdrawDuration:
 *                   type: number
 *                   description: Current duration of the withdraw poll
 *                 withdrawUnlockDate:
 *                     type: Date
 *                     description: Date after which the withdraw will be available
 *                 state:
 *                   type: number
 *                   description: Current state of the reward [Disabled, Enabled]
 *                 poll:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                       description: Unique identifier of the reward poll
 *                     withdrawAmount:
 *                       type: number
 *                       description: Proposed size of the reward
 *                     withdrawDuration:
 *                       type: number
 *                       description: Proposed duration of the withdraw poll
 *       '302':
 *          description: Redirect to `GET /rewards/:id`
 *          headers:
 *             Location:
 *                type: string
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '404':
 *         description: Not Found. Reward not found for this asset pool.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */
