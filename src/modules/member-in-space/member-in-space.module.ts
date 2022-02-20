import { forwardRef, Module } from '@nestjs/common';
import { MemberInSpaceService } from './member-in-space.service';
import { MemberInSpaceController } from './member-in-space.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberInSpaceEntity } from './member-in-space.entity';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [TypeOrmModule.forFeature([MemberInSpaceEntity]), forwardRef(() => MemberModule)],
  controllers: [MemberInSpaceController],
  providers: [MemberInSpaceService],
  exports: [MemberInSpaceService]
})
export class MemberInSpaceModule {}
