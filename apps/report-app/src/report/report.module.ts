import { Module } from '@nestjs/common';
import { ReportService } from '@report-app/report/report.service';
import { ReportController } from '@report-app/report/report.controller';
import { PrismaService } from '@report-app/prisma/prisma.service';

@Module({
  controllers: [ReportController],
  providers: [ReportService, PrismaService],
  exports: [ReportService],
})
export class ReportModule {}
