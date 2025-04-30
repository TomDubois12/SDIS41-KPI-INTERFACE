import { Controller } from '@nestjs/common';
import { StatistiquesService } from './statistiques.service';


@Controller('statistiques')
export class StatistiquesController {
    constructor(private readonly statistiquesService: StatistiquesService) { }
}