import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MemberEntity } from "../member/member.entity";
import { NotificationEntity } from "../notification/notification.entity";

@Entity('tagged_member')
export class TaggedMemberEntity{

    @PrimaryGeneratedColumn('increment')
    id: number;

    @ManyToOne(type => NotificationEntity, notification => notification.taggedMember)
    notification: NotificationEntity;

    @ManyToOne(type => MemberEntity, member => member.taggedMember)
    member: MemberEntity;    

}