/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var SEQNR = 1;
var app = {

    connection: null,
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        $(document).bind('mobileinit',function(){
                $.mobile.loadingMessage = false;
            });
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        //$("#loginForm").on("submit",app.handleLogin);
        //app.receivedEvent('deviceready');
    },

    on_chat_message: function(stanza) {
        alert('New chat message from: ' + $(stanza).attr('from'))
    },
    on_presence: function(stanza) {
    	var from = $(stanza).attr('from');
    	var name = $(stanza).attr('name') || from;
    	var type = $(stanza).attr('type');
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
                    var ul = document.getElementById("roster");
                    var li = document.createElement("li");
                    li.appendChild(document.createTextNode(name));
                    li.setAttribute("class","table-view-cell media");
                    ul.appendChild(li);
                }
                else if(support_0323 == true){
                    var ul = document.getElementById("roster");
                    var li = document.createElement("li");
                    li.appendChild(document.createTextNode(name));
                    li.setAttribute("class","table-view-cell media");
                    ul.appendChild(li);
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
        })
    },
    on_roster: function(stanza) {
        $(stanza).find('item').each(function() {
            var jid = $(this).attr('jid');
            var name = $(this).attr('name') || jid;
		});
		app.connection.send($pres());
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
                	$("#roster").empty();
                	alert("Connected!!!");
                    app.connection.addHandler(app.on_chat_message, null, 'message', 'chat');
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

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

app.initialize();