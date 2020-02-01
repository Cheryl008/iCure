const express = require('express');
/*
	include all required modules 
*/
const session = require('express-session');
const path = require('path');
const sanitize = require('mongo-sanitize');
const moment = require('moment');


/*
	require database schemas 
*/
require('./db');
const mongoose = require('mongoose');
//const Visitor = mongoose.model('Visitor');
const Patient = mongoose.model('Patient');
const Doctor = mongoose.model('Doctor');
const Appointment = mongoose.model('Appointment');
const Message = mongoose.model('Message');
const Chat = mongoose.model('Chat');
const Post = mongoose.model('Post');
const Comment = mongoose.model('Comment');
const MedicalProfile = mongoose.model('MedicalProfile');
const Id = mongoose.model('Id');

const app = express();

app.set('view engine', 'hbs');

const publicPath = path.join(__dirname);
app.use(express.static(publicPath));
app.use(express.urlencoded({extended: false}));

/*
	* session setting
	* session will be used to store the login state of users
*/
const sessionOptions = {
	secret: 'secret for signing session id',
	saveUninitialized: false,
	resave: false
};

app.use(session(sessionOptions));

/*
	*use the middleware to store the session information of users
*/
app.use(function(req, res, next){
	/*
		use 'local' one the session information
	*/
	res.locals.is_doctor = req.session.is_doctor;
	res.locals.type = req.session.type;
	res.locals.user = req.session.name;
	res.locals._id = req.session._id;
	res.locals.userslug = req.session.slug;
  next();
});

// get the homepage
app.get('/', (req, res) => {
	/*
		* Randomly generate 10 posts from the postes with top 20 hits 
		* send 10 posts to front-end for display
	*/
	let twentyPosts;
	let selectedPosts;
	Post.find(function(err,posts){
		posts.sort((a, b) => (a.hit < b.hit) ? 1:-1);
		twentyPosts = posts.slice(0,20);

		/*
			* generate the posts with the help of the getRandom function
		*/
		selectedPosts = getRandom(twentyPosts, Math.min(10,twentyPosts.length))
		.map(function(postObj) {
			postObj.content = postObj.content.slice(0, 300);
			return postObj;
		});
		if (req.session.name===undefined) {
			res.render('HomePage',{NotLogin: true,posts:selectedPosts});
		}
	else {
		res.render('HomePage',{posts:selectedPosts});
	}
		});
});

//load the login page
app.get("/login", function(req, res) {
    res.render('login', {layout: false});
});

//load the register page
app.get("/signup", function(req, res) {
    res.render('signup', {layout: false});
});

//check whether the login is valid with email and password 

app.get("/loginCheck", function(req,res){
	/*
		check whether the user is login as a doctor
	*/
	if (req.query.usertype==="Doctor") {
		/*
			* check the if the email and password match any registered doctors 
		*/
		Doctor.findOne({email:req.query.Email, password: req.query.Password}, function(error, data){
			if (data) {
				/*
					* if login is valid, store the session info in the server
					* session including the usertype, username, userid, and userslug
				*/
				req.session.is_doctor = true;
				req.session.type = "Doctor";
				req.session.name = data.name;
				req.session._id = data.id;
				req.session.slug = data.slug;
				res.redirect("/");
			} else {
				const errormessage="Sorry! Incorrect username or password. Please try again.";
				res.render("error", {"error": errormessage});
			}
		});
	} else if (req.query.usertype==="Patient"){
		/*
			check whether the user is login as a patient
		*/
		Patient.findOne({email:req.query.Email, password: req.query.Password}, function(error, data){
			/*
				check the if the email and password match any registered doctors 
			*/
			if (data) {
				/*
					* if login is valid, store the session info in the server
					* session including the usertype, username, userid, and userslug
				*/
				req.session.is_doctor = false;
				req.session.type = "Patient";
				req.session.name = data.name;
				req.session._id = data.id;
				req.session.slug = data.slug;
				res.redirect("/");
			}
			else {
				const errormessage="Sorry! Incorrect username or password. Please try again.";
				res.render("error", {"error": errormessage});
			}
		});
	}
});

//get the register form for doctor
app.get('/registerDoctor', function(req, res){
	res.render("registerDoctor",{layout: false});
});

//get the register form for patient
app.get('/registerPatient', function(req, res){
	res.render("registerPatient",{layout: false});
});

