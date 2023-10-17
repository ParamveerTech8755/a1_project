// const mongoose = require('mongoose')
import {Schema, model} from 'mongoose'

const billRcptSchema = new Schema({
	billRcvId: {type: Number, unique: true},
	billDt: String,
	billNo: String,
	billRcvDt: String,
	div: String,
	party: String,
	ourRef: String,
	matServDscr: String,
	ttlBillval: Number,
	acptdBillTxble: Number,
	gstPerctg: Number,
	acptdTtlGSTVal: Number,
	acptdTtlBillVal: Number
}, {timestamps: true})

//complete

const billRcptModel = model('billRcpt', billRcptSchema)
export default billRcptModel