import { forwardRef, Module } from '@nestjs/common';
import { SpaceService } from './space.service';
import { SpaceController } from './space.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpaceEntity } from './space.entity';
import { MemberInSpaceModule } from '../member-in-space/member-in-space.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports:[TypeOrmModule.forFeature([SpaceEntity, ]), forwardRef(() => MemberInSpaceModule), forwardRef(() => NotificationModule)],
  controllers: [SpaceController],
  providers: [SpaceService],
  exports: [SpaceService]
})
export class SpaceModule {}
