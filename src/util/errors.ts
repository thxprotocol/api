class BaseError extends Error {
    status: number;
    message: string;
}

class BadRequestError extends BaseError {
    status = 400;
    message = 'Bad Request';
}

class UnauthorizedError extends BaseError {
    status = 401;
    message = 'Unauthorized';
}

class ForbiddenError extends BaseError {
    status = 403;
    message = 'Forbidden';
}

class NotFoundError extends BaseError {
    status = 404;
    message = 'Not Found';
}

class InternalServerError extends BaseError {
    status = 500;
    message = 'Internal Server Error';
}

class NotImplementedError extends BaseError {
    status = 501;
    message = 'Not Implemented';
}

class BadGatewayError extends BaseError {
    status = 502;
    message = 'Bad Gateway';
}

class PromoCodeNotFoundError extends NotFoundError {
    message = 'Could not find this promo code';
}

class SubjectUnauthorizedError extends ForbiddenError {
    message = 'Not authorized for subject of access token';
}

class AudienceForbiddenError extends UnauthorizedError {
    message = 'Forbidden for audience of access token';
}

class AmountExceedsAllowanceError extends BadRequestError {
    message = 'Transfer amount exceeds allowance';
}

class InsufficientBalanceError extends BadRequestError {
    message = 'Transfer amount exceeds balance';
}

class TokenPaymentFailedError extends InternalServerError {
    message = 'Transfer did not succeed';
}
class GetPastTransferEventsError extends InternalServerError {
    message = 'GetPastEvents for Transfer event failed in callback.';
}
class GetPastWithdrawnEventsError extends InternalServerError {
    message = 'GetPastEvents for Withdrawn event failed in callback.';
}

class DuplicateEmailError extends BadRequestError {
    message = 'An account with this e-mail address already exists.';
}

export {
    BaseError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    NotImplementedError,
    BadGatewayError,
    PromoCodeNotFoundError,
    SubjectUnauthorizedError,
    AudienceForbiddenError,
    AmountExceedsAllowanceError,
    InsufficientBalanceError,
    TokenPaymentFailedError,
    GetPastTransferEventsError,
    GetPastWithdrawnEventsError,
    DuplicateEmailError,
};
