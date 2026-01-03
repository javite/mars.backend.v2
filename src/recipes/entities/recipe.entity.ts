import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Device } from '../../devices/entities/device.entity';

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  species: string;

  @Column({ type: 'int', default: 0 })
  state: number;

  @Column('jsonb', { nullable: true })
  recipe: any;

  @Column({
    type: 'bigint',
    nullable: true,
    transformer: { to: (value) => value, from: (value) => Number(value) },
  })
  created_at: number;

  @Column({
    type: 'bigint',
    nullable: true,
    transformer: { to: (value) => value, from: (value) => Number(value) },
  })
  updated_at: number;

  @Column()
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @ManyToMany(() => Device, (device) => device.recipes)
  devices: Device[];
}
