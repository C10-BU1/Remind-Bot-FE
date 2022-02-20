import { ApiProperty } from "@nestjs/swagger";


export class MemberInfoDto implements Readonly<MemberInfoDto>{

    @ApiProperty({type: Number})
    id?: number;

    @ApiProperty({type: String})
    email?: string;

    @ApiProperty({type: String})
    name?: string;

    @ApiProperty({type: String})
    displayName?: string;

    @ApiProperty({type: String})
    imageUrl?: string;

    @ApiProperty({type: String})
    role?: string;


}