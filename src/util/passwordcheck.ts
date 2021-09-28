export const checkPasswordStrength = (password: string) => {
    let strongPassword = new RegExp('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})');
    let mediumPassword = new RegExp(
        '((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{6,}))|((?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}))',
    );
    if (strongPassword.test(password)) {
        return 'strong';
    } else if (mediumPassword.test(password)) {
        return 'medium';
    } else {
        return 'weak';
    }
};
