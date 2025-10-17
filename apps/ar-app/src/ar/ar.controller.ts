import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ArService } from '@ar-app/ar/ar.service';
import { EVENTS } from '@shared/events';
import { ARSnapshotCreateDto, ARSnapshotListDto } from '@shared/dto/ar.dto';

@Controller()
export class ArController {
  constructor(private readonly arService: ArService) {}

  @MessagePattern(EVENTS.AR.SNAPSHOT_CREATE)
  snapshotCreate(@Payload() dto: ARSnapshotCreateDto) {
    return this.arService.snapshotCreate(dto);
  }

  @MessagePattern(EVENTS.AR.SNAPSHOT_LIST)
  snapshotList(@Payload() dto: ARSnapshotListDto) {
    return this.arService.snapshotList(dto);
  }
}
