import {Schema, model} from 'mongoose'

const reqForApprSchema = new Schema({
	apprId: {type: Number, unique: true},
	billRcvId: Number,
	billTtlAppr: Number,
	billApprBal: Number,
	billAmtPaid: Number,
	billBalPyble: Number,
	reqForApprBasic: Number,
	reqForApprGST: Number,
	ttlRFApprAmt: Number,
	remarks: String
}, {timestamps: true})

const reqForApprModel = model('reqForAppr', reqForApprSchema)

export default reqForApprModel