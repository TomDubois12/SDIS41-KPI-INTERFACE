import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

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

    @Column({ type: 'int', nullable: true, name: 'user_id' })  // <-- Vérifiez ceci
    userId: number | null;

    @CreateDateColumn()
    createdAt: Date;
}