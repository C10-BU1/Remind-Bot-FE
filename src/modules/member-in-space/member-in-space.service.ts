import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { MemberInfoDto } from '../member/dto/member-info.dto';
import { MemberEntity } from '../member/member.entity';
import { MemberService } from '../member/member.service';
import { SpaceEntity } from '../space/space.entity';
import { ListMemberDto } from './dto/list-member.dto';
import { MemberInSpaceEntity } from './member-in-space.entity';
import { paginateResponse } from 'src/common/paginate/paginate';
import { MemberRole } from 'src/common/member-role/member-role';

@Injectable()
export class MemberInSpaceService {

    constructor(
        @InjectRepository(MemberInSpaceEntity) private memberInSpaceRepo: Repository<MemberInSpaceEntity>,
        @Inject(forwardRef(() => MemberService)) private memberService: MemberService,
    ) { }

    async totalMember(spaceId: number): Promise<number> {
        try {
            const result = await this.memberInSpaceRepo.createQueryBuilder().select().where('spaceId = :spaceId', { spaceId: spaceId }).getCount();
            return result
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async addMemberToSpace(space: SpaceEntity, member: MemberEntity, role: string) {
        const isAdded = await this.memberInSpaceRepo.findOne({ space: space, member: member });
        if (isAdded != null) {
            return null;
        }
        const memberInSpaceEntity = new MemberInSpaceEntity();
        memberInSpaceEntity.space = space;
        memberInSpaceEntity.member = member;
        memberInSpaceEntity.role = role;
        try {
            const result = await this.memberInSpaceRepo.save(memberInSpaceEntity);
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async listMember(spaceId: number): Promise<ListMemberDto> {
        const members = await this.memberInSpaceRepo.createQueryBuilder('m')
            .innerJoinAndSelect('m.member', 'memberInfo')
            .select(['memberInfo.name AS name', 'memberInfo.displayName AS displayName'])
            .where('m.spaceId = :spaceId', { spaceId: spaceId }).execute();
        const listMember = new ListMemberDto();
        listMember.spaceId = spaceId;
        listMember.members = members;
        return listMember;
    }

    async findBySpaceAndRole(take: number, page: number, spaceId: number, role: string): Promise<any> {
        const takeQuery = take || 10;
        const pageQuery = page || 1;
        const skipQuery = (pageQuery - 1) * take;
        const [members, total] = await this.memberInSpaceRepo.createQueryBuilder('m')
            .innerJoinAndSelect('m.member', 'memberInfo')
            .where('m.spaceId = :spaceId', { spaceId: spaceId })
            .andWhere('m.role = :role', { role: role })
            .orderBy('memberInfo.displayName', 'ASC')
            .skip(skipQuery)
            .take(takeQuery)
            .getManyAndCount();
        const result = this.convertToMemberInfoDto(members);
        return paginateResponse(result, pageQuery, takeQuery, total);
    }

    async findBySpaceId(spaceId: number): Promise<MemberInfoDto[]> {
        const members = await this.memberInSpaceRepo.createQueryBuilder('m')
            .innerJoinAndSelect('m.member', 'memberInfo')
            .where('m.spaceId = :spaceId', { spaceId: spaceId })
            .orderBy('memberInfo.displayName', 'ASC').getMany();
        const result = this.convertToMemberInfoDto(members);
        return result;
    }

    async searchByMemberDisplayNameAndRole(take: number, page: number, spaceId: number, role: string, memberName: string): Promise<any> {
        const takeQuery = take || 10;
        const pageQuery = page || 1;
        const skipQuery = (pageQuery - 1) * take;
        try {
            const [members, total] = await this.memberInSpaceRepo.createQueryBuilder('m')
                .innerJoinAndSelect('m.member', 'memberInfo')
                .where('m.spaceId = :spaceId', { spaceId: spaceId })
                .andWhere('m.role = :role', { role: role })
                .andWhere("memberInfo.display_name like :displayName", { displayName: `%${memberName}%` })
                .orderBy('memberInfo.displayName', 'ASC')
                .skip(skipQuery)
                .take(takeQuery)
                .getManyAndCount();
            const result = this.convertToMemberInfoDto(members);
            return paginateResponse(result, pageQuery, takeQuery, total);
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async searchByDisplayName(spaceId: number, memberName: string): Promise<any> {
        try {
            const members = await this.memberInSpaceRepo.createQueryBuilder('m')
                .innerJoinAndSelect('m.member', 'memberInfo')
                .where('m.spaceId = :spaceId', { spaceId: spaceId })
                .andWhere("memberInfo.display_name like :displayName", { displayName: `%${memberName}%` })
                .orderBy('memberInfo.displayName', 'ASC')
                .take(10)
                .getMany();
            const result = this.convertToMemberInfoDto(members);
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async updateRole(spaceId: number, memberId: number, role: string): Promise<any> {
        if (!['admin', 'member'].includes(role)) {
            throw new BadRequestException('Invalid param');
        }
        try {
            const res = await this.memberInSpaceRepo.createQueryBuilder().update()
                .set({ role: role })
                .where('spaceId = :spaceId', { spaceId: spaceId })
                .andWhere('memberId = :memberId', { memberId: memberId })
                .execute();
            return res;
        } catch (error) {
            throw new InternalServerErrorException(`Database connect error: ${error}`);
        }
    }

    async getSpacesByMemberIdAndRole(take: number, page: number, memberId: number) {
        const takeQuery = take || 10;
        const pageQuery = page || 1;
        const skipQuery = (pageQuery - 1) * take;
        try {
            const [spaces, total] = await this.memberInSpaceRepo.createQueryBuilder('s').innerJoinAndSelect('s.space', 'spaceInfo')
                .where('s.memberId = :memberId', { memberId: memberId })
                .andWhere('s.role IN (:...roles)', { roles: [MemberRole.ADMIN, MemberRole.OWNER] })
                .andWhere('spaceInfo.enable = :enable', {enable: true})
                .skip(skipQuery)
                .take(takeQuery)
                .getManyAndCount();
            const result = [];
            for (let space of spaces) {
                const totalMember = await this.totalMember(space.space.id);
                result.push({ ...space.space, totalMember });
            }
            return paginateResponse(result, pageQuery, takeQuery, total);
        } catch (error) {
            Logger.error(error);
            throw new InternalServerErrorException(`Database connection or another error: ${error}`)
        }
    }

    async searchSpacesByMemberIdAndRole(take: number, page: number, memberId: number, displayName: string) {
        const takeQuery = take || 10;
        const pageQuery = page || 1;
        const skipQuery = (pageQuery - 1) * take;
        try {
            const [spaces, total] = await this.memberInSpaceRepo.createQueryBuilder('s')
                .innerJoinAndSelect('s.space', 'spaceInfo')
                .where('s.memberId = :memberId', { memberId: memberId })
                .andWhere('s.role IN (:...roles)', { roles: [MemberRole.ADMIN, MemberRole.OWNER] })
                .andWhere('spaceInfo.display_name like :displayName', { displayName: `%${displayName}%` })
                .skip(skipQuery)
                .take(takeQuery)
                .getManyAndCount();
            const result = [];
            for (let space of spaces) {
                const totalMember = await this.totalMember(space.space.id);
                result.push({ ...space.space, totalMember });
            }
            return paginateResponse(result, pageQuery, takeQuery, total);
        } catch (error) {
            Logger.error(error);
            throw new InternalServerErrorException(`Database connection or another error: ${error}`);
        }
    }

    async checkRole(memberId: number, spaceId: number): Promise<string> {
        try {
            const result = await this.memberInSpaceRepo
                .createQueryBuilder().select(['role'])
                .where('spaceId = :spaceId', { spaceId: spaceId })
                .andWhere('memberId = :memberId', {memberId: memberId}).execute();
            if(result.length != 0){
                return result[0].role;
            }
            return '';
        } catch (error) {
            Logger.error(error);
            throw new InternalServerErrorException(`Database connection or another error: ${error}`);
        }
    }

    convertToMemberInfoDto(members: MemberInSpaceEntity[]): MemberInfoDto[] {
        const result = members.map((member) => {
            const memberInfoDto = new MemberInfoDto();
            memberInfoDto.id = member.member.id;
            memberInfoDto.email = member.member.email;
            memberInfoDto.name = member.member.name;
            memberInfoDto.displayName = member.member.displayName;
            memberInfoDto.imageUrl = member.member.imageUrl;
            memberInfoDto.role = member.role;
            return memberInfoDto;
        })
        return result;
    }
}
function orWhere(arg0: string, arg1: { search: string; }) {
    throw new Error('Function not implemented.');
}

