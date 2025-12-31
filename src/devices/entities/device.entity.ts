import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Recipe } from 'src/recipes/entities/recipe.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  macAddress: string;

  @Column({ nullable: true })
  name: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ default: 'offline' })
  status: string;

  @Column({ nullable: true })
  current_program_id: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  version: string;

  @Column({ nullable: true })
  firmware_version: string;

  @Column({ unique: true, nullable: true })
  serial_number: string;

  // Add verification token for claiming flow if needed
  @Column({ nullable: true })
  verifyToken: string;

  @Column({ type: 'jsonb', nullable: true })
  config: any;

  @Column({ type: 'jsonb', nullable: true })
  sensors: any;

  @Column({ type: 'jsonb', nullable: true })
  outputs: any;

  @Column({ type: 'jsonb', nullable: true })
  state: any;

  @ManyToOne(() => Recipe)
  @JoinColumn({ name: 'active_recipe_id' })
  active_recipe: Recipe;

  @Column({ nullable: true })
  active_recipe_id: string;

  @Column({ nullable: true })
  last_seen: Date;

  @Column({ nullable: true })
  last_state_update: Date;
}
