import { Module } from '@nestjs/common';
import { ReportModule } from '@report-app/report/report.module';

@Module({
  imports: [ReportModule],
  controllers: [],
  providers: [],
})
export class ReportAppModule {}
