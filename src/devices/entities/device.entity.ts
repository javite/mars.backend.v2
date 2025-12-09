import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('devices')
export class Device {
    @PrimaryColumn() // MAC address
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

    // Add verification token for claiming flow if needed
    @Column({ nullable: true })
    verifyToken: string;
}
