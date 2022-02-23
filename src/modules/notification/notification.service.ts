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

  async createNormalNotification(notification: NotificationDto, email: string): Promise<any> {
    const notificationEntity = new NotificationEntity();
    const space = await this.spaceService.findById(notification.spaceId);
    const createdBy = await this.memberService.findByEmail(email);
    let dayOfWeek = '';
    if (notification.dayOfWeek.length == 0) {
      const d = new Date();
      const currentYear = d.getFullYear();
      const currentMonth = d.getMonth();
      notificationEntity.sendAtDayOfMonth = notification.dayOfMonth;
      notificationEntity.sendAtMonths = ((parseInt(notification.year) - currentYear) * 12 - currentMonth + parseInt(notification.month)).toString();
      notificationEntity.sendAtDayOfWeek = '*';
    } else {
      notification.dayOfWeek.forEach((value) => dayOfWeek += `${value},`);
      notificationEntity.sendAtDayOfMonth = '*';
      notificationEntity.sendAtMonths = '*';
      notificationEntity.sendAtDayOfWeek = dayOfWeek.substring(0, dayOfWeek.length - 1);
    }
    notificationEntity.name = notification.name;
    notificationEntity.content = notification.content;
    notificationEntity.isEnable = true;
    notificationEntity.sendAtHour = notification.hour;
    notificationEntity.sendAtMinute = notification.minute;
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
      this.addCronJobForNormalNotification(space.name, result, taggedMembers);
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
    notificationEntity.name = notification.name;
    notificationEntity.content = notification.content;
    notificationEntity.isEnable = true;
    notificationEntity.sendAtHour = notification.hour;
    notificationEntity.sendAtMinute = notification.minute;
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
      this.addCronJobForReminderNotification(space.name, result, taggedMembers);
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
      const job = this.schedulerRegistry.getCronJob(notificationId.toString());
      if (isEnable) {
        job.start();
      } else {
        job.stop();
      }
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
    normalNotification.minute = notification.sendAtMinute;
    normalNotification.hour = notification.sendAtHour;
    normalNotification.type = notification.type;
    normalNotification.keyWord = notification.keyWord;
    normalNotification.fromTime = notification.fromTime;
    normalNotification.toTime = notification.toTime;
    if (notification.sendAtDayOfWeek == '*') {
      normalNotification.dayOfWeek = [];
      const { year, month } = this.calculateMonthAndYear(parseInt(notification.sendAtMonths), notification.createdAt);
      normalNotification.year = year;
      normalNotification.month = month;
      normalNotification.dayOfMonth = notification.sendAtDayOfMonth;
    } else {
      normalNotification.dayOfWeek = notification.sendAtDayOfWeek.split(',').map((day) => {
        return parseInt(day);
      })
      normalNotification.year = '';
      normalNotification.month = '';
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
      const job = this.schedulerRegistry.getCronJob(notificationId.toString());
      job.stop();
      this.schedulerRegistry.deleteCronJob(notificationId.toString());
      return { notificationId: notificationId }
    } catch (error) {
      throw new InternalServerErrorException(`Database connection error: ${error}`);
    }
  }

  async updateNotification(notification: UpdateNotification) {
    console.log(notification)
    const notificationEntity = await this.getNotification(notification.id);
    const tags = notification.tags;
    delete notification.id;
    delete notification.tags;
    try {
      const result = await this.notificationRepo.save({ ...notificationEntity, ...notification });
      if (notification.sendAtDayOfWeek || notification.sendAtHour || notification.sendAtMinute || notification.sendAtDayOfMonth || notification.sendAtMonths) {
        this.updateTimeForCronJob(result);
      }
      if (notification.content || notification.threadId || notification.fromTime || notification.toTime || notification.keyWord) {
        const space = await this.notificationRepo.createQueryBuilder('n')
          .innerJoinAndSelect('n.space', 'spaceInfo')
          .select(['spaceInfo.name AS name'])
          .where('n.id = :id', { id: result.id }).execute();
        const taggedMemberInDb = await this.taggedMemberService.getTaggedMember(result.id);
        const job = this.schedulerRegistry.getCronJob(result.id.toString());
        job.stop();
        this.schedulerRegistry.deleteCronJob(result.id.toString());
        if (tags.length != 0 && notification.content) {
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
          if (result.type == NotificationType.NORMAL) {
            this.addCronJobForNormalNotification(space[0].name, result, taggedMember);
          } else {
            this.addCronJobForReminderNotification(space[0].name, result, taggedMember);
          }
        } else {
          console.log(212312);
          if (result.type == NotificationType.NORMAL) {
            this.addCronJobForNormalNotification(space[0].name, result, taggedMemberInDb);
          } else {
            this.addCronJobForReminderNotification(space[0].name, result, taggedMemberInDb);
          }
        }
      }
    } catch (error) {
      console.log(error)
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

  addCronJobForNormalNotification(spaceName: string, notification: NotificationEntity, members: MemberInfoDto[]) {
    const utcHour = moment(moment(`${notification.sendAtHour}`, 'H')).utcOffset('-0700').format('H');
    let utcDayOfMonth = '';
    if (notification.sendAtDayOfMonth == '*') {
      utcDayOfMonth += '*';
    } else {
      utcDayOfMonth += moment(moment(`${notification.sendAtDayOfMonth} ${notification.sendAtHour}`, 'D H')).utcOffset('-0700').format('D');
    }
    const utcDayOfWeek = this.convertToUtc(notification.sendAtHour, notification.sendAtDayOfWeek);
    const job = new CronJob(`0 ${notification.sendAtMinute} ${utcHour} ${utcDayOfMonth} ${notification.sendAtMonths} ${utcDayOfWeek}`, async () => {
      const result = await createMessage(notification.content, members, spaceName, notification.threadId);
      if (result == 0) {
        await this.updateNotificationStatus(notification.id, false);
      }
    });
    this.schedulerRegistry.addCronJob(notification.id.toString(), job);
    job.start();
    if (!notification.isEnable) {
      job.stop();
    }
  }

  addCronJobForReminderNotification(spaceName: string, notification: NotificationEntity, members: MemberInfoDto[]) {
    const utcHour = moment(moment(`${notification.sendAtHour}`, 'H')).utcOffset('-0700').format('H');
    const utcDayOfWeek = this.convertToUtc(notification.sendAtHour, notification.sendAtDayOfWeek);
    const job = new CronJob(`0 ${notification.sendAtMinute} ${utcHour} * * ${utcDayOfWeek}`, async () => {
      const receivedMessages = await this.receivedMessageService.checkMessage(notification);
      let tagMembers: MemberInfoDto[] = [];
      members.forEach((member) => {
        const isReceived = receivedMessages.filter((message) => {
          return member.name == message.member.name;
        })
        if (isReceived.length == 0) {
          tagMembers.push(member);
        }
      })
      for (let message of receivedMessages) {
        const res = await getMessage(message.messageName);
        const inTaggedMember = members.filter((member) => {
          return message.member.name == member.name;
        })
        if (!res.toLowerCase().includes(notification.keyWord.toLowerCase()) && inTaggedMember.length != 0) {
          tagMembers.push(message.member);
        }
      }
      if (tagMembers.length != 0) {
        const result = await createMessageForReminderNotification(notification.content, tagMembers, members, spaceName, notification.threadId);
        if (result == 0) {
          await this.updateNotificationStatus(notification.id, false);
        }
      }
    });
    this.schedulerRegistry.addCronJob(notification.id.toString(), job);
    job.start();
    if (!notification.isEnable) {
      job.stop();
    }
  }

  checkTag(content: string, tags: MemberInfoDto[]) {
    const taggedMembers = tags.filter((tag) => {
      return content.includes(`@${tag.displayName}`);
    });
    return taggedMembers;
  }

  calculateMonthAndYear(months: number, createdDate: Date) {
    const createdYear = parseInt(moment(createdDate).format('YYYY'));
    const createdMonth = parseInt(moment(createdDate).format('M'));
    const year = Math.floor(months / 12) + (months % 12 + createdMonth - 1 > 12 ? 1 : 0) + createdYear;
    const month = months % 12 + createdMonth - 1 > 12 ? 13 - createdMonth + months % 12 : months % 12 + createdMonth - 1;
    return { year: year.toString(), month: month.toString() };
  }

  convertToUtc(localHour: string, localDayOfWeek: string) {
    if (localDayOfWeek == '*') {
      return localDayOfWeek;
    }
    let utcDayOfWeek = '';
    if (parseInt(localHour) - 7 >= 0) {
      utcDayOfWeek = localDayOfWeek;
    } else {
      localDayOfWeek.split(',').forEach((item) => {
        const day = parseInt(item);
        if (day == 0) {
          utcDayOfWeek += `6,`;
        } else {
          utcDayOfWeek += `${day - 1},`
        }
      })
    }
    const result = utcDayOfWeek.substring(0, localDayOfWeek.length);
    return result;
  }

  updateTimeForCronJob(notification: NotificationEntity) {
    const job = this.schedulerRegistry.getCronJob(notification.id.toString());
    const utcHour = moment(moment(`${notification.sendAtHour}`, 'H')).utcOffset('-0700').format('H');
    const utcDayOfWeek = this.convertToUtc(notification.sendAtHour, notification.sendAtDayOfWeek);
    if (notification.type == NotificationType.NORMAL) {
      let utcDayOfMonth = '';
      if (notification.sendAtDayOfMonth == '*') {
        utcDayOfMonth += '*';
      } else {
        utcDayOfMonth += moment(moment(`${notification.sendAtDayOfMonth} ${notification.sendAtHour}`, 'D H')).utcOffset('-0700').format('D');
      }
      job.setTime(new CronTime(`0 ${notification.sendAtMinute} ${utcHour} ${utcDayOfMonth} ${notification.sendAtMonths} ${utcDayOfWeek}`));
    } else {
      job.setTime(new CronTime(`0 ${notification.sendAtMinute} ${utcHour} * * ${utcDayOfWeek}`));
    }
    if (notification.isEnable) {
      job.start();
    }
  }
}
