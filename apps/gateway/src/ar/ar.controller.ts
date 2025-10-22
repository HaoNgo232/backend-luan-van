import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ARSnapshotCreateDto, ARSnapshotListDto } from '@shared/dto/ar.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { BaseGatewayController } from '../base.controller';

@Controller('ar')
export class ArController extends BaseGatewayController {
  constructor(@Inject('AR_SERVICE') protected readonly service: ClientProxy) {
    super(service);
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
