import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";
import { MemberRole } from "src/common/member-role/member-role";

export class UpdateRoleDto implements Readonly<UpdateRoleDto>{

    @ApiProperty({type: Number})
    @IsNumber()
    spaceId: number;

    @ApiProperty({type: Number})
    @IsNumber()
    memberId: number;
    
    @ApiProperty({ enum: ['Admin', 'Member', 'Owner']})
    @IsString()
    role: MemberRole;
}