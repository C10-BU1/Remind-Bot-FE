import { Column, ColumnTypeUndefinedError, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MemberEntity } from "../member/member.entity";
import { ReceivedMessageEntity } from "../received-message/received-message.entity";
import { SpaceEntity } from "../space/space.entity";
import { TaggedMemberEntity } from "../tagged-member/tagged-member.entity";

@Entity('notification')
export class NotificationEntity {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ type: 'varchar', nullable: false })
    name: string;

    @Column({ type: 'text', nullable: false })
    content: string;

    @Column({ name: 'thread_id', type: 'varchar', nullable: true })
    threadId: string;

    @Column({ name: 'is_enable', type: 'boolean', nullable: false })
    isEnable: boolean;

    @Column({ name: 'send_at_minute', type: 'varchar', nullable: false })
    sendAtMinute: string;

    @Column({ name: 'send_at_hour', type: 'varchar', nullable: false })
    sendAtHour: string;

    @Column({ name: 'send_at_day_of_week', type: 'varchar', nullable: false })
    sendAtDayOfWeek: string;

    @Column({ name: 'send_at_months', type: 'varchar', nullable: true })
    sendAtMonths: string;

    @Column({ name: 'send_at_day_of_month', type: 'varchar', nullable: true })
    sendAtDayOfMonth: string;

    @Column({ name: 'created_at', type: 'datetime', nullable: false })
    createdAt: Date; 

    @Column({type: 'varchar', nullable: false})
    type: string;

    @Column({name: 'key_word', type: 'varchar', nullable: true})
    keyWord: string;

    @Column({name: 'from_time', type: 'varchar', nullable: true})
    fromTime: string;

    @Column({name: 'to_time', type: 'varchar', nullable: true})
    toTime: string;

    @ManyToOne(type => SpaceEntity, space => space.notification)
    space: SpaceEntity;

    @ManyToOne(type => MemberEntity, member => member.notification)
    member: MemberEntity;

    @OneToMany(type => TaggedMemberEntity, taggedMember => taggedMember.notification)
    taggedMember: TaggedMemberEntity;

    @OneToMany(type => ReceivedMessageEntity, receivedMessage => receivedMessage.notification)
    receivedMessage: ReceivedMessageEntity;
}