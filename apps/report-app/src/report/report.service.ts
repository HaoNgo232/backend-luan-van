import { Injectable } from '@nestjs/common';
import { SalesSummaryDto, ProductPerformanceDto, UserCohortDto } from '@shared/dto/report.dto';

@Injectable()
export class ReportService {
  async salesSummary(_dto: SalesSummaryDto) {}

  async productPerformance(_dto: ProductPerformanceDto) {}

  async userCohort(_dto: UserCohortDto) {}
}
