import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found.');
    }

    const productsId = products.map(product => ({ id: product.id }));

    const allProducts = await this.productsRepository.findAllById(productsId);

    if (products.length !== allProducts.length) {
      throw new AppError('Invalid product on order');
    }

    const orderProducts = allProducts.map(product => {
      const productFromOrder = products.find(
        orderProduct => orderProduct.id === product.id,
      );

      if (!productFromOrder) {
        throw new AppError('Product not found.');
      }

      if (product.quantity < productFromOrder.quantity) {
        throw new AppError('Insufficient product quantity');
      }

      return {
        product_id: product.id,
        price: product.price,
        quantity: productFromOrder.quantity,
      };
    });

    const order = this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    const subtractedProducts = allProducts.map(product => {
      const productFromOrder = products.find(
        orderProduct => orderProduct.id === product.id,
      );

      if (!productFromOrder) {
        throw new AppError('Product not found.');
      }

      return {
        id: product.id,
        quantity: product.quantity - productFromOrder.quantity,
      };
    });

    await this.productsRepository.updateQuantity(subtractedProducts);

    return order;
  }
}

export default CreateOrderService;
