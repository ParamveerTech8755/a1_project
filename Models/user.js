import {Schema, model} from 'mongoose'
import passportLocalMongoose from 'passport-local-mongoose'
import findOrCreate from 'mongoose-findorcreate'

const UserSchema = new Schema({
	username: {type: String, unique: true, required: true},
	password: {type: String},
	accessLvl: {type: Number, required: true}
})

UserSchema.plugin(passportLocalMongoose)
UserSchema.plugin(findOrCreate)
const User = model('User', UserSchema)


export default User