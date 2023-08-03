import express from 'express'
import { testConnection, sequelize } from './utils/sequelize.client'
import { User, Contact, Conversation, UserConversation, Message } from '../sequelize/sequelize.models'

const app = express()

const port = process.env.PORT ?? 3000

app.use(express.json())

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

// health check
app.get('/', (req, res) => {
  res.send('OK')
})

// test database connection
app.get('/testDB', async (req, res) => {
  try {
    await testConnection()
    res.send('OK')
  } catch (error) {
    const typedError = error as Error
    res.status(500)
    res.send(typedError.message)
  }
})

// database sync models
app.get('/syncDB', async (req, res) => {
  try {
    await User.sync({ force: true })
    await Contact.sync({ force: true })
    await Conversation.sync({ force: true })
    await UserConversation.sync({ force: true })
    await Message.sync({ force: true })

    res.send('OK')
  } catch (error) {
    const typedError = error as Error
    res.status(500)
    res.send(typedError.message)
  }
})