//store the register information of new patient into database
app.post('/registerPatient', function(req, res){
	/*
		* generate id for a new patient
		* check the previous ids to decide the next aviliable id
		* the first registered user will get a default id
	*/
	let id = '1000000000';
	Id.findOne({type:'init'},function(error, data){
		if (data) {
			id = data.id;
		}
	});
	/*
		* create a new patient
		* store the personal information provided during the registration
		* save the new patient into database
	*/
	new Patient({
		name: sanitize(req.body.Name),
		password: sanitize(req.body.Password),
		gender: sanitize(req.body.Gender),
		id: id.toString(),
		date_of_birth: sanitize(req.body.DateOfBirth),
		phone: sanitize(req.body.Phone),
		address: sanitize(req.body.Address),
		email: sanitize(req.body.Email),
	}).save(function(error,newPatient){
		if (error) {
			console.log(error);
			const errormessage = "Invalid register information!";
			res.render('errorPage', {"error": errormessage});
		} else {
			patient = newPatient;
			const NewId = id+1;
			/*
				* update the aviliable id
			*/
			Id.findOneAndUpdate({type:'init'},{id:NewId},function(error){
				if (error) {
					const errormessage = "Invalid register information!";
					res.render('errorPage', {"error": errormessage});
					console.log(error);
				} else {
					/*
						* create an empty medical profile for the new patient
					*/
					new MedicalProfile({
						patient_id:id
							}).save(function(error,data){
								if (data) {
									res.redirect('/');
								}
							});
				}
			});
		}
	});
});

//store the register information of new doctor into database
app.post('/registerDoctor', function(req, res){
	/*
		* generate id for a new doctor
		* check the previous ids to decide the next aviliable id
		* the first registered user will get a default id
	*/
	let id = '1000000000';
	Id.findOne({type:'init'},function(error, data){
		if (data) {
				id = data.id;
		} 
	});
	/*
		* create a new doctor
		* store the personal information provided during the registration
		* save the new doctor into database
	*/
	new Doctor({
		name: sanitize(req.body.Name),
		password: sanitize(req.body.Password),
		gender: sanitize(req.body.Gender),
		id: id.toString(),
		date_of_birth: sanitize(req.body.DateOfBirth),
		phone: sanitize(req.body.Phone),
		address: sanitize(req.body.Address),
		email: sanitize(req.body.Email),
		resume: sanitize(req.body.Resume),
		department: sanitize(req.body.Department),
		hospital: sanitize(req.body.Hospital),
		position: sanitize(req.body.Position),
		rating: 0
	}).save(function(error){
	if (error) {
		console.log(error);
		res.render('errorPage', {"error": "Invalid register information!"});
	} else {
		/*
			* update the aviliable id
		*/
		const NewId = id+1;
		Id.findOneAndUpdate({type:'init'},{id:NewId},function(error){
			if (error) {
				res.render('errorPage', {"error": "Server Error!"});
			} else {
				res.redirect('/');
			}
		});
		}
	});
	});

//get the result of doctor search from database and sent to front-end
app.get('/search-result', (req, res) => {
	/*
		* search a doctor based on the input sequence
	*/
	Doctor.find(function(err, doctors) {
		/*
			* show all doctors if the input is empty
		*/
		if (req.query.option === "") {
			/*
				* doctors are sorted by their ratings.
			*/
			doctors.sort((a, b) => (a.rating < b.rating) ? 1:-1);
			res.render('SearchResults', {doctors: doctors});
		} else {
			/*
				* search doctors based on name/hospital/department/position
			*/
			const option = sanitize(req.query.option);
			const filter = sanitize(req.query.filter);
			const filteredDoctors = doctors.filter(function(doctorObj) {
				return doctorObj[filter] === option;
			});
			filteredDoctors.sort((a, b) => (a.rating < b.rating) ? 1:-1);
			res.render('SearchResults', {doctors: filteredDoctors});
		}
	});
});

//get the detailed doctor profile
app.get('/doctors/:slug', (req, res) => {
	const slug = sanitize(req.params.slug);
	/*
		* search for doctor by slug and get the profile 
		* provide detailed doctor info after searching 
	*/
	Doctor.findOne({slug: slug}, function(err, doctor) {
		if (err || doctor === null) {
			res.render('DoctorDetail', {error: true});
		} else {
			res.render('DoctorDetail', {doctor: doctor});

		}
	});
});

