

export class UpdateNotification implements Readonly<UpdateNotification>{

    id?: number;

    content?: string;

    name?: string;

    threadId?: string;

    sendAtMinute?: string;

    sendAtHour?: string;

    sendAtDayOfWeek?: string;

    sendAtMonths?: string;

    sendAtDayOfMonth?: string;

    createdAt?: Date;

    tags?: [];

    keyWord?: string;

    fromTime?: string;

    toTime?: string;
}