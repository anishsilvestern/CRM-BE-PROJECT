const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require("nodemailer");
const env =  require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcryptjs = require('bcryptjs');
const { connectDb } = require('./db');
const { Admin, LastLogin, Customer, Product, Communication, Feedback, Purchase } = require('./schema');
const jwt = require('jsonwebtoken');


// connect to database
connectDb();

// create express app
const app = express();

// body parser middleware for parsing json data
app.use(bodyParser.json()); 

// cors middleware for cross origin resource sharing 
app.use(cors());

const url = process.env.production ? "https://crm-capstone-anish.netlify.app/" : "http://localhost:5173/"

console.log(process.env.production);

// Authentication middleware
const Auth = (request, response, next) => {
    console.log(request.path)
    if(request.path === '/login/' || request.path === '/register' || request.path === '/getAdmin/' || request.path === '/forget-password' || request.path === '/new-password/' || request.path === '/update-last-login') {
        next();
    }else {
        const userToken = request.headers.auth;
        if(!userToken) {
            response.status(401).send("Unauthorized");
        }

        const decodedToken = jwt.verify(userToken, process.env.JWT_SECRET);
        
        const email = decodedToken.email;

        Admin.find({email: email}).then(admin => {
            if(admin.length === 0) {
                response.status(401).send("Unauthorized");
            }else {
                next();
            }
        })
            
    }
}
app.use(Auth);

app.get('/', (request, response) => {
    response.send('server is running successfully & is connected to database');
})

// login admin
app.get("/login", async (request, response) => {
    const uiEmail = request.query.email;
    const uiPassword = request.query.password;

    try {
        const admin = await Admin.find({email: uiEmail});
        
           const passwordMatch = await bcryptjs.compare(uiPassword, admin[0].password);

           if (passwordMatch) {
               const token = jwt.sign({
                   email: admin[0].email,
               }, process.env.JWT_SECRET);
               response.send(token);
           } else {
               response.status(400).send("Invalid email or password");
           }
    }catch (error) {
        response.status(500).send("Internal server error");
    }
})

// get admin email to check if admin exists
app.get("/getAdmin", async (request, response) => {
    const uiEmail = request.query.email;

    try {
        const admin = await Admin.find({email: uiEmail});
        response.send(admin);     
    }catch (error) {
        response.status(500).send("Internal server error");
    }
}) 


// create admin 
app.post("/register", async (request, response)  => {
    
    try {
        const {name, email, phoneNumber, password} = request.body;

        // hash password before saving to database from bcryptjs
        const hashPassword = await bcryptjs.hash(password, 10);

        // generate id from uuidv4
        const id = uuidv4();

        const admin = await Admin.create({
            id: id,
            name: name,
            email: email,
            phoneNo: phoneNumber,
            password: hashPassword
        })
        response.send(admin.name);
    } catch (error) {
        response.status(500).send("Internal server error");
    }
} ) 

// send Link to user's email 
app.get("/forget-password", (req, res) => {
     const email = req.query.email;
     const urlToEmail = `${url}new-password?email=${email}`

     console.log(urlToEmail)

     try {
        // nodemailer is used to send the otp to the user's email
        const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Use `true` for port 465, `false` for all other ports
        auth: {
            user: "anishnodejs@gmail.com",
            pass: process.env.NODEMAILER_EMAIL_PASSWORD,
        },
        });

        // async..await is not allowed in global scope, must use a wrapper
        async function main() {
        // send mail with defined transport object
        const info = await transporter.sendMail({
            from: '"Future Developer 👻" <anishnodejs@gmail.com>', // sender address
            to: email, // list of receivers
            subject: "Forgot Password", // Subject line
            text: "Hello User your Password changed", // plain text body
            html: 
            `
            <div>
              <h1>Forgot Password Don't worry</h1>
              <div>
                <a href= >
                  <button>Click Here For Change Password</button>
                </a>
              </div>
            </div>
          ` 
          , // html body
        });

        console.log("Message sent: %s", info.messageId);
        // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
        }

        main().catch(console.error);

        res.send("Email sent successfully");
     } catch (error) {
        res.status(500).send("Internal server error");
     }
})

