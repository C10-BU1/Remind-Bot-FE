import { forwardRef, Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberRole } from 'src/common/member-role/member-role';
import { paginateResponse } from 'src/common/paginate/paginate';
import { Repository } from 'typeorm';
import { MemberInSpaceService } from '../member-in-space/member-in-space.service';
import { MemberInfoDto } from '../member/dto/member-info.dto';
import { SpaceInfoDto } from './dto/space-info.dto';
import { SpaceEntity } from './space.entity';
import { Logger } from '@nestjs/common';
@Injectable()
export class SpaceService {
    constructor(
        @InjectRepository(SpaceEntity) private spaceRepo: Repository<SpaceEntity>,
        @Inject(forwardRef(() => MemberInSpaceService)) private memberInSpaceService: MemberInSpaceService,
    ) { }

    async getSpaces(): Promise<SpaceEntity[]> {
        try {
            const result = await this.spaceRepo.find();
            return result;
        } catch (error) {
            Logger.error(error);
        }
    }

    async getListSpace(take: number, page: number, memberId: number): Promise<any> {
        const takeQuery = take || 10;
        const pageQuery = page || 1;
        const skipQuery = (pageQuery - 1) * take;
        try {
            const [spaces, totalSpace] = await this.spaceRepo.createQueryBuilder()
                .orderBy('name', 'ASC').skip(skipQuery).take(takeQuery).getManyAndCount();
            const result = [];
            for (let space of spaces) {
                const totalMember = await this.memberInSpaceService.totalMember(space.id);
                result.push({ ...space, totalMember });
            }
            return paginateResponse(result, pageQuery, takeQuery, totalSpace);
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async searchByDisplayName(take: number, page: number, name: string): Promise<any> {
        const takeQuery = take || 10;
        const pageQuery = page || 1;
        const skipQuery = (pageQuery - 1) * take;
        try {
            const [spaces, totalSpace] = await this.spaceRepo.createQueryBuilder()
                .where("display_name like :name", { name: `%${name}%` }).orderBy('name', 'ASC').skip(skipQuery).take(takeQuery).getManyAndCount();
            const result = [];
            for (let space of spaces) {
                const totalMember = await this.memberInSpaceService.totalMember(space.id);
                result.push({ ...space, totalMember });
            }
            return paginateResponse(result, pageQuery, takeQuery, totalSpace);
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async addSpace(name: string, displayName: string): Promise<SpaceEntity> {
        const spaceEntity = new SpaceEntity();
        spaceEntity.name = name;
        spaceEntity.displayName = displayName;
        spaceEntity.isEnable = true;
        try {
            const result = await this.spaceRepo.save(spaceEntity);
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async findByName(name: string): Promise<SpaceEntity> {
        try {
            const result = await this.spaceRepo.findOne({ name: name });
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async findById(id: number): Promise<SpaceEntity> {
        try {
            const result = await this.spaceRepo.findOne({ id: id });
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async updateSpaceStatus(space: SpaceEntity, isEnable: boolean): Promise<SpaceEntity> {
        try {
            const result = await this.spaceRepo.save({ ...space, isEnable: isEnable });
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async getSpaceInfo(spaceId: number, memberId: number): Promise<SpaceInfoDto> {
        const memberRole = await this.memberInSpaceService.checkRole(memberId, spaceId) as MemberRole;
        if(![MemberRole.ADMIN, MemberRole.OWNER].includes(memberRole)){
            throw new UnauthorizedException('Can not access to the space')
        }
        const space = await this.findById(spaceId);
        const members = await this.memberInSpaceService.findBySpaceId(spaceId);
        let owner: MemberInfoDto = null;
        let admin: MemberInfoDto[] = [];
        let member: MemberInfoDto[] = [];
        members.forEach((memberInfo) => {
            if (memberInfo.role == MemberRole.OWNER) {
                owner = memberInfo;
            } else if (memberInfo.role == MemberRole.ADMIN) {
                admin.push(memberInfo);
            } else if (memberInfo.role == MemberRole.MEMBER) {
                member.push(memberInfo);
            }
        })
        const spaceInfoDto = new SpaceInfoDto();
        spaceInfoDto.id = space.id;
        spaceInfoDto.displayName = space.displayName;
        spaceInfoDto.name = space.name;
        spaceInfoDto.owner = owner;
        spaceInfoDto.admin = admin.length;
        spaceInfoDto.member = member.length;
        spaceInfoDto.role =memberRole;
        return spaceInfoDto;
    }
}
