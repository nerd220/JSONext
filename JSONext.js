// DESCRIPTION
/*

About this method

JSONext provide make object->text serialization with save links to other objects (all dependeces will attach to JSON)
Also this method may save functions and recreate objects after deserialization (to save objects proto)

1. to JSON encode, use toLinkedJSON(object, exceptions, recreate)
	object - base object, would you like to JSON
		if you have array of objects, you may cover in object like {arr:YouArray}
	exceptions
		Array: [ [object1, howGet1], ... [objectN, howGetN] ]
		object - this object will not attach
		after deserialization, it's will replace on howGet expression (expression must manipulate global objects)
		example: [ [game.units[0].img, 'DB.images[0].data'] ] or  [ [canvas, 'window.canvas'] ]
	recreate
		Array of class names (object.constructor.name)
		Then object with this types is deserialized, it's create from constructor and merge with actual data		

2. to decode use fromLinkedJSON(recreateType)
	recreateType		3 - like 0 type, but don't guess arguments (don't use eval methods)
 				2 - if create function of object have arguments, method try guess this arguments, take it from object fields with same names
				1 - object use call method of create function and after merge with himself
				0 - like 2 type, but just create __proto__ from prototype
				choose type as you set proto of you object

Beware! This metod is change source object (and all linked objects, childs & etc)
If you don't want change source objects, use structuredClone function for this object and all dependences

Warning! Method may use eval calls, that could be unsafe in some cases.

On output you will get standart classic JSON, but some objects are replaced by arrays with special keymarks

*/


// CODE

//function asyncStringify(str){
//	return new Promise((resolve)=>resolve(JSON.stringify(str)));
//}

//function asyncParse(o){
//	return new Promise((resolve)=>resolve(JSON.parse(o)));
//}

function tljNested(o,objects,exp=[],recreate=[]){
	let keys=Object.keys(o);
	var rec=false;
	for(let i in recreate) if(recreate[i]==o.constructor.name){
		rec=true;
		o.FLJR=o.constructor.name;
		break
	}
	if(rec){
		keys=Object.keys(o.__proto__);
		keys2=Object.keys(o);
		for(let i in keys2) if(keys.indexOf(keys2[i])==-1) keys.push(keys2[i]);
	}
	for(let i in keys){
		if(keys[i]=='FLJlink') continue;
		if(typeof(o[keys[i]])=='object' && o[keys[i]] && o[keys[i]].constructor!==Array && o[keys[i]].constructor!==Function){
			let fe=false;
			for(let j in exp) if(exp[j][0]==o[keys[i]]){
				o[keys[i]]=['TLJE',exp[j][1]];
				fe=true;
				break;
			}
			if(fe) continue;
			
			var re=false;
			var ren='';
			for(let j in recreate) if(o[keys[i]].constructor.name==recreate[j]){
				re=true;
				ren=recreate[j];
				break;
			}
			
			let founded=false;
			let fi=0;
			if(o[keys[i]].FLJid!=undefined){
				founded=true;
				fi=o[keys[i]].FLJid;
			}
			if(!founded){
				let no=o[keys[i]];
				fi=objects.length;
				if(!no.FLJlink){
					no=cloneObjectTLJ(no);
					no.FLJlink=o[keys[i]];
				}
				objects.push(no);
				o[keys[i]].FLJid=fi;
				refsObj.push(o[keys[i]]);
				objects=tljNested(no,objects,exp,recreate);				
			}
			
			o[keys[i]]=['TLJ',fi];
			if(re){
				objects[fi].FLJR=ren;
			}
		}
		if(typeof(o[keys[i]])=='function' && !rec){
			o[keys[i]]=['TLJF',o[keys[i]].toString()];
		}
		if(typeof(o[keys[i]])=='object' && o[keys[i]] && o[keys[i]].constructor===Array){
			let no=o[keys[i]];
			if(no[0] && (no[0]=='TLJ' || no[0]=='TLJE' || no[0]=='TLJF')) continue;
			no=no.slice();
			o[keys[i]]=no;
			objects=tljNested(no,objects,exp,recreate);
		}
	}
	return objects;
}

function cloneObjectTLJ(o){
	var no=Object.assign({},o);
	no.__proto__=o.__proto__;
	return no;
}

var refsObj;
function toLinkedJSON(o,exp=[],recreate=[]){
	var objects;
	var no=cloneObjectTLJ(o);
	o.FLJid=0;
	no.FLJlink=o;
	objects=[no];
	refsObj=[];
	objects=tljNested(no,objects,exp,recreate);
	for(let i in refsObj) delete refsObj[i].FLJid; //cleanUp
	for(let i in objects){
		if(objects[i].FLJlink){
			delete objects[i].FLJlink.FLJR;
			delete objects[i].FLJlink;
		}
		for(let j in recreate) if(objects[i].constructor.name==recreate[j]){
			for(let k in objects[i]) if(!objects[i].hasOwnProperty(k)){
				objects[i][k]=objects[i][k];
			}
			break;
		}
	}
	return JSON.stringify(objects);
	
	//let r=JSON.stringify(objects); 				//if memory leaks
	//console.log('JSO '+objects.length);
	//for(let i in objects) delete objects[i];
	//return r;
	
	//return asyncStringify(objects);				//if sync
}

