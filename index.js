const express = require('express');
const cors = require('cors');
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
const { MongoClient, ServerApiVersion, ObjectId, ObjectID } = require('mongodb');
const port = process.env.PORT || 5000;

// Middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.PASSWORD}@cluster0.hvqv2xi.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const usedCarCollection = client.db('luxuryHunt').collection('usedCard')
        const categoryCollection = client.db('luxuryHunt').collection('category')
        const allUserCollection = client.db('luxuryHunt').collection('allUser')
        const allBookingCollection = client.db('luxuryHunt').collection('allBooking')
        const addvertiseCollection = client.db('luxuryHunt').collection('advertiseItem')
        const paymentCollection = client.db('luxuryHunt').collection('paymentItem')
        const wishlistCollection = client.db('luxuryHunt').collection('wishlist')


        app.post('/paymentSuccess', async (req, res) => {
            const body = req.body;
            const payment = await paymentCollection.insertOne(body)
            const id = body.carId;
            const query = {
                _id: ObjectId(id)
            }
            const docs = {
                $set: {
                    payment: 'paid',
                    transactionId: body.transactionId
                }
            }
            const updatedBooking = await allBookingCollection.updateOne(query, docs)
            res.send(payment)
        })

        app.post("/createpaymentintent", async (req, res) => {
            const body = req.body;
            const price = body.carPrice
            const amount = price * 100;

            console.log(amount)
            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        app.get('/homecar', async (req, res) => {
            const query = {}
            const homeAllCar = await usedCarCollection.find(query).limit(6).toArray()
            res.send(homeAllCar)
        })
        app.get('/category', async (req, res) => {
            const query = {}
            const allCategory = await categoryCollection.find(query).toArray()
            res.send(allCategory)
        })
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { categoryId: id }
            const carCollection = await usedCarCollection.find(query).toArray()
            res.send(carCollection)
        })

        // User api created
        app.post('/userCollection', async (req, res) => {
            const body = req.body;
            const query = { userEmail: body.userEmail }
            const findUser = await allUserCollection.findOne(query)
            console.log(findUser)
            if (!findUser) {
                const userData = await allUserCollection.insertOne(body)
                res.send(userData)
            }
        })

        // Booked data api
        app.post('/allBooking', async (req, res) => {
            const body = req.body
            const allBokings = await allBookingCollection.insertOne(body)
            res.send(allBokings)
        })

        // Dataload api for role
        app.get('/role', async (req, res) => {
            const email = req.query.email
            const query = {
                userEmail: email
            }
            const userInfo = await allUserCollection.findOne(query)
            res.send(userInfo)
        })

        // For Buyer
        app.get('/myorder', async (req, res) => {
            const email = req.query.email
            const query = {
                email: email
            }
            const orders = await allBookingCollection.find(query).toArray()
            res.send(orders)
        })
        app.get('/carCategory', async (req, res) => {
            const query = {};
            const category = await categoryCollection.find(query).project({ categoryName: 1 }).toArray()
            res.send(category)
        })
        app.post('/wishlist/:id', async (req, res) => {
            const id = req.params.id
            console.log(id)
            const query = {
                _id: ObjectId(id)
            }
            const findItem = await usedCarCollection.findOne(query);
            if (findItem) {
                const itemStringify = {
                    carId: id,
                    picture: findItem.picture,
                    name: findItem.name,
                    condition: findItem.condition,
                    location: findItem.location,
                    resalePrice: findItem.resalePrice,
                    originalPrice: findItem.originalPrice,
                    yearsOfUse: findItem.yearsOfUse,
                    postDate: findItem.postDate,
                    sellerName: findItem.sellerName,
                    email: findItem.email,
                    number: findItem.number,
                    description: findItem.description,
                    categoryId: findItem.categoryId
                }
                const wishlistItem = await wishlistCollection.insertOne(itemStringify);
                res.send(wishlistItem)
            }
        })
        app.get('/wishlistItem', async (req, res) => {
            const query = {};
            const allWishlistItem = await wishlistCollection.find(query).toArray()
            res.send(allWishlistItem)
        })


        // Buyer payment 
        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = {
                _id: ObjectId(id)
            }
            const paymentInfo = await allBookingCollection.findOne(query);
            res.send(paymentInfo)
        })
        //Add car collection 
        app.post('/usedCar', async (req, res) => {
            const body = req.body
            const addProduct = await usedCarCollection.insertOne(body)
            res.send(addProduct)
        })
        // Seller Product
        app.get('/sellerProduct', async (req, res) => {
            const email = req.query.email;
            const query = {
                email: email
            }
            const sellerProduct = await usedCarCollection.find(query).toArray()
            res.send(sellerProduct)
        })
        // Seller product delete
        app.delete('/sellerProductDelete/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
            }
            const deleteProduct = await usedCarCollection.deleteOne(query)
            res.send(deleteProduct)
        })
        app.delete('/advartiseItemDelete/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                carId: id
            }
            const deleteAdvertise = await addvertiseCollection.deleteOne(query)
            console.log(id)
            res.send(deleteAdvertise)
        })

        // Items load for advertise sections
        app.get('/advertiseItem', async (req, res) => {
            const query = {}
            const advertiseItems = await addvertiseCollection.find(query).toArray()
            res.send(advertiseItems)
        })
        app.post('/advertiseItem/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
            }
            const findedItem = await usedCarCollection.findOne(query);
            const itemStringify = {
                carId: id,
                picture: findedItem.picture,
                name: findedItem.name,
                condition: findedItem.condition,
                location: findedItem.location,
                resalePrice: findedItem.resalePrice,
                originalPrice: findedItem.originalPrice,
                yearsOfUse: findedItem.yearsOfUse,
                postDate: findedItem.postDate,
                sellerName: findedItem.sellerName,
                email: findedItem.email,
                number: findedItem.number,
                description: findedItem.description,
                categoryId: findedItem.categoryId
            }
            console.log(findedItem)
            const advertiseItem = await addvertiseCollection.insertOne(itemStringify)
            res.send(advertiseItem)
        })
        // For admin
        app.get('/allSeller', async (req, res) => {
            const query = { role: "Seller" }
            const allSeller = await allUserCollection.find(query).toArray()
            res.send(allSeller)
        })
        app.delete('/allSeller/:id', async (req, res) => {
            const id = req.params.id
            const query = {
                _id: ObjectId(id)
            }
            const deletedUser = await allUserCollection.deleteOne(query)
            res.send(deletedUser)
        })
        app.get('/allUser', async (req, res) => {
            const query = {}
            const allUser = await allUserCollection.find(query).toArray()
            res.send(allUser)
        })
        app.delete('/allUser/:id', async (req, res) => {
            const id = req.params.id
            const query = {
                _id: ObjectId(id)
            }
            const deletedUser = await allUserCollection.deleteOne(query)
            res.send(deletedUser)
        })
    }
    finally {

    }
}
run().catch(console.dir())


app.get('/', (req, res) => {
    res.send('Your server is running')
})
app.listen(port, () => {
    console.log(`Your server is running ${port}`)
})



