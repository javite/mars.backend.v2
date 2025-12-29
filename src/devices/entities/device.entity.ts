import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

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
}
