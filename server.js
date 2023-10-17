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
	['billRcpt', 'Bill Receipt'],
	['reqForAppr', 'Request For Approval'],
	['paymentAppr', 'Payment Approval'],
	['paymentRfr', 'Payment Reference']
]
let formReviewData = {}
let count = {
	billRcpt: 0,
	reqForAppr: 0,
	paymentAppr: 0,
	paymentRfr: 0
}


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
passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) => {
	User.findById(id).then(user => 
		done(null, user)
	).catch(err => {
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
		formReviewData = {}
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
		count = {
			billRcpt: 0,
			reqForAppr: 0,
			paymentAppr: 0,
			paymentRfr: 0
		}
})

app.get('/view/:collection', async (req, res) => {
	//@1.0.0 no feature of filtering.. view whole database
	if(!req.isAuthenticated())
		res.redirect('/auth/login')
	else{
	
		let data = []
	
		const {collection} = req.params
		switch(collection){
		case 'billRcpt':
			data = await billRcpt.find({})
			break
		case 'reqForAppr':
			let rfaData = await reqForAppr.find({})
			for(let ele of rfaData){
				let billData = await billRcpt.findOne({billRcvId: ele.billRcvId}, '-_id billNo party acptdTtlBillVal')
				data.push({_doc:{...ele._doc, ...billData._doc}})
			}
			break
		case 'paymentAppr':
			let pymtApprData = await paymentAppr.find({})
			for(let ele of pymtApprData){
				let rfaData = await reqForAppr.findOne({apprId: ele.apprId}, '-_id billRcvId billTtlAppr billApprBal billAmtPaid billBalPyble reqForApprBasic reqForApprGST ttlRFApprAmt')
				let billData = await billRcpt.findOne({billRcvId: rfaData.billRcvId}, '-_id billNo party acptdTtlBillVal')
				data.push({_doc: {...rfaData._doc, ...ele._doc, ...billData._doc}})
			}
			break
		case 'paymentRfr':
			let pymtRfrData = await paymentRfr.find({})
			for(let ele of pymtRfrData){
				let rfaData = await reqForAppr.findOne({apprId: ele.apprId}, '-_id billRcvId billTtlAppr billApprBal billAmtPaid billBalPyble')
				let billData = await billRcpt.findOne({billRcvId: rfaData.billRcvId}, '-_id billNo party acptdTtlBillVal')
				let pymtApprData = await paymentAppr.findOne({apprId: ele.apprId}, '-_id apprdBasic apprdGST apprdTtlAmt')
				data.push({_doc: {...rfaData._doc, ...ele._doc, ...pymtApprData._doc, ...billData._doc}})
			}
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
	
		res.render('viewData', {dataArray, username: req.user.username, mode: 'view', dbArray, n: 3})
		}
})

app.route('/edit/:collection')
	.get(async (req, res) => {
		if(!req.isAuthenticated())
			res.redirect('/auth/login')
		else
		{
		//render the forms here
		const {collection} = req.params
		const {accessLvl, username} = req.user
		let n = accessLvl-1
		if(n === 4)
			n = 3
		let data
		let dataArray =[]
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
		}
		data.forEach(ele => {
			const newObj = ele._doc
			dataArray.push(newObj)
		})
		const pkg = {username, data: dataArray, n, mode: 'edit', dbArray, formReviewData, count}

		switch(collection){
		case 'billRcpt':
			if(accessLvl >= 1)
				res.render('forms/billRcptFrm', pkg)
				count.billRcpt++
			break
		case 'reqForAppr':
			if(accessLvl >= 2)
				res.render('forms/reqForApprFrm', pkg)
				count.reqForAppr++
			break
		case 'paymentAppr':
			if(accessLvl >= 3)
				res.render('forms/paymentApprFrm', pkg)
				count.paymentAppr++
			break
		case 'paymentRfr':
			if(accessLvl >= 4)
				res.render('forms/paymentRfrFrm', pkg)
				count.paymentRfr++
			break
		default:
			res.redirect('/edit/billRcpt', pkg)
		}
		formReviewData = {}
	}
	})
	.post(async (req, res) => {
		if(!req.isAuthenticated())
			res.redirect('/auth/login')
		else{
		const {collection} = req.params

		let newRecord= {}
		switch(collection){
		case 'billRcpt':
			newRecord = new billRcpt(req.body)
 			await newRecord.save()
			break
		case 'reqForAppr':
			newRecord = new reqForAppr(req.body)
 			await newRecord.save()
			break
		case 'paymentAppr':
			newRecord = new paymentAppr(req.body)
 			await newRecord.save()
			break
		case 'paymentRfr':
			newRecord = new paymentRfr(req.body)
 			await newRecord.save()
			break
		}
		res.redirect('/selectmode')
	}
	})

app.post('/edit/:collection/review', (req, res) => {
	if(!req.isAuthenticated())
		res.redirect('/auth/login')
	else{

	const data = req.body
	const {collection} = req.params
	let resultObj = {}
	switch(collection){
	case 'billRcpt':
		billRcpt.count({}).then(count => {
			formReviewData = {...data, billRcvId: count+1}
		})
		break
	case 'reqForAppr':
		billRcpt.findOne({billRcvId: data.billRcvId}, '-_id billNo party acptdTtlBillVal').then(({_doc}) => {
			if(_doc)
				reqForAppr.count({}).then(count => {
					formReviewData = {...data,..._doc, apprId: count+1}
				})

		}).catch(err => {
			console.log(err)
		})

		break
	case 'paymentAppr':

		resultObj = {}
		reqForAppr.findOne({apprId: data.apprId}, '-_id billRcvId billTtlAppr billApprBal billAmtPaid billBalPyble reqForApprBasic reqForApprGST')
			.then(result => {
				if(result._doc){
					resultObj = result._doc
					billRcpt.findOne({billRcvId: resultObj.billRcvId}, '-_id billNo party acptdTtlBillVal')
						.then(({_doc}) => {
							if(_doc){
								resultObj = {...resultObj, ..._doc}
								formReviewData = {...resultObj, ...data}
								// console.log(formReviewData)
							}
						}).catch(err => {
							console.log(err)
						})
				}

			}).catch(err => {
				console.log(err)
			})
			
			// console.log(formReviewData)
			//if formReviewData = empty.. error
		break
	case 'paymentRfr':
		resultObj = {}
		reqForAppr.findOne({apprId: data.apprId}, '-_id billRcvId billTtlAppr billApprBal billAmtPaid billBalPyble')
			.then(result => {
				if(result._doc){
					resultObj = result._doc
					billRcpt.findOne({billRcvId: resultObj.billRcvId}, '-_id billNo party acptdTtlBillVal')
						.then(resultBill => {
							if(resultBill._doc){
								resultObj = {...resultObj, ...resultBill._doc}
								paymentAppr.findOne({apprId: data.apprId}, '-_id apprdBasic apprdGST apprdTtlAmt')
									.then(({_doc}) => {
										if(_doc){
											resultObj = {...resultObj, ..._doc}
											paymentRfr.count({}).then(count => {
												formReviewData = {...resultObj, ...data, pymtId: count + 1}
												console.log(formReviewData)
											})
										}
									}).catch(err => console.log(err))
							}
						}).catch(err => console.log(err))
				}
			}).catch(err => console.log(err))

		break
	}
	res.redirect(`/edit/${collection}`)
	}
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