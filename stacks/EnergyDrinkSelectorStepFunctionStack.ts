import path = require("path");
import { Construct } from "constructs";
import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { ExpressStepFunction } from "../constructs/StepFunctions/ExpressStepFunction";
import { energyDrinkSelectorDefinition } from "../src/stepFunctions/definitions/energyDrinkSelector";

type EnergyDrinkSelectorStepFunctionStackProps = NestedStackProps & {
    table: ITable;
}

export class EnergyDrinkSelectorStepFunctionStack extends NestedStack {
    public readonly stepFunction: StateMachine;

    constructor(scope: Construct, id: string, props: EnergyDrinkSelectorStepFunctionStackProps) {
        super(scope, id, props);

        const { table } = props;

        const sugarFreeLambdaFunction = new NodejsFunction(this, 'SugarFreeLambdaFunction', {
            entry: path.join(__dirname, '../src/functions/sugarFree/sugarFree.ts'),
            runtime: Runtime.NODEJS_18_X,
            architecture: Architecture.ARM_64,
            handler: 'sugarFree',
            bundling: {
                sourceMap: true,
                minify: true,
                tsconfig: path.join(__dirname, '../tsconfig.json'),
            },
        });

        const sugarLambdaFunction = new NodejsFunction(this, 'SugarLambdaFunction', {
            entry: path.join(__dirname, '../src/functions/sugar/sugar.ts'),
            runtime: Runtime.NODEJS_18_X,
            architecture: Architecture.ARM_64,
            handler: 'sugar',
            bundling: {
                sourceMap: true,
                minify: true,
                tsconfig: path.join(__dirname, '../tsconfig.json'),
            },
        });

        const energyDrinkSelectorStepFunction = new ExpressStepFunction(this, 'EnergyDrinkSelectorExpress', {
            serviceName: 'energy-drink-selector',
            stage: 'dev',
            definition: energyDrinkSelectorDefinition({
                stack: this,
                energyDrinkTable: table,
                sugarLambdaFunction: sugarLambdaFunction, 
                sugarFreeLambdaFunction: sugarFreeLambdaFunction
            }),
        });

        this.stepFunction = energyDrinkSelectorStepFunction.stateMachine;
    }
};