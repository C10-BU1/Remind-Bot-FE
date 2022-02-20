export const paginateResponse = (data: any, page: number, limit: number, total:number) => {
    const lastPage = Math.ceil(total / limit);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;
    return {
        data: [...data],
        total: total,
        currentPage: page,
        nextPage: nextPage,
        prevPage: prevPage,
        lastPage: lastPage,
    }
}