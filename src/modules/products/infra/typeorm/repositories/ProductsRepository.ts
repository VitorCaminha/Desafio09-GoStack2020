import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsId = products.map(product => product.id);

    const storedProducts = await this.ormRepository.find({
      where: { id: In(productsId) },
    });

    return storedProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsId = products.map(product => product.id);

    const storedProducts = await this.ormRepository.find({
      where: { id: In(productsId) },
    });

    const updatedProducts = products.map(product => {
      const productToUpdate = storedProducts.find(
        storedProduct => storedProduct.id === product.id,
      );

      if (!productToUpdate) {
        throw new AppError('Product not found.', 404);
      }

      productToUpdate.quantity = product.quantity;

      return productToUpdate;
    });

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
