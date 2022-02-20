import { forwardRef, Module } from '@nestjs/common';
import { ReceivedMessageService } from './received-message.service';
import { ReceivedMessageController } from './received-message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceivedMessageEntity } from './received-message.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReceivedMessageEntity]), forwardRef(() => NotificationModule)],
  controllers: [ReceivedMessageController],
  providers: [ReceivedMessageService],
  exports: [ReceivedMessageService]
})
export class ReceivedMessageModule {}
