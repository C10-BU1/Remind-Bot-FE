import { MemberInfoDto } from "src/modules/member/dto/member-info.dto";


export class UpdateNotification implements Readonly<UpdateNotification>{

    id: number;

    content?: string;

    name?: string;
   
    threadId?: string;

    sendAtMinute?: string;

    sendAtHour?: string;

    sendAtDayOfWeek?: string;

    sendAtMonths?: string;

    sendAtDayOfMonth?: string;

    createdAt?: Date; 

    tags: MemberInfoDto[];

    fromTime?: string;

    toTime?: string;

    keyWord?: string;


}