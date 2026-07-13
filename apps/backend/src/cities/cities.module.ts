import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitiesController } from './cities.controller';
import { CitiesService } from './cities.service';
import { CitiesRepository } from './repositories/cities.repository';
import { City, CitySchema } from './schemas/city.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: City.name, schema: CitySchema }])],
  controllers: [CitiesController],
  providers: [CitiesService, CitiesRepository],
  exports: [CitiesService, CitiesRepository],
})
export class CitiesModule {}
