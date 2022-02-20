import { forwardRef, Module } from '@nestjs/common';
import { TaggedMemberService } from './tagged-member.service';
import { TaggedMemberController } from './tagged-member.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaggedMemberEntity } from './tagged-member.entity';
import { MemberModule } from '../member/member.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([TaggedMemberEntity]), forwardRef(() => MemberModule), forwardRef(() => NotificationModule)],
  controllers: [TaggedMemberController],
  providers: [TaggedMemberService],
  exports: [TaggedMemberService]
})
export class TaggedMemberModule {}
