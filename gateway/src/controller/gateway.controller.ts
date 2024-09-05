import {Controller, Get, Post, Body, Param, Res, Delete, Put, HttpException, HttpStatus} from '@nestjs/common';
import {Client, ClientProxy, Transport} from '@nestjs/microservices';
import {Response} from 'express';
import {catchError, lastValueFrom, timeout} from 'rxjs';

@Controller()
export class GatewayController {
    @Client({
        transport: Transport.TCP,
        options: {
            host: 'localhost',
            port: 5002, // Service microservice
        },
    })
    private serviceClient: ClientProxy;

    @Client({
        transport: Transport.TCP,
        options: {
            host: 'localhost',
            port: 5001, // Patient microservice
        },
    })
    private patientClient: ClientProxy;

    // Services Methods
    @Get('services')
    async getAllServices(@Res() response: Response) {
        const result = await this.serviceClient.send({cmd: 'getAllServices'}, {}).toPromise();
        response.setHeader('X-Gateway', 'true');
        return response.json(result);
    }

    @Post('services')
    async createService(@Body() createServiceDto: any, @Res() response: Response) {
        const result = await this.serviceClient.send({cmd: 'createService'}, createServiceDto).toPromise();
        response.setHeader('X-Gateway', 'true');
        return response.json(result);
    }

    @Get('services/:id_service')
    async getServiceById(@Param('id_service') id: string, @Res() response: Response) {
        const result = await this.serviceClient.send({cmd: 'getServiceById'}, parseInt(id)).toPromise();
        response.setHeader('X-Gateway', 'true');
        return response.json(result);
    }

    @Put('services/:id_service')
    async updateService(@Param('id_service') id: string, @Body() updateServiceDto: any, @Res() response: Response) {
        const result = await this.serviceClient.send(
            {cmd: 'updateService'},
            {id_service: parseInt(id), updateServiceDto}
        ).toPromise();
        response.setHeader('X-Gateway', 'true');
        return response.json(result);
    }

    @Delete('services/:id')
    async deleteService(@Param('id') id: string, @Res() response: Response) {
        try {
            const result = await lastValueFrom(
                this.serviceClient.send({cmd: 'deleteService'}, parseInt(id)).pipe(
                    timeout(5000),
                    catchError(err => {
                        throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
                    })
                )
            );

            if (result && result.success) {
                response.setHeader('X-Gateway', 'true');
                return response.json(result);
            } else if (result && !result.success) {
                throw new HttpException(result.message || 'Service not found', HttpStatus.NOT_FOUND);
            } else {
                throw new HttpException('Unexpected response from services', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('An error occurred while deleting the services', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Patients Methods
    @Get('patients')
    async getAllPatients(@Res() response: Response) {
        const result = await this.patientClient.send({cmd: 'getAllPatients'}, {}).toPromise();
        response.setHeader('X-Gateway', 'true');
        return response.json(result);
    }

    @Post('patients')
    async createPatient(@Body() createPatientDto: any, @Res() response: Response) {
        const result = await this.patientClient.send({cmd: 'createPatient'}, createPatientDto).toPromise();
        response.setHeader('X-Gateway', 'true');
        return response.json(result);
    }

    @Get('patients/services')
    async getAllPatientServices(@Res() response: Response) {
        const result = await this.serviceClient.send({cmd: 'getAllServices'}, {}).toPromise();
        response.setHeader('X-Gateway', 'true');
        return response.json(result);
    }

    @Get('patients/:id_patient')
    async getPatientById(@Param('id_patient') id: string, @Res() response: Response) {
        const result = await this.patientClient.send({cmd: 'getPatientById'}, parseInt(id)).toPromise();
        response.setHeader('X-Gateway', 'true');
        return response.json(result);
    }

    @Get('notifications/patient-created')
    async getPatientCreatedNotifications(@Res() response: Response) {
        const notifications = await this.serviceClient.send({cmd: 'getPatientCreatedNotifications'}, {}).toPromise();
        response.setHeader('X-Gateway', 'true');
        return response.json(notifications);
    }

    // Nouvelle méthode pour afficher les files d'attente
    @Get('queues')
    async displayQueues(@Res() response: Response) {
        try {
            const result = await this.serviceClient.send({cmd: 'displayQueues'}, {}).toPromise();
            response.setHeader('X-Gateway', 'true');
            return response.json(result);
        } catch (error) {
            throw new HttpException('Error displaying queues', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}