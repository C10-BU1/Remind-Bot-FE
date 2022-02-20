import { UpdateNotification } from "@/components/Notification/dto/update-notification.dto";
import axiosClient from "./axiosClient"

export const createNormalNotification = async (data: any) => {
    const url = 'notification/normal';
    return await axiosClient.post(url, data);
}

export const createReminderNotification = async (data: any) => {
    const url = 'notification/reminder';
    return await axiosClient.post(url, data);
}

export const getNotifications = async (spaceId: number, currentPage: number) => {
    const url = `notification/space/${spaceId}?page=${currentPage}&limit=10`;
    return await axiosClient.get(url);
}

export const searchNotificationByName = async (spaceId: number, name: string, currentPage: number) => {
    const url = `notification/space/${spaceId}/search?name=${name}&page=${currentPage}&limit=10`;
    return await axiosClient.get(url);
}

export const updateStatus = async (data: API.UpdateNotificationStatus) => {
    const url = `notification/status`;
    return await axiosClient.put(url, data);
}

export const deleteNotification = async (notificationId: number) => {
    const url = `notification/${notificationId}`;
    return await axiosClient.delete(url);
}

export const getNotification = async (notificationId: number) => {
    const url = `notification/${notificationId}`;
    return await axiosClient.get(url);
}

export const updateNotification = async (notification: UpdateNotification) => {
    const url = `notification`;
    return await axiosClient.put(url, notification);
}

export const getReminderNotification = async (notificationId: number) => {
    const url = `notification/reminder/${notificationId}`;
    return await axiosClient.get(url);
}
