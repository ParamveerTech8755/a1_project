import {Schema, model} from 'mongoose'

const paymentApprSchema = new Schema({
	apprBasic: Number,
	apprGST: Number,
	remarks: String,
	apprStatus: String,
	approver: String
}, {timestamps: true})

const paymentApprModel = model('paymentAppr', paymentApprSchema)

export default paymentApprModel