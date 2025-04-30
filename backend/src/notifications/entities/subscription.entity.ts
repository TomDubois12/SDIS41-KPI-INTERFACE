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

    @Column(
        { 
            type: 'int', 
            nullable: true, 
            name: 'user_id' 
        }
    )
    userId: number | null;

    @CreateDateColumn()
    createdAt: Date;

    @Column(
        { 
            type: 'boolean', 
            default: true, 
            name: 'notify_on_ticket' 
        }
    )
    notifyOnTicket: boolean;

    @Column(
        { 
            type: 'boolean', 
            default: true, 
            name: 'notify_on_email' 
        }
    )
    notifyOnEmail: boolean;
}