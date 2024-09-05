// patient-services/src/patient/patient.controller.ts
import {Controller} from '@nestjs/common';
import {MessagePattern, Payload} from '@nestjs/microservices';
import {PatientService} from './patient.service';
import {CreatePatientDto} from './dto/patient.dto';

@Controller()
export class PatientController {
    constructor(private readonly patientsService: PatientService) {
    }

    @MessagePattern({cmd: 'getAllPatients'})
    async getAllPatient() {
        try {
            const patients = await this.patientsService.getAllPatient();
            return {status: 'success', message: 'Patients retrieved successfully', data: patients};
        } catch (error) {
            return {status: 'error', message: error.message};
        }
    }

    @MessagePattern({cmd: 'createPatient'})
    async createPatient(@Payload() createPatientDto: CreatePatientDto) {
        try {
            const newPatient = await this.patientsService.createPatient(createPatientDto);
            return {status: 'success', message: 'Patient created successfully', data: newPatient};
        } catch (error) {
            return {status: 'error', message: error.message};
        }
    }

    @MessagePattern({cmd: 'getPatientById'})
    async getPatientById(@Payload() id_patient: number) {
        try {
            const patient = await this.patientsService.getPatientById(id_patient);
            return {status: 'success', message: 'Patient retrieved successfully', data: patient};
        } catch (error) {
            return {status: 'error', message: error.message};
        }
    }
}