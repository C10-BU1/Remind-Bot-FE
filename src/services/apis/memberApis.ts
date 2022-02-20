import axiosClient from "./axiosClient";


export const memberInfo = async () => {
    const url = 'member';
    return await axiosClient.get(url);
}

export const listMember = async (spaceId: number) => {
    const url = `member-in-space/list-member/${spaceId}`;
    return await axiosClient.get(url);
}

export const memberInfoBySpaceIdAndRole = async (spaceId: number, role: string, currentPage: number) => {
    const url = `member-in-space/${spaceId}/member-info?role=${role}&page=${currentPage}&limit=7`;
    return await axiosClient.get(url);
}

export const searchMemberInSpace = async (spaceId: number, role: string, currentPage: number, name: string) => {
    const url = `member-in-space/${spaceId}/member-info/search/r?role=${role}&page=${currentPage}&limit=7&mn=${name}`;
    return await axiosClient.get(url);
}

export const searchMemberByDisplayName = async (spaceId: number, displayName: string) => {
    const url = `member-in-space/${spaceId}/member-info/search?mn=${displayName}`;
    return await axiosClient.get(url);
}

export const updateRole = async (data: API.UpdateRole) => {
    const url = `member-in-space/update-role`
    return await axiosClient.put(url, data);
}
