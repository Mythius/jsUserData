function Microphone(){
	var context,usrmedia;
	var stream_source,meter;
	var vol,spectrum=[];
	this.getSounds=()=>spectrum;
	this.getVolume=()=>vol;
	this.stop=()=>{
		if(meter) meter.shutdown();
		this.volume=0;
	}
	try{
		window.AudioContext = 
		window.AudioContext||window.webkitAudioContext;
		context = new AudioContext();
	} catch(e){
		console.error('Web Audio API not Supported!');
		//
	}
	try{
		navigator.getUserMedia = 
        	navigator.getUserMedia ||
        	navigator.webkitGetUserMedia ||
        	navigator.mozGetUserMedia;
        navigator.getUserMedia({
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        },success,failure);
	} catch(e){
		console.error('Error:',e);
		//
	}
	function failure(){
		console.error('No Microphone! (Stream generation Failed)');
	}
	function success(stream){
		stream_source = context.createMediaStreamSource(stream);
		meter = createMeter();
		stream_source.connect(meter);
	}
	function createMeter(level,avg,lag){
		var p = context.createScriptProcessor(512);
		p.onaudioprocess = audiohandler;
		p.clipping=false;
		p.lastClip=0;
		p.volume=0;
		p.clipLevel=level||.98;
		p.averaging=avg||.95;
		p.clipLag=lag||750;
		p.connect(context.destination);
		p.checkClipping = function(){
			if(!this.clipping) return false;
			if((this.lastClip + this.clipLag)<window.performance.now()) this.clipping=false;
			return this.clipping;
		};
		p.shutdown=function(){
			this.disconnect();
			this.onaudioprocess=null;
		};
		return p;
	}
	function audiohandler(e){
		var b = e.inputBuffer.getChannelData(0);
		var bufLength = b.length;
		var sum=0;
		spectrum=[];
		for(let i=0;i<bufLength;i++){
			let x=b[i];
			if(Math.abs(x)>=this.clipLevel){
				this.clipping=true;
				this.lastClip = window.performance.now();
			}
			sum+=x*x;
			spectrum.push(x);
		}
		var r = Math.sqrt(sum/bufLength);
		vol=Math.max(r,this.volume*this.averaging);
	}
}