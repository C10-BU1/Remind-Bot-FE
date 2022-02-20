import axiosClient from "./axiosClient"

export const getSpaces = async (page: number) => {
    const url = `member-in-space/spaces?page=${page}&limit=10`;
    return await axiosClient.get(url);
}

export const searchByName = async (name: string, page: number) => {
    const url = `member-in-space/spaces/search?page=${page}&limit=10&name=${name}`;
    return await axiosClient.get(url);
}

export const getSpaceInfo = async (spaceId: number) =>{
    const url = `space/${spaceId}`;
    return await axiosClient.get(url);
}