import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './service.entity';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { Patient } from './patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Patient])],
  controllers: [ServiceController],
  providers: [ServiceService],
})
export class ServiceModule {}
