import { TodosAccess } from './todosAccess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'

const logger = createLogger('Todos')
const todosAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string
) {
    const todoId = uuid.v4()
    const todo: TodoItem = {
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate,
        done: false,
        attachmentUrl: null
    }

    const createdTodo = await todosAccess.createTodo(todo)

    return createdTodo
}

export async function getTodosForUser(userId: string) {
    var todos = await todosAccess.getTodoByUser(userId)
    todos.forEach(e => e.attachmentUrl = attachmentUtils.getAttachmentUrl(e.attachmentUrl))
    return todos
}

export async function updateTodo(
    todoId: string,
    updateTodoRequest: UpdateTodoRequest,
    userId: string
) {
    const todo = await todosAccess.getTodo(todoId)
    if (!todo) {
        logger.error(`Todo with id ${todoId} not found`)
        throw createError(404, 'Todo not found')
    }
    if (todo[0].userId !== userId) {
        throw createError(403, 'Unauthorized')
    }

    const updatedTodo: TodoItem = {
        userId,
        todoId,
        createdAt: todo[0].createdAt,
        name: updateTodoRequest.name,
        dueDate: updateTodoRequest.dueDate,
        done: updateTodoRequest.done,
        attachmentUrl: todo[0].attachmentUrl
    }

    const updatedTodoItem = await todosAccess.updateTodo(todoId, updatedTodo)

    return updatedTodoItem
}

export async function deleteTodo(todoId: string, userId: string) {
    const todo = await todosAccess.getTodo(todoId)
    if (!todo) {
        logger.error(`Todo with id ${todoId} not found`)
        throw createError(404, 'Todo not found')
    }
    if (todo[0].userId !== userId) {
        logger.error(`User ${userId} does not have access to delete todo ${todoId}`)
        throw createError(401, 'Unauthorized')
    }
    return await todosAccess.deleteTodo(todoId)
}

export async function createAttachmentPresignedUrl(todoId: string) {
    const attachmentUrl = await attachmentUtils.getPresignedUrl(todoId)
    return attachmentUrl
}