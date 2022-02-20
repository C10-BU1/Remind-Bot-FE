import { ApiProperty } from "@nestjs/swagger";
import { AuthLoginDto } from "src/modules/auth/dto/auth-login.dto";
import { MemberInfoDto } from "src/modules/member/dto/member-info.dto";


export class SpaceInfoDto implements Readonly<SpaceInfoDto>{

    @ApiProperty({type: Number})
    id: number;
    
    @ApiProperty({type: String})
    name: string;

    @ApiProperty({type: String})
    displayName: string;

    @ApiProperty({type: MemberInfoDto})
    owner: MemberInfoDto;

    @ApiProperty({ type : Number})
    admin: number;

    @ApiProperty({ type : Number})
    member: number;

    @ApiProperty({type: String})
    role: string;






}