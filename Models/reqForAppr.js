import {Schema, model} from 'mongoose'

const reqForApprSchema = new Schema({
	// billRcvId: /**/,
	reqForApprBasic: Number,
	reqForApprGST: Number,
	remarks: String
}, {timestamps: true})

const reqForApprModel = model('reqForAppr', reqForApprSchema)

export default reqForApprModel