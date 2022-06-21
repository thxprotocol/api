import { TReward } from '@/models/Reward';

export function addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60000);
}

export function minusMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() - minutes * 60000);
}

export function formatDate(date: Date) {
    const yyyy = date.getFullYear();
    let mm: any = date.getMonth() + 1; // Months start at 0!
    let dd: any = date.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    return yyyy + '-' + mm + '-' + dd;
}

export function getRewardConfiguration(slug: RewardSlug) {
    switch (slug) {
        case 'no-limit-and-claim-one-disabled': {
            return {
                title: 'No limit and claim one disabled',
                slug: 'no-limit-and-claim-one-disabled',
                withdrawAmount: 1,
                withdrawLimit: 0,
                withdrawDuration: 0,
                isClaimOnce: false,
                isMembershipRequired: false,
            };
        }
        case 'one-limit-and-claim-one-disabled': {
            return {
                title: '1 limit and claim one disabled',
                slug: 'one-limit-and-claim-one-disabled',
                withdrawAmount: 1,
                withdrawDuration: 0,
                withdrawLimit: 1,
                isClaimOnce: false,
                isMembershipRequired: false,
            };
        }
        case 'withdraw-date-is-today': {
            return {
                title: 'Withdraw date is today',
                slug: 'withdraw-date-is-today',
                withdrawAmount: 1,
                withdrawDuration: 0,
                withdrawLimit: 0,
                withdrawUnlockDate: formatDate(new Date()),
                isClaimOnce: false,
                isMembershipRequired: false,
            };
        }
        case 'withdraw-date-is-tomorrow': {
            return {
                title: 'Withdraw date is tomorrow',
                slug: 'withdraw-date-is-tomorrow',
                withdrawAmount: 1,
                withdrawDuration: 0,
                withdrawLimit: 0,
                withdrawUnlockDate: formatDate(addMinutes(new Date(), 24 * 60)),
                isClaimOnce: false,
                isMembershipRequired: false,
            };
        }
        case 'expiration-date-is-today': {
            return {
                title: 'Expiration date is today',
                slug: 'expiration-date-is-today',
                withdrawAmount: 1,
                withdrawDuration: 0,
                withdrawLimit: 0,
                withdrawUnlockDate: new Date(),
                isClaimOnce: false,
                isMembershipRequired: false,
                expiryDate: new Date(),
            };
        }
        case 'expiration-date-is-tomorrow': {
            return {
                title: 'Expiration date is tomorrow',
                slug: 'expiration-date-is-tomorrow',
                withdrawAmount: 1,
                withdrawDuration: 0,
                withdrawLimit: 0,
                withdrawUnlockDate: new Date(),
                isClaimOnce: false,
                isMembershipRequired: false,
                expiryDate: addMinutes(new Date(), 24 * 60),
            };
        }
        case 'membership-is-required': {
            return {
                title: 'Membership is required',
                slug: 'membership-is-required',
                withdrawAmount: 1,
                withdrawDuration: 0,
                withdrawLimit: 0,
                withdrawUnlockDate: new Date(),
                isClaimOnce: false,
                isMembershipRequired: true,
            };
        }
        case 'claim-one-is-enabled': {
            return {
                title: 'Claim one is enabled',
                slug: 'claim-one-is-enabled',
                withdrawAmount: 1,
                withdrawDuration: 0,
                withdrawLimit: 0,
                withdrawUnlockDate: new Date(),
                isClaimOnce: true,
                isMembershipRequired: false,
            };
        }
        case 'claim-one-is-disabled': {
            return {
                title: 'Claim one is disabled',
                slug: 'claim-one-is-disabled',
                withdrawAmount: 1,
                withdrawDuration: 0,
                withdrawLimit: 0,
                withdrawUnlockDate: new Date(),
                isClaimOnce: false,
                isMembershipRequired: false,
            };
        }
    }
}

type RewardSlug =
    | 'no-limit-and-claim-one-disabled'
    | 'one-limit-and-claim-one-disabled'
    | 'withdraw-date-is-tomorrow'
    | 'withdraw-date-is-today'
    | 'expiration-date-is-today'
    | 'expiration-date-is-tomorrow'
    | 'membership-is-required'
    | 'claim-one-is-enabled'
    | 'claim-one-is-disabled';
