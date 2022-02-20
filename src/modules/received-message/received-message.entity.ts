import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MemberEntity } from "../member/member.entity";
import { NotificationEntity } from "../notification/notification.entity";
import { SpaceEntity } from "../space/space.entity";


@Entity('received_message')
export class ReceivedMessageEntity {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'message_name', type: 'varchar' , nullable: false})
    messageName: string;

    @Column({name: 'thread_id', type: 'varchar'})
    threadId: string;

    @Column({ name: 'received_at', type: 'datetime' , nullable: false})
    receivedAt: Date;

    @Column({name: 'isValid', type: 'boolean', nullable: true})
    isValid: boolean;

    @ManyToOne(type => MemberEntity, member => member.receivedMessage)
    member: MemberEntity;

    @ManyToOne(type => NotificationEntity, notification => notification.receivedMessage)
    notification: NotificationEntity;
}