import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReportService } from '@report-app/report/report.service';
import { EVENTS } from '@shared/events';
import {
  SalesSummaryDto,
  ProductPerformanceDto,
  UserCohortDto,
} from '@shared/dto/report.dto';

@Controller()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @MessagePattern(EVENTS.REPORT.SALES_SUMMARY)
  salesSummary(@Payload() dto: SalesSummaryDto) {
    return this.reportService.salesSummary(dto);
  }

  @MessagePattern(EVENTS.REPORT.PRODUCT_PERF)
  productPerformance(@Payload() dto: ProductPerformanceDto) {
    return this.reportService.productPerformance(dto);
  }

  @MessagePattern(EVENTS.REPORT.USER_COHORT)
  userCohort(@Payload() dto: UserCohortDto) {
    return this.reportService.userCohort(dto);
  }
}