var mpoints=[];//id -> [object id,keys]
function fljNested(o,objects,id=0,keys=[]){
	if(typeof(o)=='object'  && o.length>1 && o[0]){
		if(o[0]=='TLJ'){
			var oid=o[1];
			o=objects[oid];
			if(!(oid in mpoints)) mpoints[oid]=[];
			mpoints[oid].push([id,[...keys]]);
			return o;
		}
		if(o[0]=='TLJF' || o[0]=='TLJE'){
			var of;
			eval('of='+o[1]);
			o=of;
			return o;
		}
	}
	for(let j in o){
		if(typeof(o[j])=='object' && o[j] && o[j].length>1 && o[j][0]){
			if(o[j][0]=='TLJ'){
				var oid=o[j][1];
				o[j]=objects[oid];
				if(!(oid in mpoints)) mpoints[oid]=[];
				mpoints[oid].push([id,[...keys,j]]);
			}
			if(o[j][0]=='TLJF' || o[j][0]=='TLJE'){
				var of;
				eval('of='+o[j][1]);
				o[j]=of;
			}
		}
		if(typeof(o[j])=='object' && o[j] && o[j].length>0 && o[j].constructor==Array){
			let arr=[];
			for(let k in o[j]){
				if(o[j][k]!=null){
					o[j][k]=fljNested(o[j][k],objects,id,[...keys,j,k]);
					arr[k]=o[j][k];
				}
			}
			o[j]=arr;
		}
	}
	return o;
}

function getMountPoints(o,obj,eid,mount){ //unused
	if(typeof(o)=='object'  && o.length>1 && o[0]){
		if(o[0]=='TLJ'){
			var oid=o[1];
			if(!(oid in mount)) mount[oid]=[];
			mount[oid].push([obj,eid]);
			return mount;
		}
	}
	for(let j in o){
		if(typeof(o[j])=='object' && o[j].length>1 && o[j][0]){
			if(o[j][0]=='TLJ'){
				var oid=o[j][1];
				if(!(oid in mount)) mount[oid]=[];
				mount[oid].push([o,j]);
				continue;
			}
		}
		if(typeof(o[j])=='object' && o[j].length>0 && o[j].constructor==Array){
			for(let k in o[j]){
				if(o[j][k]!=null){
					mount=getMountPoints(o[j][k],o[j],k,mount);
				}
			}
		}
	}
	return mount;
}

function fljMount(o,target,newO){
	for(let j in o){
		if(typeof(o[j])=='object' && o[j].constructor!=Array && o[j].constructor!=Function){
			if(o[j]==target){
				o[j]=newO;
				continue;
			}
		}
		if(typeof(o[j])=='object' && o[j].length>0 && o[j].constructor==Array){
			for(let k in o[j]){
				if(o[j][k]!=null){
					if(o[j][k]==target) o[j][k]=newO;
					else fljMount(o[j][k],target,newO);
				}
			}
		}
	}
}

function fljGetGlobalConstructor(name){
	return (window?window[name]:global[name]);
}

function fromLinkedJSON(s,recreateType=0){
	var objects=JSON.parse(s);
	//var objects=asyncParse(s);
	var o=objects[0];
	mpoints=[];
	for(let i in objects) objects[i]=fljNested(objects[i],objects,i);
	for(let i in objects){
		if(objects[i].FLJR){
			if(recreateType==1){
				var to=Object.assign({},objects[i]);
				eval('to='+objects[i].FLJR+'.call(to);');
				delete objects[i].FLJR;
				to=Object.assign(to,objects[i]);
				objects[i]=to;
			} else {
				var to,cur;
				cur=objects[i];
				to=fljGetGlobalConstructor(objects[i].FLJR);
				var args=(to.toString().split('(')[1].split(')')[0]);
				var comp=[];
				if(args!='' && recreateType!=3){
					if(args.includes(',')) args=args.split(','); else args=[args];
					var def=[];
					for(let j in args){
						if(args[j].includes('=')){
							def[j]=args[j].split('=')[1];
							args[j]=args[j].split('=')[0];
						}
						if(args[j] in cur) comp.push('cur.'+args[j]);
						else {
							if(def[j]) comp.push(def[j]);
							else comp.push('0');
						}
					}
					comp=comp.join(',');
				} else comp='';
				if(recreateType==2){
					eval('to=new '+objects[i].FLJR+'('+comp+');');
					delete objects[i].FLJR;
					to=Object.assign(to,objects[i]);
					objects[i]=to;
				} else {
					var ok=[];
					var cn=objects[i].FLJR;
					delete objects[i].FLJR;
					
					for(let j of Object.keys(cur)) ok[j]=cur[j];
					if(recreateType==3) cur=new to();
					else eval('cur=new '+cn+'('+comp+');');
					for(let j of Object.keys(ok)) cur[j]=ok[j];
					if(mpoints[i]){
						for(let j in mpoints[i]){
							let id=mpoints[i][j][0];
							let keys=mpoints[i][j][1];
							let link;
							if(id!=i || i==0) link=objects[id]; else link=cur;
							for(let k=0;k<keys.length-1;k++) link=link[keys[k]];
							link[keys[keys.length-1]]=cur;
						}
					}
					if(i==0) o=cur;
					objects[i]=cur;
				}
			}
		}
	}
	mpoints=[];
	return o;
}
