import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ARSnapshotCreateDto, ARSnapshotListDto } from '@shared/dto/ar.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';

@Controller('ar')
export class ArController {
  constructor(@Inject('AR_SERVICE') private readonly arService: ClientProxy) {}

  private async sendWithRetry<T>(pattern: string, data: unknown): Promise<T> {
    return firstValueFrom(
      this.arService.send<T>(pattern, data).pipe(
        timeout(5000),
        retry({ count: 1, delay: 5000 }),
        catchError(error => {
          throw new HttpException(
            error.message || 'Service communication failed',
            error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
  }

  @Post('snapshots')
  @UseGuards(AuthGuard)
  async createSnapshot(@Body() dto: ARSnapshotCreateDto) {
    return this.sendWithRetry(EVENTS.AR.SNAPSHOT_CREATE, dto);
  }

  @Get('snapshots')
  async listSnapshots(@Query() query: ARSnapshotListDto) {
    return this.sendWithRetry(EVENTS.AR.SNAPSHOT_LIST, query);
  }
}
