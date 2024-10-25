import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  Delete,
  Put,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Client, ClientProxy, Transport } from '@nestjs/microservices';
import { Response } from 'express';
import { catchError, lastValueFrom, timeout } from 'rxjs';

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

  @Client({
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 7272, // Patient microservice
    },
  })
  private consultationService: ClientProxy;

  // Services Methods
  @Get('services')
  async getAllServices(@Res() response: Response) {
    const result = await this.serviceClient
      .send({ cmd: 'getAllServices' }, {})
      .toPromise();
    response.setHeader('X-Gateway', 'true');
    return response.json(result);
  }

  @Post('services')
  async createService(
    @Body() createServiceDto: any,
    @Res() response: Response,
  ) {
    const result = await this.serviceClient
      .send({ cmd: 'createService' }, createServiceDto)
      .toPromise();
    response.setHeader('X-Gateway', 'true');
    return response.json(result);
  }

  @Get('services/:id_service')
  async getServiceById(
    @Param('id_service') id: string,
    @Res() response: Response,
  ) {
    const result = await this.serviceClient
      .send({ cmd: 'getServiceById' }, parseInt(id))
      .toPromise();
    response.setHeader('X-Gateway', 'true');
    return response.json(result);
  }

  @Put('services/:id_service')
  async updateService(
    @Param('id_service') id: string,
    @Body() updateServiceDto: any,
    @Res() response: Response,
  ) {
    const result = await this.serviceClient
      .send(
        { cmd: 'updateService' },
        { id_service: parseInt(id), updateServiceDto },
      )
      .toPromise();
    response.setHeader('X-Gateway', 'true');
    return response.json(result);
  }

  @Delete('services/:id')
  async deleteService(@Param('id') id: string, @Res() response: Response) {
    try {
      const result = await lastValueFrom(
        this.serviceClient.send({ cmd: 'deleteService' }, parseInt(id)).pipe(
          timeout(5000),
          catchError((err) => {
            throw new HttpException(
              'Service unavailable',
              HttpStatus.SERVICE_UNAVAILABLE,
              err,
            );
          }),
        ),
      );

      if (result && result.success) {
        response.setHeader('X-Gateway', 'true');
        return response.json(result);
      } else if (result && !result.success) {
        throw new HttpException(
          result.message || 'Service not found',
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw new HttpException(
          'Unexpected response from services',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'An error occurred while deleting the services',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Patients Methods
  @Get('patients')
  async getAllPatients(@Res() response: Response) {
    const result = await this.patientClient
      .send({ cmd: 'getAllPatients' }, {})
      .toPromise();
    response.setHeader('X-Gateway', 'true');
    return response.json(result);
  }

  @Post('patients')
  async createPatient(
    @Body() createPatientDto: any,
    @Res() response: Response,
  ) {
    const result = await this.patientClient
      .send({ cmd: 'createPatient' }, createPatientDto)
      .toPromise();
    response.setHeader('X-Gateway', 'true');
    return response.json(result);
  }

  @Get('patients/services')
  async getAllPatientServices(@Res() response: Response) {
    const result = await this.serviceClient
      .send({ cmd: 'getAllServices' }, {})
      .toPromise();
    response.setHeader('X-Gateway', 'true');
    return response.json(result);
  }

  @Get('patients/:id_patient')
  async getPatientById(
    @Param('id_patient') id: string,
    @Res() response: Response,
  ) {
    const result = await this.patientClient
      .send({ cmd: 'getPatientById' }, parseInt(id))
      .toPromise();
    response.setHeader('X-Gateway', 'true');
    return response.json(result);
  }

  @Get('notifications/patient-created')
  async getPatientCreatedNotifications(@Res() response: Response) {
    const notifications = await this.serviceClient
      .send({ cmd: 'getPatientCreatedNotifications' }, {})
      .toPromise();
    response.setHeader('X-Gateway', 'true');
    return response.json(notifications);
  }

  // Nouvelle méthode pour afficher les files d'attente
  @Get('queues')
  async displayQueues(@Res() response: Response) {
    try {
      const result = await this.serviceClient
        .send({ cmd: 'displayQueues' }, {})
        .toPromise();
      response.setHeader('X-Gateway', 'true');
      return response.json(result);
    } catch (error) {
      throw new HttpException(
        'Error displaying queues',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('consultations')
  async getAllConsultations(@Res() response: Response) {
    try {
      const result = await lastValueFrom(
        this.consultationService.send({ cmd: 'getAllConsultations' }, {}).pipe(
          timeout(5000),
          catchError((err) => {
            console.error('Error from microservice:', err);
            throw new HttpException(
              'Service Unavailable',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );
      response.setHeader('X-Gateway', 'true');
      return response.json(result);
    } catch (error) {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
  @Post('consultations')
  async createConsultation(
    @Body() createConsultationDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'createConsultation' }, createConsultationDto)
          .pipe(
            timeout(5000),
            catchError((err) => {
              console.error('Error from microservice:', err);
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
              );
            }),
          ),
      );
      response.setHeader('X-Gateway', 'true');
      return response.json(result);
    } catch (error) {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get('consultations/:id')
  async getConsultationById(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const result = await this.consultationService
      .send({ cmd: 'getConsultationById' }, parseInt(id))
      .toPromise();
    response.setHeader('X-Gateway', 'true');
    return response.json(result);
  }

  @Put('consultations/:id')
  async updateConsultation(
    @Param('id') id: string,
    @Body() updateConsultationDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send(
            { cmd: 'updateConsultation' },
            { id: parseInt(id), updateConsultationDto },
          )
          .pipe(
            timeout(5000),
            catchError((err) => {
              console.error('Error from microservice:', err);
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
              );
            }),
          ),
      );
      response.setHeader('X-Gateway', 'true');
      return response.json(result);
    } catch (error) {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete('consultations/:id')
  async deleteConsultation(@Param('id') id: string, @Res() response: Response) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'deleteConsultation' }, parseInt(id))
          .pipe(
            timeout(5000),
            catchError((err) => {
              console.error('Error from microservice:', err);
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
              );
            }),
          ),
      );
      response.setHeader('X-Gateway', 'true');
      return response.json(result);
    } catch (error) {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
  @Get('examens-cliniques')
  async getAllExamensCliniques(@Res() response: Response) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'getAllExamensCliniques' }, {})
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      response.setHeader('X-Gateway', 'true');
      return response.json(result);
    } catch (error) {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  // Créer un examen clinique
  @Post('examens-cliniques')
  async createExamenClinique(
    @Body() createExamenCliniqueDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'createExamenClinique' }, createExamenCliniqueDto)
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      response.setHeader('X-Gateway', 'true');
      return response.json(result);
    } catch (error) {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  // Obtenir un examen clinique par ID
  @Get('examens-cliniques/:id')
  async getExamenCliniqueById(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const result = await this.consultationService
      .send({ cmd: 'getExamenCliniqueById' }, parseInt(id))
      .toPromise();
    response.setHeader('X-Gateway', 'true');
    return response.json(result);
  }

  // Mettre à jour un examen clinique
  @Put('examens-cliniques/:id')
  async updateExamenClinique(
    @Param('id') id: string,
    @Body() updateExamenCliniqueDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send(
            { cmd: 'updateExamenClinique' },
            { id: parseInt(id), updateExamenCliniqueDto },
          )
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      response.setHeader('X-Gateway', 'true');
      return response.json(result);
    } catch (error) {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  // Supprimer un examen clinique
  @Delete('examens-cliniques/:id')
  async deleteExamenClinique(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'deleteExamenClinique' }, parseInt(id))
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      response.setHeader('X-Gateway', 'true');
      return response.json(result);
    } catch (error) {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  // Examen paraclinique

  @Post('examens-paracliniques')
  async createExamenParaclinique(
    @Body() createExamenParacliniqueDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send(
            { cmd: 'createExamenParaclinique' },
            createExamenParacliniqueDto,
          )
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
  @Get('examens-paracliniques')
  async getAllExamensParacliniques(@Res() response: Response) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'getAllExamensParacliniques' }, {})
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
  @Get('examens-paracliniques/:id')
  async getExamenParacliniqueById(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'getExamenParacliniqueById' }, parseInt(id))
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
  @Delete('examens-paracliniques/:id')
  async deleteExamenParaclinique(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'deleteExamenParaclinique' }, parseInt(id))
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json({ message: 'Deleted successfully', result });
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Put('examens-paracliniques/:id')
  async updateExamenParaclinique(
    @Param('id') id: string,
    @Body() updateExamenParacliniqueDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send(
            { cmd: 'updateExamenParaclinique' },
            { id: parseInt(id), updateExamenParacliniqueDto },
          )
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      response.setHeader('X-Gateway', 'true');
      return response.json(result);
    } catch (error) {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  // Lettre d'hospitalisatio

  @Post('lettres-hospitalisation')
  async createLettreHospitalisation(
    @Body() createLettreHospitalisationDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send(
            { cmd: 'createLettreHospitalisation' },
            createLettreHospitalisationDto,
          )
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get('lettres-hospitalisation')
  async getAllLettresHospitalisation(@Res() response: Response) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'getAllLettresHospitalisation' }, {})
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get('lettres-hospitalisation/:id')
  async getLettreHospitalisationById(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'getLettreHospitalisationById' }, parseInt(id))
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete('lettres-hospitalisation/:id')
  async deleteLettreHospitalisation(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'deleteLettreHospitalisation' }, parseInt(id))
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json({ message: 'Deleted successfully', result });
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Put('lettres-hospitalisation/:id')
  async updateLettreHospitalisation(
    @Param('id') id: string,
    @Body() updateLettreHospitalisationDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send(
            { cmd: 'updateLettreHospitalisation' },
            { id: parseInt(id), updateLettreHospitalisationDto },
          )
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Post('arrets-travail')
  async createArretTravail(
    @Body() createArretTravailDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'createArretTravail' }, createArretTravailDto)
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  // Get All ArretsTravail
  @Get('arrets-travail')
  async getAllArretsTravail(@Res() response: Response) {
    try {
      const result = await lastValueFrom(
        this.consultationService.send({ cmd: 'getAllArretsTravail' }, {}).pipe(
          timeout(5000),
          catchError((err) => {
            throw new HttpException(
              'Service Unavailable',
              HttpStatus.SERVICE_UNAVAILABLE,
              err,
            );
          }),
        ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  // Get ArretTravail by Id
  @Get('arrets-travail/:id')
  async getArretTravailById(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'getArretTravailById' }, parseInt(id))
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  // Update ArretTravail
  @Put('arrets-travail/:id')
  async updateArretTravail(
    @Param('id') id: string,
    @Body() updateArretTravailDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send(
            { cmd: 'updateArretTravail' },
            { id: parseInt(id), updateArretTravailDto },
          )
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  // Delete ArretTravail
  @Delete('arrets-travail/:id')
  async deleteArretTravail(@Param('id') id: string, @Res() response: Response) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'deleteArretTravail' }, parseInt(id))
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json({ message: 'Deleted successfully', result });
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
  @Post('certicat-medicals')
  async createCertificatMedical(
    @Body() createCertificatMedicalDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'createCertificatMedical' }, createCertificatMedicalDto)
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get('certicat-medicals')
  async getAllCertificatsMedicaux(@Res() response: Response) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'getAllCertificatsMedicaux' }, {})
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get('certicat-medicals/:id')
  async getCertificatMedicalById(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'getCertificatMedicalById' }, parseInt(id))
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete('certicat-medicals/:id')
  async deleteCertificatMedical(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'deleteCertificatMedical' }, parseInt(id))
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json({ message: 'Deleted successfully', result });
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Put('certicat-medicals/:id')
  async updateCertificatMedical(
    @Param('id') id: string,
    @Body() updateCertificatMedicalDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send(
            { cmd: 'updateCertificatMedical' },
            { id: parseInt(id), updateCertificatMedicalDto },
          )
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  //**************************************************** *///
  //ordonnance\
  @Post('ordonnance')
  async createOrdonnance(
    @Body() createOrdonnanceDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'createOrdonnance' }, createOrdonnanceDto)
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get('ordonnance')
  async getAllOrdonnances(@Res() response: Response) {
    try {
      const result = await lastValueFrom(
        this.consultationService.send({ cmd: 'getAllOrdonnances' }, {}).pipe(
          timeout(5000),
          catchError((err) => {
            throw new HttpException(
              'Service Unavailable',
              HttpStatus.SERVICE_UNAVAILABLE,
              err,
            );
          }),
        ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get('ordonnance/:id')
  async getOrdonnanceById(@Param('id') id: string, @Res() response: Response) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'getOrdonnanceById' }, parseInt(id))
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete('ordonnance/:id')
  async deleteOrdonnance(@Param('id') id: string, @Res() response: Response) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send({ cmd: 'deleteOrdonnance' }, parseInt(id))
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json({ message: 'Deleted successfully', result });
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Put('ordonnance/:id')
  async updateOrdonnance(
    @Param('id') id: string,
    @Body() updateOrdonnanceDto: any,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.consultationService
          .send(
            { cmd: 'updateOrdonnance' },
            { id: parseInt(id), updateOrdonnanceDto },
          )
          .pipe(
            timeout(5000),
            catchError((err) => {
              throw new HttpException(
                'Service Unavailable',
                HttpStatus.SERVICE_UNAVAILABLE,
                err,
              );
            }),
          ),
      );
      return response.json(result);
    } catch (error) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
