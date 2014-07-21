var a = new Blob(["abcdefghijklmnopqrstuvxyz1234567890"],  {type: "text/plain;charset=utf-8"});
var source = new Streams.BlobSourceBuffer(a);
source._sliceSize = 3;
source._countercurrent.push(0, 3, 6);
source.produce(4).then(function (result) { window.result = result; console.log(result) }, function (error) { console.log(error) });

var a = new Blob(["에피르멍청이"],  {type: "text/plain;charset=utf-8"});
var stream = new BlobStream(a);
stream.readBytesAs = "text";
stream.readBytes(4).then(function (result) { window.result = result; console.log(result) }, function (error) { console.log(error) });

var forked = stream.fork();
forked.readBytes(4).then(function (result) { window.result = result; console.log(result) }, function (error) { console.log(error) });

var sliced = stream.slice(2);
sliced.readBytes(4).then(function (result) { window.result = result; console.log(result) }, function (error) { console.log(error) });