import { eq } from "drizzle-orm"
import { logger } from "../config/logger"
import { db } from "../db"
import { InsertUser, usersTable } from "../db/schema"
import { AppError } from "../utils/AppError"

export const createUser = async (data: InsertUser) => {
    try {
        const getUser = await db.select().from(usersTable).where(eq(usersTable.email, data.email))
        if (getUser) {
            logger.error(`User Already Exists with same mail`)
            console.error(`User Already exists with same mail`)
            throw new AppError(`User Already exists with same mail`, 400)
        }
        const [{ id }] = await db.insert(usersTable).values(data).returning({
            id: usersTable.id
        })
        return {
            "success": true,
            "message": "New User Created",
            id: id
        }
    } catch (error) {
        logger.error(`Failed to create user: ${error}`)
        console.error(`Failed to create user: ${error}`)
        throw new AppError(`Failed to Create user`, 500)
    }
}

export const getAllUsers = async () => {
    try {
        const users = await db.select().from(usersTable)
        return {
            "success": true,
            "message": "Users retrieved successfully",
            data: users
        }
    } catch (error) {
        logger.error(`Failed to get users: ${error}`)
        console.error(`Failed to get users: ${error}`)
        throw new AppError(`Failed to get users`, 500)
    }
}