import { ConflictException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberService } from '../member/member.service';
import { SpaceService } from '../space/space.service';
import { TaggedMemberService } from '../tagged-member/tagged-member.service';
import { NotificationEntity } from './notification.entity';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob, CronTime } from 'cron';
import { createMessage, getMessage, createMessageForReminderNotification } from 'src/google-chat-apis/google-chat-apis';
import { NotificationDto } from './dto/notification.dto';
import { paginateResponse } from 'src/common/paginate/paginate';
import { MemberInfoDto } from '../member/dto/member-info.dto';
import * as moment from 'moment';
import { UpdateNotification } from './dto/update-notification.dto';
import { Logger } from '@nestjs/common';
import { SpaceEntity } from '../space/space.entity';
import { NotificationType } from 'src/common/notification-type/notification-type';
import { ReceivedMessageService } from '../received-message/received-message.service';
@Injectable()
export class NotificationService {

  constructor(
    @InjectRepository(NotificationEntity) private notificationRepo: Repository<NotificationEntity>,
    @Inject(forwardRef(() => SpaceService)) private spaceService: SpaceService,
    @Inject(forwardRef(() => MemberService)) private memberService: MemberService,
    @Inject(forwardRef(() => TaggedMemberService)) private taggedMemberService: TaggedMemberService,
    @Inject(forwardRef(() => ReceivedMessageService)) private receivedMessageService: ReceivedMessageService,
    private schedulerRegistry: SchedulerRegistry,
  ) { }

  async getNotificationBySpace(space: SpaceEntity): Promise<NotificationEntity[]> {
    try {
      return await this.notificationRepo.find({ space: space });
    } catch (error) {
      Logger.error(error);
    }
  }

  async getNotification(notificationId: number): Promise<NotificationEntity> {
    try {
      const result = await this.notificationRepo.findOne(notificationId);
      return result;
    } catch (error) {
      Logger.error(error);
      throw new InternalServerErrorException(`Database connection error: ${error}`);
    }
  }

