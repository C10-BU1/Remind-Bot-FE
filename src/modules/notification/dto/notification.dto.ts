import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { MemberInfoDto } from "src/modules/member/dto/member-info.dto";


export class NotificationDto implements Readonly<NotificationDto>{

    @ApiProperty({ type: Number })
    @IsNumber()
    id?: number;

    @ApiProperty({ type: String })
    @IsString()
    name?: string;

    @ApiProperty({ type: String })
    @IsString()
    content?: string;

    tags?: MemberInfoDto[];

    dayOfWeek?: number[];

    @ApiProperty({ type: String })
    @IsString()
    minute?: string;

    @ApiProperty({ type: String })
    @IsString()
    hour?: string;

    @ApiProperty({ type: String })
    @IsString()
    dayOfMonth?: string;

    @ApiProperty({ type: String })
    @IsString()
    month?: string;

    @ApiProperty({ type: String })
    @IsString()
    year?: string;

    @ApiProperty({ type: String })
    @IsString()
    threadId?: string;

    spaceId?: number;

    createdAt?: Date;

    isEnable?: boolean;

    @ApiProperty({ type: String })
    @IsString()
    type?: string;

    @ApiProperty({ type: String })
    @IsString()
    fromTime?: string;

    @ApiProperty({ type: String })
    @IsString()
    toTime?: string;

    @ApiProperty({ type: String })
    @IsString()
    keyWord?: string;

}