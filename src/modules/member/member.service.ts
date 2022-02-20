import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthLoginDto } from '../auth/dto/auth-login.dto';
import { MemberInfoDto } from './dto/member-info.dto';
import { MemberEntity } from './member.entity';

@Injectable()
export class MemberService {


    constructor(
        @InjectRepository(MemberEntity) private memberRepo: Repository<MemberEntity>,

    ) { }

    async getMemberInfo(id: number): Promise<MemberEntity> {
        try {
            const result = await this.memberRepo.findOne(id);
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async findByEmail(email: string): Promise<MemberEntity> {
        try {
            const result = await this.memberRepo.findOne({ email: email });
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }

    }

    async findByName(name: string): Promise<MemberEntity> {
        try {
            const result = await this.memberRepo.findOne({ name: name });
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }

    }

    async memberLogin(authLogin: AuthLoginDto): Promise<MemberEntity> {
        try {
            const member = await this.findByName(`users/${authLogin.googleId}`)
            if (member == null) {
                const newMember = await this.addMember(authLogin.email, authLogin.name, authLogin.imageUrl, authLogin.googleId, `users/${authLogin.googleId}`);
                return newMember;
            } else if (member.googleId == null) {
                return await this.memberRepo.save({ ...member, googleId: authLogin.googleId, imageUrl: authLogin.imageUrl, email: authLogin.email });
            }
            return member;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async addMember(email: string, displayName: string, imageUrl: string, googleId?: string, name?: string): Promise<MemberEntity> {
        try {
            const memberEntity = new MemberEntity();
            memberEntity.email = email;
            memberEntity.displayName = displayName;
            memberEntity.imageUrl = imageUrl;
            memberEntity.googleId = googleId;
            memberEntity.name = name;
            const result = await this.memberRepo.save(memberEntity);
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async updateMemberName(member: MemberEntity, name: string) {
        if (member.name == null) {
            try {
                await this.memberRepo.save({ ...member, name: name });
            } catch (error) {
                throw new InternalServerErrorException(`Database connection error: ${error}`);
            }
        }
    }

    async updateMember(member: MemberInfoDto, memberEntity: MemberEntity): Promise<MemberEntity>{
        try {
            const result = await this.memberRepo.save({...memberEntity,...member});
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }
}
