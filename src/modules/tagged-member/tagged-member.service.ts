import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberInfoDto } from '../member/dto/member-info.dto';
import { MemberEntity } from '../member/member.entity';
import { NotificationEntity } from '../notification/notification.entity';
import { SpaceEntity } from '../space/space.entity';
import { TaggedMemberEntity } from './tagged-member.entity';

@Injectable()
export class TaggedMemberService {

    constructor(
        @InjectRepository(TaggedMemberEntity) private taggedMemberRepo: Repository<TaggedMemberEntity>,
    ) { }

    async add(notification: NotificationEntity, member?: MemberEntity): Promise<TaggedMemberEntity> {
        const taggedMemberEntity = new TaggedMemberEntity();
        taggedMemberEntity.notification = notification;
        taggedMemberEntity.member = member;
        try {
            const result = await this.taggedMemberRepo.save(taggedMemberEntity);
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection error: ${error}`);
        }
    }

    async deleteAllTaggedMember(notificationId: number) {
        try {
            const res = this.taggedMemberRepo.createQueryBuilder().delete()
                .where('notificationId = :notificationId', { notificationId: notificationId }).execute();
            return res;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection or another error: ${error}`);
        }
    }

    async deleteTaggedMember(notificationId: number, memberId: number) {
        try {
            const res = this.taggedMemberRepo.createQueryBuilder().delete()
                .where('notificationId = :notificationId', { notificationId: notificationId })
                .andWhere('memberId = :memberId', {memberId: memberId})
                .execute();
            return res;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection or another error: ${error}`);
        }
    }

    async getTaggedMember(notificationId: number): Promise<MemberInfoDto[]> {
        try {
            const members = await this.taggedMemberRepo.createQueryBuilder('t')
                .innerJoinAndSelect('t.member', 'memberInfo')
                .where('t.notificationId = :notificationId', { notificationId: notificationId }).getMany();
            const result = members.map((member) => {
                return {id: member.member.id, name: member.member.name, displayName: member.member.displayName };
            })
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection or another error: ${error}`);
        }
    }
}
