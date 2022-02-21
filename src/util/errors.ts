class THXError extends Error {
    message: string;

    constructor(message?: string) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    }
}

class THXHttpError extends THXError {
    status: number;
    constructor(message?: string, status?: number) {
        super(message);
        if (status) {
            this.status = status;
        }
    }
}

class BadRequestError extends THXHttpError {
    status = 400;
    message = 'Bad Request';
}

class UnauthorizedError extends THXHttpError {
    status = 401;
    constructor(message?: string) {
        super(message || 'Unauthorized');
    }
}

class ForbiddenError extends THXHttpError {
    status = 403;
    message = 'Forbidden';
}

class NotFoundError extends THXHttpError {
    status = 404;
    message = 'Not Found';
}

class InternalServerError extends THXHttpError {
    status = 500;
    message = 'Internal Server Error';
}

class NotImplementedError extends THXHttpError {
    status = 501;
    message = 'Not Implemented';
}

class BadGatewayError extends THXHttpError {
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
    THXError,
    THXHttpError,
    BadRequestError,
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
