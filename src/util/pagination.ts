interface PaginationResult {
    results: any[];
    next?: { page: number };
    previous?: { page: number };
    limit: number;
    total: number;
}

export const paginatedResults = async (
    model: any,
    page: number,
    limit: number,
    query: any,
): Promise<PaginationResult> => {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await model.find(query).countDocuments().exec();
    let next, previous;

    if (endIndex < total) {
        next = {
            next: {
                page: page + 1,
            },
        };
    }
    if (startIndex > 0) {
        previous = {
            previous: {
                page: page - 1,
            },
        };
    }

    const results = await model
        .find(query)
        .limit(limit)
        .sort([['createdAt', -1]])
        .skip(startIndex)
        .exec();

    return {
        results,
        limit,
        total,
        ...next,
        ...previous,
    };
};
