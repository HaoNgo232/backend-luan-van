import { Injectable } from '@nestjs/common';
import {
  SalesSummaryDto,
  ProductPerformanceDto,
  UserCohortDto,
} from '@shared/dto/report.dto';

@Injectable()
export class ReportService {
  async salesSummary(dto: SalesSummaryDto) {}

  async productPerformance(dto: ProductPerformanceDto) {}

  async userCohort(dto: UserCohortDto) {}
}
