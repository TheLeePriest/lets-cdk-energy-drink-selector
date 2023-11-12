import path = require("path");
import { Construct } from "constructs";
import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { ExpressStepFunction } from "../constructs/StepFunctions/ExpressStepFunction";
import { energyDrinkSelectorDefinition } from "../src/stepFunctions/definitions/energyDrinkSelector";
import { TSLambdaFunction } from "../constructs/LambdaFunction/TSLambdaFunction";

type EnergyDrinkSelectorStepFunctionStackProps = NestedStackProps & {
    table: ITable;
}

export class EnergyDrinkSelectorStepFunctionStack extends NestedStack {
    public readonly stepFunction: StateMachine;

    constructor(scope: Construct, id: string, props: EnergyDrinkSelectorStepFunctionStackProps) {
        super(scope, id, props);

        const { table } = props;
        const tsConfigPath = path.join(__dirname, '../tsconfig.json');
    
        const sugarFreeLambdaFunction = new TSLambdaFunction(this, 'SugarFreeLambdaFunction', {
            serviceName: 'energy-drink-selector',
            stage: 'dev',
            handlerName: 'sugarFree',
            entryPath: path.join(__dirname, '../src/functions/sugarFree/sugarFree.ts'),
            tsConfigPath
        });

        const sugarLambdaFunction =  new TSLambdaFunction(this, 'SugarLambdaFunction', {
            serviceName: 'energy-drink-selector',
            stage: 'dev',
            handlerName: 'sugar',
            entryPath: path.join(__dirname, '../src/functions/sugar/sugar.ts'),
            tsConfigPath
        })

        const energyDrinkSelectorStepFunction = new ExpressStepFunction(this, 'EnergyDrinkSelectorExpress', {
            serviceName: 'energy-drink-selector',
            stage: 'dev',
            definition: energyDrinkSelectorDefinition({
                stack: this,
                energyDrinkTable: table,
                sugarLambdaFunction: sugarLambdaFunction.tsLambdaFunction, 
                sugarFreeLambdaFunction: sugarFreeLambdaFunction.tsLambdaFunction
            }),
        });

        this.stepFunction = energyDrinkSelectorStepFunction.stateMachine;
    }
};