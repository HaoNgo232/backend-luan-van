import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '@product-app/prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    category: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCategory = {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    parent: null,
    children: [],
  };

  const mockChildCategory = {
    id: 'cat-2',
    name: 'Smartphones',
    slug: 'smartphones',
    description: 'Mobile phones',
    parentId: 'cat-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    parent: mockCategory,
    children: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getById', () => {
    it('should return a category when found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.getById({ id: 'cat-1' });

      expect(result).toBeDefined();
      expect(result.id).toBe('cat-1');
      expect(result.name).toBe('Electronics');
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        include: {
          parent: true,
          children: true,
        },
      });
    });

    it('should throw NotFoundException when category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.getById({ id: 'non-existent' })).rejects.toThrow(NotFoundException);
      await expect(service.getById({ id: 'non-existent' })).rejects.toThrow(
        'Category with ID non-existent not found',
      );
    });

    it('should throw BadRequestException on database error', async () => {
      mockPrismaService.category.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.getById({ id: 'cat-1' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBySlug', () => {
    it('should return a category when found by slug', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.getBySlug({ slug: 'electronics' });

      expect(result).toBeDefined();
      expect(result.slug).toBe('electronics');
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'electronics' },
        include: {
          parent: true,
          children: true,
        },
      });
    });

    it('should throw NotFoundException when category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.getBySlug({ slug: 'non-existent' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated categories', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);
      mockPrismaService.category.count.mockResolvedValue(1);

      const result = await service.list({ page: 1, pageSize: 20 });

      expect(result).toBeDefined();
      expect(result.categories).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should apply search filter', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);
      mockPrismaService.category.count.mockResolvedValue(0);

      await service.list({ q: 'search term', page: 1, pageSize: 20 });

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should filter by parent slug', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.category.findMany.mockResolvedValue([mockChildCategory]);
      mockPrismaService.category.count.mockResolvedValue(1);

      const result = await service.list({ parentSlug: 'electronics' });

      expect(result.categories).toHaveLength(1);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'electronics' },
      });
    });

    it('should return empty results if parent not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      const result = await service.list({ parentSlug: 'non-existent' });

      expect(result.categories).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Category',
      slug: 'new-category',
      description: 'A new category',
      parentId: undefined,
    };

    it('should create a new category successfully', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue({
        ...mockCategory,
        name: 'New Category',
        slug: 'new-category',
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('New Category');
      expect(prisma.category.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        "Category with slug 'new-category' already exists",
      );
    });

    it('should throw BadRequestException if parent not found', async () => {
      mockPrismaService.category.findUnique
        .mockResolvedValueOnce(null) // Slug check
        .mockResolvedValueOnce(null); // Parent check

      await expect(service.create({ ...createDto, parentId: 'non-existent' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create child category with valid parent', async () => {
      mockPrismaService.category.findUnique
        .mockResolvedValueOnce(null) // Slug check
        .mockResolvedValueOnce(mockCategory); // Parent check
      mockPrismaService.category.create.mockResolvedValue(mockChildCategory);

      const result = await service.create({
        ...createDto,
        parentId: 'cat-1',
      });

      expect(result).toBeDefined();
      expect(result.parentId).toBe('cat-1');
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Category',
      description: 'Updated description',
    };

    it('should update a category successfully', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.category.update.mockResolvedValue({
        ...mockCategory,
        ...updateDto,
      });

      const result = await service.update('cat-1', updateDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Category');
      expect(prisma.category.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new slug already exists', async () => {
      mockPrismaService.category.findUnique
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce({ ...mockCategory, id: 'different-id' });

      await expect(service.update('cat-1', { slug: 'existing-slug' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if trying to set self as parent', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      await expect(service.update('cat-1', { parentId: 'cat-1' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('cat-1', { parentId: 'cat-1' })).rejects.toThrow(
        'Category cannot be its own parent',
      );
    });

    it('should throw BadRequestException for circular reference', async () => {
      // Setup: A (cat-1) -> B (cat-2)
      // Trying to set A.parentId = B (makes B parent of A, but B is child of A - circular!)
      
      mockPrismaService.category.findUnique
        .mockResolvedValueOnce(mockCategory) // 1. existing check - cat-1 exists
        .mockResolvedValueOnce({
          // 2. parent check - cat-2 exists
          id: 'cat-2',
          name: 'Child Category',
          slug: 'child',
          parentId: 'cat-1', // B's parent is A
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          // 3. checkCircularReference - get cat-2's parentId
          parentId: 'cat-1', // B points to A
        });

      await expect(service.update('cat-1', { parentId: 'cat-2' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('cat-1', { parentId: 'cat-2' })).rejects.toThrow(
        /circular reference/,
      );
    });

    it('should throw BadRequestException for deep circular reference (grandchild)', async () => {
      // Setup: A (cat-1) -> B (cat-2) -> C (cat-3)
      // Trying to set A.parentId = C (makes C parent of A, but C is descendant of A - circular!)
      const grandchildCategory = {
        id: 'cat-3',
        name: 'Grandchild',
        slug: 'grandchild',
        description: null,
        parentId: 'cat-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.category.findUnique
        .mockResolvedValueOnce(mockCategory) // 1. existing check - cat-1 exists
        .mockResolvedValueOnce(grandchildCategory) // 2. parent check - cat-3 exists
        // checkCircularReference traversal (starting from cat-3, looking for cat-1):
        .mockResolvedValueOnce({ parentId: 'cat-2' }) // 3. cat-3's parent is cat-2
        .mockResolvedValueOnce({ parentId: 'cat-1' }); // 4. cat-2's parent is cat-1 (FOUND circular!)

      await expect(service.update('cat-1', { parentId: 'cat-3' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('cat-1', { parentId: 'cat-3' })).rejects.toThrow(
        /circular reference/,
      );
    });
  });

  describe('delete', () => {
    it('should delete a category successfully', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        ...mockCategory,
        children: [],
        products: [],
      });
      mockPrismaService.category.delete.mockResolvedValue(mockCategory);

      const result = await service.delete('cat-1');

      expect(result).toEqual({ success: true, id: 'cat-1' });
      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if category has children', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        ...mockCategory,
        children: [mockChildCategory],
        products: [],
      });

      await expect(service.delete('cat-1')).rejects.toThrow(BadRequestException);
      await expect(service.delete('cat-1')).rejects.toThrow(
        /Cannot delete category with child categories/,
      );
    });

    it('should throw BadRequestException if category has products', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        ...mockCategory,
        children: [],
        products: [{ id: 'prod-1', name: 'Product 1' }],
      });

      await expect(service.delete('cat-1')).rejects.toThrow(BadRequestException);
      await expect(service.delete('cat-1')).rejects.toThrow(/Cannot delete category with products/);
    });
  });
});
