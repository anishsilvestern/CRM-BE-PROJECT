const { mongoose } = require("./db");


const schema = mongoose.Schema;


const adminSchema = new schema({
    id: {type: String},
    name: {type: String},
    email: {type: String},
    phoneNo: {type: String},
    password: {type: String}, 
})

const customerSchema = new schema({
    customerId: {type: String}, 
    name: {type: String},
    email: {type: String},
    address: {type: String},
    phone: {type: String},
    source: {type: String},
    status: {type: String},
    fabricType: {type: Array},
    design: {type: Array},
    colour: {type: Array},
    deleted: {type: Boolean}
})

const productSchema = new schema({
    productId: {type: String},
    Name: {type: String},
    Price: {type: Number},
    Stock: {type: Number},
    Description: {type: String},
    PhotoUrl: {type: String},
    Rating: {type: String},
    FabricType: {type: String},
    DesignType: {type: String},
    Color: {type: String},
    deleted: {type: Boolean}
})

const productOrderSchema = new schema({
    product_Id: {type: String},
    quantity: {type: Number},
})    

const purchaseSchema = new schema({
    purchase_id: {type: String},
    customer_id: {type: String},
    products: [productOrderSchema],
    date: {type: String},
    total_amount_rs: {type: Number}
})

const communicationSchema = new schema({
    communication_id: {type: String},
    customer_Id: {type: String},
    date: {type: String},
    method: {type: String},
    content: {type: String}
})

const feedbackSchema = new schema({
    feedback_id: {type: String},
    customer_Id: {type: String},
    date: {type: String},
    content: {type: String}
})


const Admin = mongoose.model("Admin", adminSchema);
const Customer = mongoose.model("Customer", customerSchema);
const Product = mongoose.model("Product", productSchema);
const Purchase = mongoose.model("Purchase", purchaseSchema);
const Communication = mongoose.model("Communication", communicationSchema);
const Feedback = mongoose.model("Feedback", feedbackSchema);


module.exports = {
    Admin,
    Customer,
    Product,
    Purchase,
    Communication,
    Feedback
}
