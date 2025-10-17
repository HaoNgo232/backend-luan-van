import { Controller } from '@nestjs/common';
import { ArService } from './ar.service';

@Controller()
export class ArController {
  constructor(private readonly arService: ArService) {}
}
