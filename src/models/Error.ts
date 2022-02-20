export class HttpError extends Error {
    status: number;
    rootError: Error;

    constructor(status: number, message: string, error: Error = null) {
        super(message);

        this.rootError = error;
        this.status = status;
    }
}
