import { Injectable } from '@nestjs/common';
import { ARSnapshotCreateDto, ARSnapshotListDto } from '@shared/dto/ar.dto';

@Injectable()
export class ArService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async snapshotCreate(_dto: ARSnapshotCreateDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async snapshotList(_dto: ARSnapshotListDto) {}
}
