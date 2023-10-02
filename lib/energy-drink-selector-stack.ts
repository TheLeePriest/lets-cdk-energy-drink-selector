import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { APIGatewayStack } from '../stacks/APIGatewayStack';

export class EnergyDrinkSelectorStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const apiGatewayStack = new APIGatewayStack(this, 'EnergyDrinkSelectorAPIGatewayStack');
    apiGatewayStack.restAPI.root.addMethod('GET');
  }
}
