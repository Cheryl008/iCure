document.addEventListener('DOMContentLoaded', function() {
  let calendarEl = document.getElementById('calendar');
  let doctor_id = document.getElementById('doctor').value;
  let event = JSON.parse(document.getElementById('event').value);
  let eventArray = event;
  let newEvent = {};
  let dateStart;
  let dateEnd;
  let now; 
  let calendar = new FullCalendar.Calendar(calendarEl, {
    plugins: [ 'interaction', 'timeGrid','DateTime' ],
    header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
    },
  validRange: {
    start: new Date('now')
  },
    editable:true,
    selectable: true,
    selectHelper: true,
    weekends:false,
    minTime:'08:00:00',
    maxTime: '18:00:00',
select: function(info){
      dateStart = new Date(info.startStr);
      dateEnd = new Date(info.endStr);
    var time_slot = document.getElementById("validationTooltip01");
    time_slot.setAttribute("value", dateStart);
    },
    events: eventArray,
  });

  const make_app = document.getElementById("create-app");
  make_app.addEventListener("click",function(){
    let title =  document.getElementById("appointment-title").value.trim()
    let chief_complaint =  document.getElementById("appointment-content").value.trim()
  if (title.valueOf() && chief_complaint.valueOf() && dateStart) { // valid?
    newEvent = {
      doctor:doctor,
      title: title,
      start: dateStart,
      end: dateEnd,
      chief_complaint: chief_complaint,
      slotEventOverlap:false,
    };
    calendar.addEvent(newEvent);
    alert('Great. Now, update your database...');
    let req = new XMLHttpRequest();
    req.open('POST','/update-appointment',true);
    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    req.send('newEvent='+JSON.stringify(newEvent)+'&doctor_id='+doctor_id);
    dateStart = "";
    dateEnd = "";
  } else {
    alert('Invalid date.');
  }
  document.getElementById("modal-text").style.display = "none";

  });
    console.log(eventArray);

  calendar.render();
  console.log(eventArray);

});