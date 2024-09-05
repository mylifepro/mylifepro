import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Patient {
    @PrimaryGeneratedColumn()
    id_patient: number;

    @Column()
    nom_patient: string;

    @Column()
    prenom_patient: string;

    @Column()
    age_patient: string;

    @Column()
    maladie_patient: string;

    @Column()
    status_patient: string;
}
