import { Injectable } from '@nestjs/common';
import {
  SalesSummaryDto,
  ProductPerformanceDto,
  UserCohortDto,
} from '@shared/dto/report.dto';

@Injectable()
export class ReportService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async salesSummary(_dto: SalesSummaryDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async productPerformance(_dto: ProductPerformanceDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async userCohort(_dto: UserCohortDto) {}
}
