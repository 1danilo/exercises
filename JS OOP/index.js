/*
//Object Literals
const circle = {
  radius: 1, // radius is a property(also a "key"), properties hold VALUE (1 is the "value")
  location: {
    x: 1,
    y: 1,
  },
  draw: function () {
    //draw is a method, functions and methods are used to define LOGIC
    console.log("draw");
  },
};

circle.draw();



//Factory or Construction Function
// If an object has one or more methods, the object has BEHAVIOR
//Imagine we would like to create another circle:

function createCircle(radius) {
  return {
    radius,
    draw: function () {
      console.log("draw");
    },
  };
}
const circle = createCircle(1);
circle.draw();

//Constructor Function
function Circle(radius) {
  console.log("this", this);
  this.radius = radius;
  this.draw = function () {
    console.log("draw");
  };
}

const another = new Circle(1);



const message = "Don't be sad, be happy!";
let withSlice = message.slice(0, 3);
console.log(withSlice);


let message = "";

if (message === "spanish") {
  console.log("hola mundo");
} else {
  if (message === "french") {
    console.log("bonjour tout le monde");
  } else {
    console.log("hello world");
  }
}
*/


/*
kata #1 - Write a function which converts the input string to uppercase.

function makeUpperCase(str) {
  return str.toUpperCase()
}

//alternative solution
const makeUpperCase = str => str.toUpperCase();
*/


/*
kata #2 - Complete the function that takes two integers (a, b, where a < b) and return an array of all integers between the input parameters, including them.
function between(a, b) {
  // your code here
  arr = []
  for(i = a;i <= b; i++){ 
      arr.push(i)
  }
  return arr
}
*/

/*
kata #3 - Write a function to convert a name into initials. This kata strictly takes two words with one space in between them.
The output should be two capital letters with a dot separating them.
It should look like this:
Sam Harris => S.H
Patrick Feeney => P.F
*/

/*
Beginner - Lost Without a Map
Given an array of integers, return a new array with each value doubled.

For example:

[1, 2, 3] --> [2, 4, 6]

function maps(x){
let numbersTimeTwo = [];
for(let i = 0; i < x.length; i++) {
  numbersTimeTwo.push(x[i]*2);
}
return numbersTimeTwo
  }

or

function maps(x){
  return x.map(n => n * 2);
}

or

maps = x => x.map(e => e * 2);

or

const maps = arr => arr.map( x => x * 2 )
*/


/*
Opposites Attract
Timmy & Sarah think they are in love, but around where they live, they will only know once they pick a flower each. If one of the flowers has an even number of petals and the other has an odd number of petals it means they are in love.
Write a function that will take the number of petals of each flower and return true if they are in love and false if they aren't.

function lovefunc(flower1, flower2){
  if (flower1 % 2 === 0 && flower2 % 2 === 1 || flower1 % 2 === 1 && flower2 % 2 === 0) {
     return true;
} else {
  return false
}
  }

or

function lovefunc(flower1, flower2){
  return flower1 % 2 !== flower2 % 2;
}

or 

function lovefunc(flower1, flower2){
  return (flower1 + flower2) % 2 === 1
}

function lovefunc(flower1, flower2){
  return (flower1 + flower2) % 2 == 1;
}

*/

