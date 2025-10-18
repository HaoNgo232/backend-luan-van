import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class DateRangeDto {
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  fromAt: string;

  @IsNotEmpty()
  @IsString()
  @IsDateString()
  toAt: string;
}

export class SalesSummaryDto extends DateRangeDto {}

export class ProductPerformanceDto extends DateRangeDto {}

export class UserCohortDto extends DateRangeDto {}