//enter the mian form page
app.get('/main-forum', (req, res) => {
	/*
		* search for all posts and send to the front-end
	*/
	Post.find(function(err, posts) {
		if (req.query.option === "") {
		/*
			* list of posts is sorted by the number of their hits
		*/
			posts.sort((a, b) => (a.hit < b.hit) ? 1:-1);
			posts.map(function(postObj) {
				postObj.content = postObj.content.slice(0, 320);
				return postObj;
			});
			res.render('forumPosts', {posts: posts});
		} else {
			/*
				* filter the posts if searching with specific title/author
			*/
			const option = sanitize(req.query.option);
			const filter = sanitize(req.query.filter);
			const filteredPosts = posts.filter(function(postObj) {
				return postObj[filter] === option;
			}).map(function(postObj) {
				postObj.content = postObj.content.slice(0, 300);
				return postObj;
			});
			filteredPosts.sort((a, b) => (a.hit < b.hit) ? 1:-1);
			res.render('forumPosts', {posts: filteredPosts});
		}
	});
});

//get the page of creating a new post
app.get('/posts-new', (req, res) => {
	if (req.session.name !== undefined){
	res.render('addPost'); 
	} else {
		res.redirect('/login');
	}
});

//add the new post into database and go back to the main form
app.post('/posts-new', (req, res) => {
	/*
		* get the title, content, time, author of the new post
	*/
	const rawContent = JSON.parse(sanitize(req.body.content));
	const title = sanitize(req.body.title);
	const content = rawContent["ops"][0]["insert"].trim();
	const myDate = new Date();
	const time = myDate.getTime();
	const stringTime = moment(time).format('YYYY-MM-DD HH:mm:ss');
	/*
		* create a new post with the corresponding data
	*/
	const newPost = new Post({
		title: title,
		content: content,
		author_id: req.session._id,
		create_time: stringTime,
		comments: [],
		name: req.session.name,
		hit: 0
	});
	/*
		* save the post into database 
	*/
	newPost.save(function(err) {
		if (err) {
			/*
				* reprot the error if title is not provided
			*/
			res.render('addPost', {error: "Please provide a title."});
		} else {
			res.redirect('/main-forum');
		}
	});
});

//get the detailed information and comments of the post
app.get('/posts/:slug',(req, res) => {
	const slug = sanitize(req.params.slug);
	const name = sanitize(req.query.option);
	/*
		* search for post based on its slug and set the info to front-end
	*/
	Post.findOneAndUpdate({slug: slug}, {$inc: {hit: 1}}, function(err, post) {
		if (err) {
			res.render('postContent', {error: "Server error"});
		} else {
			/*
				* find the list of comments under this post
			*/
			Comment.find({_id: post.comments}, function(err, comments) {
				if (err) {
					res.render('postContent', {error: true});
				} else if (req.query.option === "" || req.query.option === undefined) {
					res.render('postContent', {post: post, comments: comments});
				} else {
					/*
						* filter the comment if searching for comments from specific useer
					*/
					const filteredComments = comments.filter(function(commentObj) {
						return commentObj.name === name;
					});
					res.render('postContent', {post: post, comments: filteredComments});
				}
			});
		}
	});
});

// get the page for making a new comment on the post
app.get('/posts/:slug/comments', (req, res) => {
	const slug = sanitize(req.params.slug);
	res.redirect('/posts/'+slug);
});

//make new comments under the post
app.post('/posts/:slug/comments', (req, res) => {
	/*
		* direct to the login page if the user hasn't logged in
	*/
	if (req.session.name === undefined) {
		res.redirect('/login');
	}
	/*
		* get the content,time and auther info of the comment from the front-end
	*/
	const slug = sanitize(req.params.slug);
	const comment = sanitize(req.body.comment);
	const name = req.session.name;
	const authorId = req.session._id;
	const myDate = new Date();
	const time = myDate.getTime();
	const stringTime = moment(time).format('YYYY-MM-DD HH:mm:ss');
	/*
		* create a new comment with these info
	*/
	const newComment = new Comment({
		content: comment,
		author_id: authorId,
		create_time: stringTime,
		name: name
	});
	/*
		* save the new comment into database
	*/
	newComment.save(function(err, savedComment) {
		if (err) {
			console.log('error 1', err);
			res.render('postContent', {commentError: true});
		} else {
			/*
				* update the post in database by adding the new comment 
			*/
			Post.findOneAndUpdate({slug: slug}, {$push: {comments: savedComment._id}}, function(err) {
				if (err) {
					console.log('error 2',err);
					res.render('postConent', {commentError: true});
				} else {
					res.redirect('/posts/' + slug);
				}
			});
		}
	});
});

