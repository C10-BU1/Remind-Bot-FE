import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService{

  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
  ) { }
}
