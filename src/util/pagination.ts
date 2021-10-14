export class PaginationResult {
    next: any;
    results: any;
    previous: any;
}

export const paginatedResults = async (model: any, page: number, limit: number, query: any) => {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let results = new PaginationResult();
    if (endIndex < (await model.countDocuments().exec())) {
        results.next = {
            page: page + 1,
            limit: limit,
        };
    }
    if (startIndex > 0) {
        results.previous = {
            page: page - 1,
            limit: limit,
        };
    }
    results.results = await model.find(query).limit(limit).skip(startIndex).exec();
    return { results };
};
