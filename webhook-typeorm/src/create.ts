import { Handler, Context, Callback } from "aws-lambda";
import { IRequestDynamoCreateId } from "./models";

const AWS = require('aws-sdk')
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const dayjs = require('dayjs')

export const run: Handler =  async (event, context: Context, callback: Callback) => {

    console.log('Function name: ', context.functionName)
	console.log('Remaining time: ', context.getRemainingTimeInMillis())
	
    context.callbackWaitsForEmptyEventLoop = false;

    console.log("incoming dynamo post function", event.body)

    const data: IRequestDynamoCreateId = JSON.parse(event.body);

    if(typeof data.id !== 'string' || typeof data.key !=='string' || typeof data.type !== 'string' || typeof data.name !== 'string'){
        console.log('validation Error')
    } else {

        data.created_at =dayjs(new Date().toLocaleString("en-US", {timeZone: "Asia/Seoul"})).format('YYYY-MM-DD HH:mm:ss');
        const clickupUser = {
            TableName: process.env.DYNAMODB_TABLE,
            Item: data
        }
        await dynamoDb.put(clickupUser).promise()
        callback(null);
        console.log(data)
    }



}