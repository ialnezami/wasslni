import { Injectable, NotFoundException } from '@nestjs/common';
import { CitiesRepository } from './repositories/cities.repository';
import { CreateCityDto, UpdateCityDto } from './dto/cities.dto';

@Injectable()
export class CitiesService {
  constructor(private readonly citiesRepository: CitiesRepository) {}

  findAll() {
    return this.citiesRepository.findActive();
  }
  create(dto: CreateCityDto) { return this.citiesRepository.create(dto); }
  async update(id: string, dto: UpdateCityDto) { const city = await this.citiesRepository.updateById(id, dto); if (!city) throw new NotFoundException('City not found'); return city; }
  async remove(id: string) { const city = await this.citiesRepository.softDelete(id); if (!city) throw new NotFoundException('City not found'); return { message: 'City deleted' }; }
}
