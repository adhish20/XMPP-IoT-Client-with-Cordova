var SEQNR = 1;
var app = {

    connection: null,
    contacts: [],
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
    	$(".contact").click(function(){
			$(this).next("ul").toggle();
		});
    },

    on_chat_message: function(stanza) {
        alert('New chat message from: ' + $(stanza).attr('from'));
        return true;
    },

    on_presence: function(stanza) {
    	var from = $(stanza).attr('from');
    	var name = $(stanza).attr('name') || from;
    	var type = $(stanza).attr('type');
    	if(Strophe.getBareJidFromJid(from) == Strophe.getBareJidFromJid(app.connection.jid)){
    		return true;
    	}
    	app.connection.disco.info(from,
    		null,
    		function (stanza) {
				var from = $(stanza).attr('from');
				var support_0323 = false;
                var support_0325 = false;
                $(stanza).find('feature').each(function() {
                    var feature = $(this).attr('var');
                    console.log("var: "+feature);
                    if (feature == "urn:xmpp:iot:sensordata"){
                    	support_0323 = true;
                    }
                    else if (feature == "urn:xmpp:iot:control") {
                        support_0325 = true;
                    }
                });
                if(support_0323 == true && support_0323 == true){
                	var index = app.getIndex(Strophe.getBareJidFromJid(from));
                	var check = "#"+Strophe.getNodeFromJid(from)+"-li";
                	if($(check).length == 0) {
                		var li = '<li id="'+Strophe.getNodeFromJid(from)+'-li" class="table-view-cell media"><a href="#"><img class="media-object pull-left" src="'+app.contacts[index].img+'"><div id="'+Strophe.getNodeFromJid(from)+'-name" class="media-body">'+app.contacts[index].Name+'<p>Sensor and Control Device</p></div></a></li>';
						$("#roster").append(li);
					}
                }
                else if(support_0323 == true){
                	var index = app.getIndex(Strophe.getBareJidFromJid(from));
                	var check = "#"+Strophe.getNodeFromJid(from)+"-li";
                	if($(check).length == 0) {
	                	var li = '<li id="'+Strophe.getNodeFromJid(from)+'-li" class="table-view-cell media"><a href="#"><img class="media-object pull-left" src="'+app.contacts[index].img+'"><div id="'+Strophe.getNodeFromJid(from)+'-name" class="media-body">'+app.contacts[index].Name+'<p>Sensor Device</p></div></a></li>';
						$("#roster").append(li);
					}
                }
                else{
                	var index = app.getIndex(Strophe.getBareJidFromJid(from));
                	var check = "#"+Strophe.getNodeFromJid(from)+"-li";
                	if($(check).length == 0) {
	                	var li = '<li id="'+Strophe.getNodeFromJid(from)+'-li" class="table-view-cell media"><a href="#"><img class="media-object pull-left" src="'+app.contacts[index].img+'"><div id="'+Strophe.getNodeFromJid(from)+'-name" class="media-body">'+app.contacts[index].Name+'<p>Contact</p></div></a></li>';
						$("#roster").append(li);
					}
                }
            },
            function (stanza){
            	console.log('Service discovery error:');
				if (stanza == null) {
					// timeout
					console.log('Service discovery timed out (' + from + ')');
				}
				else{
				    console.log(stanza.outerHTML);
				}
            },
            120000
        );
		return true;
    },

    on_error_iq: function(stanza) {
        $(stanza).find('error').each(function() {
            alert('Info query error code: ' + $(this).attr('code'))
        });
        return true;
    },

    on_roster: function(stanza) {
        $(stanza).find('item').each(function() {
            var jid = $(this).attr('jid');
            var name = $(this).attr('name') || jid;
            var contact = {};
            contact.jid = jid;
            contact.Name = Strophe.getNodeFromJid(jid);
            contact.img = "img/xmpp.png"
            app.contacts.push(contact);
            app.connection.vcard.get(app.on_vcard,
                Strophe.getBareJidFromJid(jid),
                function (stanza) {
                	log("Error callback from getting a vcard on " + bareJid);
                }
            );
		});
		app.connection.send($pres());
    },

    on_vcard: function(stanza) {
	    var from = $(stanza).attr('from');
	    var bareJid = Strophe.getBareJidFromJid(from);
		var $vCard = $(stanza).find("vCard");
		// Update the contact's name
		var index = app.getIndex(bareJid);
		app.contacts[index].jid = bareJid;
		var nickname = $vCard.find('NICKNAME').text();
		if (nickname) {
			//console.log(nickname);
			app.contacts[index].Name = nickname;
			app.updateContact(bareJid);
		}
		var imgData = $vCard.find('BINVAL').text();
		if (!imgData || imgData == "") {
		    return;
		}
		var imgType = $vCard.find('TYPE').text();
		var imgSrc = 'data:' + imgType + ';base64,' + imgData;
		app.contacts[index].img = imgSrc;
		app.updateContactImage(bareJid);
	},

	getIndex: function (Jid) {
		return app.contacts.map(function(el) {
			return el.jid;
		}).indexOf(Jid);
	},

	updateContact: function(jid){
		var Id = $('#'+Strophe.getNodeFromJid(jid)+'-name');
		var index = app.getIndex(jid);
		var Name = app.contacts[index].Name;
	    if (Id.length > 0) {
			$(Id).text(Name);
	    }
	    else {
			return;
	    }
	    $('#roster').listview('refresh');
	},

	updateContactImage: function(jid){
		var btn = $('#'+Strophe.getNodeFromJid(jid)+'-li');
		var index = app.getIndex(jid);
		var imgSrc = app.contacts[index].img;
	    if (btn.length > 0) {
		var img = btn.find('img');
		img.attr('src', imgSrc);
		$('#roster').listview('refresh');
    }
	},

    handleLogin: function() {
    	app.connection = null;
        var form = $("#loginForm");
        var username = $("#username", form).val();
        var password = $("#password", form).val();
        if(username != '' && password!= '') {
            app.connection = new Strophe.Connection('https://conversejs.org/http-bind/')
            app.connection.connect(username, password, function onConnect(status) {
                if (status == Strophe.Status.CONNECTED)
                {
                	//form.remove(); 
                    app.connection.addHandler(app.on_chat_message, null, 'message', 'chat');
                    app.connection.addHandler(app.on_read, null, 'message');
                    app.connection.addHandler(app.on_error_iq, null, 'iq', 'error');
                    app.connection.addHandler(app.on_presence, null, 'presence');

                    var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
                    app.connection.sendIQ(iq, app.on_roster);
                }
            });
        }
        else {
            alert("You must enter a username and password", function() {});
        }
    },

    readValues: function (jid){
    	var iq = $iq({type: "get", to: jid, from: app.connection.jid}).c("req", {xmlns: "urn:xmpp:iot:sensordata", seqnr: SEQNR, momentary: "true"});
        SEQNR = SEQNR + 1;
        app.connection.sendIQ(iq,
        	function (message){
        		console.log(message);
        	},
            function (err){
            	console.log(err);
            },
            600000
        );
    },

    on_read: function(message){
    	var $message = $(message);
    	var tag = $(message).find('fields');
        var from = $message.attr('from');
        var jid = Strophe.getBareJidFromJid(from);
        $(tag).find('node').each(function() {
            $(this).find('timestamp').each(function() {
                $(this).find('numeric').each(function() {
                	var name = $(this).attr('name');
                	var val = $(this).attr('value');
                	var li = '<li class="table-view-cell media">'+name+' : '+val+'</li>'
                	$("#"+jid+"-read").append(li);
                });
            });
        });
    }
};

app.initialize();