//get the page(calendar) for making an appointment with a doctor
app.get('/make-appointment/:slug', function(req, res){
	/*
		* direct to the login page if the user hasn't logged in
	*/
	if (req.session.name === undefined) {
		res.redirect('/login');
	}
	const doctorSlug = req.params.slug;
	/*
		* find the doctor by the doctor slug
	*/
	Doctor.findOne({slug:doctorSlug}, function(error,doctor){
		if (error){
			const errormessage = "Server Error!";
			res.render('errorPage', {"error": errormessage});
			console.log(error);
		}
		else {
			/*
				* find all appointment of the doctor
			*/
			Appointment.find({doctor_id:doctor.id},function(error,appointment){
				if (error){
					const errormessage = "Server Error!";
					res.render('errorPage', {"error": errormessage});
					console.log(error);
				} else {
					/*
						* send the list of appointments to the front-end
					*/
					res.render('makeAppointment',{doctor:doctor,appointment:JSON.stringify(appointment),slug:req.session.slug});
				}
			});
		}
	});
});

//store the new appointment into database
app.post('/update-appointment',function(req,res){
	const event = JSON.parse(req.body.newEvent);
	const doctorId = sanitize(req.body.doctor_id).toString();
	/*
		* create a new appointment event
		* the detailed infomation of the appointment event comes from the front-end form and calendar API
	*/
	const newEvent = new Appointment({
		title: event.title,
		start: event.start,
		end:event.end,
		doctor_id: doctorId,
		patient_id:req.session._id,
		chief_complaint:event.chief_complaint,
	});
	/*
		* save the new appointment event into database
	*/
	newEvent.save(function(err, appointment){
		if (err){
			const errormessage = "Server Error!";
			res.render('errorPage', {"error": errormessage});
			console.log(err);
		} else {
			Doctor.find({id: doctorId}, function(err, doctor) {
				if (err) {
					const errormessage = "Server Error!";
					res.render('errorPage', {"error": errormessage});
					console.log(err);
				} else {
					/*
						* whenever making an appointment
						* the patient and doctor can chat with each other
						* so a new chat will be created if there isn't one
					*/
					Chat.findOne({doctor_id: doctorId, patient_id: req.session._id}, function(err, chat) {
						/*
							* check if there is a chat between the doctor and the patient
						*/
						if (err) {
							const errormessage = "Server Error!";
							res.render('errorPage', {"error": errormessage});
							console.log(err);
						} else if (chat == undefined) {
							/*
								* create a new chat 
								* save the chat into database
							*/
							const newChat = new Chat({
							doctor_id: doctorId,
							patient_id: req.session._id,
							doctor_name: doctor[0].name,
							patient_name: req.session.name,
							messages: []
							});
							newChat.save(function(err, chat) {
								if (err) {
									console.log(err);
								}
							});
						}
					});		
				}
			});
		}
	});

});

//view all the appointments, including history and upcoming
app.get('/appointment-history/:slug',function(req,res){
	const upcoming = [];
	const history = [];
	let currentApp = {};
	if (req.session.type === "Patient") {
		/*
			* search the appointments with the patient id 
			* distinguish the history appointments and upcoming appintments
		*/
		Appointment.find({patient_id: req.session._id}, function(err, appointments) {
			if (err) {
				res.render('appointmentHistory', {error: true});
			} else {
				for (let i=0; i<appointments.length; i++ ){
					currentApp = appointments[i];
					if (appointments[i].status === "Upcoming"){
						/*
							* use the helper function to get the doctor and patient info the the appointments
						*/
						getDoctorAndPatient(currentApp);
						currentApp.slotEventOverlap=false;
						upcoming.push(currentApp);
						} else {
								getDoctorAndPatient(currentApp);
								currentApp.slotEventOverlap=false;
								history.push(currentApp);
						}
					}
				}
				res.render('appointmentHistory', {upcoming:upcoming,history:history});
		});
	} else if (req.session.type==="Doctor") {
		/*
			* search the appointments with the doctor id 
			* distinguish the history appointments and upcoming appintments
		*/
		Appointment.find({doctor_id: req.session._id}, function(err, appointments) {
			if (err) {
				res.render('appointmentHistory', {error: true});
			} else {
				for (let i=0; i<appointments.length; i++ ){
					currentApp = appointments[i];
					if (appointments[i].status === "Upcoming"){
						/*
							* use the helper function to get the doctor and patient info the the appointments
						*/
						getDoctorAndPatient(currentApp);
						currentApp.slotEventOverlap=false;
						upcoming.push(currentApp);
						//console.log(currentApp);
						} else {
								getDoctorAndPatient(currentApp);
								currentApp.slotEventOverlap=false;
								history.push(currentApp);
						}
					}
				}
				//console.log(upcoming);
				res.render('appointmentHistory', {upcoming:upcoming,history:history});
});

	}
});

