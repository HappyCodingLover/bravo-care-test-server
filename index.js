const express = require('express')
const app = express()
const cors = require('cors')
const router = require('./router')
const port = 5000

// app.use(bodyParser.json())
// app.use(
//   bodyParser.urlencoded({
//     extended: true,
//   })
// )
app.use(express.json())
app.use(cors())

app.use('/api', router)

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})