// update new password to database
app.put("/new-password", async (req, res) => {
    const email = req.query.email
    const password = req.query.password
    
    const hashPassword = await bcryptjs.hash(password, 10);
    
    const filter = {email: email};
    const update = {password: hashPassword};

    try {
        const newPassword = await Admin.findOneAndUpdate(filter, update,)
        
        res.send("Password changed successfully");
    } catch (error) {
        res.status(500).send("Internal server error");
    }
     
})

//  to fetch admin details
app.get("/admin", async (req, res) => {
    const email = req.query.email;

    try {
        const admin = await Admin.find({email: email})
        res.send(admin)
    } catch (error) {
        res.status(500).send("Internal server error");
    }
})

//  to update admin details
app.put("/update-admin", async (req, res) => {

    try {
        const { name, email, phoneNumber } = req.body;

        const filter = {email: email};
        const update = {name: name, email: email, phoneNo: phoneNumber};
        
        const updateAdmin = await Admin.findOneAndUpdate(filter, update)
        res.send(updateAdmin);
    } catch (error) {
        res.status(500).send("Internal server error");
    } 
})

// to fetch all customers
app.get("/customers", async (req, res) => {
    
    try {
        const customers = await Customer.find({deleted: false});
        res.send(customers);
    } catch (error) {
        res.status(500).send("Internal server error");
    }
})

// to update customer details
app.put("/update-customer", async (req, res) => {
    const { customerId, name, email, address, phone, source, status, fabricType, colour, design } = req.body;

    const filter = {customerId: customerId};
    const update = {name: name, email: email, address: address, phone: phone, source: source, status: status, fabricType: fabricType, colour: colour, design: design};

    try {
        const updateCustomer = await Customer.findOneAndUpdate(filter, update);
        res.send(updateCustomer);
    } catch (error) {
        res.status(500).send("Internal server error");
    }
})

// delete customer
app.put("/delete-customer", async (req, res) => {
    const { customerId } = req.body;

    const filter = {customerId: customerId};
    const update = {deleted: true};
     
     try {
        const deleteCustomer = await Customer.findOneAndUpdate(filter, update);
        res.send(deleteCustomer);
     } catch (error) {
        res.status(500).send("Internal server error");
     }
})

// Add New Customer
app.post("/add-customer", async (req, res) => {
    const { name, email, address, phone, source, status, fabricType, colour, design } = req.body;

     try {
        const lastCustomerId = await Customer.findOne({}, {}, { sort: { _id: -1 } })

        const lastid = lastCustomerId.customerId

        const letter = lastid.replace(/\d/g, '')
        const number = lastid.replace(/\D/g, '')
        const newId = letter + (parseInt(number) + 1)

        const addCustomer = await Customer.create({
            customerId: newId,
            name: name,
            email: email,
            address: address,
            phone: phone,
            source: source,
            status: status,
            fabricType: fabricType,
            colour: colour,
            design: design,
            deleted: false
        })
     
        res.send(addCustomer);
     } catch (error) {
        res.status(500).send("Internal server error");
     }
})

// to fetch all products
app.get("/products", async (req, res) => {
    try {
        const products = await Product.find({deleted: false})
        res.send(products)
    } catch (error) {
        res.status(500).send("Internal server error");
    }
})

// to update product details
app.put("/update-product", async (req, res) => {

    try {
        const { productId, Name, Price, FabricType, Color, DesignType, Rating, Description, PhotoUrl, Stock } = req.body;

        const filter = {productId: productId};
        const update = {Name: Name, Price: Price, FabricType: FabricType, Color: Color, DesignType: DesignType, Rating: Rating, Description: Description, PhotoUrl: PhotoUrl, Stock: Stock};

        const updateProduct = await Product.findOneAndUpdate(filter, update)
        res.send(updateProduct);

    } catch (error) {
        res.status(500).send("Internal server error");
    }

})

