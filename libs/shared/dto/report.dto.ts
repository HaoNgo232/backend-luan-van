export class DateRangeDto {
  from: string;
  to: string;
}

export class SalesSummaryDto extends DateRangeDto {}

export class ProductPerformanceDto extends DateRangeDto {}

export class UserCohortDto extends DateRangeDto {}
