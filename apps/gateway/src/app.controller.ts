import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AppService } from '@gateway/app.service';
import { EVENTS } from '@shared/events';
import { firstValueFrom } from 'rxjs';
import { timeout, retry } from 'rxjs/operators';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('USER_SERVICE') private userService: ClientProxy,
    @Inject('PRODUCT_SERVICE') private productService: ClientProxy,
    @Inject('CART_SERVICE') private cartService: ClientProxy,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('users/by-id')
  async getUserById(@Query('id') id: string) {
    return firstValueFrom(
      this.userService
        .send(EVENTS.USER.FIND_BY_ID, id)
        .pipe(timeout(5000), retry(1)),
    );
  }

  @Get('products/by-slug')
  async getProductBySlug(@Query('slug') slug: string) {
    return firstValueFrom(
      this.productService
        .send(EVENTS.PRODUCT.GET_BY_SLUG, { slug })
        .pipe(timeout(5000), retry(1)),
    );
  }

  @Get('cart')
  async getCart(@Query('sessionId') sessionId: string) {
    return firstValueFrom(
      this.cartService
        .send(EVENTS.CART.GET, { sessionId })
        .pipe(timeout(5000), retry(1)),
    );
  }
}
