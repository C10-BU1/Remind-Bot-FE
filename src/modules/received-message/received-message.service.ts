import { forwardRef, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberEntity } from '../member/member.entity';
import { NotificationEntity } from '../notification/notification.entity';
import { ReceivedMessageEntity } from './received-message.entity';
import * as moment from 'moment';
import { ReceivedMessageDto } from './dto/received-message.dto';
import { NotificationService } from '../notification/notification.service';
@Injectable()
export class ReceivedMessageService {

    constructor(
        @InjectRepository(ReceivedMessageEntity) private receivedMessageRepo: Repository<ReceivedMessageEntity>,
        @Inject(forwardRef(() => NotificationService)) private notificationService: NotificationService,

    ) { }

    async addMessage(messageName: string, notification: NotificationEntity, member: MemberEntity): Promise<any> {
        const receivedMessageEntity = new ReceivedMessageEntity();
        receivedMessageEntity.member = member;
        receivedMessageEntity.messageName = messageName;
        receivedMessageEntity.notification = notification;
        receivedMessageEntity.receivedAt = new Date;
        receivedMessageEntity.threadId = notification.threadId;
        try {
            const result = await this.receivedMessageRepo.save(receivedMessageEntity);
        } catch (error) {
            Logger.error(error);
        }
    }

    async checkIsExist(notification: NotificationEntity, member: MemberEntity, date: Date): Promise<ReceivedMessageEntity> {
        try {
            const result = await this.receivedMessageRepo.createQueryBuilder()
                .where('notificationId = :notificationId', { notificationId: notification.id })
                .andWhere('memberId = :memberId', { memberId: member.id })
                .orderBy('received_at', 'DESC').take(1).getOne();
            if (result == null || moment(result.receivedAt).format('DD-MM-YYYY') != moment(date).format('DD-MM-YYYY')) {
                return null;
            }
            return result;
        } catch (error) {
            Logger.error(error);
        }
    }

    async updateMessageName(receivedMessage: ReceivedMessageEntity, messageName: string): Promise<ReceivedMessageEntity> {
        try {
            const result = await this.receivedMessageRepo.save({ ...receivedMessage, messageName: messageName, receivedAt: new Date() });
            return result;
        } catch (error) {
            Logger.error(error);
        }
    }

    async deleteMessage(notification: NotificationEntity){
        try {
            const result = await this.receivedMessageRepo.delete({notification: notification});
            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Database connection or another error: ${error}`);
        }
    }

    async checkMessage(notification: NotificationEntity): Promise<ReceivedMessageDto[]> {
        const currentDate = moment(new Date()).format('YYYY-MM-DD');
        const fromTime = moment(`${currentDate} ${notification.fromTime}:00`).toDate();
        const toTime = moment(`${currentDate} ${notification.toTime}:00`).toDate();
        try {
            const timeValidMessages = await this.receivedMessageRepo.createQueryBuilder('m').innerJoinAndSelect('m.member', 'memberInfo')
                .where('m.notificationId = :notificationId', { notificationId: notification.id })
                .andWhere('m.received_at >= :fromTime', { fromTime: fromTime })
                .andWhere('m.received_at <= :toTime', { toTime: toTime })
                .getMany();
            const messages = timeValidMessages.map((message) => {
                const receivedMessageDto = new ReceivedMessageDto();
                receivedMessageDto.messageName = message.messageName;
                receivedMessageDto.member = message.member;
                return receivedMessageDto;
            });
            return messages;
        } catch (error) {
            Logger.error(error);
            throw new InternalServerErrorException(error);
        }
    }
}
