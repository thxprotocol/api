import { check } from "express-validator";
import { confirmPassword } from "../../util/validation";

export const validations = {
    putPassword: [
        check("password", "Password must be at least 4 characters long").isLength({ min: 4 }),
        confirmPassword,
    ],
};
