// patient-services/src/patient/patient.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { Patient } from './patient.entity';
import { CreatePatientDto } from './dto/patient.dto';

@Injectable()
export class PatientService {
  private client: ClientProxy;

  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [
          `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`,
        ],
        queue: 'patient_created',
        queueOptions: {
          durable: true, // Queue durable pour les messages persistants
        },
      },
    });
  }

  async getAllPatient() {
    const patients = this.patientsRepository.find();
    return patients;
  }

  async createPatient(createPatientDto: CreatePatientDto) {
    try {
      const newPatient = this.patientsRepository.create(createPatientDto);
      await this.patientsRepository.save(newPatient);

      console.log(
        'Patient créé et sauvegardé dans la base de données :',
        newPatient,
      ); // Log pour vérifier si le patient est bien sauvegardé

      this.client.emit('patient_created', newPatient);
      console.log(
        'Événement patient.created émis pour RabbitMQ avec les données :',
        newPatient,
      ); // Log pour vérifier si l'événement est bien émis
      console.log(
        'Émission du message sur la queue patient_created :',
        newPatient,
      );

      return newPatient;
    } catch (error) {
      console.error('Erreur lors de la création du patient :', error.message); // Log en cas d'erreur
      throw error;
    }
  }

  async getPatientById(id_patient: number): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({
      where: { id_patient },
    });
    if (!patient) {
      console.error(`Patient with ID ${id_patient} not found`);
    }
    return patient;
  }
}
