import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReviewStatus, UserRole } from '@prisma/client';
import { Public } from '../../../common/decorators/public.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto, ModerateReviewDto } from './dto/review.dto.js';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Submit a review (customer)' })
  create(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, req.user.tenantId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List approved reviews for a product (public)',
  })
  @ApiQuery({ name: 'productId', required: true })
  @ApiQuery({ name: 'tenant', required: true, example: 'corekit' })
  async listForProduct(
    @Query('productId') productId: string,
    @Query('tenant') tenantSlug: string,
  ) {
    if (!productId || !tenantSlug) {
      throw new BadRequestException(
        'productId and tenant query parameters are required',
      );
    }
    // Scope by tenantSlug — look up tenantId via productId match
    return this.reviewsService.listApprovedForProduct(productId, tenantSlug);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('admin')
  @ApiOperation({ summary: 'List reviews for moderation (admin/staff)' })
  @ApiQuery({ name: 'status', required: false, enum: ReviewStatus })
  listForAdmin(@Request() req: any, @Query('status') status?: ReviewStatus) {
    return this.reviewsService.listForModeration(req.user.tenantId, status);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('admin/stats')
  @ApiOperation({ summary: 'Review status counts (admin/staff)' })
  stats(@Request() req: any) {
    return this.reviewsService.stats(req.user.tenantId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id/moderate')
  @ApiOperation({ summary: 'Approve or reject a review' })
  moderate(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderate(id, req.user.tenantId, dto, req.user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review (admin only)' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.reviewsService.remove(id, req.user.tenantId);
  }
}
