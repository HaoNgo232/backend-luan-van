import { prisma } from '@user-app/prisma/prisma.client';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaService } from '@product-app/prisma/prisma.service';
import { ProductQueryBuilder } from '@product-app/products/builders/product-query.builder';
import { ProductValidator } from '@product-app/products/validators/product.validator';
import { ProductMapper } from '@product-app/products/mappers/product.mapper';

describe('ProductsController', () => {
  let controller: ProductsController;
  let prisma: PrismaService;
  let service: ProductsService;
  let validator: ProductValidator;
  let queryBuilder: ProductQueryBuilder;
  let mapper: ProductMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        PrismaService,
        ProductValidator,
        ProductQueryBuilder,
        ProductMapper,
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    prisma = module.get<PrismaService>(PrismaService);
    service = module.get<ProductsService>(ProductsService);
    validator = module.get<ProductValidator>(ProductValidator);
    queryBuilder = module.get<ProductQueryBuilder>(ProductQueryBuilder);
    mapper = module.get<ProductMapper>(ProductMapper);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
