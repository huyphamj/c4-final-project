import * as AWS from 'aws-sdk'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
const AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

const todosCreatedAtIndex = process.env.TODOS_CREATED_AT_INDEX

function createDynamoDBClient(): DocumentClient {
    return new XAWS.DynamoDB.DocumentClient()
}

export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly itemTable = process.env.TODOS_TABLE
    ) {

    }

    async getAllTodo(): Promise<TodoItem[]> {
        logger.info('Getting all todos')

        const result = await this.docClient.scan({
            TableName: process.env.TODOS_TABLE
        }).promise()

        const items = result.Items
        return items as TodoItem[]
    }

    async getTodoByUser(userId: string): Promise<TodoItem[]> {
        logger.info('Getting todo by user', userId)

        const result = await this.docClient.query({
            TableName: process.env.TODOS_TABLE,
            IndexName: todosCreatedAtIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()

        return result.Items as TodoItem[]
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        logger.info('Creating todo', todo)

        await this.docClient.put({
            TableName: this.itemTable,
            Item: todo
        }).promise()

        return todo
    }

    async updateTodo(todoId: string, userId: string, todoUpdate: TodoUpdate): Promise<TodoItem> {
        logger.info('Updating todo', todoId, todoUpdate)

        const updatedTodo = await this.docClient.update({
            TableName: this.itemTable,
            Key: {
                'todoId': todoId,
                'userId': userId
            },
            UpdateExpression: 'set #name = :name, #dueDate = :dueDate, #done = :done',
            ExpressionAttributeNames: {
                '#name': 'name',
                '#dueDate': 'dueDate',
                '#done': 'done'
            },
            ExpressionAttributeValues: {
                ':name': todoUpdate.name,
                ':dueDate': todoUpdate.dueDate,
                ':done': todoUpdate.done
            },
            ReturnValues: 'UPDATED_NEW'
        }).promise()
        return updatedTodo.Attributes as TodoItem
    }

    async deleteTodo(todoId: string, userId: string): Promise<string> {
        logger.info('Deleting todo', todoId)

        await this.docClient.delete({
            TableName: this.itemTable,
            Key: {
                'todoId': todoId,
                'userId': userId
            }
        }).promise()

        return todoId
    }
}
