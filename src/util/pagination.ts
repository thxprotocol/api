export class PaginationResult {
    results: any[];
    next: { page: number };
    previous: { page: number };
    limit: number;
    total: number;
}

export const paginatedResults = async (model: any, page: number, limit: number, query: any) => {
    const results = new PaginationResult();
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const totalDocuments = await model.find(query).countDocuments().exec();

    results.limit = limit;
    results.total = totalDocuments;

    if (endIndex < totalDocuments) {
        results.next = {
            page: page + 1,
        };
    }
    if (startIndex > 0) {
        results.previous = {
            page: page - 1,
        };
    }
    results.results = await model
        .find(query)
        .limit(limit)
        .sort([['createdAt', -1]])
        .skip(startIndex)
        .exec();

    return results;
};
