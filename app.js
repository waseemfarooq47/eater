var express = require('express');
var fs = require('fs');
var dotenv = require('dotenv');
var app = express();
var mongo = require('mongodb')
var MongoClient = mongo.MongoClient
dotenv.config();

// var mongoUrl=process.env.MongoUrl
var mongoUrl = 'mongodb+srv://testadd:test@cluster0.arhd2.mongodb.net/waseemdata?retryWrites=true&w=majority'
var cors=require('cors')
const bodyParser=require('body-parser')
var port = process.env.PORT || 6662

var db;

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(cors())

//default route
app.get('/', (req, res) => {
    res.send("this is from express")
})

//return all the city
app.get('/location', (req, res) => {
    db.collection('location').find().toArray((err, result) => {
        if (err) throw error
        res.send(result)
    })
})


//return all the mealtype
app.get('/mealtype', (req, res) => {
    db.collection("mealtype").find().toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })
})



//return all the menus wrt restaurantID
app.get("/menu/:restid", (req, res) => {  // we can route other pages to route on same url
    var restid=Number(req.params.restid)
    db.collection("menu").find({"restaurant_id":restid}).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })

})

app.post('/menuItems',(req, res)=>{
    db.collection("menu").find({"menu_id":{$in:req.body}}).toArray((err, result)=>{
        if (err) throw err;
        res.send(result)
    })

})

app.get('/orders', (req, res) => {
    db.collection('orders').find().toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })
})


app.put('/updateStatus/:id', (req, res) => {
    var id=Number(req.params.id)
    var status = req.body.status?req.body.status:"pending"
    db.collection('orders').updateOne(
        {id:id},
        {
            $set:{
                "status":status,
                "date": req.body.date,
                "bank_status":req.body.bank_status,
                "bank":req.body.bank
            }
        }   

        )
        res.send('order updated')
})

//post call to place order >>> required body parser for post call
app.post('/placeOrder', (req, res) => {
    // console.log(req.body)
    // res.send(req.body)
    db.collection("orders").insert(req.body,(err, result) => {
        if (err) throw err;
        res.send("order placed")
    })
})

//deleted all orders without id provided
app.delete("/deleteOrders", (req, res) => {
    db.collection('orders').remove({},(err, result) => {
        if (err) throw err;
        res.send("orders deleted")
    })
})

//return all the restaurants
/*app.get('/restaurants',(req,res)=>{
    db.collection('restaurants').find().toArray((err,result)=>{
        if (err) throw err;
        res.send(result)
    })
})*/

//restaurant wrt cityname
app.get('/restaurants', (req, res) => {
    var query = {};
    if (req.query.city) {
        query = { state_id: Number(req.query.city) }
    }
    db.collection('restaurants').find(query).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })
})

//return restaurant wrt id
app.get('/restaurants/:id', (req, res) => {
    var id = parseInt(req.params.id);
    db.collection('restaurants').find({ 'restaurant_id': id }).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })
})


app.get('/filter/:mealId', (req, res) => {
    //this is paramid on basis mealid
    var id = parseInt(req.params.mealId);
    var sort={cost:1}
    var query = { "mealTypes.mealtype_id": id }

    if(req.query.sortKey){
        var sortKey= req.query.sortKey;
            if(sortKey>1 || sortKey < -1 || sortKey==0){
                sortKey=1;
            }
         sort = {cost:Number(sortKey)}
    }

    if (req.query.lcost && req.query.hcost) {
        var lcost = Number(req.query.lcost)
        var hcost = Number(req.query.hcost)
    }

    // this is queryparam on basis cuisine
    if (req.query.cuisine && req.query.lcost && req.query.hcost) {
        var query = { $and: [{ cost: { $gt: lcost, $lt: hcost } }], "mealTypes.mealtype_id": id, "cuisines.cuisine_id": Number(req.query.cuisine) }
    }
    else if (req.query.cuisine)
        var query = { "mealTypes.mealtype_id": id, "cuisines.cuisine_id": Number(req.query.cuisine) }

    // this is queryparam on basisi of cost information

    else if (req.query.lcost && req.query.hcost) {
        var query = { $and: [{ cost: { $gt: lcost, $lt: hcost } }], "mealTypes.mealtype_id": id }
    }

    db.collection("restaurants").find(query).sort(sort).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    })
})


MongoClient.connect(mongoUrl, (err, client) => {
    if (err) console.log("error while connecting")
    db = client.db("waseemdata")
    app.listen(port, () => {
        console.log(`listening to port ${port}`)
    })
})



