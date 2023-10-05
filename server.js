import {config} from 'dotenv'
config()
import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import path from 'path'
import * as url from 'url'
import session from 'express-session'
import passport from 'passport'
import passportLocalMongoose from 'passport-local-mongoose'


import billRcpt from './Models/billRcpt.js'
import paymentAppr from './Models/paymentAppr.js'
import paymentRfr from './Models/paymentRfr.js'
import reqForAppr from './Models/reqForAppr.js'
import User from './Models/user.js'

const app = express()
const PORT = process.env.PORT || 8080
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
// const urlDB = 'mongodb://127.0.0.1:27017/dadDB'

const dbArray = [
	['billRcpt', 'Bill Receipt Database'],
	['reqForAppr', 'Request For Approval Database'],
	['paymentAppr', 'Payment Approval Database'],
	['paymentRfr', 'Payment Reference Database']
]


mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true})
	.then(() => {console.log('Connected to MongoDB Database')}).catch(err => {if(err) console.log(err)})



////////////Middleware///////////////////

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static(__dirname + 'public'))
app.use(session({
	secret: process.env.SECRET,
	resave: false,
	saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

passport.use(User.createStrategy())// only required for logining in without google
passport.serializeUser((user, done) => {done(null, user.id)})
passport.deserializeUser((id, done) => {
	User.findById(id).then(user => {
		done(null, user)
	}).catch(err => {
		console.log(err)
	})
})


/////////////Route Handling//////////////

app.get('/', (req, res) => {
	res.redirect('/auth')
})

app.get('/auth', (req, res) => {
		res.render('auth')
})
app.route('/auth/login_master')
	.get((req, res) => {
		res.render('login_master')
	})
	.post((req, res) => {
		//authenticate the user/master if present in the userDB database with accessLvl: 5
		const masterUserAttempting = new User({...req.body, accessLvl:5})
		console.log(req.login)
		req.login(masterUserAttempting, err => {
			if(err){
				console.log(err)
				res.redirect('/auth/login_master')
			}else{
				passport.authenticate('local')(req, res, () =>{
					res.redirect('/register')
				})
			}
		})

	})

app.route('/auth/login')
	.get((req, res) => {
		res.render('login')
	})
	.post((req, res) => {
		// res.send(req.body)
		//Authenticate the user trying to login
		const userAttemptingLogin = new User(req.body)
			req.login(userAttemptingLogin, err => {
				if(err){
					console.log(err)
					res.redirect('/auth/login')
				}
				else{
					passport.authenticate('local')(req, res, () => {
						res.redirect('/selectmode')
					})
				}
			})

	})

app.route('/register')
	.get((req, res) => {
		if(req.isAuthenticated() && req.user.accessLvl === 5)
			res.render('register', {
				username: req.user.username
			})
		else{
				console.log('Unauthorized')
				res.redirect('/auth/login_master')
			}
	})
	.post(async (req, res) => {
		// res.send(req.body)
		const {username, password, accessLvl} = req.body
		await User.register({username, accessLvl}, password, (err, user) => {
			if(err)	console.log(err)
			else console.log('Successfully registered user!')

			res.redirect('/logout')
		})

	})

app.get('/selectmode', (req, res) => {
	if(req.isAuthenticated()){
		const {accessLvl, username} = req.user
		let n = accessLvl-1
		if(n === 4)
			n = 3
		res.render('selectmode', {
			username,
			dbArray,
			n
		})
	}
	else
		res.redirect('/auth/login')
})
app.get('/logout', (req, res) => {
		req.logout(err => {
			if(err) console.log(err);
			res.redirect('/auth')
		})
})

app.get('/view/:collection', async (req, res) => {
	//@1.0.0 no feature of filtering.. view whole database
	if(!req.isAuthenticated())
		res.redirect('/auth/login')

	let data

	const {collection} = req.params
	switch(collection){
	case 'billRcpt':
		data = await billRcpt.find({})
		break
	case 'reqForAppr':
		data = await reqForAppr.find({})
		break
	case 'paymentAppr':
		data = await paymentAppr.find({})
		break
	case 'paymentRfr':
		data = await paymentRfr.find({})
		break
	default:
		res.redirect('/view/billRcpt')
	}

	// for all objects in data.. _id, createdAt and updatedAt have to be removed
	let dataArray = []
	data.forEach(ele => {
		let newObj = {}
		for(let prop in ele._doc){
			if(prop === '_id' || prop === '__v' || prop === 'createdAt' || prop === 'updatedAt')
				continue
			else{
				newObj[prop] = ele._doc[prop]
			}
		}
			dataArray.push(newObj)
	})

	console.log(dataArray)
	res.render('viewData', {dataArray, username: req.user.username})
	
})

app.route('/edit/:collection')
	.get((req, res) => {
		//
	})
	.post((req, res) => {
		//
	})

app.all('*', (req, res) => {
	res.status(404).send('<h1>Oops!!<p>Page requested not found</p></h1>')
})

process.on('exit', () => mongoose.connection.close(false))

// app.route('/view')
// 	.get((req, res) => {
// 		res.render('selectDBview')
// 	})
// 	.post((req, res) => {

// 	})


// app.route('/billRcptFrm')
// 	.get((req, res) => {
// 		res.render('forms/billRcptFrm.ejs')
// 	})
// 	.post((req, res) => {
// 		const newRecord = new billRcpt(req.body)
// 		newRecord.save().then(() => res.send('successfull')).catch(err=> res.send(err))
// 	})
// app.route('/paymentApprFrm')
// 	.get((req, res) => {
// 		res.render('forms/paymentApprFrm')
// 	})
// 	.post(async (req, res) => {
// 		// res.send(req.body)
// 		const newRecord = new paymentAppr(req.body)
// 		await newRecord.save()
// 	})
// app.route('/paymentRfrFrm')
// 	.get((req, res) => {
// 		res.render('forms/paymentRfrFrm')
// 	})
// 	.post(async (req, res) => {
// 		// res.send(req.body)
// 		const newRecord = new paymentRfr(req.body)
// 		await newRecord.save()
// 	})
// app.route('/reqForApprFrm')
// 	.get((req, res) => {
// 		res.render('forms/reqForApprFrm')
// 	})
// 	.post(async (req, res) => {
// 		// res.send(req.body)
// 		const newRecord = new reqForAppr(req.body)
// 		await newRecord.save()
// 	})

////////////Server Connection////////////////

app.listen(PORT, err => {
	if(err) throw err;
	console.log(`Server running on port ${PORT}.`)
})


/*
accessLvl    no of databases to display
0             0
1             1
2             2
3             3
4             4
5             4



*/