import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MemberInSpaceEntity } from "../member-in-space/member-in-space.entity";
import { NotificationEntity } from "../notification/notification.entity";
import { ReceivedMessageEntity } from "../received-message/received-message.entity";
import { TaggedMemberEntity } from "../tagged-member/tagged-member.entity";

@Entity('member')
export class MemberEntity {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'google_id', type: 'varchar', nullable: true })
    googleId: string;

    @Column({ name: 'image_url', type: 'varchar', nullable: true })
    imageUrl: string;

    @Column({ type: 'nvarchar', nullable: true })
    name: string;

    @Column({ name: 'display_name', type: 'nvarchar', nullable: false })
    displayName: string;

    @Column({ type: 'varchar', nullable: true })
    email: string;

    @OneToMany(type => MemberInSpaceEntity, memberInSpace => memberInSpace.member)
    memberInSpace: MemberInSpaceEntity[];

    @OneToMany(type => ReceivedMessageEntity, receivedMessage => receivedMessage.member)
    receivedMessage: ReceivedMessageEntity[];

    @OneToMany(type => TaggedMemberEntity, taggedMember => taggedMember.member)
    taggedMember: TaggedMemberEntity[];

    @OneToMany(type => NotificationEntity, notification => notification.member)
    notification: NotificationEntity[];
}