//view the detail of an appointment
app.get('/appointments/:slug',function(req,res){
	let currentAppointment = {};
	const slug = req.params.slug;
	let currDoctor;
	Appointment.findOne({slug:slug},function(err,appointment){
		if (err) {
			const errormessage = "errormessage";
			res.render('errorPage', {"error": errormessage});
		}else if (appointment){
			currentAppointment = appointment;
			Doctor.findOne({id:appointment.doctor_id},function(err,doctor){
				currDoctor = doctor;
				if (err) {
					const errormessage = "errormessage";
					res.render('errorPage', {"error": errormessage});
				}else if (doctor){
					MedicalProfile.findOne({patient_id:currentAppointment.patient_id}, function(err,data){
						if (err) {
							const errormessage = "errormessage";
							res.render('errorPage', {"error": errormessage});
						} else if (data){
							res.render("appointmentDetail",{appointment:currentAppointment,doctor:currDoctor,medicalProfile:data,slug:slug});
						} else {
							new MedicalProfile({
								patient_id:currentAppointment.patient_id
							}).save(function(err,data){
								if(err) {
									res.render('errorPage', {"error": errormessage});
								}else if (data){
									res.render("appointmentDetail",{appointment:currentAppointment,doctor:currDoctor,medicalProfile:data,slug:slug});
								}
							});
						}
					});
				}
			});
		}
	});
});

//view and edit the diagnosis corresponding to one appointment
app.get('/diagnosis/:slug',function(req,res){
	let currentAppointment = {};
	const slug = req.params.slug;
	let currDoctor;
	Appointment.findOne({slug:slug},function(err,appointment){
		if (err) {
			const errormessage = "errormessage";
			res.render('errorPage', {"error": errormessage});
		} else if (appointment){
			currentAppointment = appointment;
			Doctor.findOne({id:appointment.doctor_id},function(err,doctor){
				currDoctor = doctor;
				if (err) {
					const errormessage = "errormessage";
					res.render('errorPage', {"error": errormessage});
				}else if (doctor){
					MedicalProfile.findOne({patient_id:currentAppointment.patient_id}, function(err,data){
						if (err) {
							const errormessage = "errormessage";
							res.render('errorPage', {"error": errormessage});
						} else if (data){
							res.render("diagnosisDetail",{appointment:currentAppointment,doctor:currDoctor,medicalProfile:data,slug:slug});
						} else {
							new MedicalProfile({
								patient_id:currentAppointment.patient_id
							}).save(function(err,data){
								if (err) {
									const errormessage = "errormessage";
									res.render('errorPage', {"error": errormessage});
								}else{
									res.render("diagnosisDetail",{appointment:currentAppointment,doctor:currDoctor,medicalProfile:data,slug:slug});
								}
							});
						}
					});
				}
			});
		}
	});
});

//get the page of rating an appoitment
app.get('/rate/:slug',function(req,res){
	let currentAppointment = {};
	const slug = req.params.slug;
	let currDoctor;
	/*
		* find all the history appointments aviliable for rate
		* get the appointment details 
		* send the info of the appointment to be rated to front-end
	*/
	Appointment.findOne({slug:slug},function(err,appointment){
		if (appointment){
			currentAppointment = appointment;
			Doctor.findOne({id:appointment.doctor_id},function(err,doctor){
				currDoctor = doctor;
				if (err) {
					const errormessage = "errormessage";
					res.render('errorPage', {"error": errormessage});
				} else{
					MedicalProfile.findOne({patient_id:currentAppointment.patient_id}, function(err,data){
						if (err) {
							const errormessage = "errormessage";
							res.render('errorPage', {"error": errormessage});
						} else if(data){
							res.render("rateDetail",{appointment:currentAppointment,doctor:currDoctor,medicalProfile:data,slug:slug});
						} else {
							new MedicalProfile({
								patient_id:currentAppointment.patient_id
							}).save(function(err,data){
								if (err) {
									const errormessage = "errormessage";
									res.render('errorPage', {"error": errormessage});
								} else{
									res.render("rateDetail",{appointment:currentAppointment,doctor:currDoctor,medicalProfile:data,slug:slug});
								}
							});
						}
					});
				}
			});
		}
	});
});

