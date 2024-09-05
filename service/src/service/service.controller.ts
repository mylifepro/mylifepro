// services-services/src/services/services.controller.ts
import {Controller} from '@nestjs/common';
import {EventPattern, MessagePattern, Payload} from '@nestjs/microservices';
import {ServiceService} from './service.service';
import {CreateServiceDto} from './dto/service.dto';
import {Patient} from "./patient.entity";

@Controller()
export class ServiceController {
    constructor(private readonly serviceService: ServiceService) {
    }

    @MessagePattern({cmd: 'getAllServices'})
    async getAllServices() {
        try {
            const services = await this.serviceService.getAllServices();
            return {status: 'success', message: 'Services retrieved successfully', data: services};
        } catch (error) {
            return {status: 'error', message: error.message};
        }
    }

    @MessagePattern({cmd: 'createService'})
    async createService(@Payload() createServiceDto: CreateServiceDto) {
        try {
            const newService = await this.serviceService.createService(createServiceDto);
            return {status: 'success', message: 'Service created successfully', data: newService};
        } catch (error) {
            return {status: 'error', message: error.message};
        }
    }

    @MessagePattern({cmd: 'getServiceById'})
    async getServiceById(@Payload() id_service: number) {
        try {
            const service = await this.serviceService.getServiceById(id_service);
            return {status: 'success', message: 'Service retrieved successfully', data: service};
        } catch (error) {
            return {status: 'error', message: error.message};
        }
    }

    @MessagePattern({cmd: 'updateService'})
    async updateService(@Payload() payload: { id_service: number; updateServiceDto: Partial<CreateServiceDto> }) {
        try {
            const updatedService = await this.serviceService.updateService(payload.id_service, payload.updateServiceDto);
            return {status: 'success', message: 'Service updated successfully', data: updatedService};
        } catch (error) {
            return {status: 'error', message: error.message};
        }
    }

    @MessagePattern({cmd: 'deleteService'})
    async deleteService(@Payload() id: number) {
        try {
            const result = await this.serviceService.deleteService(id);
            return {status: 'success', message: 'Service deleted successfully', data: result};
        } catch (error) {
            return {status: 'error', message: error.message || 'An error occurred while deleting the service'};
        }
    }

    @EventPattern({cmd: 'getPatientCreatedNotifications'})
    async getPatientCreatedNotifications(): Promise<Patient[]> {
        return this.serviceService.getPatientCreatedNotifications();
    }

    @MessagePattern({ cmd: 'displayQueues' })
    async displayQueues() {
        try {
            const messages = await this.serviceService.displayQueues(); // Récupérer les messages
            return {
                status: 'success',
                message: 'Queues displayed successfully',
                data: messages
            };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }
}
