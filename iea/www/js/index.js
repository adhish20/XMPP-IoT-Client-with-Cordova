var SEQNR = 1;
var app = {

    connection: null,
    contacts: [],
    
    initialize: function() {
        // Application Constructor
        this.bindEvents();
    },

    bindEvents: function() {
        //Binding Events on start of Application
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
        //Listener for Login Button
        $("#submitButton").on('tap', function(){
            app.handleLogin();
        });
        //Dropdown List Event Listener
        $(document).on('click', '.clickable li', function(event) {
            event.stopPropagation();
            $("#Graph").remove();
            $(this).children('ul').slideToggle();
            $(this).parent().find('li').not(this).children('ul').slideUp();
            event.preventDefault();
        });
    },

    on_chat_message: function(stanza) {
        /*
        Handler Function called on receiving a message.
        Arguments:
            stanza : Message Stanza received by our JID.
        */
        alert('New chat message from: ' + $(stanza).attr('from'));
        return true;
    },

    on_presence: function(stanza) {
        /*
        on_presence is a Handler which is called when we receive presence from some other JID.
        Sending Disco Queries to ask for features.
        Storing various resources of same JID.
        Adding JIDs to View.
        Arguments:
            stanza : Presence Stanza received by our JID.
        */
        var from = $(stanza).attr('from');
        var name = $(stanza).attr('name') || from;
        var type = $(stanza).attr('type');
        if(Strophe.getBareJidFromJid(from) == Strophe.getBareJidFromJid(app.connection.jid)){
            return true;
        }
        var index = app.getIndex(Strophe.getBareJidFromJid(from));
        
        // Storing Resource of JID.
        var resource = Strophe.getResourceFromJid(from);
        if(app.contacts[index].resources.indexOf(resource) == -1){
            app.contacts[index].resources.push(resource);
        }
        // Making a Disco Request to ask for features supported by the JID.
        app.connection.disco.info(from,
            null,
            function (stanza) {
                var from = $(stanza).attr('from');
                var support_0323 = false;
                var support_0325 = false;
                $(stanza).find('feature').each(function() {
                    var feature = $(this).attr('var');
                    //console.log("var: "+feature);
                    if (feature == "urn:xmpp:iot:sensordata"){
                        support_0323 = true;
                    }
                    else if (feature == "urn:xmpp:iot:control") {
                        support_0325 = true;
                    }
                });
                //console.log(from);
                // Adding JIDs to View.
                if(support_0323 == true && support_0325 == true){
                    var check = "#"+Strophe.getNodeFromJid(from)+"-li";
                    if($(check).length == 0) {
                        app.contacts[index].type = 1;
                        var li = '<li id="'+Strophe.getNodeFromJid(from)+'-li" class="table-view-cell media"><a href="#" onclick="app.readValues(\'' + from + '\')"><img class="media-object pull-left" src="'+app.contacts[index].img+'"><div id="'+Strophe.getNodeFromJid(from)+'-name" class="media-body">'+app.contacts[index].Name+'<p>Sensor and Control Device</p></div></a><ul id="'+Strophe.getNodeFromJid(from)+'-read" class="table-read"></ul></li>';
                        $("#roster").append(li);
                    }
                    else if(app.contacts[index].type == 2 || app.contacts[index].type == 3)
                    {
                        $(check).remove();
                        app.contacts[index].type = 1;
                        var li = '<li id="'+Strophe.getNodeFromJid(from)+'-li" class="table-view-cell media"><a href="#" onclick="app.readValues(\'' + from + '\')"><img class="media-object pull-left" src="'+app.contacts[index].img+'"><div id="'+Strophe.getNodeFromJid(from)+'-name" class="media-body">'+app.contacts[index].Name+'<p>Sensor and Control Device</p></div></a><ul id="'+Strophe.getNodeFromJid(from)+'-read" class="table-read"></ul></li>';
                        $("#roster").append(li);
                    }
                }
                else if(support_0323 == true){
                    var check = "#"+Strophe.getNodeFromJid(from)+"-li";
                    if($(check).length == 0) {
                        app.contacts[index].type = 2;
                        var li = '<li id="'+Strophe.getNodeFromJid(from)+'-li" class="table-view-cell media"><a href="#" onclick="app.readValues(\'' + from + '\')"><img class="media-object pull-left" src="'+app.contacts[index].img+'"><div id="'+Strophe.getNodeFromJid(from)+'-name" class="media-body">'+app.contacts[index].Name+'<p>Sensor Device</p></div></a><ul id="'+Strophe.getNodeFromJid(from)+'-read" class="table-read"></ul></li>';
                        $("#roster").append(li);
                    }
                    else if(app.contacts[index].type == 3)
                    {
                        $(check).remove();
                        app.contacts[index].type = 2;
                        var li = '<li id="'+Strophe.getNodeFromJid(from)+'-li" class="table-view-cell media"><a href="#" onclick="app.readValues(\'' + from + '\')"><img class="media-object pull-left" src="'+app.contacts[index].img+'"><div id="'+Strophe.getNodeFromJid(from)+'-name" class="media-body">'+app.contacts[index].Name+'<p>Sensor Device</p></div></a><ul id="'+Strophe.getNodeFromJid(from)+'-read" class="table-read"></ul></li>';
                        $("#roster").append(li);
                    }
                }
                else{
                    var check = "#"+Strophe.getNodeFromJid(from)+"-li";
                    if($(check).length == 0) {
                        app.contacts[index].type = 3;
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
        /*
        Handler Function called on receiving an error.
        Arguments:
            stanza : Error Stanza received by our JID.
        */
        $(stanza).find('error').each(function() {
            alert('Info query error code: ' + $(this).attr('code'))
        });
        return true;
    },

    on_roster: function(stanza) {
        /*
        Handler Function called on receiving roster.
        Get VCard of COntact JIDs.
        Arguments:
            stanza : Roster Stanza contains details of all contacts and subscriptions.
        */
        $(stanza).find('item').each(function() {
            var jid = $(this).attr('jid');
            var name = $(this).attr('name') || jid;
            var contact = {};
            contact.jid = jid;
            contact.Name = Strophe.getNodeFromJid(jid);
            contact.img = "img/xmpp.png";
            contact.resources = [];
            contact.support_0323 = false;
            contact.support_0325 = false;
            contact.type = 0;
            app.contacts.push(contact);
            app.connection.vcard.get(app.on_vcard,
                Strophe.getBareJidFromJid(jid),
                function (stanza) {
                    console.log("Error callback from getting a vcard on " + bareJid);
                }
            );
        });
        app.connection.send($pres());
    },

    on_vcard: function(stanza) {
        /*
        Callback Function called on receiving a VCard of a Contact.
        Arguments:
            stanza : Stanza contains information of a Contact.
        */
        var from = $(stanza).attr('from');
        var bareJid = Strophe.getBareJidFromJid(from);
        var $vCard = $(stanza).find("vCard");
        // Update the Contact's name.
        var index = app.getIndex(bareJid);
        app.contacts[index].jid = bareJid;
        var nickname = $vCard.find('NICKNAME').text();
        if (nickname) {
            //console.log(nickname);
            app.contacts[index].Name = nickname;
            app.updateContact(bareJid);
        }
        // Get Image Data of the Contact.
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
        /*
        Function to get index of Jid in Contacts.
        Arguments:
            Jid : Bare JID of the Contact.
        */
        return app.contacts.map(function(el) {
            return el.jid;
        }).indexOf(Jid);
    },

    updateContact: function(jid){
        /*
        Function to update Contact Name.
        Arguments:
            jid : Bare JID of the Contact.
        */
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
        /*
        Function to update Contact Image.
        Arguments:
            jid : Bare JID of the Contact.
        */
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
        /*
        Callback Function called on Login Button being pressed.
        Establishes Connection, Register Function Handlers and send get Roster IQ.
        */
        app.connection = null;
        var form = $("#loginForm");
        var username = $("#username", form).val();
        var password = $("#password", form).val();
        if(username != '' && password!= '') {
            app.connection = new Strophe.Connection('https://conversejs.org/http-bind/')
            app.connection.connect(username, password, function onConnect(status) {
                if (status == Strophe.Status.CONNECTED)
                {
                    form.remove();
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
        /*
        Function called on tapping a Contact.
        Sends a Momentary Read IQ to the JID.
        Arguments:
            jid : JID of the Contact
        */
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
        /*
        Callback Function called when the Values of a Device are returned on sending a Momentary/History Read IQ.
        Message is parsed depending on if it contains Historical Data or Momentary Data.
        For Historical it is parsed so as to give input to showGraph Function.
        For Momentary Data it updates the fields with the new data received for each Field.
        Arguments:
            message : Message contains Data sent in by the device. Node, Timestamps, Fields, Values, Units, etc.
        */
        var $message = $(message);
        var tag = $(message).find('fields');
        var from = $message.attr('from');
        var jid = Strophe.getNodeFromJid(from);
        var data = {
            labels: [],
            datasets: [
                {
                    label: "",
                    fillColor: "rgba(151,187,205,0.2)",
                    strokeColor: "rgba(151,187,205,1)",
                    pointColor: "rgba(151,187,205,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: []
                }
            ]
        };
        //console.log('hi');
        var historical = 0;
        $(tag).find('node').each(function() {
            $(this).find('timestamp').each(function() {
                data.labels.push($(this).attr('value'));
                $(this).find('numeric').each(function() {
                    if($(this).attr('historical') === "true")
                    {
                        historical = 1;
                        var name = $(this).attr('name');
                        var val = $(this).attr('value');
                        //console.log(name+" : "+val);
                        data.datasets[0].label = name;
                        data.datasets[0].data.push(val);
                    }
                    else
                    {
                        var name = $(this).attr('name');
                        var writable = $(this).attr('writable');
                        var val = $(this).attr('value');
                        var check = "#"+jid+"-"+name;
                        if($(check).length == 0) {
                            if(writable == 'true')
                            {
                                var li = '<li id="'+jid+'-'+name+'" class="table-view-cell media"><a href="#" onclick="app.on_history(\'' + from + '\',\'' + name + '\')"><div id="'+jid+'-field-'+name+'">'+name+'</div></a><div id="'+jid+'-value-'+name+'"><input type="text" id="'+jid+'-Inputvalue-'+name+'" value="'+val+'" /><input type="button" value="Write" onclick="app.on_write(\'' + from + '\',\'numeric\',\'' + name + '\')" /></div></li>';
                            }
                            else
                            {
                                var li = '<li id="'+jid+'-'+name+'" class="table-view-cell media"><a href="#" onclick="app.on_history(\'' + from + '\',\'' + name + '\')"><div id="'+jid+'-field-'+name+'">'+name+'</div></a><div id="'+jid+'-value-'+name+'">'+val+'</div></li>';
                            }
                            $("#"+jid+"-read").append(li);
                        }
                        else
                        {
                            if(writable == 'true')
                            {
                                $("#"+Strophe.getNodeFromJid(jid)+"-Inputvalue-"+name+"").val(val);
                            }
                            else
                            {
                                var div = $('#'+jid+'-value-'+name);
                                $(div).text(val);
                            }
                        }
                    }
                });
            });
        });
        if(historical == 1)
        {
            app.showGraph(data);
        }
        return true;
    },

    on_write: function(from, nameType, field){
        /*
        Function called when a write event is triggered.
        Arguments:
            from : JID of the Contact.
            nameType : type of field. e.g. 'numeric' or 'boolean'.
            field : Name of Field whose value is to be changed.
        */
        var jid = Strophe.getNodeFromJid(from);
        var value = $("#"+jid+"-Inputvalue-"+field+"").val();
        var iq = $msg({to: from, from: app.connection.jid}).c("set", {xmlns: "urn:xmpp:iot:control", seqnr: SEQNR}).c(nameType, {"name": field, "value": value});
        SEQNR = SEQNR + 1;
        app.connection.send(iq,
        function (message){
                console.log(message);
            },
            function (err){
                console.log(err);
            },
            600000
        );
    },

    on_history: function(jid, field){
        /*
        Function called when a history event is triggered.
        Arguments:
            jid : JID of the Contact.
            field : Name of Field whose hisotry is to be revealed.
        */
        var toTime = Math.round(new Date().getTime() / 1000);
        var fromTime = toTime - 24 * 60 * 60;
        fromTime = app.formatTime(new Date(fromTime*1000));
        toTime = app.formatTime(new Date(toTime*1000));
        var bareJid = Strophe.getBareJidFromJid(jid)
        var index = app.getIndex(bareJid);
        var resources = app.contacts[index].resources;
        for (i = 0; i < resources.length; i++)
        {
            if(resources[i] != null)
            {
                var jid_to = bareJid+'/'+resources[i];
                //console.log(jid_to + " History check");
                var iq = $iq({type: "get", to: jid_to}).c("req", {xmlns: "urn:xmpp:iot:sensordata", seqnr: SEQNR , historical: "true", from: fromTime, to: toTime}).c("field", {name: field});
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
            }
        }
    },

    formatTime: function(localDate) {
        /*
        Function to Parse Time in ISO Format.
        Arguments:
            loacalDate : date as given by JavaScipt Date Function.
        */
        if (!localDate) localDate = new Date();
        var tzo = -localDate.getTimezoneOffset();
        var sign = tzo >= 0 ? '+' : '-';
        var yyyy = localDate.getFullYear().toString();
        var mm = (localDate.getMonth()+1).toString(); // getMonth() is zero-based
        var dd = localDate.getDate().toString();
        var hh = localDate.getHours().toString();
        var MM = localDate.getMinutes().toString();
        var ss = localDate.getSeconds().toString();
        var TZH = Math.floor(tzo / 60).toString();
        var TZS = (tzo % 60).toString();
        return yyyy
            +"-"+(mm[1]?mm:"0"+mm[0])
            +"-"+(dd[1]?dd:"0"+dd[0])
            +"T"+(hh[1]?hh:"0"+hh[0])
            +":"+(MM[1]?MM:"0"+MM[0])
            +":"+(ss[1]?ss:"0"+ss[0])
            +sign+(TZH[1]?TZH:"0"+TZH[0])
            +":"+(TZS[1]?TZS:"0"+TZS[0]);
    },

    showGraph: function(data) {
        /*
        Function called to plot the Graph of Historical Data.
        Arguments:
            data : Data parsed by on_read function for historical message.
        */
        canvas = $('<canvas id="Graph" height="400px" width="330px" class="myChart"></canvas>');
        canvas.remove();
        $("#canvas").append(canvas);
        var ctx = $("#Graph").get(0).getContext("2d");
        var myLineChart = new Chart(ctx).Line(data,{tooltipTemplate:"<%= value %>", showXLabels: 12});
    }
};

app.initialize();
