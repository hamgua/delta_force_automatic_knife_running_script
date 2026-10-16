function TouchObserver(){this.active={};this.down=0;this.move=0;this.up=0;this.cancel=0;this.maxActive=0;this.history=[];this.visible=true;}
TouchObserver.prototype.activeCount=function(){return Object.keys(this.active).length;};
TouchObserver.prototype.event=function(type,id,x,y){if(['down','move','up','cancel'].indexOf(type)<0)throw new Error('UNKNOWN_EVENT');this[type]++;if(type==='down')this.active[id]={x:x,y:y};else if(type==='move'&&this.active[id])this.active[id]={x:x,y:y};else if(type==='up'||type==='cancel')delete this.active[id];this.maxActive=Math.max(this.maxActive,this.activeCount());this.history.push(type+' #'+id+' '+Math.round(x)+','+Math.round(y));if(this.history.length>12)this.history.shift();};
TouchObserver.prototype.visibility=function(visible){this.visible=visible;};

TouchObserver.prototype.touch=function(type,count){this.nativeTouches=count;if(type==='touchstart')this.touchStart=(this.touchStart||0)+1;if(type==='touchend')this.touchEnd=(this.touchEnd||0)+1;if(type==='touchcancel')this.touchCancel=(this.touchCancel||0)+1;};
