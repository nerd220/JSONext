# JSONext
Deep method to serialize/deserialize, was provide maintain links and functions inside objects


About this method

JSONext provide make object->text serialization with save links to other objects (all dependeces will attach to JSON)\
Also this method may save functions and recreate objects after deserialization (to save objects proto)

## to JSON encode, use toLinkedJSON(object, exceptions, recreate)
	
**object** - base object, would you like to JSON\
if you have array of objects, you may cover in object like {arr:YouArray}
 
**exceptions** - this objects will not included in you JSON, but links are will saved, because you put howGet method, who provide how find source object in system after deserialization - Array: [ [**object**1, **howGet**1], ... [objectN, howGetN] ]

- **object** - this object will not attach
- after deserialization, it's will replace on **howGet** expression (expression must manipulate global objects)
- example: [ [game.units[0].img, 'DB.images[0].data'] ] or  [ [canvas, 'window.canvas'] ]
  
**recreate** - objects of pointed classes will re created by use object construction function in destination systems (where deserialization will happen), and merge with actual data - Array of class names (object.constructor.name). **Warning**: These classes/constructors must be present in the destination system.

## to decode use fromLinkedJSON(data, recreateType)

**data** - serialization

**recreateType**\
2 - if create function of object have arguments, method try guess this arguments, take it from object fields with same names\
1 - object use call method of create function and after merge with himself\
0 - (**default**) like 2 type, but just create __proto__ from prototype\
choose type as you set proto of you object

Beware! This metod is change source object (and all linked objects, childs & etc)\
If you don't want change source objects, use structuredClone function for this object and all dependences

Warning! Method may use eval calls, that could be unsafe in some cases.

On output you will get standart classic JSON, but some objects are replaced by arrays with special keymarks

## Examples

Simple case

	var a={x: 1};
	var b={y: 2, z: a};
	var c={a: a, b: b};
	var json=toLinkedJSON(c);
	var x=fromLinkedJSON(json);
	console.log(x.a == x.b.z); // true, becouse all links are saved

Difficult example
	
 	// setup classses
 
	function constructAProto(){
  		this.i=1;
 		this.protoMethod=function(){
   			this.i+=2;
		}
 	}
  
	function constructA(){
		// weird but working way of inheritance
 		this.__proto__=new constructAProto();
 		this.constructor=constructA;
 		// data
   		this.body=document.body;
 	}
  
  	function constructB(link){
  		this.someMethod=function(){
			this.l.i++;
		}
		this.l=link;
   	}

	// create objects and fill data
     
	var a=new constructA();
	var b=new constructB(a);
	var c={linkA: a, linkB: b, method: (o)=>console.log(o.l.i)};
	var o={a:a, b:b, c:c};

 	// serialize objects
  
	var json=toLinkedJSON(o,[[document.body,'document.body']],['constructA','constructB']);

 	// deserialize objects
  
	var x=fromLinkedJSON(json);

 	// test methods and data
  
	x.b.someMethod(); // increase b.a.i
	x.a.protoMethod(); // double increase a
	x.c.method(x.b); // log b.l.i, return 4
	console.log(x.c.linkA === x.b.l); // return true, because all objects are same, the same as it was before serialization
 	console.log(x.a.body); // returns real document body, because this object was reattached while deserialization works

You can see that in this example, serialization of objects works by taking into account their links, methods, parent prototypes, and prototype chains. At the output, you get a fully functional object, as if it had not been serialized.

## How it works and cons of the approach

The method walks through the object and determines internal links.
It also identifies links with external objects and records ways to restore them.
If you need to serialize a method, it turns into string.

During deserialization, the algorithm finds all the object's mount points and attaches it to the right places.

Currently, the method is used for the system of saving complex multiplayer games. The method handles data of several megabytes well.

CONS:
- Loads CPU when processing large objects
- May require a specific approach when prototyping objects
- The method may be unsafe if the user has access to serialization, but unpacking of methods via eval can be disabled
