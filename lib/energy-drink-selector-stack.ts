import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { APIGatewayStack } from '../stacks/APIGatewayStack';
import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { EnergyDrinkSelectorStepFunctionStack } from '../stacks/EnergyDrinkSelectorStepFunctionStack';
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { AwsIntegration } from "aws-cdk-lib/aws-apigateway";

export class EnergyDrinkSelectorStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const apiGatewayStack = new APIGatewayStack(this, 'EnergyDrinkSelectorAPIGatewayStack');

    const energyDrinkTable = new Table(this, 'EnergyDrinkDynamoTable', {
      tableName: 'EnergyDrinkTable',
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
          name: 'PK',
          type: AttributeType.STRING
      },
      sortKey: {
          name: 'SK',
          type: AttributeType.STRING
      }
    });

    const stepFunctionStack = new EnergyDrinkSelectorStepFunctionStack(this, 'EnergyDrinkSelectorStepFunctionStack', { table: energyDrinkTable });

    const apiGatewayStepFunctionRole = new Role(this, 'APIGatewayStepFunctionRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      inlinePolicies: {
        'StepFunctionsStartSyncExecutionPolicy': new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['states:StartSyncExecution'],
              resources: [stepFunctionStack.stepFunction.stateMachineArn],
            }),
          ],
        }),
      },
    });

    stepFunctionStack.stepFunction.grantStartExecution(apiGatewayStepFunctionRole);

    const integration = new AwsIntegration({
      service: 'states',
      action: 'StartSyncExecution',
      integrationHttpMethod: 'POST',
      options: {
        credentialsRole: apiGatewayStepFunctionRole,
        requestTemplates: {
          'application/json': `
            {
              "stateMachineArn": "${stepFunctionStack.stepFunction.stateMachineArn}",
              "input": "$util.escapeJavaScript($input.json('$'))"
            }
          `,
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': `$input.path('$.output')`,
            },
          },
          {
            statusCode: '400',
            selectionPattern: '4\\d{2}',
          },
          {
            statusCode: '500',
            selectionPattern: '5\\d{2}',
          },
        ],
      },
    });

    apiGatewayStack.restAPI.root.addMethod('POST', integration, {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '500' },
      ],
    });
  }
}
