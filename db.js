// db.js
//refer to the class diagram
const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');

//visitor
const Visitor = new mongoose.Schema({
	id: {type: String, required: true, minlength: 10, maxlength: 10}
});

//id
const Id = new mongoose.Schema({
	type : {type: String, required: true},
	id :{type: Number, required: true, default: 1000000000}
});

//patient
const Patient = new mongoose.Schema({
	id: {type: String, required: true, minlength: 10, maxlength: 10},
	name: {type: String, required: true},
	password: {type: String, required: true, minlength: 5, maxlength: 20},
	date_of_birth: {type: Date, required: true},
	gender: {type: String, required: true},
	phone: {type: String, required: true},
	address: String,
	email: {type: String, required: true}
});

//doctor
const Doctor = new mongoose.Schema({
	id: {type: String,required: true},
	name: {type: String, required: true},
	password: {type: String, required: true, minlength: 5, maxlength: 20},
	date_of_birth: {type: Date, required: true},
	gender: {type: String, required: true},
	phone: {type: String, required: true},
	address: String,
	email: {type: String, required: true},
	resume: {type: String, required: true}, // resume type: undecided
	hospital: {type: String, required: true},
	department: {type: String, required: true},
	position: {type: String, required: true},
	rating: {type: Number, required: true}
});

//appointment
// * each appointment is related to one doctor and one patient
// * each appointment has a unique create time
// * each appointment is ralated a patient's profile
const Appointment = new mongoose.Schema({
	startTime: {type: Date, default: Date.now, required: true},
	endTime: {type: Date, default: Date.now, required: true},
	doctor_id: {type: String, required: true, minlength: 10, maxlength: 10},
	patient_id: {type: String, required: true, minlength: 10, maxlength: 10},
	chief_complaint: {type: String, required: true},
	diagnosis: String,
	prescription: String,
	status: {type: String,default: "Upcoming",required: true},
	rating: {type: Number},
	related_profile: {type: mongoose.Schema.Types.ObjectId, ref:'MedicalProfile'}
});

//message
// * each message is related to one doctor and one patient
// * each message has a unique create time
const Message = new mongoose.Schema({
	doctor_id: {type: String,required: true, minlength: 10, maxlength: 10},
	patient_id: {type: String,required: true, minlength: 10, maxlength: 10},
	time: {type: Date, default: Date.now, required: true},
	text: {type: String,required: true}
});

//chat
// * each chat is related to one doctor and one patient
// * each chat contains 0 or more messages
const Chat = new mongoose.Schema({
	doctor_id: {type: String,required: true, minlength: 10, maxlength: 10},
	patient_id: {type: String,required: true, minlength: 10, maxlength: 10},
	messages: [{type: mongoose.Schema.Types.ObjectId, ref:'Message'}]
});

//post
// * each post is related to one user
// * each post has a unique create time
// * each post contains 0 or more comments
const Post = new mongoose.Schema({
	title: {type: String, required: true},
	name: {type: String, required: true},
	author_id: {type: String, required: true, maxlength:10},
	content: {type: String,required: true},
	create_time: {type: Date, default: Date.now, required: true}, 
	hit: {type: Number, required: true, default: 0},
	comments: [{type: mongoose.Schema.Types.ObjectId, ref:'Comment'}]
});

//comment
// * each comment is related to one user
// * each comment has a unique create time
// * each comment is related to one post or one comment (?)
// * each comment contains 0 or more comments
const Comment = new mongoose.Schema({
	post: {type: mongoose.Schema.Types.ObjectId, ref:'Post'},
	name: {type: String, required: true},
	comment: {type: mongoose.Schema.Types.ObjectId, ref:'Comment'},
	author_id: {type: String, required: true, maxlength: 10},
	content: {type: String,required: true},
	create_time: {type: Date, default: Date.now, required: true},
	comments: [{type: mongoose.Schema.Types.ObjectId, ref:'Comment'}]
});

//medical profile
// * each medical profile is related to one patient
const MedicalProfile = new mongoose.Schema({
	patient_id: {type: String,required: true, minlength: 10, maxlength: 10},
	height: Number,
	weight: Number, 
	right_eye_sight: Number,
	left_eye_sight: Number,
	blood_type: String,
	medical_history: String,
	allergy: String,
	blood_pressure: String,
	others: String
});


Patient.plugin(URLSlugs('id name'));
Doctor.plugin(URLSlugs('id name'));
Appointment.plugin(URLSlugs('doctor_id patient_id time'));
Message.plugin(URLSlugs('doctor_id patient_id time'));
Chat.plugin(URLSlugs('doctor_id patient_id'));
Post.plugin(URLSlugs('author_id create_time'));
Comment.plugin(URLSlugs('author_id create_time'));
MedicalProfile.plugin(URLSlugs('patient_id'));
Visitor.plugin(URLSlugs('id'));
Id.plugin(URLSlugs('id'));

mongoose.model('Visitor', Visitor);
mongoose.model('Patient', Patient);
mongoose.model('Doctor', Doctor);
mongoose.model('Appointment', Appointment);
mongoose.model('Message', Message);
mongoose.model('Chat', Chat);
mongoose.model('Post', Post);
mongoose.model('Comment', Comment);
mongoose.model('MedicalProfile', MedicalProfile);
mongoose.model('Id', Id);

mongoose.connect('mongodb://localhost/icure'); // unfinished, connect to mongodb 
