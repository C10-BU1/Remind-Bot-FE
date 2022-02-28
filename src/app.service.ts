import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { config } from 'dotenv';
import { MemberService } from './modules/member/member.service';
import { SpaceService } from './modules/space/space.service';
import { getMembersInSpace, simsimiApi } from 'src/google-chat-apis/google-chat-apis';
import { MemberInSpaceService } from './modules/member-in-space/member-in-space.service';
import { SpaceEntity } from './modules/space/space.entity';
import { MemberRole } from 'src/common/member-role/member-role';
import { NotificationService } from './modules/notification/notification.service';
import { TaggedMemberService } from './modules/tagged-member/tagged-member.service';
import { NotificationType } from './common/notification-type/notification-type';
import { ReceivedMessageService } from './modules/received-message/received-message.service';
import { MemberInfoDto } from './modules/member/dto/member-info.dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob, CronTime } from 'cron';
import * as moment from 'moment';
config()
@Injectable()
export class AppService implements OnModuleInit {

  constructor(
    @Inject(forwardRef(() => MemberService)) private memberService: MemberService,
    @Inject(forwardRef(() => SpaceService)) private spaceService: SpaceService,
    @Inject(forwardRef(() => MemberInSpaceService)) private memberInSpaceService: MemberInSpaceService,
    @Inject(forwardRef(() => NotificationService)) private notificationService: NotificationService,
    @Inject(forwardRef(() => TaggedMemberService)) private taggedMemberService: TaggedMemberService,
    @Inject(forwardRef(() => ReceivedMessageService)) private receivedMessageService: ReceivedMessageService,
    private schedulerRegistry: SchedulerRegistry,
  ) { }
  async onModuleInit() {
    const job = new CronJob(`0 */1 * * * *`, () => {
      this.notificationService.addNotifications();
    });
    this.schedulerRegistry.addCronJob('notification', job);
    job.start();
  }

  async handleEvents(body: any) {
    if (body['type'] === 'ADDED_TO_SPACE') {
      return await this.handEventAddToSpace(body);
    } else if (body['type'] === 'MESSAGE') {
      return await this.handleEventReceivedMessage(body);
    } else if (body['type'] === 'REMOVED_FROM_SPACE') {
      await this.handleEventRemoveFromSpace(body);
    }
  }

  async handEventAddToSpace(data: any) {
    const isAdded = await this.spaceService.findByName(data.space.name);
    if (isAdded) {
      await this.spaceService.updateSpaceStatus(isAdded, true);
      return { text: `Thank for adding me to space ${data['space']['displayName']}` };
    } else {
      const space = await this.spaceService.addSpace(data.space.name, data.space.displayName);
      const listMember = await getMembersInSpace(space.name);
      //   const member = await this.memberService.findByEmail(data.user.email);
      for (let member of listMember) {
        if (data.user.name == member.member.name) {
          await this.addMemberToSpace(space, data.user.displayName, data.user.name, MemberRole.OWNER);
        } else {
          await this.addMemberToSpace(space, member.member.displayName, member.member.name, MemberRole.MEMBER);
        }
      }
      return { text: `Vivu hiện đã active trong space. Truy cập https://remindbot.tk để cài đặt thông báo` };
    }
  }

  async handleEventReceivedMessage(data: any) {
    const message = data.message.argumentText.trim() as string;
    const space = await this.spaceService.findByName(data.space.name);
    const member = await this.memberService.findByName(data.user.name);
    if (message == 'update') {
      if (member == null) {
        const newMember = await this.memberService.addMember(data.user.email, data.user.displayName, data.user.avatarUrl, null, data.user.name);
        await this.memberInSpaceService.addMemberToSpace(space, newMember, MemberRole.MEMBER);
      } else {
        const memberInfo = new MemberInfoDto(); 
        memberInfo.email = data.user.email;
        memberInfo.imageUrl = data.user.avatarUrl;
        memberInfo.displayName = data.user.displayName;
        await this.memberService.updateMember(memberInfo, member);
      }
      return { text: `<${data.user.name}> cập nhật thành công` };
    }
    else if (message == 'thread') {
      return { text: `ThreadID của thread này là: ${data.message.thread.name}` };
    }
    else {
      const threadId = data.message.thread.name;
      const notification = await this.notificationService.checkThreadId(threadId);
      if (notification != null) {
        const member = await this.memberService.findByName(data.user.name);
        const receivedMessageEntity = await this.receivedMessageService.checkIsExist(notification, member, new Date());
        if (receivedMessageEntity == null) {
          await this.receivedMessageService.addMessage(data.message.name, notification, member);
        } else {
          await this.receivedMessageService.updateMessageName(receivedMessageEntity, data.message.name);
        }
      }
      else{
        const resMessage = await simsimiApi(message);
        return { text: `<${data.user.name}> ${resMessage}` };
      }
    }
  }

  async handleEventRemoveFromSpace(data: any) {
    const space = await this.spaceService.findByName(data.space.name);
    const result = await this.spaceService.updateSpaceStatus(space, false);
  }

  async addMemberToSpace(space: SpaceEntity, memberDisplayName: string, memberName: string, role: string) {
    const member = await this.memberService.findByName(memberName);
    if (member == null) {
      const newMember = await this.memberService.addMember(null, memberDisplayName, null, null, memberName);
      await this.memberInSpaceService.addMemberToSpace(space, newMember, role);
    } else {
      await this.memberService.updateMemberName(member, memberName);
      await this.memberInSpaceService.addMemberToSpace(space, member, role);
    }
  }


}
