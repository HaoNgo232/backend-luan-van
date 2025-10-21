import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '@product-app/prisma/prisma.service';
import { ProductMapper } from './mappers/product.mapper';
import { ProductValidator } from './validators/product.validator';
import { ProductQueryBuilder } from './builders/product-query.builder';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;
  let mapper: ProductMapper;
  let validator: ProductValidator;
  let queryBuilder: ProductQueryBuilder;

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
  };

  const mockProductMapper = {
    mapToProductResponse: jest.fn(),
    mapManyToProductResponse: jest.fn(),
  };

  const mockProductValidator = {
    validateUniqueSKUAndSlug: jest.fn(),
    validateSlugForUpdate: jest.fn(),
    validateCategoryExists: jest.fn(),
    validateStockChangeQuantity: jest.fn(),
    validateSufficientStock: jest.fn(),
  };

  const mockProductQueryBuilder = {
    buildWhereClause: jest.fn(),
    getPaginationParams: jest.fn(),
    getPaginationMetadata: jest.fn(),
  };

  const mockProduct = {
    id: 'prod-1',
    sku: 'SKU-001',
    name: 'Test Product',
    slug: 'test-product',
    priceInt: 1999,
    stock: 10,
    description: 'Test description',
    imageUrls: ['image1.jpg'],
    categoryId: 'cat-1',
    attributes: { color: 'red' },
    model3dUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-1',
      name: 'Test Category',
      slug: 'test-category',
      description: null,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ProductMapper,
          useValue: mockProductMapper,
        },
        {
          provide: ProductValidator,
          useValue: mockProductValidator,
        },
        {
          provide: ProductQueryBuilder,
          useValue: mockProductQueryBuilder,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
    mapper = module.get<ProductMapper>(ProductMapper);
    validator = module.get<ProductValidator>(ProductValidator);
    queryBuilder = module.get<ProductQueryBuilder>(ProductQueryBuilder);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getById', () => {
    it('should return a product when found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockProductMapper.mapToProductResponse.mockReturnValue(mockProduct);

      const result = await service.getById({ id: 'prod-1' });

      expect(result).toBeDefined();
      expect(result.id).toBe('prod-1');
      expect(result.name).toBe('Test Product');
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        include: { category: true },
      });
      expect(mapper.mapToProductResponse).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.getById({ id: 'non-existent' })).rejects.toThrow(NotFoundException);
      await expect(service.getById({ id: 'non-existent' })).rejects.toThrow(
        'Product with ID non-existent not found',
      );
    });

    it('should throw BadRequestException on database error', async () => {
      mockPrismaService.product.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.getById({ id: 'prod-1' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBySlug', () => {
    it('should return a product when found by slug', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockProductMapper.mapToProductResponse.mockReturnValue(mockProduct);

      const result = await service.getBySlug({ slug: 'test-product' });

      expect(result).toBeDefined();
      expect(result.slug).toBe('test-product');
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-product' },
        include: { category: true },
      });
      expect(mapper.mapToProductResponse).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.getBySlug({ slug: 'non-existent' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated products', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);
      mockProductQueryBuilder.getPaginationParams.mockReturnValue({ skip: 0, take: 20 });
      mockProductQueryBuilder.buildWhereClause.mockReturnValue({});
      mockProductQueryBuilder.getPaginationMetadata.mockReturnValue({
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
      mockProductMapper.mapManyToProductResponse.mockReturnValue([mockProduct]);

      const result = await service.list({ page: 1, pageSize: 20 });

      expect(result).toBeDefined();
      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should apply search filter', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);
      mockProductQueryBuilder.getPaginationParams.mockReturnValue({ skip: 0, take: 20 });
      mockProductQueryBuilder.buildWhereClause.mockReturnValue({
        OR: expect.any(Array),
      });
      mockProductQueryBuilder.getPaginationMetadata.mockReturnValue({
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });
      mockProductMapper.mapManyToProductResponse.mockReturnValue([]);

      await service.list({ q: 'search term', page: 1, pageSize: 20 });

      expect(queryBuilder.buildWhereClause).toHaveBeenCalled();
    });

    it('should apply category filter', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);
      mockProductQueryBuilder.getPaginationParams.mockReturnValue({ skip: 0, take: 20 });
      mockProductQueryBuilder.buildWhereClause.mockReturnValue({
        category: { slug: 'test-category' },
      });
      mockProductQueryBuilder.getPaginationMetadata.mockReturnValue({
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });
      mockProductMapper.mapManyToProductResponse.mockReturnValue([]);

      await service.list({ categorySlug: 'test-category' });

      expect(queryBuilder.buildWhereClause).toHaveBeenCalled();
    });

    it('should apply price range filters', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);
      mockProductQueryBuilder.getPaginationParams.mockReturnValue({ skip: 0, take: 20 });
      mockProductQueryBuilder.buildWhereClause.mockReturnValue({
        priceInt: { gte: 1000, lte: 2000 },
      });
      mockProductQueryBuilder.getPaginationMetadata.mockReturnValue({
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });
      mockProductMapper.mapManyToProductResponse.mockReturnValue([]);

      await service.list({ minPriceInt: 1000, maxPriceInt: 2000 });

      expect(queryBuilder.buildWhereClause).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const createDto = {
      sku: 'SKU-002',
      name: 'New Product',
      slug: 'new-product',
      priceInt: 2999,
      stock: 5,
      description: 'New product description',
      imageUrls: ['new-image.jpg'],
      categoryId: 'cat-1',
      attributes: { size: 'large' },
      model3dUrl: undefined,
    };

    it('should create a new product successfully', async () => {
      mockProductValidator.validateUniqueSKUAndSlug.mockResolvedValue(undefined);
      mockProductValidator.validateCategoryExists.mockResolvedValue(undefined);
      mockPrismaService.product.create.mockResolvedValue({
        ...mockProduct,
        ...createDto,
      });
      mockProductMapper.mapToProductResponse.mockReturnValue({
        ...mockProduct,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.sku).toBe('SKU-002');
      expect(validator.validateUniqueSKUAndSlug).toHaveBeenCalledWith('SKU-002', 'new-product');
      expect(validator.validateCategoryExists).toHaveBeenCalledWith('cat-1');
      expect(prisma.product.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if SKU already exists', async () => {
      mockProductValidator.validateUniqueSKUAndSlug.mockRejectedValue(
        new ConflictException("Product with SKU 'SKU-002' already exists"),
      );

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        "Product with SKU 'SKU-002' already exists",
      );
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockProductValidator.validateUniqueSKUAndSlug.mockRejectedValue(
        new ConflictException("Product with slug 'new-product' already exists"),
      );

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        "Product with slug 'new-product' already exists",
      );
    });

    it('should throw BadRequestException if category not found', async () => {
      mockProductValidator.validateUniqueSKUAndSlug.mockResolvedValue(undefined);
      mockProductValidator.validateCategoryExists.mockRejectedValue(
        new BadRequestException('Category with ID cat-1 not found'),
      );

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Product',
      priceInt: 2499,
    };

    it('should update a product successfully', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockProductValidator.validateSlugForUpdate.mockResolvedValue(undefined);
      mockProductValidator.validateCategoryExists.mockResolvedValue(undefined);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        ...updateDto,
      });
      mockProductMapper.mapToProductResponse.mockReturnValue({
        ...mockProduct,
        ...updateDto,
      });

      const result = await service.update('prod-1', updateDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Product');
      expect(prisma.product.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new slug already exists', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockProductValidator.validateSlugForUpdate.mockRejectedValue(
        new ConflictException("Product with slug 'existing-slug' already exists"),
      );

      await expect(service.update('prod-1', { slug: 'existing-slug' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a product successfully', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.delete.mockResolvedValue(mockProduct);

      const result = await service.delete('prod-1');

      expect(result).toEqual({ success: true, id: 'prod-1' });
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('incrementStock', () => {
    it('should increment stock successfully', async () => {
      mockProductValidator.validateStockChangeQuantity.mockReturnValue(undefined);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        stock: 15,
      });

      const result = await service.incrementStock({
        productId: 'prod-1',
        quantity: 5,
      });

      expect(result).toEqual({
        productId: 'prod-1',
        previousStock: 10,
        newStock: 15,
        quantityChanged: 5,
      });
      expect(validator.validateStockChangeQuantity).toHaveBeenCalledWith(5);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stock: 15 },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductValidator.validateStockChangeQuantity.mockReturnValue(undefined);
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.incrementStock({ productId: 'non-existent', quantity: 5 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('decrementStock', () => {
    it('should decrement stock successfully', async () => {
      mockProductValidator.validateStockChangeQuantity.mockReturnValue(undefined);
      mockProductValidator.validateSufficientStock.mockReturnValue(undefined);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        stock: 7,
      });

      const result = await service.decrementStock({
        productId: 'prod-1',
        quantity: 3,
      });

      expect(result).toEqual({
        productId: 'prod-1',
        previousStock: 10,
        newStock: 7,
        quantityChanged: 3,
      });
      expect(validator.validateStockChangeQuantity).toHaveBeenCalledWith(3);
      expect(validator.validateSufficientStock).toHaveBeenCalledWith(10, 3);
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      mockProductValidator.validateStockChangeQuantity.mockReturnValue(undefined);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockProductValidator.validateSufficientStock.mockImplementation(() => {
        throw new BadRequestException('Insufficient stock. Available: 10, Requested: 15');
      });

      await expect(service.decrementStock({ productId: 'prod-1', quantity: 15 })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.decrementStock({ productId: 'prod-1', quantity: 15 })).rejects.toThrow(
        /Insufficient stock/,
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductValidator.validateStockChangeQuantity.mockReturnValue(undefined);
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.decrementStock({ productId: 'non-existent', quantity: 5 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
