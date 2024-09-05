import {Injectable, Logger, OnModuleInit} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Service} from './service.entity';
import {CreateServiceDto} from './dto/service.dto';
import {Patient} from "./patient.entity";
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
    ) {
    }

    async onModuleInit() {
        await this.connectToRabbitMQ();
    }

    private async connectToRabbitMQ() {
        try {
            const connection = await amqp.connect('amqp://localhost:5672');
            this.channel = await connection.createChannel();
            const queue = 'patient_created';

            await this.channel.assertQueue(queue, {durable: true});

            this.logger.log(`Connected to RabbitMQ and asserting queue: ${queue}`);

            this.channel.consume(queue, (msg) => {
                if (msg !== null) {
                    const patientData = JSON.parse(msg.content.toString());
                    this.handlePatientCreated(patientData);
                    this.channel.ack(msg);
                }
            });
        } catch (error) {
            this.logger.error('Failed to connect to RabbitMQ', error);
        }
    }

    private handlePatientCreated(patient: Patient) {
        this.logger.log('Received patient created notification:', patient);
        this.patientCreatedNotifications.push(patient);
        this.eventEmitter.emit('patientCreated', patient);
        // Vous pouvez ajouter ici toute logique supplémentaire pour traiter le patient
    }

    async displayQueues(): Promise<any> {
        try {
            const queue = 'patient_created';
            const {messageCount, consumerCount} = await this.channel.checkQueue(queue);

            this.logger.log(`Queue Name: ${queue}`);
            this.logger.log(`Message Count: ${messageCount}`);
            this.logger.log(`Consumer Count: ${consumerCount}`);

            const messages = [];

            if (messageCount > 0) {
                await this.channel.consume(queue, (message) => {
                    if (message) {
                        const patient = JSON.parse(message.content.toString());
                        messages.push(patient);
                        this.channel.ack(message);
                    }
                }, {noAck: false});

                // Attendre 1 seconde pour permettre la réception de tous les messages
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return messages;
        } catch (error) {
            this.logger.error('Failed to display queues', error);
            throw error;
        }
    }

    async getAllServices(): Promise<Service[]> {
        this.logger.log('Fetching all services');
        const services = await this.serviceRepository.find();
        this.logger.log(`Fetched ${services.length} services`);
        return services;
    }

    async createService(createServiceDto: CreateServiceDto): Promise<Service> {
        this.logger.log('Creating a new service');
        const newService = this.serviceRepository.create(createServiceDto);
        const savedService = await this.serviceRepository.save(newService);
        this.logger.log(`Created service with ID ${savedService.id_service}`);
        return savedService;
    }

    async getServiceById(id_service: number): Promise<Service> {
        this.logger.log(`Fetching service with ID ${id_service}`);
        const service = await this.serviceRepository.findOne({where: {id_service}});
        if (service) {
            this.logger.log(`Fetched service with ID ${id_service}`);
        } else {
            this.logger.warn(`Service with ID ${id_service} not found`);
        }
        return service;
    }

    async updateService(id_service: number, updateServiceDto: Partial<CreateServiceDto>): Promise<Service> {
        this.logger.log(`Updating service with ID ${id_service}`);
        await this.serviceRepository.update(id_service, updateServiceDto);
        const updatedService = await this.serviceRepository.findOne({where: {id_service}});
        this.logger.log(`Updated service with ID ${id_service}`);
        return updatedService;
    }

    async deleteService(id_service: number): Promise<void> {
        this.logger.log(`Deleting service with ID ${id_service}`);
        await this.serviceRepository.delete(id_service);
        this.logger.log(`Deleted service with ID ${id_service}`);
    }

    async getPatientCreatedNotifications(): Promise<Patient[]> {
        return this.patientCreatedNotifications;
    }
}