  async getNotifications(): Promise<NotificationEntity[]> {
    try {
      const result = await this.notificationRepo.createQueryBuilder('n').innerJoinAndSelect('n.space', 'spaceInfo').where('n.is_enable = :enable', { enable: true }).getMany();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Database connection error: ${error}`);
    }
  }

  async createNormalNotification(notification: NotificationDto, email: string): Promise<any> {
    const notificationEntity = new NotificationEntity();
    const space = await this.spaceService.findById(notification.spaceId);
    const createdBy = await this.memberService.findByEmail(email);
    let dayOfWeek = '';
    if (notification.dayOfWeek.length == 0) {
      notificationEntity.sendAtDayOfMonth = notification.dayOfMonth;
      notificationEntity.sendAtDayOfWeek = '';
    } else {
      notification.dayOfWeek.forEach((value) => dayOfWeek += `${value},`);
      notificationEntity.sendAtDayOfMonth = '';
      notificationEntity.sendAtDayOfWeek = dayOfWeek.substring(0, dayOfWeek.length - 1);
    }
    notificationEntity.name = notification.name;
    notificationEntity.content = notification.content;
    notificationEntity.isEnable = true;
    notificationEntity.sendAtHour = notification.hour;
    notificationEntity.threadId = notification.threadId;
    notificationEntity.space = space;
    notificationEntity.member = createdBy;
    notificationEntity.createdAt = moment(new Date()).utcOffset('+0700').toDate();
    notificationEntity.type = NotificationType.NORMAL;
    try {
      const result = await this.notificationRepo.save(notificationEntity);
      const members = [];
      const taggedMembers = this.checkTag(notification.content, notification.tags);
      for (let tag of taggedMembers) {
        if (tag.name == 'all') {
          await this.taggedMemberService.add(result);
        } else {
          const member = await this.memberService.findByName(tag.name);
          members.push(member);
          await this.taggedMemberService.add(result, member);
        }
      }
      return { message: 'success' }
    } catch (error) {
      throw new InternalServerErrorException(`Database connection or another error: ${error}`);
    }
  }

  async createReminderNotification(notification: NotificationDto, email: string): Promise<any> {
    if (await this.checkThreadId(notification.threadId) != null) {
      throw new ConflictException(`This thread is used for other notification`);
    }
    const notificationEntity = new NotificationEntity();
    const space = await this.spaceService.findById(notification.spaceId);
    const createdBy = await this.memberService.findByEmail(email);
    let dayOfWeek = '';
    notification.dayOfWeek.forEach((value) => dayOfWeek += `${value},`);
    notificationEntity.sendAtDayOfWeek = dayOfWeek.substring(0, dayOfWeek.length - 1);
    notificationEntity.fromTime = notification.fromTime;
    notificationEntity.toTime = notification.toTime;
    notificationEntity.sendAtDayOfMonth = '';
    notificationEntity.name = notification.name;
    notificationEntity.content = notification.content;
    notificationEntity.isEnable = true;
    notificationEntity.sendAtHour = notification.hour;
    notificationEntity.threadId = notification.threadId;
    notificationEntity.space = space;
    notificationEntity.member = createdBy;
    notificationEntity.createdAt = moment(new Date()).utcOffset('+0700').toDate();
    notificationEntity.keyWord = notification.keyWord;
    notificationEntity.type = NotificationType.REMINDER;
    try {
      const result = await this.notificationRepo.save(notificationEntity);

      const taggedMembers = this.checkTag(notification.content, notification.tags);
      for (let tag of taggedMembers) {
        const member = await this.memberService.findByName(tag.name);
        await this.taggedMemberService.add(result, member);
      }
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async updateNotificationStatus(notificationId: number, isEnable: boolean): Promise<any> {
    try {
      const notification = await this.getNotification(notificationId);
      if (notification == null) {
        throw new NotFoundException(`Notification have id-${notificationId} does not exist`);
      }
      await this.notificationRepo.save({ ...notification, isEnable: isEnable });
      return { message: 'Updated' }
    } catch (error) {
      throw new InternalServerErrorException(`Database connection error: ${error}`);
    }

  }

  async getListNotification(take: number, page: number, spaceId: number): Promise<any> {
    const takeQuery = take || 10;
    const pageQuery = page || 1;
    const skipQuery = (pageQuery - 1) * take;
    const space = await this.spaceService.findById(spaceId);
    if (space == null) {
      throw new NotFoundException(`Space have id-${spaceId} does not exist`);
    }
    try {
      const [notifications, total] = await this.notificationRepo.createQueryBuilder()
        .where('spaceId = :spaceId', { spaceId: spaceId }).skip(skipQuery).take(takeQuery).orderBy('created_at', 'DESC').getManyAndCount()
      const result = notifications.map((notification) => {
        const notificationDto = new NotificationDto();
        notificationDto.id = notification.id;
        notificationDto.name = notification.name;
        notificationDto.isEnable = notification.isEnable;
        notificationDto.type = notification.type;
        return notificationDto;
      })
      return paginateResponse(result, pageQuery, takeQuery, total);
    } catch (error) {
      throw new InternalServerErrorException(`Database connection error: ${error}`);
    }
  }

  async searchNotificationByName(take: number, page: number, spaceId: number, name: string): Promise<any> {
    const takeQuery = take || 10;
    const pageQuery = page || 1;
    const skipQuery = (pageQuery - 1) * take;
    const space = await this.spaceService.findById(spaceId);
    if (space == null) {
      throw new NotFoundException(`Space have id-${spaceId} does not exist`);
    }
    try {
      const [notifications, total] = await this.notificationRepo.createQueryBuilder()
        .where('spaceId = :spaceId', { spaceId: spaceId })
        .andWhere('name like :name', { name: `%${name}%` })
        .skip(skipQuery).take(takeQuery).getManyAndCount()
      const result = notifications.map((notification) => {
        const notificationDto = new NotificationDto();
        notificationDto.id = notification.id;
        notificationDto.name = notification.name;
        notificationDto.isEnable = notification.isEnable;
        return notificationDto;
      })
      return paginateResponse(result, pageQuery, takeQuery, total);
    } catch (error) {
      throw new InternalServerErrorException(`Database connection error: ${error}`);
    }
  }

  async getNotificationInfo(notificationId): Promise<NotificationDto> {
    const notification = await this.getNotification(notificationId);
    if (notification == null) {
      throw new NotFoundException(`Notification have id-${notificationId} does not exist`);
    }
    const normalNotification = new NotificationDto();
    normalNotification.id = notification.id;
    normalNotification.content = notification.content;
    normalNotification.name = notification.name;
    normalNotification.threadId = notification.threadId;
    normalNotification.createdAt = notification.createdAt;
    normalNotification.hour = notification.sendAtHour;
    normalNotification.type = notification.type;
    normalNotification.keyWord = notification.keyWord;
    normalNotification.fromTime = notification.fromTime;
    normalNotification.toTime = notification.toTime;
    if (notification.sendAtDayOfWeek == '') {
      normalNotification.dayOfWeek = [];
      normalNotification.dayOfMonth = notification.sendAtDayOfMonth;
    } else {
      normalNotification.dayOfWeek = notification.sendAtDayOfWeek.split(',').map((day) => {
        return parseInt(day);
      })
      normalNotification.dayOfMonth = '';
    }
    normalNotification.tags = await this.taggedMemberService.getTaggedMember(notificationId)
    return normalNotification;
  }

  async deleteNotification(notificationId: number): Promise<any> {
    const notification = await this.getNotification(notificationId);
    if (notification == null) {
      throw new NotFoundException(`Notification have id-${notificationId} does not exist`);
    }
    try {
      await this.taggedMemberService.deleteAllTaggedMember(notificationId);
      if (notification.type == NotificationType.REMINDER) {
        await this.receivedMessageService.deleteMessage(notification);
      }
      await this.notificationRepo.delete(notification);
      return { notificationId: notificationId }
    } catch (error) {
      throw new InternalServerErrorException(`Database connection error: ${error}`);
    }
  }

  async updateNotification(notification: UpdateNotification) {
    const notificationEntity = await this.getNotification(notification.id);
    const tags = notification.tags;
    delete notification.id;
    delete notification.tags;
    try {
      const result = await this.notificationRepo.save({ ...notificationEntity, ...notification });
      if (tags.length != 0 && notification.content) {
        const taggedMemberInDb = await this.taggedMemberService.getTaggedMember(result.id);
        const taggedMember = this.checkTag(notification.content, tags);
        for (let member of taggedMember) {
          const findMember = taggedMemberInDb.filter((memberInDb) => {
            return memberInDb.name == member.name;
          })
          if (findMember.length == 0) {
            if (member.name != 'all') {
              const memberEntity = await this.memberService.findByName(member.name);
              await this.taggedMemberService.add(result, memberEntity);
            } else {
              await this.taggedMemberService.add(result);
            }
          }
        }
        for (let member of taggedMemberInDb) {  //add new tagged member
          const findMember = taggedMember.filter((memberInListTag) => {
            return memberInListTag.name == member.name;
          })
          if (findMember.length == 0) {
            if (member.name != 'all') {
              const memberEntity = await this.memberService.findByName(member.name);
              await this.taggedMemberService.deleteTaggedMember(result.id, memberEntity.id);
            } else {
              await this.taggedMemberService.deleteTaggedMember(result.id, null);
            }
          }
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(`Database connection error: ${error}`)
    }
  }

  async checkThreadId(threadId: string): Promise<NotificationEntity> {
    try {
      const result = await this.notificationRepo.findOne({ threadId: threadId, type: NotificationType.REMINDER });
      return result;
    } catch (error) {
      Logger.error(error);
    }
  }

  async addNotifications() {
    const notifications = await this.getNotifications();
    const dayOfWeek = moment(new Date()).utcOffset('+0700').format('e');
    const dayOfMonth = moment(new Date()).utcOffset('+0700').format('DD-MM-YYYY');
    const hour = moment(new Date()).utcOffset('+0700').format('HH:mm');
    for (let notification of notifications) {
      if (notification.type == NotificationType.NORMAL) {
        if (notification.sendAtDayOfWeek.includes(dayOfWeek) && notification.sendAtHour == hour) {
          const taggedMember = await this.taggedMemberService.getTaggedMember(notification.id);
          const res = await createMessage(notification, taggedMember, notification.space.name);
          if (res == 0) {
            await this.updateNotificationStatus(notification.id, false);
          }
        }
        if (notification.sendAtDayOfMonth == dayOfMonth && notification.sendAtHour == hour) {
          const taggedMember = await this.taggedMemberService.getTaggedMember(notification.id);
          const res = await createMessage(notification, taggedMember, notification.space.name);
          if (res == 0) {
            await this.updateNotificationStatus(notification.id, false);
          }
        }
      } else if (notification.type == NotificationType.REMINDER && notification.sendAtDayOfWeek.includes(dayOfWeek) && notification.sendAtHour == hour) {
        const receivedMessages = await this.receivedMessageService.checkMessage(notification);
        const taggedMember = await this.taggedMemberService.getTaggedMember(notification.id);
        let tagMembers: MemberInfoDto[] = [];
        taggedMember.forEach((member) => {
          const isReceived = receivedMessages.filter((message) => {
            return member.name == message.member.name;
          })
          if (isReceived.length == 0) {
            tagMembers.push(member);
          }
        })
        for (let message of receivedMessages) {
          const res = await getMessage(message.messageName);
          const inTaggedMember = taggedMember.filter((member) => {
            return message.member.name == member.name;
          })
          if (!res.toLowerCase().includes(notification.keyWord.toLowerCase()) && inTaggedMember.length != 0) {
            tagMembers.push(message.member);
          }
        }
        if (tagMembers.length != 0) {
          const result = await createMessageForReminderNotification(notification, taggedMember, tagMembers, notification.space.name);
          if (result == 0) {
            await this.updateNotificationStatus(notification.id, false);
          }
        }
      }
    }
  }

  checkTag(content: string, tags: MemberInfoDto[]) {
    const taggedMembers = tags.filter((tag) => {
      return content.includes(`@${tag.displayName}`);
    });
    return taggedMembers;
  }
}
