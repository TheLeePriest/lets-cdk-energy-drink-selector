import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";

type LambdaFunctionProps = {
    serviceName: string;
    stage: string;
    entryPath: string;
    handlerName?: string;
    tsConfigPath: string;
}

export class TSLambdaFunction extends Construct {
    public readonly tsLambdaFunction: NodejsFunction;

    constructor(scope: Stack, id: string, props: LambdaFunctionProps) {
        super(scope, id);

        const {
            serviceName,
            stage,
            entryPath,
            handlerName = 'handler',
            tsConfigPath
        } = props;

        this.tsLambdaFunction = new NodejsFunction(this, `${serviceName}-${id}-${stage}`, {
            entry: entryPath,
            runtime: Runtime.NODEJS_18_X,
            architecture: Architecture.ARM_64,
            handler: handlerName,
            bundling: {
                sourceMap: true,
                minify: true,
                tsconfig: tsConfigPath,
            },
        });
    }
}
