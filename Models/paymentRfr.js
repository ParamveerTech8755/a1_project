import {Schema, model} from 'mongoose'

const paymentRfrSchema = new Schema({
	pymtId: Number,
	apprId: Number,
	// billRcvId: Number,
	pymtAmt: Number,
	pymtTyp: String,
	pymtMthd: String,
	pymtDt: String,
	remarks: String
}, {timestamps: true})

const paymentRfrModel = model('paymentRfr', paymentRfrSchema)

export default paymentRfrModel