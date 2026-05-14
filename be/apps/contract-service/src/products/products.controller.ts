import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ProductDto,
  CreateProductDto,
  ListResponse,
  CurrentUser,
  JwtPayload,
  Roles,
  Public,
} from '@trustagri/shared';
import { ProductsService } from './products.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

/**
 * Chợ nông sản — sản phẩm marketplace
 *
 * GET  /api/v1/products          — public, danh sách + lọc
 * GET  /api/v1/products/:id      — public, chi tiết
 * POST /api/v1/products          — trader, tạo sản phẩm
 * PUT  /api/v1/products/:id      — trader owner, cập nhật
 * DELETE /api/v1/products/:id    — trader owner, soft delete
 */
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /api/v1/products
   * Danh sách sản phẩm công khai với lọc và phân trang.
   * Không yêu cầu xác thực.
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'List marketplace products with filters (public, no auth required)' })
  @ApiResponse({ status: 200, description: 'Paginated list of active products' })
  listProducts(
    @Query() query: ProductQueryDto,
  ): Promise<ListResponse<ProductDto>> {
    return this.productsService.listProducts(query);
  }

  /**
   * GET /api/v1/products/:id
   * Chi tiết sản phẩm công khai.
   * Không yêu cầu xác thực.
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product details by ID (public, no auth required)' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getProduct(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ProductDto> {
    return this.productsService.getProduct(id);
  }

  /**
   * POST /api/v1/products
   * Tạo sản phẩm mới. Chỉ dành cho thương lái.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('trader')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new marketplace product (trader only)' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - trader role required' })
  createProduct(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductDto> {
    return this.productsService.createProduct(dto, user.sub);
  }

  /**
   * PUT /api/v1/products/:id
   * Cập nhật sản phẩm. Chỉ thương lái chủ sở hữu.
   */
  @Put(':id')
  @Roles('trader')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (owner trader only)' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only owner trader' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  updateProduct(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductDto> {
    return this.productsService.updateProduct(id, dto, user.sub);
  }

  /**
   * DELETE /api/v1/products/:id
   * Xóa mềm sản phẩm. Chỉ thương lái chủ sở hữu.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('trader')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a product (owner trader only)' })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only owner trader' })
  deleteProduct(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.productsService.deleteProduct(id, user.sub);
  }
}
