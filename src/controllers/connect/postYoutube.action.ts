import { NextFunction, Request, Response } from 'express';

export async function postYoutube(req: Request, res: Response, next: NextFunction) {
    // Get the account by sub
    // Get googleAccessToken from payload
    // PATCH account with googleAccessToken and googleAccessTokenExpires (in body)
    // If no googleAccessToken token is there or expired
    // Build auth url in client
}
