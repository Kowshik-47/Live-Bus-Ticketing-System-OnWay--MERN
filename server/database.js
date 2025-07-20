import { env } from '../environment.js'
import { exit } from "process";
import { MongoClient } from "mongodb";

const mongoClient = new MongoClient(env.DB_URI)

export async function connectDataBase() {
    try {
        await mongoClient.connect()
        console.log('Connected to Mongo DB Atlas')
        return true
    } catch (error) {
        console.error("Mongo DB Connection Error")
        exit(0)
    }
}

const db = mongoClient.db('onWay')
export const userCollection = db.collection('user')
export const ticketCollection = db.collection('ticket')
export const routeCollection = db.collection('route')
export const busCollection = db.collection('bus')