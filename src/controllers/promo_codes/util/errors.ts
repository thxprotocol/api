class BaseError extends Error {
    status: number;
    message: string;

    constructor(message?: string) {
        super();
        this.message = message || this.message;
    }
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

export { BaseError, UnauthorizedError, ForbiddenError, NotFoundError };
