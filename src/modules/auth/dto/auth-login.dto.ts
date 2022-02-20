import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";


export class AuthLoginDto{

    @ApiProperty({type: String})
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({type: String})
    @IsNotEmpty()
    name: string;

    @ApiProperty({type: String})
    @IsNotEmpty()
    googleId?: string;

    @ApiProperty({type: String})
    @IsNotEmpty()
    imageUrl: string;

}