// Add New Product
app.post("/add-product", async (req, res) => {

    try {
        const { Name, Price, FabricType, Color, DesignType, Description, PhotoUrl, Stock } = req.body;

        const lastProductId = await Product.findOne({}, {}, { sort: { _id: -1 } })

        const lastid = lastProductId.productId

        const letter = lastid.replace(/\d/g, '')
        const number = lastid.replace(/\D/g, '')
        const newId = letter + (parseInt(number) + 1)

        const addProduct = await Product.create({
            productId: newId,
            Name: Name,
            Price: Price,
            FabricType: FabricType,
            Color: Color,
            DesignType: DesignType,
            Description: Description,
            PhotoUrl: PhotoUrl,
            Stock: Stock
        })

        res.send(addProduct);

    } catch (error) {
        res.status(500).send("Internal server error");
    }

})

// delete product
app.put("/delete-product", async (req, res) => {
    const { productId } = req.body;

    try {
        const filter = {productId: productId};
    const update = {deleted: true};

    const deleteProduct = await Product.findOneAndUpdate(filter, update)
     res.send(deleteProduct);
    } catch (error) {
        res.status(500).send("Internal server error");
    }

})

//  to communication 
app.get("/communication", async (req, res) => {

    try {
        const communication = await Communication.find({})
        res.send(communication)
    } catch (error) {
        res.status(500).send("Internal server error");
    }
})

//  to feedback
app.get("/feedback", async (req, res) => {

    try {
        const feedback = await Feedback.find({})
        res.send(feedback)
    } catch (error) {
        res.status(500).send("Internal server error");
    }
})

// new Customer fetch
app.get("/new-customer", async (req, res) => {
     try {
        const lastCustomerId = await Customer.find({}, {}, { sort: { _id: -1 } })
        res.send(lastCustomerId)
     } catch (error) {
        res.status(500).send("Internal server error");
     }
})

// recentPurchase fetch
app.get("/monthly-revenue", async (req, res) => {
     try {
        const monthlyRevenue = await Purchase.find({}, {_id: 0})
        res.send(monthlyRevenue)
     } catch (error) {
        res.status(500).send("Internal server error");
     }
})

// fetching top 50 highest purchased products
app.get("/top-50-highest-purchased-products", async (req, res) => {
    try {
        
        const result = await Purchase.aggregate([
            {
                $unwind: "$products" 
            },
            {
                $group: {
                    _id: "$products.product_id", 
                    totalQuantity: { $sum: "$products.quantity" } 
                }
            },
            {
                $sort: { totalQuantity: -1 }
            },
            {
                $limit: 50
            }
        ]);

        const productIds = result.map(item => item._id);

    
        const products = await Product.find({ productId: { $in: productIds } });
    
       
        const top50HighestPurchasedProducts = result.map(item => {
            const product = products.find(product => product.productId === item._id);
    
            return {
                productId: item._id,
                totalQuantity: item.totalQuantity,
                productName: product ? product.Name : 'Unknown' 
            };
        });
        res.send(top50HighestPurchasedProducts);
    } catch (error) {
        console.error("Error fetching top 50 highest purchased products:", error);
        res.status(500).send("Internal server error");
    }
});

// fetch most purchased customer
app.get("/most-purchased-customers", async (req, res) => {
    try {
        const result = await Purchase.aggregate([
            {
                $group: {
                    _id: "$customer_id",
                    totalPurchases: { $sum: 1 }, 
                    totalAmountSpent: { $sum: "$total_amount_rs" } 
                }
            },
            {
                $sort: { totalAmountSpent: -1 } 
            },
            {
                $limit: 100 
            }
        ]);

        
        const customerIds = result.map(item => item._id);
        const customers = await Customer.find({ customerId: { $in: customerIds } });

        

  
        const mostPurchasedCustomers = result.map(item => {
            const customer = customers.find(customer => customer.customerId === item._id);
          
            return {
                customerId: item._id,
                customerName: customer ? customer.name : 'Unknown', 
                totalPurchases: item.totalPurchases,
                totalAmountSpent: item.totalAmountSpent
            };
        });

        console.log(mostPurchasedCustomers)
        res.send(mostPurchasedCustomers);
    } catch (error) {
        console.error("Error fetching most purchased customers:", error);
        res.status(500).send("Internal server error");
    }
});





 


app.listen(4000, () => {
    console.log('server is running on port 4000');
})