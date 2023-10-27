import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { APIGateway } from "../constructs/APIGateway/APIGateway";
import { RestApi } from "aws-cdk-lib/aws-apigateway";

export class APIGatewayStack extends NestedStack {
    public readonly restAPI: RestApi;

    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(scope, id, props);

        const apiGateway = new APIGateway(this, id, {
            serviceName: 'energy-drink-selector',
            stage: 'dev',
        });

        this.restAPI = apiGateway.restAPI;
    }
};