import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit {
    private client: mqtt.MqttClient;
    private readonly logger = new Logger(MqttService.name);

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        this.connect();
    }

    private connect() {
        const url = this.configService.get<string>('MQTT_URL') || 'mqtt://127.0.0.1:1883';
        const options: mqtt.IClientOptions = {
            username: this.configService.get<string>('MQTT_USERNAME'),
            password: this.configService.get<string>('MQTT_PASSWORD'),
        };

        this.logger.log(`Connecting to MQTT broker at ${url}`);
        this.client = mqtt.connect(url, options);

        this.client.on('connect', () => {
            this.logger.log('Successfully connected to MQTT broker');
        });

        this.client.on('error', (err) => {
            this.logger.error('MQTT connection error', err);
        });

        this.client.on('offline', () => {
            this.logger.warn('MQTT client is offline');
        });
    }

    publish(topic: string, message: any) {
        if (!this.client || !this.client.connected) {
            this.logger.warn('MQTT client not connected. Cannot publish message.');
            return;
        }

        const payload = typeof message === 'string' ? message : JSON.stringify(message);
        this.client.publish(topic, payload, (err) => {
            if (err) {
                this.logger.error(`Failed to publish to ${topic}`, err);
            } else {
                this.logger.log(`Published to ${topic}: ${payload}`);
            }
        });
    }

    async publishToTopicAndWaitForMessage(publishTopic: string, payload: any, responseTopic: string, timeoutMs: number = 5000): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.client || !this.client.connected) {
                return reject(new Error('MQTT client not connected'));
            }

            const correlationId = Date.now().toString(); // Simple correlation ID if needed, or just rely on topic

            // 1. Subscribe to response topic
            this.client.subscribe(responseTopic, (err) => {
                if (err) {
                    return reject(new Error(`Failed to subscribe to ${responseTopic}: ${err.message}`));
                }

                this.logger.debug(`Subscribed to ${responseTopic}, waiting for response...`);

                // 2. Setup timeout
                const timer = setTimeout(() => {
                    cleanup();
                    reject(new Error(`Timeout waiting for response on ${responseTopic}`));
                }, timeoutMs);

                // 3. Message handler
                const messageHandler = (topic: string, message: Buffer) => {
                    if (topic === responseTopic) {
                        try {
                            const msgString = message.toString();
                            const msgJson = JSON.parse(msgString);
                            cleanup();
                            resolve(msgJson);
                        } catch (e) {
                            // If not JSON, return string
                            cleanup();
                            resolve(message.toString());
                        }
                    }
                };

                // 4. Cleanup function
                const cleanup = () => {
                    clearTimeout(timer);
                    this.client.removeListener('message', messageHandler);
                    this.client.unsubscribe(responseTopic);
                };

                // 5. Attach listener
                this.client.on('message', messageHandler);

                // 6. Publish command
                this.publish(publishTopic, payload);
            });
        });
    }
}
