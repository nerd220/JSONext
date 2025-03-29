# JSONext
Deep method to serialize/deserialize, was provide maintain links and functions inside objects


About this method

JSONext provide make object->text serialization with save links to other objects (all dependeces will attach to JSON)
Also this method may save functions and recreate objects after deserialization (to save objects proto)

1. to JSON encode, use toLinkedJSON(object, exceptions, recreate)
	
**object** - base object, would you like to JSON
if you have array of objects, you may cover in object like {arr:YouArray}
 
**exceptions** - this objects will not included in you JSON, but links are will saved, because you put howGet method, who provide how find source object in system after deserialization
Array: [ [**object**1, **howGet**1], ... [objectN, howGetN] ]
**object** - this object will not attach
after deserialization, it's will replace on **howGet** expression (expression must manipulate global objects)
example: [ [game.units[0].img, 'DB.images[0].data'] ] or  [ [canvas, 'window.canvas'] ]
  
**recreate** - objects of pointed classes will re created by use object construction function in destination systems (where deserialization will happen), and merge with actual data
Array of class names (object.constructor.name)		

2. to decode use fromLinkedJSON(data, recreateType)

**data**
serialization

**recreateType**
2 - if create function of object have arguments, method try guess this arguments, take it from object fields with same names
1 - object use call method of create function and after merge with himself
0 - (**default**) like 2 type, but just create __proto__ from prototype
choose type as you set proto of you object

Beware! This metod is change source object (and all linked objects, childs & etc)
If you don't want change source objects, use structuredClone function for this object and all dependences

Warning! Method may use eval calls, that could be unsafe in some cases.

On output you will get standart classic JSON, but some objects are replaced by arrays with special keymarks
