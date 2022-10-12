import { type } from 'os';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FlavorEntity } from './flavor.entity';

@Entity() // sql table === 'coffees'
export class Coffee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  brand: string;

  @Column({ default: 0 })
  recommendations: number;

  @JoinTable()
  @ManyToMany(() => FlavorEntity, (flavorEntity) => flavorEntity.coffees, {
    cascade: true, //[insert]
  })
  flavor: FlavorEntity[];
}