//post and store the rate and comments of an appointment
app.post('/rate/:slug',function(req,res){
	let doctor_id;
	let doc_rate = 0;
	let num = 0;
	let avg_rate = 0;
	const slug = req.params.slug;
	const rate = sanitize(req.body.rate);
	const rawComment = JSON.parse(sanitize(req.body.comment));
	const comment = rawComment["ops"][0]["insert"].trim();
	Appointment.findOneAndUpdate({slug:slug},{rate:rate,comment:comment},function(err,appointment){
		if (appointment){
			doctor_id = appointment.doctor_id;
			Appointment.find({doctor_id:doctor_id}, function(err, doc_apps){
				if (err) {
					const errormessage = "errormessage";
					res.render('errorPage', {"error": errormessage});
				} else{
					for (let i=0; i<doc_apps.length; i++) {
						if (doc_apps[i].rate && doc_apps[i].rate !== "0") {
							doc_rate += parseInt(doc_apps[i].rate);
							num += 1;
						} 
					}
					if (num !== 0) {
						avg_rate = doc_rate/num;
					}
					Doctor.findOneAndUpdate({id:doctor_id},{rating: avg_rate.toFixed(1)}, function(err, doctor){
						if (err) {
							const errormessage = "errormessage";
							res.render('errorPage', {"error": errormessage});
						} else {
							res.redirect('/rate/'+slug);
						}
					});
				}
			});
		}
	});
});

//store the diagnosis 
app.post('/diagnosis/:slug',function(req,res){
	const slug = req.params.slug;
	const rawDiagnosis = JSON.parse(sanitize(req.body.diagnosis));
	const diagnosis = rawDiagnosis["ops"][0]["insert"].trim();
	/*
		* create a new medical profile 
	*/
	const newMedical = {
		height: sanitize(req.body.height),
		weight: sanitize(req.body.weight), 
		right_eye_sight: sanitize(req.body.right_eye_sight),
		left_eye_sight: sanitize(req.body.left_eye_sight),
		blood_type: sanitize(req.body.blood_type),
		medical_history: sanitize(req.body.medical_history),
		allergy: sanitize(req.body.allergy),
		blood_pressure_low: sanitize(req.body.blood_pressure_low),
		blood_pressure_high: sanitize(req.body.blood_pressure_high),
	};
	/*
		* update the appointment with new medical profile and diagnosis
	*/
	Appointment.findOneAndUpdate({slug:slug},{diagnosis:diagnosis,status:"History"},function(err,appointment){
		if (err) {
			const errormessage = "errormessage";
			res.render('errorPage', {"error": errormessage});
		} else {
			/*
				* uodate the medical profile of the patient in the database
			*/
			MedicalProfile.findOneAndUpdate({patient_id:appointment.patient_id},newMedical,function(err){
				res.redirect('/appointments/'+slug);
			});
		}
	});
});


//get the profile of doctors and patients
app.get('/info-form/:slug',function(req,res){
	if (req.session.type === "Doctor"){
		/*
			* search for doctor and get the profile
		*/
		Doctor.findOne({slug:req.session.slug},function(err,doctor){
			if (err) {
				const errormessage = "errormessage";
				res.render('errorPage', {"error": errormessage});
			} else{
				res.render("infoForm",{my:doctor});
			}
		});
	} else if(req.session.type === "Patient"){
		/*
			* search for patient and get the profile
		*/
		Patient.findOne({slug:req.session.slug},function(err,patient){
			if (patient){
				MedicalProfile.findOne({patient_id:patient.id},function(err,medicalProfile){
					if (err){
						const errormessage = "errormessage";
						res.render('errorPage', {"error": errormessage});
						console.log(err);
					} else {
						res.render("infoForm",{my:patient, medicalProfile:medicalProfile});
					}
				});
			}
		});
	}
});

