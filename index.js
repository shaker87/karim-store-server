const express = require('express')
const app = express()

const cors = require('cors')
app.use(cors())
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
app.use(express.static('products'));
app.use(fileUpload());
require('dotenv').config()


const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const port = 5000


const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const { response } = require('express');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5jsgv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useUnifiedTopology: true }, { useNewUrlParser: true });
client.connect(err => {
  const productCollection = client.db("karim-store").collection("product");
  console.log("database connected")
  app.post('/add-product', (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const price = req.body.price;
    const expiredate = req.body.expiredate;
    console.log(file, title, price, expiredate)
    const filePath = `${__dirname}/products/${file.name}`

    file.mv(filePath, err => {
      if (err) {
        console.log(err)
        return res.status(500).send({ msg: 'failed to upload image' })
      }
      return res.send({ name: file.name, path: `${file.name}` })
    })

    const encImg = file.data.toString('base64')
    const image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer(encImg, 'base64')
    }

    productCollection.insertOne({
      title, price, expiredate, img: image
    })
      .then(result => {
        console.log(result)
        res.send(result.insertedCount > 0)
      })
  })

  app.get('/products', (req, res) => {
    productCollection.find({})
      .toArray((err, document) => {
        res.send(document);
      })
  })
  app.get('/search-product', (req, res) => {
    console.log(req.query.price)
    productCollection.find({ price: req.query.price })
      .toArray((err, document) => {
        res.send(document);
      })
  })

  app.get('/product/:id', (req, res) => {
    productCollection.find({ _id: ObjectId(req.params.id) })
      .toArray((err, document) => {
        res.send(document[0]);
      })
  })

  app.patch('/update/:id', (req, res) => {
    console.log(req.params.id)
    productCollection.updateOne({ _id: ObjectId(req.params.id) },
      { $set: { title: req.body.title, price: req.body.price, expiredate: req.body.expiredate } })
      .then(result => {
        console.log(result)
      })
  })

  app.delete('/delete/:id', (req, res) => {
    console.log(req.params.id)
    productCollection.deleteOne({ _id: ObjectId(req.params.id) })
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })
});


app.get('/', (req, res) => {
  res.send('Hello Shaker Comeback in server')
})

app.listen(process.env.PORT || port)