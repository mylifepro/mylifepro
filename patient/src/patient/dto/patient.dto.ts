import {IsNotEmpty} from "class-validator";

export class CreatePatientDto {
    @IsNotEmpty()
    nom_patient: string;

    @IsNotEmpty()
    prenom_patient: string;

    @IsNotEmpty()
    age_patient: string;

    @IsNotEmpty()
    maladie_patient: string;
}