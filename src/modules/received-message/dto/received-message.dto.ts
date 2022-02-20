import { MemberInfoDto } from "src/modules/member/dto/member-info.dto";


export class ReceivedMessageDto implements Readonly<ReceivedMessageDto>{

    messageName: string;

    member: MemberInfoDto;
}