import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundError } from 'rxjs';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Connection, Repository } from 'typeorm';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { Coffee } from './entities/coffee.entity';
import { FlavorEntity } from './entities/flavor.entity';

@Injectable()
export class CoffeesService {
  // private coffees: Coffee[] = [
  //   {
  //     id: 1,
  //     name: 'shipwreck Roast',
  //     brand: 'Buddy Brew',
  //     flavor: ['chocolate', 'Vanilla'],
  //   },
  // ];

  constructor(
    @InjectRepository(Coffee)
    private readonly coffeeRepository: Repository<Coffee>,
    @InjectRepository(FlavorEntity)
    private readonly flavorRepository: Repository<FlavorEntity>,
  ) {}

  findAll(paginationQuery: PaginationQueryDto) {
    const { limit, offset } = paginationQuery;
    return this.coffeeRepository.find({
      relations: ['flavor'],
      skip: offset,
      take: limit,
    });
  }

  async findOne(id) {
    const coffee = await this.coffeeRepository.findOne({
      where: { id },
      relations: ['flavor'],
    });
    if (!coffee) {
      throw new NotFoundException(`coffees #${id} not found`);
    }
    return coffee;
  }

  async create(createCoffeeDto: CreateCoffeeDto) {
    const flavor = await Promise.all(
      createCoffeeDto.flavor.map((name) => this.preloadFlavorByName(name)),
    );
    const coffee = this.coffeeRepository.create({ ...createCoffeeDto, flavor });
    return this.coffeeRepository.save(coffee);
  }

  async update(id: string, updateCoffeeDto: UpdateCoffeeDto) {
    const flavor =
      updateCoffeeDto.flavor &&
      (await Promise.all(
        updateCoffeeDto.flavor.map((name) => this.preloadFlavorByName(name)),
      ));
    const coffee = await this.coffeeRepository.preload({
      id: +id,
      ...updateCoffeeDto,
      flavor,
    });
    if (!coffee) {
      throw new NotFoundException('coffee #${id} not found');
    }
    return this.coffeeRepository.save(coffee);
  }

  async remove(id: string) {
    const coffee = await this.findOne(id);
    return this.coffeeRepository.remove(coffee);
  }

  // async recommendCoffee(coffee: Coffee) {
  //   const queryRunner = this.connection.createQueryRunner();
  //   await queryRunner.connection();
  //   await queryRunner.startTransaction();
  //   try {
  //     coffee.recommendations++;

  //     const recommendEvent = new EventEntity();
  //     recommendEvent.name = 'recommend_coffee';
  //     recommendEvent.type = 'coffee';
  //     recommendEvent.payload = { coffeeId: coffee.id };

  //     await queryRunner.manager.save(coffee);
  //     await queryRunner.manager.save(recommendEvent);

  //     await queryRunner.commitTransaction();
  //   } catch (err) {
  //     await queryRunner.rollbackTransaction();
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  private async preloadFlavorByName(name: string): Promise<FlavorEntity> {
    const existingFlavor = await this.flavorRepository.findOne({
      where: { name },
    });
    if (existingFlavor) {
      return existingFlavor;
    }
    return this.flavorRepository.create({ name });
  }
}
