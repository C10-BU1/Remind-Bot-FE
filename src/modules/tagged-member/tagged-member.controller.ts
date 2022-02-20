import { Controller } from '@nestjs/common';
import { TaggedMemberService } from './tagged-member.service';

@Controller('tagged-member')
export class TaggedMemberController {
  constructor(private readonly taggedMemberService: TaggedMemberService) {}
}
