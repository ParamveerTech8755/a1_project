import {Schema, model} from 'mongoose'

const paymentApprSchema = new Schema({
	apprId: {type: Number, required: true},
	// billRcvId: Number,
	apprdBasic: Number,
	apprdGST: Number,
	apprdTtlAmt: Number,
	remarks: String,
	apprStatus: String,
	approver: String
}, {timestamps: true})

const paymentApprModel = model('paymentAppr', paymentApprSchema)

export default paymentApprModel