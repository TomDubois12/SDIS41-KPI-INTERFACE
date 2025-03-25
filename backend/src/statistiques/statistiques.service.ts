import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StatistiquesService {
    constructor(private dataSource: DataSource) {}
}