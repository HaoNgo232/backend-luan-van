import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class DateRangeDto {
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  from: string;

  @IsNotEmpty()
  @IsString()
  @IsDateString()
  to: string;
}

export class SalesSummaryDto extends DateRangeDto {}

export class ProductPerformanceDto extends DateRangeDto {}

export class UserCohortDto extends DateRangeDto {}
