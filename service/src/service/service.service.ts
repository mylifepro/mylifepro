import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/service.dto';
import { Patient } from './patient.entity';
import * as amqp from 'amqplib';
import { EventEmitter } from 'events';

@Injectable()
export class ServiceService implements OnModuleInit {
  private readonly logger = new Logger(ServiceService.name);
  private channel: amqp.Channel;
  private patientCreatedNotifications: Patient[] = [];
  private eventEmitter = new EventEmitter();

  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  async onModuleInit() {
    await this.connectToRabbitMQ();
  }

  private async connectToRabbitMQ() {
    try {
      const connection = await amqp.connect(
        'amqp://user:password@localhost:5672',
      );
      this.channel = await connection.createChannel();
      const queue = 'patient_created';

      await this.channel.assertQueue(queue, { durable: true });

      this.logger.log(
        `Connexion réussie à RabbitMQ, en attente des messages dans la file : ${queue}`,
      );

      this.channel.consume(queue, (msg) => {
        if (msg !== null) {
          const patientData = JSON.parse(msg.content.toString());
          this.logger.log('Message reçu de RabbitMQ :', patientData);

          // Traitement du message reçu
          this.handlePatientCreated(patientData);

          // Acquittement du message
          this.channel.ack(msg);
        } else {
          this.logger.error('Message vide reçu');
        }
      });
    } catch (error) {
      this.logger.error('Erreur de connexion à RabbitMQ :', error);
      setTimeout(() => {
        this.connectToRabbitMQ();
      }, 5000);
    }
  }

  private handlePatientCreated(patient: Patient) {
    this.logger.log('Notification de création de patient reçue :', patient); // Log pour vérifier si les données du patient sont bien reçues

    this.patientCreatedNotifications.push(patient);
    this.logger.log(
      "Liste des patients après réception de l'événement :",
      this.patientCreatedNotifications,
    ); // Log pour voir l'état de la liste après l'ajout
    this.eventEmitter.emit('patientCreated', patient);
  }

  async displayQueues(): Promise<any> {
    try {
      const queue = 'patient_created';
      const { messageCount, consumerCount } =
        await this.channel.checkQueue(queue);

      this.logger.log(
        `Queue : ${queue}, Nombre de messages : ${messageCount}, Nombre de consommateurs : ${consumerCount}`,
      );

      const messages = [];
      if (messageCount > 0) {
        await this.channel.consume(
          queue,
          (message) => {
            if (message) {
              const patient = JSON.parse(message.content.toString());
              this.logger.log('Message de la queue traité :', patient); // Log pour chaque message traité
              messages.push(patient);
              this.logger.log('Consommation de message en cours.vourais..');

              this.channel.ack(message);
            }
          },
          { noAck: false },
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return messages;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des queues :', error);
      throw error;
    }
  }

  // CRUD des services
  async getAllServices(): Promise<Service[]> {
    return await this.serviceRepository.find();
  }

  async createService(createServiceDto: CreateServiceDto): Promise<Service> {
    const newService = this.serviceRepository.create(createServiceDto);
    return await this.serviceRepository.save(newService);
  }

  async getServiceById(id_service: number): Promise<Service> {
    return await this.serviceRepository.findOne({
      where: { id_service },
    });
  }

  async updateService(
    id_service: number,
    updateServiceDto: Partial<CreateServiceDto>,
  ): Promise<Service> {
    await this.serviceRepository.update(id_service, updateServiceDto);
    return await this.serviceRepository.findOne({
      where: { id_service },
    });
  }

  async deleteService(id_service: number): Promise<void> {
    await this.serviceRepository.delete(id_service);
  }

  async getPatientCreatedNotifications(): Promise<Patient[]> {
    return this.patientCreatedNotifications;
  }
}
