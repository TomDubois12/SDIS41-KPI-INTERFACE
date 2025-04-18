import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('subscriptions')
export class Subscription {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 768, unique: true })
    endpoint: string;

    @Column()
    p256dh: string;

    @Column()
    auth: string;

    @Column({ nullable: true })
    userId: number | null;

    @CreateDateColumn()
    createdAt: Date;
}