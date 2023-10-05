import {Schema, model} from 'mongoose'

const paymentRfrSchema = new Schema({
	pymtAmt: Number,
	pymtType: String,
	pymtMode: String,
	pymtDate: String,
	remarks: String
}, {timestamps: true})

const paymentRfrModel = model('paymentRfr', paymentRfrSchema)

export default paymentRfrModel