//update the profile for patients and doctors after editing the profile
app.post('/update-profile/:slug',function(req,res){
	let newProfile = {};

	/*
		* create a new profile with the updated personal information
		* update the doctors'/patients' profile with the new profile
	*/

	if (req.session.type === "Doctor"){
		newProfile = {
			phone: sanitize(req.body.phone),
			address: sanitize(req.body.address),
			email: sanitize(req.body.email),
			resume: sanitize(req.body.resume),
			department: sanitize(req.body.department),
			hospital: sanitize(req.body.hospital),
			position: sanitize(req.body.position),
		};
		if (sanitize(req.body.gender)) {
			newProfile[gender] = sanitize(req.body.gender);
		}
		Doctor.findOneAndUpdate({slug:req.session.slug},newProfile,function(err,doctor){
			if (err) {
				const errormessage = "errormessage";
				res.render('errorPage', {"error": errormessage});
			} else {
				res.redirect('/info-form/:slug');
			}
		});
	} else if(req.session.type === "Patient"){

		/*
			* create a new medical profile with the updated personal information
			* update the patients' medical profile with the new one in addition the personal information profile
		*/

		const newMedical = {
		height: sanitize(req.body.height),
		weight: sanitize(req.body.weight), 
		right_eye_sight: sanitize(req.body.right_eye_sight),
		left_eye_sight: sanitize(req.body.left_eye_sight),
		medical_history: sanitize(req.body.medical_history),
		allergy: sanitize(req.body.allergy),
		blood_pressure_low: sanitize(req.body.blood_pressure_low),
		blood_pressure_high: sanitize(req.body.blood_pressure_high),
		};
		if (sanitize(req.body.blood_type)){
			newMedical.blood_type = sanitize(req.body.blood_type);
		}
		newProfile = {
			phone: sanitize(req.body.phone),
			address: sanitize(req.body.address),
			email: sanitize(req.body.email),
		};
		if (sanitize(req.body.gender)) {
			newProfile[gender] = sanitize(req.body.gender);
		}
		Patient.findOneAndUpdate({slug:req.session.slug},newProfile,function(err,patient){
			if (patient){
				MedicalProfile.findOneAndUpdate({patient_id:patient.id}, newMedical,function(err,medicalProfile){
					if (err){
						const errormessage = "errormessage";
						res.render('errorPage', {"error": errormessage});
					} else {
						res.redirect('/info-form/:slug');
					}
				});
			}
		});
	}
});

//get the chat page 
app.get('/chat', (req, res) => {
	if (req.session.name === undefined) {
		res.redirect('/login');
	}
	/*
		* doctor can create chat with patient who has upcoming  appointments
		* start with finding the upcoming appointments
		* then find the patients corresponde with the appointments
		* create new chat if no chat exists
	*/
	if (req.session.type === "Doctor") {
		Appointment.find({doctor_id: req.session._id, status: ["Upcoming", "Ongoing"]}, function(err, appointments) {
			if (err) {
				console.log(err);
				res.render('avaiChat', {error: true});
			} else {
				const appids = appointments.map(function(obj) {
					return obj.patient_id;
				});
				Patient.find({id: appids}, function(err, patients) {
					if (err) {
						console.log(err);
						res.render('avaiChat', {error: true});
					} else {
						//res.render('avaiChat', {clients: patients});
						const patientids = patients.map(function(obj) {
							return obj.id;
						});
						Chat.find({doctor_id: req.session._id, patient_id: patientids}, function(err, chats) {
							if (err) {
								res.render('avaiChat', {error: true});
							} else {
								res.render('avaiChat', {chats: chats});
							}
						});
					}
				});
			}
		});
	} else {
		/*
			* patient can create chat with doctor who has upcoming appointments
			* start with finding the upcoming appointments
			* then find the doctor corresponde with the appointments
			* create new chat if no chat exists
		*/
		Appointment.find({patient_id: req.session._id, status: ["Upcoming", "Ongoing"]}, function(err, appointments) {
			if (err) {
				res.render('avaiChat', {error: true});
			} else {
				const appids = appointments.map(function(obj) {
					return obj.doctor_id;
				});
				Doctor.find({id: appids}, function(err, doctors) {
					if (err) {
						res.render('avaiChat', {error: true});
					} else {
						//res.render('avaiChat', {clients: doctors});
						const doctorids = doctors.map(function(obj) {
							return obj.id;
						});
						Chat.find({patient_id: req.session._id, doctor_id: doctorids}, function(err, chats) {
							if (err) {
								res.render('avaiChat', {error: true});
							} else {
								res.render('avaiChat', {chats: chats});
							}
						});
					}
				});
			}
		});
	}
});


