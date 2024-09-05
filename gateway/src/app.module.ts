import {Module} from '@nestjs/common';
import {ClientsModule, Transport} from '@nestjs/microservices';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {GatewayController} from './controller/gateway.controller';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'PATIENT_SERVICE',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://localhost:5672'],
                    queue: 'patient_queue',
                    noAck: false,
                    queueOptions: {
                        durable: false,
                    }
                },
            },
            {
                name: 'SERVICE_SERVICE',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://localhost:5672'],
                    queue: 'service_queue',
                    noAck: false,
                    queueOptions: {
                        durable: false,
                    }
                },
            },
        ]),
    ],
    controllers: [AppController, GatewayController],
    providers: [AppService],
})
export class AppModule {
}
