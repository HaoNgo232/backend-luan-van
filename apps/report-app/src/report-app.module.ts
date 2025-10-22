import { Module } from '@nestjs/common';
import { JwtModule } from '@shared/main';
import { ReportModule } from '@report-app/report/report.module';
import { PrismaService } from '@report-app/prisma/prisma.service';

@Module({
  imports: [JwtModule, ReportModule],
  controllers: [],
  providers: [PrismaService],
})
export class ReportAppModule {}
