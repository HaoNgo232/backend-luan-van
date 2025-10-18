import { Injectable } from '@nestjs/common';
import { ARSnapshotCreateDto, ARSnapshotListDto } from '@shared/dto/ar.dto';

@Injectable()
export class ArService {
  async snapshotCreate(_dto: ARSnapshotCreateDto) {}

  async snapshotList(_dto: ARSnapshotListDto) {}
}
