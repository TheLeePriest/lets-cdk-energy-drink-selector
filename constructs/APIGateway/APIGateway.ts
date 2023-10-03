import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiKey, RestApi, UsagePlan } from 'aws-cdk-lib/aws-apigateway';

type ApiGatewayProps = {
    serviceName: string;
    stage: string;
    rateLimit?: number;
    burstLimit?: number;
}

export class APIGateway extends Construct {
    public readonly restAPI: RestApi;

    constructor(scope: Stack, id: string, props: ApiGatewayProps) {
        super(scope, id);

        const {
            serviceName,
            stage,
            rateLimit = 100000,
            burstLimit = 1000
        } = props;

        this.restAPI = new RestApi(this, `${serviceName}-restAPI-${stage}`, {
            deployOptions: {
                stageName: stage
            },
            defaultMethodOptions: {
                apiKeyRequired: true
            }
        });

        const apiKey = new ApiKey(this, `${serviceName}-apiKey-${stage}`, {
            apiKeyName: `${serviceName}-apiKey-${stage}`,
            generateDistinctId: true,
            stages: [this.restAPI.deploymentStage],
        });

        const usagePlan = new UsagePlan(this, `${serviceName}-usagePlan-${stage}`, {
            name: `${serviceName}-${stage}`,
            throttle: {
                rateLimit,
                burstLimit
            },
            apiStages: [{
                stage: this.restAPI.deploymentStage
            }]
        });
        
        usagePlan.addApiKey(apiKey);
    }
}
