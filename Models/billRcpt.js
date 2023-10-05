// const mongoose = require('mongoose')
import {Schema, model} from 'mongoose'

const billRcptSchema = new Schema({
	billDt: String,
	billNo: String,
	billRcvDt: String,
	div: String,
	party: String,
	ourRef: String,
	matServDscr: String,
	acptdBillTxble: Number,
	gstPerctg: Number,
	acptdTtlGSTVal: Number
}, {timestamps: true})

//incomplete

const billRcptModel = model('billRcpt', billRcptSchema)
export default billRcptModel