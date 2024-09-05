// patient-services/src/patient/patient.service.ts
import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {ClientProxy, ClientProxyFactory, Transport} from '@nestjs/microservices';
import {Patient} from './patient.entity';
import {CreatePatientDto} from './dto/patient.dto';

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
                urls: ['amqp://localhost:5672'],
                queue: 'patient_created',
            },
        });
    }

    async getAllPatient() {
        const patients = this.patientsRepository.find();
        return patients;
    }

    async createPatient(createPatientDto: CreatePatientDto) {
        const newPatient = this.patientsRepository.create(createPatientDto);
        await this.patientsRepository.save({
            nom_patient: createPatientDto.nom_patient,
            prenom_patient: createPatientDto.prenom_patient,
            age_patient: createPatientDto.age_patient,
            maladie_patient: createPatientDto.maladie_patient
        });
        this.client.emit('patient.created', newPatient);
        return newPatient;
    }

    async getPatientById(id_patient: number): Promise<Patient> {
        const patient = await this.patientsRepository.findOne({where: {id_patient}});
        if (!patient) {
            console.error(`Patient with ID ${id_patient} not found`);
        }
        return patient;
    }
}