//get the chat page 
app.get('/chat/:slug', (req, res) => {
	/*
		* direct to the login page if the user hasn't logged in
	*/
	if (req.session.name === undefined) {
		res.redirect('/login');
	}
	const slug = req.params.slug;
	/*
		* find the chat based on the chat slug
		* find the previous messaged with this chat
		* send these messaged to the front-end
	*/
	if (req.session.type === "Doctor") {
		Chat.findOne({slug:slug}, function(err, chat) {
			if (err) {
				res.render('mainChat', {error: true});
			} else {
				Message.find({_id: chat.messages}, function(err, messages) {
					if (err) {
						res.render('mainChat', {error: true});
					} else {
						messages.sort((a, b) => (a.time < b.time) ? 1:-1);
						res.render('mainChat', {messages: messages, chat: chat});
					}
				});
			}
		});
	} else {
		Chat.findOne({slug:slug}, function(err, chat) {
			if (err) {
				res.render('mainChat', {error: true});
			} else {
				Message.find({_id: chat.messages}, function(err, messages) {
					if (err) {
						res.render('mainChat', {error: true});
					} else {
						messages.sort((a, b) => (a.time < b.time) ? 1:-1);
						res.render('mainChat', {messages: messages, chat: chat});
					}
				});
			}
		});
	}
});

//get the chat for message sending
app.get('/chat/:slug/send', (req, res) => {
	/*
		* direct to the login page if the user hasn't logged in
	*/
	if (req.session.name === undefined) {
		res.redirect('/login');
	}
	const slug = sanitize(req.params.slug);
	/*
		* find the chat based on the chat slug
	*/
	Chat.findOne({slug: slug}, function(err, chat) {
		Message.find({_id: chat.messages}, function(err, messages) {
			if (err) {
				console.log(err);
			} else {
				messages.sort((a, b) => (a.time < b.time) ? 1:-1);
				res.json(messages);
			}
		});	
	});
});

//store the new message into the database and update the chat 
app.post('/chat/:slug', (req, res) => {
	/*
		* direct to the login page if the user hasn't logged in
	*/
	if (req.session.name === undefined) {
		res.redirect('/login');
	}
	/*
		* get info about the chat and message from the front-end
	*/
	const slug = sanitize(req.params.slug);
	const text = sanitize(req.body.message);
	const sender_type = req.session.type;
	const sender_name = req.session.name;
	const sender_id = req.session._id;
	const myDate = new Date();
	const time = myDate.getTime();
	const stringTime = moment(time).format('YYYY-MM-DD HH:mm:ss');
	/*
		* create a new message with the info from the front-end
	*/
	const newMessage = new Message({
		sender_type: sender_type,
		sender_name: sender_name,
		sender_id: sender_id,
		time: stringTime,
		text: text
	});
	/*
		* save the new message into the database
	*/
	newMessage.save(function(err, savedMessage) {
		if (err) {
			console.log('error 10', err);
			res.render('mainChat', {error: true});
		} else {
			/*
				* Update the chat by adding the new message
			*/
			Chat.findOneAndUpdate({slug: slug}, {$push: {messages: savedMessage._id}}, function(err) {
				if (err) {
					console.log('error 20',err);
					res.render('mainChat', {error: true});
				} else {
					res.redirect('/chat/'+ slug);
				}
			});
		}
	});
});



//help fnction for get patient and doctor profile for an appointment
function getDoctorAndPatient(currentApp){
	/*
		* take in arguement: an appointment object
		* find both doctor and patint of the current appointment
	*/
	currentApp = Doctor.findOne({id:currentApp.doctor_id}, function(error, doctor){
		if (doctor){
			/*
				* find the doctor and get the email address and name
			*/
			currentApp.doctor_name = doctor.name;
			currentApp.doctor_email = doctor.email;
			Patient.findOne({id:currentApp.patient_id},function(err,patient){
				if (patient) {
			/*
				* find the patient and get the email address and name
			*/
				currentApp.patient_name = patient.name;
				currentApp.patient_email = patient.email;
			}
			});
		}
	});
}

//help function for randomly generating top posts on the homepage 
function getRandom(arr, n) {
	/*
		* arguements: an arrry 'arr' and an integer n
		* generate n random elements from the array
	*/
    const result = new Array(n);
    let len = arr.length;
    const taken = new Array(len);
    if (n > len) {
        throw new RangeError("getRandom: more elements taken than available");
    }
    while (n--) {
        const x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

//log out 
app.get('/logout', (req,res) => {
	/*
		* clean up the session information
	*/
	req.session.name = undefined;
	req.session._id = undefined;
	req.session.slug = undefined;
	res.redirect('/');
});

app.listen(3000);
