import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber } from "class-validator";


export class UpdateNotificationStatusDto implements Readonly<UpdateNotificationStatusDto>{

    @ApiProperty({type: Number})
    @IsNumber()
    id: number;

    @ApiProperty({type: Boolean})
    @IsBoolean()
    isEnable: boolean;
}