/**
* This library ONLY WORKS IN AIR atm 
* 
* This is a conversion of the actionscript library from twstreamer <http://github.com/r/twstreamer/> into JavaScript.
* No license was listed on the git repo, so I am assuming something public domain or new-BSD-ish.
* 
*/
var SpazTwitterStream = function(opts) {
	var that = this;
	
	this.opts = sch.defaults({
		'auth'		: null,
		'userstream_url': "https://betastream.twitter.com/2b/user.json",
		'onData'		: null,
		'onError'		: null
	}, opts);
	
	this.stream = new air.URLStream;

	this.connect = function() {
		var amountRead   = 0;
		var streamBuffer = "";
		var request = createStreamRequest(that.opts.userstream_url, that.opts.auth);
		that.stream = new air.URLStream();
		that.stream.addEventListener(air.IOErrorEvent.IO_ERROR, errorReceived);
		that.stream.addEventListener(air.ProgressEvent.PROGRESS, dataReceived);
		that.stream.load(request);
	};

	this.disconnect = function() {
		that.stream.close();
		that.stream = null;
	};

	function createStreamRequest(username, pass) {
		var request = new air.URLRequest(that.opts.userstream_url);
		var auth_header = that.opts.auth.signRequest(air.URLRequestMethod.POST, that.opts.userstream_url, '');
		sch.debug('auth_header:'+auth_header);
		request.requestHeaders = new Array(new air.URLRequestHeader("Authorization", auth_header));
		request.method = air.URLRequestMethod.POST;
		request.data = '';
		return request;
	}

	function errorReceived(e) {
		sch.debugReceived("errorReceived");
		sch.debug(e);
		if (that.opts.onError) {
			that.opts.onError.call(this, e);
		}
	}


	var isReading    = false;
	var amountRead   = 0;
	var streamBuffer = '';	
	function dataReceived(e) {
		sch.debug("dataReceived");
		sch.debug(e.toString());
		
		var toRead = e.bytesLoaded - amountRead;
		sch.debug("toRead:"+toRead);
		var buffer = that.stream.readUTFBytes(toRead);
		sch.debug("buffer:"+buffer);
		amountRead = e.bytesLoaded;
		sch.debug("amountRead:"+amountRead);
		
		var parts = [];
		if (!isReading) {
			parts = buffer.split(/\n/);
			var firstPart = parts[0].replace(/[\s\n]*/, "");
			sch.debug("firstPart:"+firstPart);
			buffer = parts.slice(1).join("\n");
			sch.debug("buffer:"+buffer);
			isReading = true;
		}
		
		// pump the JSON pieces through -- due to actionscript to javascript
		// encoding issues, we have to wrap them funnily
		if ((toRead > 0) && (amountRead > 0)) {
			streamBuffer += buffer;
			sch.debug("streamBuffer:"+streamBuffer);
			parts = streamBuffer.split(/\n/);
			var lastElement = parts.pop();
			for (var i=0; i < parts.length; i++) {
				if (that.opts.onData) {
					that.opts.onData.call(this, parts[i]);
				}
			}
			streamBuffer = lastElement;
			sch.debug("streamBuffer:"+streamBuffer);
		}
	}
};