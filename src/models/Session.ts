import mongoose from 'mongoose';

export type SessionDocument = mongoose.Document & {
    'jti': string; // unique identifier of the token
    'kind': string; // token class name
    'format': string; // the format used for the token storage and representation
    'exp': number; // timestamp of the token's expiration
    'iat': number; // timestamp of the token's creation
    'accountId': string; // account identifier the token belongs to
    'clientId': string; // client identifier the token belongs to
    'aud': string; // array of audiences the token is intended for
    'authTime': number; // timestamp of the end-user's authentication
    'claims': object; // claims parameter (see claims in OIDC Core 1.0), rejected claims are, in addition, pushed in as an Array of Strings in the `rejected` property.
    'extra': object; // extra claims returned by the extraAccessTokenClaims helper
    'codeChallenge': string; // client provided PKCE code_challenge value
    'codeChallengeMethod': string; // client provided PKCE code_challenge_method value
    'sessionUid': string; // uid of a session this token stems from
    'expiresWithSession': boolean; // whether the token is valid when session expires
    'grantId': string; // grant identifier, tokens with the same value belong together
    'nonce': string; // random nonce from an authorization request
    'redirectUri': string; // redirect_uri value from an authorization request
    'resource': string; // granted or requested resource indicator value (auth code, device code, refresh token)
    'rotations': number; // [RefreshToken only] - number of times the refresh token was rotated
    'iiat': number; // [RefreshToken only] - the very first (initial) issued at before rotations
    'acr': string; // authentication context class reference value
    'amr': string; // - Authentication methods references
    'scope': string; // scope value from an authorization request, rejected scopes are removed from the value
    'sid': string; // session identifier the token comes from
    'x5t#S256': string; // X.509 Certificate SHA-256 Thumbprint of a certificate bound access or refresh token
    'jkt': string; // JWK SHA-256 Thumbprint (according to [RFC7638]) of a DPoP bound access or refresh token
    'gty': string; // [AccessToken, RefreshToken only] space delimited grant values, indicating the grant type(s) they originate from (implicit, authorization_code, refresh_token or device_code) the original one is always first, second is refresh_token if refreshed
    'params': object; // [DeviceCode only] an object with the authorization request parameters as requested by the client with device_authorization_endpoint
    'userCode': string; // [DeviceCode only] user code value
    'deviceInfo': object; // [DeviceCode only] an object with details about the device_authorization_endpoint request
    'inFlight': boolean; // [DeviceCode only]
    'error': string; // [DeviceCode only] - error from authnz to be returned to the polling client
    'errorDescription': string; // [DeviceCode only] - error_description from authnz to be returned to the polling client
    'policies': string; // - [InitialAccessToken, RegistrationAccessToken only] array of policies
    'request': string; // [PushedAuthorizationRequest only] Pushed Request Object value
};

const sessionSchema = new mongoose.Schema(
    {
        'jti': String,
        'kind': String,
        'format': String,
        'exp': Number,
        'iat': Number,
        'accountId': String,
        'clientId': String,
        'aud': String,
        'authTime': Number,
        'claims': Object,
        'extra': Object,
        'codeChallenge': String,
        'codeChallengeMethod': String,
        'sessionUid': String,
        'expiresWithSession': Boolean,
        'grantId': String,
        'nonce': String,
        'redirectUri': String,
        'resource': String,
        'rotations': Number,
        'iiat': Number,
        'acr': String,
        'amr': String,
        'scope': String,
        'sid': String,
        'x5t#S256S': String,
        'jkt': String,
        'gty': String,
        'params': Object,
        'userCode': String,
        'deviceInfo': Object,
        'inFlight': Boolean,
        'error': String,
        'errorDescription': String,
        'policies': String,
        'request': String,
    },
    { timestamps: true },
);
export const Session = mongoose.model<SessionDocument>('Session', sessionSchema);
