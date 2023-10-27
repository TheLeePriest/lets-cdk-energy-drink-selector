import { Pass, Choice, Fail, JsonPath, Condition } from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke, DynamoPutItem, DynamoAttributeValue } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Stack, Token } from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { IFunction } from "aws-cdk-lib/aws-lambda";

type energyDrinkSelectorDefinitionProps = {
    stack: Stack
    energyDrinkTable: ITable,
    sugarFreeLambdaFunction: IFunction,
    sugarLambdaFunction: IFunction
}

export const energyDrinkSelectorDefinition = ({
    stack,
    energyDrinkTable,
    sugarFreeLambdaFunction,
    sugarLambdaFunction
}: energyDrinkSelectorDefinitionProps) => {
    const rawItemSK = JsonPath.stringAt('$.sugar') === 'true' ? 'SUGAR' : 'SUGAR_FREE';
    const storeRawItem = new DynamoPutItem(stack, 'StoreRawItem', {
        item: {
            PK: DynamoAttributeValue.fromString(JsonPath.format(`RAWITEM#{}`, JsonPath.uuid())),
            SK: DynamoAttributeValue.fromString(rawItemSK),
            body: DynamoAttributeValue.fromString(JsonPath.jsonToString(JsonPath.objectAt('$'))),
        },
        table: energyDrinkTable,
        resultPath: '$.dynamoResult'
    });

    const validatePayload = new Choice(stack, 'Validate Payload');
    const isSugarFree = new Choice(stack, 'Sugar vs Sugar Free');
    const sugarFreePassState = new Pass(stack, 'Sugar Free Error', {});
    const sugarPassState = new Pass(stack, 'Sugar Error', {});
    const failState = new Fail(stack, 'Fail', {});

    const definition = storeRawItem.addCatch(failState).next(
        validatePayload
            .when(Condition.isPresent('$.sugar'), isSugarFree
                .when(Condition.booleanEquals('$.sugar', true), new LambdaInvoke(stack, 'Sugar Logic', {
                    lambdaFunction: sugarLambdaFunction,
                }).addCatch(sugarPassState, { errors: ['States.ALL'] }))
                .otherwise(new LambdaInvoke(stack, 'Sugar Free Logic', {
                    lambdaFunction: sugarFreeLambdaFunction,
                }).addCatch(sugarFreePassState, { errors: ['States.ALL'] }))
            )
            .otherwise(failState)
    )
    
    return definition;
};